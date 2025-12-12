'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/global/auth/useAuth';
import { fetchRestaurantById } from '@/lib/restaurants';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import SearchBar from './_components/SearchBar';
import CurrentLocationButton from './_components/CurrentLocationButton';
import AddRestaurantDialog from './_components/AddRestaurantDialog';
import RestaurantsList from './_components/RestaurantsList';
import Pagination from './_components/Pagination';
import MapPanel from './_components/MapPanel';
import type { Restaurant } from '@/lib/restaurants';
import useRestaurants from '@/hooks/useRestaurants';
import { distanceMeters } from '@/lib/geo';
import RestaurantDetailDialog from './_components/RestaurantDetailDialog';

export default function RestaurantsView() {
    const {
        mapCenter,
        setMapCenter,
        mapMarkers,
        setMapMarkers,
        restaurants,
        allResults,
        total,
        page,
        setPage,
        size,
        nearbyUsingKakao,
        highlightedId,
        setHighlightedId,
        keyword,
        setKeyword,
        isNearby,
        setIsNearby,
        userPos,
        setUserPos,
        lastClicked,
        setLastClicked,
        loadRestaurants,
        searchByKeyword,
        loadNearbyRestaurants,
        kakaoSearchNearby,
        addLocalRestaurant,
        updateLocalRestaurant,
        removeLocalRestaurant,
        localAdded,
        handleItemClick: hookHandleItemClick,
    } = useRestaurants();

    useEffect(() => {
        try {
            (window as any).addLocalRestaurant = addLocalRestaurant;
            (window as any).updateLocalRestaurant = updateLocalRestaurant;
            (window as any).removeLocalRestaurant = removeLocalRestaurant;
        } catch (e) {}
        return () => {
            try {
                delete (window as any).addLocalRestaurant;
                delete (window as any).updateLocalRestaurant;
                delete (window as any).removeLocalRestaurant;
            } catch (e) {}
        };
    }, [addLocalRestaurant, updateLocalRestaurant, removeLocalRestaurant]);

    const searchDebounceRef = useRef<number | null>(null);

    const [selected, setSelected] = useState<Restaurant | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editInitial, setEditInitial] = useState<Restaurant | null>(null);
    const [pendingPick, setPendingPick] = useState<{
        mode?: 'create' | 'edit';
        initialData?: Restaurant | null;
    } | null>(null);
    const pendingPickRef = useRef<{
        mode?: 'create' | 'edit';
        initialData?: Restaurant | null;
    } | null>(null);

    const [showReviewedOnly, setShowReviewedOnly] = useState(false);
    const [adjacentList, setAdjacentList] = useState<
        (Restaurant & { distanceMeters?: number })[] | null
    >(null);
    const [adjacentPos, setAdjacentPos] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const router = useRouter();
    const { isLogin } = useAuth();

    const [reviewedRestaurants, setReviewedRestaurants] = useState<
        Restaurant[] | null
    >(null);
    const reviewedFullRef = useRef<Restaurant[] | null>(null);

    const distanceSq = (
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number
    ) => {
        const dLat = lat1 - lat2;
        const dLng = lng1 - lng2;
        return dLat * dLat + dLng * dLng;
    };

    const toCoords = (r: any) => ({
        lat: Number(r?.latitude ?? r?.lat ?? NaN),
        lng: Number(r?.longitude ?? r?.lng ?? NaN),
    });

    const getId = (r: any) =>
        r !== undefined && r !== null && r.id !== undefined && r.id !== null
            ? String(r.id)
            : null;

    const getNameLower = (r: any) =>
        ((r?.name || '') as string).toString().trim().toLowerCase();

    const coordsEqual = (
        a: { lat: number; lng: number },
        b: { lat: number; lng: number }
    ) =>
        Number.isFinite(a.lat) &&
        Number.isFinite(a.lng) &&
        Number.isFinite(b.lat) &&
        Number.isFinite(b.lng) &&
        Math.abs(a.lat - b.lat) < 1e-6 &&
        Math.abs(a.lng - b.lng) < 1e-6;

    const sortByLastClicked = (arr: Restaurant[] | null) => {
        if (!arr || !lastClicked) return arr || [];
        const target = {
            lat: Number(lastClicked.lat),
            lng: Number(lastClicked.lng),
        };
        return arr.slice().sort((a: any, b: any) => {
            const aC = toCoords(a);
            const bC = toCoords(b);
            if (!Number.isFinite(aC.lat) || !Number.isFinite(aC.lng)) return 1;
            if (!Number.isFinite(bC.lat) || !Number.isFinite(bC.lng)) return -1;
            return (
                (aC.lat - target.lat) * (aC.lat - target.lat) +
                (aC.lng - target.lng) * (aC.lng - target.lng) -
                ((bC.lat - target.lat) * (bC.lat - target.lat) +
                    (bC.lng - target.lng) * (bC.lng - target.lng))
            );
        });
    };

    const handleItemClick = (r: Restaurant) => {
        try {
            const rC = toCoords(r as any);
            const rId = getId(r as any);
            const rName = getNameLower(r as any);
            const rPlaceUrl =
                (r as any)?.placeUrl || (r as any)?.placeId || null;

            if (rId) {
                const byId = (allResults || []).find((it) => getId(it) === rId);
                if (byId) {
                    setSelected(byId as Restaurant);
                    hookHandleItemClick(byId as Restaurant);
                    return;
                }
            }

            const localMatch = (localAdded || []).find((it) => {
                try {
                    const itId = getId(it);
                    const itC = toCoords(it as any);
                    const itName = getNameLower(it as any);
                    if (itId && rId && itId === rId) return true;
                    if (
                        coordsEqual(itC, rC) &&
                        itName &&
                        rName &&
                        itName === rName
                    )
                        return true;
                } catch (e) {}
                return false;
            });
            if (localMatch) {
                setSelected({ ...(r as any), isLocal: true } as Restaurant & {
                    isLocal?: boolean;
                });
                hookHandleItemClick(r);
                return;
            }

            if (
                lastClicked &&
                coordsEqual(rC, {
                    lat: Number(lastClicked.lat),
                    lng: Number(lastClicked.lng),
                })
            ) {
                setSelected({ ...(r as any), isLocal: true } as Restaurant & {
                    isLocal?: boolean;
                });
                hookHandleItemClick(r);
                return;
            }

            const match = (allResults || []).find((it) => {
                try {
                    const itC = toCoords(it as any);
                    const itId = getId(it as any);
                    const itName = getNameLower(it as any);
                    const itPlace =
                        (it as any)?.placeUrl || (it as any)?.placeId || null;
                    const sameId = rId && itId && rId === itId;
                    const coordsMatch = coordsEqual(itC, rC);
                    const nameMatch = itName && rName && itName === rName;
                    const placeMatch =
                        rPlaceUrl &&
                        itPlace &&
                        String(rPlaceUrl) === String(itPlace);
                    return sameId || (coordsMatch && (nameMatch || placeMatch));
                } catch (e) {
                    return false;
                }
            });

            setSelected((match as Restaurant) || r);
        } catch (e) {
            setSelected(r);
        }
        hookHandleItemClick(r);
    };

    const handleDeleted = (id: number) => {
        setSelected(null);
        try {
            if (typeof (window as any).removeLocalRestaurant === 'function') {
                try {
                    (window as any).removeLocalRestaurant(id);
                } catch (e) {
                    console.error('call removeLocalRestaurant failed', e);
                }
                try {
                    if (typeof window !== 'undefined') {
                        window.location.reload();
                    }
                } catch (e) {}
                return;
            }
        } catch (e) {
            console.error('call removeLocalRestaurant check failed', e);
        }

        setMapMarkers((prev) =>
            prev.filter((m) => String((m as any).id) !== String(id))
        );
        try {
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } catch (e) {}
    };

    useEffect(() => {
        let mounted = true;

        async function loadReviewed() {
            try {
                const raw =
                    sessionStorage.getItem('myReviewedRestaurants') || '[]';
                const arr = JSON.parse(raw);
                const ids = Array.isArray(arr)
                    ? arr
                          .map((v) => Number(v))
                          .filter((v) => Number.isFinite(v) && v > 0)
                    : [];
                if (ids.length === 0) {
                    if (mounted) setReviewedRestaurants([]);
                    return;
                }

                if (reviewedRestaurants && reviewedRestaurants.length > 0) {
                    if (mounted)
                        setReviewedRestaurants(
                            sortByLastClicked(reviewedRestaurants)
                        );
                    return;
                }

                const fetches = ids.map((rid) =>
                    fetchRestaurantById(rid).catch((e) => {
                        console.error(
                            'fetch reviewed restaurant failed',
                            rid,
                            e
                        );
                        return null as any;
                    })
                );
                const results = await Promise.all(fetches);
                const next = results.filter((r) => r && r.id) as Restaurant[];
                if (mounted) {
                    reviewedFullRef.current = next;
                    setReviewedRestaurants(sortByLastClicked(next));
                }
            } catch (e) {
                console.error('loadReviewedRestaurants failed', e);
                if (mounted) setReviewedRestaurants([]);
            }
        }

        if (showReviewedOnly) {
            loadReviewed();
        } else {
            setReviewedRestaurants(null);
            reviewedFullRef.current = null;
        }

        return () => {
            mounted = false;
        };
    }, [showReviewedOnly, lastClicked]);

    const displayedRestaurants = showReviewedOnly
        ? reviewedRestaurants || []
        : restaurants || [];

    const totalForPaging = showReviewedOnly
        ? displayedRestaurants.length
        : total;

    const markersForDisplay = (() => {
        try {
            const base = mapMarkers || [];
            if (!showReviewedOnly) return base;

            const keep = new Set<string>();
            for (const r of displayedRestaurants) {
                const id = getId(r as any);
                if (id) keep.add(id);
                else {
                    const c = toCoords(r as any);
                    if (Number.isFinite(c.lat) && Number.isFinite(c.lng))
                        keep.add(`${c.lat.toFixed(6)}:${c.lng.toFixed(6)}`);
                }
            }

            const filtered = base.filter((m) => {
                if (m.title === '내 위치' || m.title === '선택한 위치')
                    return true;
                if (m.id !== undefined && m.id !== null) {
                    if (keep.has(String(m.id))) return true;
                }
                const key = `${Number(m.lat).toFixed(6)}:${Number(
                    m.lng
                ).toFixed(6)}`;
                return keep.has(key);
            });

            const built: any[] = [];
            for (const r of displayedRestaurants) {
                try {
                    const rid = (r as any).id;
                    const c = toCoords(r as any);
                    const title = (r as any).name || '식당';
                    const exists = filtered.some(
                        (m) => String((m as any).id) === String(rid)
                    );
                    if (!exists) {
                        built.push({
                            id: rid,
                            lat: c.lat || 0,
                            lng: c.lng || 0,
                            title,
                            variant: 'default',
                        });
                    }
                } catch (e) {}
            }

            return [...built, ...filtered];
        } catch (e) {
            return mapMarkers;
        }
    })();

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="w-full flex-1 min-h-0">
                <div className="flex flex-1 min-h-0">
                    <div className="w-[30%] min-w-[280px] max-w-[400px] border-r bg-white dark:bg-card flex flex-col">
                        <div className="p-4 border-b">
                            <SearchBar
                                keyword={keyword}
                                onKeywordChange={(v) => {
                                    setKeyword(v);
                                    if (isNearby) setIsNearby(false);
                                    try {
                                        if (searchDebounceRef.current) {
                                            window.clearTimeout(
                                                searchDebounceRef.current
                                            );
                                        }
                                    } catch (e) {}

                                    const performClientFilter = () => {
                                        try {
                                            setPage(1);
                                            setIsNearby(false);
                                            const base =
                                                reviewedFullRef.current ||
                                                reviewedRestaurants ||
                                                [];
                                            const q = (v || '')
                                                .toString()
                                                .trim()
                                                .toLowerCase();
                                            if (!q) {
                                                setReviewedRestaurants(
                                                    sortByLastClicked(
                                                        base || []
                                                    )
                                                );
                                                return;
                                            }
                                            const filtered = (
                                                base || []
                                            ).filter(
                                                (r) =>
                                                    (r.name || '')
                                                        .toString()
                                                        .toLowerCase()
                                                        .indexOf(q) !== -1
                                            );
                                            setReviewedRestaurants(
                                                sortByLastClicked(filtered)
                                            );
                                        } catch (e) {
                                            console.error(
                                                'client filter failed',
                                                e
                                            );
                                        }
                                    };

                                    if (showReviewedOnly) {
                                        const t = window.setTimeout(() => {
                                            performClientFilter();
                                        }, 200);
                                        searchDebounceRef.current = t;
                                        return;
                                    }

                                    if (v && v.length > 0) {
                                        const t = window.setTimeout(() => {
                                            setPage(1);
                                            setIsNearby(false);
                                            searchByKeyword(v, 1).catch(
                                                console.error
                                            );
                                        }, 300);
                                        searchDebounceRef.current = t;
                                    } else {
                                        const t = window.setTimeout(() => {
                                            setPage(1);
                                            setIsNearby(false);
                                            searchByKeyword('', 1).catch(
                                                console.error
                                            );
                                        }, 300);
                                        searchDebounceRef.current = t;
                                    }
                                }}
                                onSearch={() => {
                                    setPage(1);
                                    setIsNearby(false);
                                    try {
                                        if (searchDebounceRef.current) {
                                            window.clearTimeout(
                                                searchDebounceRef.current
                                            );
                                            searchDebounceRef.current = null;
                                        }
                                    } catch (e) {}
                                    if (showReviewedOnly) {
                                        try {
                                            const base =
                                                reviewedFullRef.current ||
                                                reviewedRestaurants ||
                                                [];
                                            const q = (keyword || '')
                                                .toString()
                                                .trim()
                                                .toLowerCase();
                                            if (!q) {
                                                setReviewedRestaurants(
                                                    sortByLastClicked(
                                                        base || []
                                                    )
                                                );
                                            } else {
                                                const filtered = (
                                                    base || []
                                                ).filter(
                                                    (r) =>
                                                        (r.name || '')
                                                            .toString()
                                                            .toLowerCase()
                                                            .indexOf(q) !== -1
                                                );
                                                setReviewedRestaurants(
                                                    sortByLastClicked(filtered)
                                                );
                                            }
                                        } catch (e) {
                                            console.error(
                                                'client filter failed',
                                                e
                                            );
                                        }
                                        return;
                                    }
                                    searchByKeyword(keyword, 1).catch(
                                        console.error
                                    );
                                }}
                            />
                        </div>
                        <div className="p-4 border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                    검색결과{' '}
                                    <span className="text-primary font-bold">
                                        {total}
                                    </span>
                                    개 검색
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        aria-pressed={showReviewedOnly}
                                        className={
                                            (showReviewedOnly
                                                ? 'group bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
                                                : 'bg-white text-gray-700 border hover:bg-gray-50') +
                                            ' cursor-pointer'
                                        }
                                        onClick={() => {
                                            try {
                                                if (!isLogin) {
                                                    try {
                                                        sessionStorage.setItem(
                                                            'postLoginRedirect',
                                                            '/restaurants'
                                                        );
                                                    } catch (e) {}
                                                    router.push(
                                                        `/login?next=${encodeURIComponent(
                                                            '/restaurants'
                                                        )}`
                                                    );
                                                    return;
                                                }
                                            } catch (e) {}
                                            setShowReviewedOnly((s) => !s);
                                        }}
                                    >
                                        리뷰
                                    </Button>

                                    <AddRestaurantDialog
                                        lastClicked={lastClicked}
                                        onSuccess={async (created) => {
                                            setPage(1);
                                            addLocalRestaurant(created);
                                            setMapCenter({
                                                lat: created.latitude,
                                                lng: created.longitude,
                                            });
                                        }}
                                        open={
                                            editInitial
                                                ? editDialogOpen
                                                : undefined
                                        }
                                        onOpenChange={
                                            editInitial
                                                ? (o) => {
                                                      setEditDialogOpen(o);
                                                      if (!o)
                                                          setEditInitial(null);
                                                  }
                                                : undefined
                                        }
                                        initialData={editInitial}
                                        mode={editInitial ? 'edit' : undefined}
                                        onRequestMapPick={() => {
                                            setPendingPick({
                                                mode: editInitial
                                                    ? 'edit'
                                                    : 'create',
                                                initialData: editInitial,
                                            });
                                            pendingPickRef.current = {
                                                mode: editInitial
                                                    ? 'edit'
                                                    : 'create',
                                                initialData: editInitial,
                                            };
                                            setEditDialogOpen(false);
                                            setEditInitial(null);
                                            try {
                                                const el =
                                                    document.getElementById(
                                                        'restaurant-map-panel'
                                                    );
                                                if (el)
                                                    el.scrollIntoView({
                                                        behavior: 'smooth',
                                                        block: 'center',
                                                    });
                                            } catch (e) {}
                                        }}
                                        onUpdate={(updated) => {
                                            try {
                                                if (
                                                    typeof (window as any)
                                                        .updateLocalRestaurant ===
                                                    'function'
                                                ) {
                                                    try {
                                                        (
                                                            window as any
                                                        ).updateLocalRestaurant(
                                                            updated
                                                        );
                                                    } catch (e) {
                                                        console.error(
                                                            'call updateLocalRestaurant failed',
                                                            e
                                                        );
                                                    }
                                                }

                                                try {
                                                    const exists = (
                                                        localAdded || []
                                                    ).some((it) => {
                                                        const itLat = Number(
                                                            (it as any)
                                                                .latitude ??
                                                                (it as any)
                                                                    .lat ??
                                                                0
                                                        );
                                                        const itLng = Number(
                                                            (it as any)
                                                                .longitude ??
                                                                (it as any)
                                                                    .lng ??
                                                                0
                                                        );
                                                        const updLat = Number(
                                                            (updated as any)
                                                                .latitude ??
                                                                (updated as any)
                                                                    .lat ??
                                                                0
                                                        );
                                                        const updLng = Number(
                                                            (updated as any)
                                                                .longitude ??
                                                                (updated as any)
                                                                    .lng ??
                                                                0
                                                        );
                                                        const sameCoords =
                                                            Math.abs(
                                                                itLat - updLat
                                                            ) < 1e-6 &&
                                                            Math.abs(
                                                                itLng - updLng
                                                            ) < 1e-6;
                                                        const sameId =
                                                            (it as any).id !==
                                                                undefined &&
                                                            (updated as any)
                                                                .id !==
                                                                undefined &&
                                                            String(
                                                                (it as any).id
                                                            ) ===
                                                                String(
                                                                    (
                                                                        updated as any
                                                                    ).id
                                                                );
                                                        return (
                                                            sameId || sameCoords
                                                        );
                                                    });
                                                    if (!exists) {
                                                        try {
                                                            (
                                                                window as any
                                                            ).addLocalRestaurant(
                                                                updated
                                                            );
                                                        } catch (e) {
                                                            console.error(
                                                                'addLocalRestaurant failed',
                                                                e
                                                            );
                                                        }
                                                    }
                                                } catch (e) {
                                                    console.error(
                                                        'ensure localAdded',
                                                        e
                                                    );
                                                }

                                                try {
                                                    setPage(1);
                                                } catch (e) {}
                                            } catch (e) {
                                                console.error(
                                                    'updateLocalRestaurant',
                                                    e
                                                );
                                            }

                                            try {
                                                const stored = JSON.parse(
                                                    sessionStorage.getItem(
                                                        'myCreatedRestaurants'
                                                    ) || '[]'
                                                );
                                                const updLat = Number(
                                                    (updated as any).latitude ??
                                                        (updated as any).lat ??
                                                        0
                                                );
                                                const updLng = Number(
                                                    (updated as any)
                                                        .longitude ??
                                                        (updated as any).lng ??
                                                        0
                                                );
                                                let found = false;
                                                const next = Array.isArray(
                                                    stored
                                                )
                                                    ? stored.slice()
                                                    : [];
                                                for (
                                                    let i = 0;
                                                    i < next.length;
                                                    i++
                                                ) {
                                                    const it = next[i];
                                                    if (!it) continue;
                                                    const itLat = Number(
                                                        it.lat ??
                                                            it.latitude ??
                                                            0
                                                    );
                                                    const itLng = Number(
                                                        it.lng ??
                                                            it.longitude ??
                                                            0
                                                    );
                                                    const sameId =
                                                        it.id &&
                                                        (updated as any).id &&
                                                        String(it.id) ===
                                                            String(
                                                                (updated as any)
                                                                    .id
                                                            );
                                                    const sameCoords =
                                                        Math.abs(
                                                            itLat - updLat
                                                        ) < 1e-6 &&
                                                        Math.abs(
                                                            itLng - updLng
                                                        ) < 1e-6;
                                                    if (sameId || sameCoords) {
                                                        next[i] = {
                                                            id:
                                                                (updated as any)
                                                                    .id ??
                                                                it.id,
                                                            lat: updLat,
                                                            lng: updLng,
                                                        };
                                                        found = true;
                                                        break;
                                                    }
                                                }
                                                if (!found) {
                                                    next.push({
                                                        id:
                                                            (updated as any)
                                                                .id ??
                                                            -Date.now(),
                                                        lat: updLat,
                                                        lng: updLng,
                                                    });
                                                }
                                                sessionStorage.setItem(
                                                    'myCreatedRestaurants',
                                                    JSON.stringify(next)
                                                );
                                            } catch (e) {
                                                console.error(
                                                    'update session myCreatedRestaurants',
                                                    e
                                                );
                                            }

                                            setEditDialogOpen(false);
                                            setEditInitial(null);
                                        }}
                                    />
                                    <CurrentLocationButton
                                        currentPos={userPos}
                                        onPanToCurrent={(pos) => {
                                            setMapCenter(pos);
                                        }}
                                        onLocated={({ lat, lng }) => {
                                            const newPos = { lat, lng };
                                            setUserPos(newPos);
                                            setMapCenter(newPos);
                                            setMapMarkers((prev) => {
                                                const filtered = prev.filter(
                                                    (m) => m.title !== '내 위치'
                                                );
                                                return [
                                                    {
                                                        lat: newPos.lat,
                                                        lng: newPos.lng,
                                                        title: '내 위치',
                                                        variant: 'current',
                                                    },
                                                    ...filtered,
                                                ];
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <RestaurantsList
                                restaurants={displayedRestaurants}
                                userPos={userPos}
                                originPos={
                                    showReviewedOnly && lastClicked
                                        ? lastClicked
                                        : userPos
                                }
                                onItemClick={(r) => handleItemClick(r)}
                            />
                        </div>

                        <div className="sticky bottom-0 bg-white dark:bg-card z-10">
                            <Pagination
                                page={page}
                                canPrev={page > 1}
                                canNext={totalForPaging > page * size}
                                totalPages={Math.max(
                                    1,
                                    Math.ceil(totalForPaging / size)
                                )}
                                onPrev={() => {
                                    const np = Math.max(1, page - 1);
                                    setPage(np);
                                    if (nearbyUsingKakao) return;
                                    if (isNearby) loadNearbyRestaurants(np);
                                    else searchByKeyword(keyword, np);
                                }}
                                onNext={() => {
                                    const np = page + 1;
                                    setPage(np);
                                    if (nearbyUsingKakao) return;
                                    if (isNearby) loadNearbyRestaurants(np);
                                    else searchByKeyword(keyword, np);
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex-1 h-full">
                        <div className="relative h-full">
                            {pendingPick ? (
                                <div className="absolute top-4 left-4 z-50 bg-yellow-50 border border-yellow-300 text-sm p-3 rounded shadow">
                                    <div>지도를 클릭해 좌표를 선택하세요.</div>
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            className="px-2 py-1 bg-white border rounded text-sm"
                                            onClick={() => {
                                                setPendingPick(null);
                                                try {
                                                    pendingPickRef.current =
                                                        null;
                                                } catch (e) {}
                                                try {
                                                    sessionStorage.removeItem(
                                                        'addRestaurantDraft'
                                                    );
                                                } catch (e) {}
                                            }}
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <MapPanel
                                center={mapCenter}
                                markers={markersForDisplay}
                                onMapClick={(pos) => {
                                    try {
                                        setAdjacentList(null);
                                        setAdjacentPos(null);
                                        const pick =
                                            pendingPickRef.current ||
                                            pendingPick;
                                        if (pick) {
                                            pendingPickRef.current = null;
                                            setPendingPick(null);
                                            setMapCenter(pos);
                                            setLastClicked(pos);
                                            try {
                                                const raw =
                                                    sessionStorage.getItem(
                                                        'addRestaurantDraft'
                                                    );
                                                if (raw) {
                                                    const draft =
                                                        JSON.parse(raw);
                                                    const origInitial =
                                                        (pick as any)
                                                            ?.initialData ||
                                                        null;
                                                    const idToUse = origInitial
                                                        ? (origInitial as any)
                                                              .id
                                                        : -Date.now();
                                                    const createdDraft: Restaurant =
                                                        {
                                                            ...(origInitial ||
                                                                {}),
                                                            id: idToUse,
                                                            name:
                                                                draft.name ??
                                                                origInitial?.name ??
                                                                '',
                                                            phone:
                                                                draft.phone ??
                                                                origInitial?.phone ??
                                                                '',
                                                            jibunAddress:
                                                                draft.jibunAddress ??
                                                                origInitial?.jibunAddress ??
                                                                '',
                                                            roadAddress:
                                                                draft.roadAddress ??
                                                                origInitial?.roadAddress ??
                                                                '',
                                                            latitude: pos.lat,
                                                            longitude: pos.lng,
                                                            image:
                                                                origInitial?.image ??
                                                                '/placeholder.svg',
                                                            averageRating: (
                                                                origInitial as any
                                                            )?.averageRating,
                                                            reviewCount:
                                                                (
                                                                    origInitial as any
                                                                )
                                                                    ?.reviewCount ??
                                                                0,
                                                        } as Restaurant;
                                                    setEditInitial(
                                                        createdDraft
                                                    );
                                                    setEditDialogOpen(true);
                                                    sessionStorage.removeItem(
                                                        'addRestaurantDraft'
                                                    );
                                                    return;
                                                }
                                            } catch (e) {
                                                console.error(
                                                    'restore addRestaurantDraft',
                                                    e
                                                );
                                            }
                                            return;
                                        }
                                    } catch (e) {
                                        console.error(
                                            'map click pendingPick handler',
                                            e
                                        );
                                    }

                                    setMapCenter(pos);
                                    setLastClicked(pos);
                                    setPage(1);
                                    try {
                                        kakaoSearchNearby(pos);
                                    } catch (e) {
                                        console.error(
                                            'kakaoSearchNearby failed',
                                            e
                                        );
                                    }
                                }}
                                onMarkerClick={(
                                    id: number | string | undefined,
                                    pos?: { lat: number; lng: number }
                                ) => {
                                    if (
                                        pos &&
                                        Number.isFinite(pos.lat) &&
                                        Number.isFinite(pos.lng)
                                    ) {
                                        console.debug(
                                            '[RestaurantsView] marker click pos',
                                            pos
                                        );
                                        setMapCenter({
                                            lat: pos.lat,
                                            lng: pos.lng,
                                        });
                                        try {
                                            const candidates = [
                                                ...(restaurants || []),
                                                ...(allResults || []),
                                                ...(localAdded || []),
                                            ];
                                            const keyed = new Map<
                                                string,
                                                Restaurant & {
                                                    distanceMeters?: number;
                                                }
                                            >();
                                            for (const r of candidates) {
                                                try {
                                                    const c = toCoords(
                                                        r as any
                                                    );
                                                    if (
                                                        !Number.isFinite(
                                                            c.lat
                                                        ) ||
                                                        !Number.isFinite(c.lng)
                                                    )
                                                        continue;
                                                    const d = distanceMeters(
                                                        pos.lat,
                                                        pos.lng,
                                                        c.lat,
                                                        c.lng
                                                    );
                                                    const id = getId(r as any);
                                                    const key = id
                                                        ? `id:${id}`
                                                        : `c:${c.lat.toFixed(
                                                              6
                                                          )}:${c.lng.toFixed(
                                                              6
                                                          )}`;
                                                    const existing =
                                                        keyed.get(key);
                                                    if (
                                                        !existing ||
                                                        (existing.distanceMeters ??
                                                            Infinity) > d
                                                    ) {
                                                        keyed.set(key, {
                                                            ...(r as Restaurant),
                                                            distanceMeters: d,
                                                        });
                                                    }
                                                } catch (e) {}
                                            }

                                            const computed = Array.from(
                                                keyed.values()
                                            );
                                            computed.sort(
                                                (a, b) =>
                                                    (a.distanceMeters ?? 0) -
                                                    (b.distanceMeters ?? 0)
                                            );
                                            const CLUSTER_RADIUS_METERS = 20;
                                            const filtered = computed
                                                .filter(
                                                    (c) =>
                                                        (c.distanceMeters ??
                                                            Infinity) <=
                                                        CLUSTER_RADIUS_METERS
                                                )
                                                .slice(0, 8);

                                            if (filtered.length === 1) {
                                                console.debug(
                                                    '[RestaurantsView] single adjacent -> open dialog',
                                                    filtered[0]
                                                );
                                                try {
                                                    handleItemClick(
                                                        filtered[0] as Restaurant
                                                    );
                                                } catch (e) {}
                                                setAdjacentList(null);
                                                setAdjacentPos(null);
                                                return;
                                            }
                                            if (filtered.length > 1) {
                                                console.debug(
                                                    '[RestaurantsView] adjacent list length',
                                                    filtered.length
                                                );
                                                setAdjacentList(filtered);
                                                setAdjacentPos({
                                                    lat: pos.lat,
                                                    lng: pos.lng,
                                                });
                                                return;
                                            }
                                        } catch (e) {
                                            console.error(
                                                'compute adjacent list failed',
                                                e
                                            );
                                            setAdjacentList(null);
                                            setAdjacentPos(null);
                                        }
                                    }

                                    const found =
                                        restaurants.find(
                                            (r) => (r as any).id === id
                                        ) ||
                                        allResults.find(
                                            (r) => (r as any).id === id
                                        );
                                    if (found) {
                                        handleItemClick(found as Restaurant);
                                        return;
                                    }

                                    const m = (mapMarkers as any[]).find(
                                        (mm) => {
                                            try {
                                                if (
                                                    mm.id !== undefined &&
                                                    id !== undefined
                                                )
                                                    return (
                                                        String(mm.id) ===
                                                        String(id)
                                                    );
                                                if (
                                                    pos &&
                                                    Number.isFinite(mm.lat) &&
                                                    Number.isFinite(mm.lng)
                                                ) {
                                                    return (
                                                        Math.abs(
                                                            Number(mm.lat) -
                                                                pos.lat
                                                        ) < 1e-6 &&
                                                        Math.abs(
                                                            Number(mm.lng) -
                                                                pos.lng
                                                        ) < 1e-6
                                                    );
                                                }
                                            } catch (e) {}
                                            return false;
                                        }
                                    );
                                    if (m)
                                        setMapCenter({
                                            lat: m.lat,
                                            lng: m.lng,
                                        });
                                }}
                                highlightId={highlightedId}
                            />

                            {adjacentList && adjacentList.length ? (
                                <div
                                    style={{ zIndex: 99999 }}
                                    className="absolute top-6 right-6 w-80 max-w-[40%] bg-white dark:bg-card border shadow-lg rounded p-3"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-medium">
                                            선택한 위치 주변
                                        </div>
                                        <button
                                            className="text-sm text-gray-500 hover:underline"
                                            onClick={() => {
                                                setAdjacentList(null);
                                                setAdjacentPos(null);
                                            }}
                                        >
                                            닫기
                                        </button>
                                    </div>
                                    <ul className="space-y-2 max-h-64 overflow-auto">
                                        {adjacentList.map((r) => (
                                            <li
                                                key={
                                                    String((r as any).id) +
                                                    '_' +
                                                    String(
                                                        (r as any).latitude ??
                                                            (r as any).lat
                                                    )
                                                }
                                                className="p-2 rounded hover:bg-gray-50 cursor-pointer"
                                                onClick={() => {
                                                    try {
                                                        handleItemClick(
                                                            r as Restaurant
                                                        );
                                                    } catch (e) {}
                                                    setAdjacentList(null);
                                                    setAdjacentPos(null);
                                                }}
                                            >
                                                <div className="text-sm font-medium">
                                                    {(r as any).name || '식당'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {Math.round(
                                                        r.distanceMeters ?? 0
                                                    )}
                                                    m
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </main>

            <RestaurantDetailDialog
                restaurant={selected}
                open={!!selected}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelected(null);
                        setHighlightedId(null);
                    }
                }}
                onDeleted={(id) => handleDeleted(id)}
                onEditLocal={(r) => {
                    setEditInitial(r);
                    setEditDialogOpen(true);
                    setSelected(null);
                    setHighlightedId(null);
                }}
                onCreated={async (created) => {
                    try {
                        setSelected(created);
                        try {
                            setPage(1);
                        } catch (e) {}
                        try {
                            addLocalRestaurant(created);
                        } catch (e) {
                            console.error('addLocalRestaurant failed', e);
                        }

                        try {
                            setMapMarkers((prev) => {
                                const next = (prev || []).slice();
                                const lat = Number(
                                    (created as any).latitude ??
                                        (created as any).lat ??
                                        0
                                );
                                const lng = Number(
                                    (created as any).longitude ??
                                        (created as any).lng ??
                                        0
                                );
                                const idKey = created.id ?? null;
                                let replaced = false;
                                for (let i = 0; i < next.length; i++) {
                                    try {
                                        const m = next[i] as any;
                                        const mLat = Number(m.lat ?? 0);
                                        const mLng = Number(m.lng ?? 0);
                                        if (
                                            Math.abs(mLat - lat) < 1e-6 &&
                                            Math.abs(mLng - lng) < 1e-6
                                        ) {
                                            next[i] = {
                                                ...m,
                                                id: idKey,
                                                lat,
                                                lng,
                                                title: created.name || m.title,
                                            };
                                            replaced = true;
                                            break;
                                        }
                                    } catch (e) {}
                                }
                                if (!replaced) {
                                    next.unshift({
                                        id: idKey,
                                        lat,
                                        lng,
                                        title: created.name || '식당',
                                    });
                                }
                                return next;
                            });
                        } catch (e) {
                            console.error('setMapMarkers failed', e);
                        }

                        try {
                            const payload = {
                                id: created.id,
                                lat:
                                    (created as any).latitude ??
                                    (created as any).lat,
                                lng:
                                    (created as any).longitude ??
                                    (created as any).lng,
                            };
                            const raw =
                                sessionStorage.getItem(
                                    'myCreatedRestaurants'
                                ) || '[]';
                            const arr = JSON.parse(raw || '[]');
                            const next = Array.isArray(arr) ? arr.slice() : [];
                            let found = false;
                            for (let i = 0; i < next.length; i++) {
                                const it = next[i];
                                try {
                                    const itLat = Number(
                                        it.lat ?? it.latitude ?? 0
                                    );
                                    const itLng = Number(
                                        it.lng ?? it.longitude ?? 0
                                    );
                                    const updLat = Number(payload.lat ?? 0);
                                    const updLng = Number(payload.lng ?? 0);
                                    const sameCoords =
                                        Math.abs(itLat - updLat) < 1e-6 &&
                                        Math.abs(itLng - updLng) < 1e-6;
                                    if (sameCoords) {
                                        next[i] = payload;
                                        found = true;
                                        break;
                                    }
                                } catch (e) {}
                            }
                            if (!found) next.push(payload);
                            sessionStorage.setItem(
                                'myCreatedRestaurants',
                                JSON.stringify(next)
                            );
                        } catch (e) {
                            console.error(
                                'persist myCreatedRestaurants failed',
                                e
                            );
                        }
                    } catch (e) {
                        console.error('onCreated handler error', e);
                    }
                }}
            />
        </div>
    );
}
