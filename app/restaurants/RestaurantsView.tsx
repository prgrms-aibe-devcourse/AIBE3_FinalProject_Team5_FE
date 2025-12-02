'use client';

import { useState, useRef, useEffect } from 'react';
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

    const handleItemClick = (r: Restaurant) => {
        try {
            const rLat = Number((r as any).latitude ?? (r as any).lat ?? 0);
            const rLng = Number((r as any).longitude ?? (r as any).lng ?? 0);

            const localMatch = (localAdded || []).find((it) => {
                const itLat = Number(
                    (it as any).latitude ?? (it as any).lat ?? 0
                );
                const itLng = Number(
                    (it as any).longitude ?? (it as any).lng ?? 0
                );
                return (
                    Math.abs(itLat - rLat) < 1e-6 &&
                    Math.abs(itLng - rLng) < 1e-6
                );
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

            if (lastClicked) {
                const lcLat = Number(lastClicked.lat);
                const lcLng = Number(lastClicked.lng);
                if (
                    Math.abs(lcLat - rLat) < 1e-4 &&
                    Math.abs(lcLng - rLng) < 1e-4
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
                const itLat = Number(
                    (it as any).latitude ?? (it as any).lat ?? 0
                );
                const itLng = Number(
                    (it as any).longitude ?? (it as any).lng ?? 0
                );
                const sameCoords =
                    Math.abs(itLat - rLat) < 1e-6 &&
                    Math.abs(itLng - rLng) < 1e-6;
                const sameId =
                    (it as any).id !== undefined &&
                    (r as any).id !== undefined &&
                    String((it as any).id) === String((r as any).id);
                const itHasLocalFlag =
                    Boolean((it as any).isLocal) ||
                    Boolean((it as any).ownerId ?? (it as any).memberId);
                return (sameCoords || sameId) && itHasLocalFlag;
            });
            if (match) {
                const augmented = {
                    ...(r as any),
                    isLocal: true,
                } as Restaurant & { isLocal?: boolean };
                setSelected(augmented);
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
            // @ts-ignore
            if (typeof removeLocalRestaurant === 'function') {
                // @ts-ignore
                removeLocalRestaurant(id);
                try {
                    if (typeof window !== 'undefined') {
                        window.location.reload();
                    }
                } catch (e) {}
                return;
            }
        } catch (e) {
            console.error('call removeLocalRestaurant failed', e);
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
                                                    typeof updateLocalRestaurant ===
                                                    'function'
                                                ) {
                                                    // @ts-ignore
                                                    updateLocalRestaurant(
                                                        updated
                                                    );
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
                                                            // @ts-ignore
                                                            addLocalRestaurant(
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
                                            setIsNearby(true);
                                            setPage(1);
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
                                            loadNearbyRestaurants(1, newPos);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <RestaurantsList
                                restaurants={restaurants}
                                userPos={userPos}
                                onItemClick={(r) => handleItemClick(r)}
                            />
                        </div>

                        <div className="sticky bottom-0 bg-white dark:bg-card z-10">
                            <Pagination
                                page={page}
                                canPrev={page > 1}
                                canNext={total > page * size}
                                totalPages={Math.max(
                                    1,
                                    Math.ceil(total / size)
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
                                markers={mapMarkers}
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
