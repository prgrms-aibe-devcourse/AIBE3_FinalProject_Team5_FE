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
        localAdded,
        handleItemClick: hookHandleItemClick,
    } = useRestaurants();

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

    const sortByLastClicked = (arr: Restaurant[] | null) => {
        if (!arr || !lastClicked) return arr || [];
        const lat = Number(lastClicked.lat);
        const lng = Number(lastClicked.lng);
        return arr.slice().sort((a, b) => {
            try {
                const aLat = Number(
                    (a as any).latitude ?? (a as any).lat ?? NaN
                );
                const aLng = Number(
                    (a as any).longitude ?? (a as any).lng ?? NaN
                );
                const bLat = Number(
                    (b as any).latitude ?? (b as any).lat ?? NaN
                );
                const bLng = Number(
                    (b as any).longitude ?? (b as any).lng ?? NaN
                );
                if (!Number.isFinite(aLat) || !Number.isFinite(aLng)) return 1;
                if (!Number.isFinite(bLat) || !Number.isFinite(bLng)) return -1;
                return (
                    distanceSq(aLat, aLng, lat, lng) -
                    distanceSq(bLat, bLng, lat, lng)
                );
            } catch (e) {
                return 0;
            }
        });
    };

    const handleItemClick = (r: Restaurant) => {
        try {
            const rLat = Number((r as any).latitude ?? (r as any).lat ?? NaN);
            const rLng = Number((r as any).longitude ?? (r as any).lng ?? NaN);
            const rId =
                (r as any)?.id !== undefined && (r as any)?.id !== null
                    ? String((r as any).id)
                    : null;
            const rName = ((r as any)?.name || '')
                .toString()
                .trim()
                .toLowerCase();
            const rPlaceUrl =
                (r as any)?.placeUrl || (r as any)?.placeId || null;

            if (rId) {
                const byId = (allResults || []).find(
                    (it) =>
                        (it as any).id !== undefined &&
                        String((it as any).id) === rId
                );
                if (byId) {
                    setSelected(byId as Restaurant);
                    hookHandleItemClick(byId as Restaurant);
                    return;
                }
            }

            const localMatch = (localAdded || []).find((it) => {
                try {
                    const itId =
                        (it as any)?.id !== undefined &&
                        (it as any)?.id !== null
                            ? String((it as any).id)
                            : null;
                    const itLat = Number(
                        (it as any).latitude ?? (it as any).lat ?? NaN
                    );
                    const itLng = Number(
                        (it as any).longitude ?? (it as any).lng ?? NaN
                    );
                    const itName = ((it as any)?.name || '')
                        .toString()
                        .trim()
                        .toLowerCase();
                    if (itId && rId && itId === rId) return true;
                    if (
                        Number.isFinite(itLat) &&
                        Number.isFinite(itLng) &&
                        Number.isFinite(rLat) &&
                        Number.isFinite(rLng)
                    ) {
                        const sameCoords =
                            Math.abs(itLat - rLat) < 1e-6 &&
                            Math.abs(itLng - rLng) < 1e-6;
                        if (sameCoords && itName && rName && itName === rName)
                            return true;
                    }
                } catch (e) {}
                return false;
            });
            if (localMatch) {
                const augmented = {
                    ...(r as any),
                    isLocal: true,
                } as Restaurant & { isLocal?: boolean };
                setSelected(augmented);
                hookHandleItemClick(r);
                return;
            }

            if (lastClicked && Number.isFinite(rLat) && Number.isFinite(rLng)) {
                const lcLat = Number(lastClicked.lat);
                const lcLng = Number(lastClicked.lng);
                if (
                    Math.abs(lcLat - rLat) < 1e-6 &&
                    Math.abs(lcLng - rLng) < 1e-6
                ) {
                    const augmented = {
                        ...(r as any),
                        isLocal: true,
                    } as Restaurant & { isLocal?: boolean };
                    setSelected(augmented);
                    hookHandleItemClick(r);
                    return;
                }
            }

            const match = (allResults || []).find((it) => {
                try {
                    const itLat = Number(
                        (it as any).latitude ?? (it as any).lat ?? NaN
                    );
                    const itLng = Number(
                        (it as any).longitude ?? (it as any).lng ?? NaN
                    );
                    const itId =
                        (it as any)?.id !== undefined &&
                        (it as any)?.id !== null
                            ? String((it as any).id)
                            : null;
                    const itName = ((it as any)?.name || '')
                        .toString()
                        .trim()
                        .toLowerCase();
                    const itPlace =
                        (it as any)?.placeUrl || (it as any)?.placeId || null;
                    const sameId = rId && itId && rId === itId;
                    const coordsMatch =
                        Number.isFinite(itLat) &&
                        Number.isFinite(itLng) &&
                        Number.isFinite(rLat) &&
                        Number.isFinite(rLng) &&
                        Math.abs(itLat - rLat) < 1e-6 &&
                        Math.abs(itLng - rLng) < 1e-6;
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
            if (match) {
                setSelected(match as Restaurant);
            } else {
                setSelected(r);
            }
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
                if ((r as any).id !== undefined && (r as any).id !== null) {
                    keep.add(String((r as any).id));
                } else {
                    const lat = Number(
                        (r as any).latitude ?? (r as any).lat ?? NaN
                    ).toFixed(6);
                    const lng = Number(
                        (r as any).longitude ?? (r as any).lng ?? NaN
                    ).toFixed(6);
                    keep.add(`${lat}:${lng}`);
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
                    const lat = Number(
                        (r as any).latitude ?? (r as any).lat ?? 0
                    );
                    const lng = Number(
                        (r as any).longitude ?? (r as any).lng ?? 0
                    );
                    const title = (r as any).name || '식당';
                    const exists = filtered.some(
                        (m) => String((m as any).id) === String(rid)
                    );
                    if (!exists) {
                        built.push({
                            id: rid,
                            lat,
                            lng,
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
                                        // debounce client-side filtering too
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
                                        // immediate client filter
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
                                onMarkerClick={(id) => {
                                    const found =
                                        restaurants.find(
                                            (r) => (r as any).id === id
                                        ) ||
                                        allResults.find(
                                            (r) => (r as any).id === id
                                        );
                                    if (found)
                                        handleItemClick(found as Restaurant);
                                    else {
                                        const m = (mapMarkers as any[]).find(
                                            (mm) =>
                                                String((mm as any).id) ===
                                                String(id)
                                        );
                                        if (m)
                                            setMapCenter({
                                                lat: m.lat,
                                                lng: m.lng,
                                            });
                                    }
                                }}
                                highlightId={highlightedId}
                            />
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
            />
        </div>
    );
}
