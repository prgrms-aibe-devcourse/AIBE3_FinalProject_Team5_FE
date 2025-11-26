'use client';

import { useState } from 'react';
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
        loadNearbyRestaurants,
        kakaoSearchNearby,
        handleItemClick: hookHandleItemClick,
    } = useRestaurants();

    const [selected, setSelected] = useState<Restaurant | null>(null);

    const handleItemClick = (r: Restaurant) => {
        setSelected(r);
        hookHandleItemClick(r);
    };

    const handleDeleted = (id: number) => {
        setSelected(null);
        setMapMarkers((prev) =>
            prev.filter((m) => String((m as any).id) !== String(id))
        );
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
                                }}
                                onSearch={() => {
                                    setPage(1);
                                    setIsNearby(false);
                                    loadRestaurants(keyword, 1);
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
                                        onSuccess={async ({ lat, lng }) => {
                                            setPage(1);
                                            await loadRestaurants('', 1);
                                            setMapCenter({ lat, lng });
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
                                    else loadRestaurants(keyword, np);
                                }}
                                onNext={() => {
                                    const np = page + 1;
                                    setPage(np);
                                    if (nearbyUsingKakao) return;
                                    if (isNearby) loadNearbyRestaurants(np);
                                    else loadRestaurants(keyword, np);
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex-1 h-full">
                        <MapPanel
                            center={mapCenter}
                            markers={mapMarkers}
                            onMapClick={(pos) => {
                                console.log('지도 클릭:', pos);
                                setMapCenter(pos);
                                setLastClicked(pos);
                                setPage(1);
                                kakaoSearchNearby(pos);
                            }}
                            onMarkerClick={(id) => {
                                const found =
                                    restaurants.find(
                                        (r) => (r as any).id === id
                                    ) ||
                                    allResults.find(
                                        (r) => (r as any).id === id
                                    );
                                if (found) handleItemClick(found as Restaurant);
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
            />
        </div>
    );
}
