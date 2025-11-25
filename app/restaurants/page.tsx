'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import SearchBar from './_components/SearchBar';
import CurrentLocationButton from './_components/CurrentLocationButton';
import AddRestaurantDialog from './_components/AddRestaurantDialog';
import RestaurantsList from './_components/RestaurantsList';
import Pagination from './_components/Pagination';
import MapPanel from './_components/MapPanel';
import type { Restaurant } from '@/lib/restaurants';
import { fetchRestaurants, fetchNearbyRestaurants } from '@/lib/restaurants';

export default function RestaurantsPage() {
    const [activeTab] = useState<'list' | 'map'>('map');
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: 33.450701,
        lng: 126.570667,
    });
    const [mapMarkers, setMapMarkers] = useState<
        Array<{
            lat: number;
            lng: number;
            title?: string;
            variant?: 'default' | 'current';
        }>
    >([
        { lat: 33.450701, lng: 126.570667, title: '제주동화마을' },
        { lat: 33.450936, lng: 126.569477, title: '수목원 야시장' },
    ]);

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const size = 10;
    const [keyword, setKeyword] = useState('');
    const [isNearby, setIsNearby] = useState(false);
    const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
        null
    );
    const [lastClicked, setLastClicked] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const loadRestaurants = async (kw = keyword, p = page) => {
        const json = await fetchRestaurants({ keyword: kw, page: p, size });
        setRestaurants(json.data);
        setTotal(json.totalElements);
        setMapMarkers((prev) => {
            const current = prev.find((m) => m.title === '내 위치');
            const list = (json.data as Restaurant[]).map((r) => ({
                lat: r.lat,
                lng: r.lng,
                title: r.name,
            }));
            return current ? [current, ...list] : list;
        });
    };

    const loadNearbyRestaurants = async (
        p = page,
        pos?: { lat: number; lng: number }
    ) => {
        const target = pos || userPos;
        if (!target) return;
        try {
            const json = await fetchNearbyRestaurants({
                lat: target.lat,
                lng: target.lng,
                page: p,
                size,
            });
            setRestaurants(json.data);
            setTotal(json.totalElements);
            setMapMarkers((prev) => {
                // Always keep '내 위치' marker first
                const filtered = prev.filter((m) => m.title !== '내 위치');
                const list = (json.data as Restaurant[]).map((r) => ({
                    lat: r.lat,
                    lng: r.lng,
                    title: r.name,
                }));
                return [
                    {
                        lat: target.lat,
                        lng: target.lng,
                        title: '내 위치',
                        variant: 'current',
                    },
                    ...list,
                ];
            });
        } catch (e) {
            console.error('nearby fetch error', e);
            window.alert('내 주변 식당을 불러오지 못했습니다.');
        }
    };

    useEffect(() => {
        loadRestaurants().catch(console.error);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            {/* Header 제거: 검색 바를 리스트 패널 상단으로 이동 */}

            <div
                className="flex flex-1 min-h-[calc(104vh-120px)]"
                style={{ height: 'calc(104vh - 120px)' }}
            >
                <div className="w-[30%] min-w-[280px] max-w-[400px] border-r bg-white dark:bg-card overflow-y-auto">
                    {/* 리스트 패널 상단 검색바 */}
                    <div className="p-4 border-b">
                        <SearchBar
                            keyword={keyword}
                            onKeywordChange={(v) => {
                                setKeyword(v);
                                if (isNearby) {
                                    // 검색어 입력 시 주변 모드 해제
                                    setIsNearby(false);
                                }
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
                                    onLocated={({ lat, lng }) => {
                                        const newPos = { lat, lng };
                                        setUserPos(newPos);
                                        setMapCenter(newPos);
                                        setIsNearby(true);
                                        setPage(1);
                                        // 주변 식당 호출 후 마커 구성 (함수 내부에서 '내 위치' 포함)
                                        loadNearbyRestaurants(1, newPos);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <RestaurantsList restaurants={restaurants} />

                    <Pagination
                        page={page}
                        canPrev={page !== 1}
                        canNext={restaurants.length >= size}
                        onPrev={() => {
                            const np = Math.max(1, page - 1);
                            setPage(np);
                            if (isNearby) {
                                loadNearbyRestaurants(np);
                            } else {
                                loadRestaurants(keyword, np);
                            }
                        }}
                        onNext={() => {
                            const np = page + 1;
                            setPage(np);
                            if (isNearby) {
                                loadNearbyRestaurants(np);
                            } else {
                                loadRestaurants(keyword, np);
                            }
                        }}
                    />
                </div>
                <MapPanel
                    center={mapCenter}
                    markers={mapMarkers}
                    onMapClick={(pos) => {
                        console.log('지도 클릭:', pos);
                        setLastClicked(pos);
                    }}
                />
            </div>
            <Footer />
        </div>
    );
}
