import { useCallback, useEffect, useState } from 'react';
import type { Restaurant } from '@/lib/restaurants';
import { fetchRestaurants, fetchNearbyRestaurants } from '@/lib/restaurants';
import { distanceMeters } from '@/lib/geo';

export function useRestaurants(
    initialCenter = { lat: 33.450701, lng: 126.570667 }
) {
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
        initialCenter
    );
    const [mapMarkers, setMapMarkers] = useState<
        Array<{
            lat: number;
            lng: number;
            title?: string;
            variant?: 'default' | 'current' | 'selected';
            id?: number | string;
        }>
    >([
        {
            lat: initialCenter.lat,
            lng: initialCenter.lng,
            title: '제주동화마을',
        },
    ]);

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [allResults, setAllResults] = useState<Restaurant[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const size = 6;
    const [nearbyUsingKakao, setNearbyUsingKakao] = useState(false);
    const [highlightedId, setHighlightedId] = useState<number | string | null>(
        null
    );
    const [keyword, setKeyword] = useState('');
    const [isNearby, setIsNearby] = useState(false);
    const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
        null
    );
    const [lastClicked, setLastClicked] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    const loadRestaurants = useCallback(
        async (kw = keyword, p = page) => {
            const json = await fetchRestaurants({ keyword: kw, page: p, size });
            const list = Array.isArray(json.data) ? json.data : [];
            setRestaurants(list);
            setTotal(json.totalElements);
            setMapMarkers((prev) => {
                const current = prev.find((m) => m.title === '내 위치');
                const list = (json.data as Restaurant[]).map((r) => ({
                    lat: (r as any).latitude ?? (r as any).lat,
                    lng: (r as any).longitude ?? (r as any).lng,
                    title: r.name,
                }));
                return current ? [current, ...list] : list;
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [keyword, page]
    );

    const loadNearbyRestaurants = useCallback(
        async (p = page, pos?: { lat: number; lng: number }) => {
            const target = pos || userPos;
            if (!target) return;
            try {
                const json = await fetchNearbyRestaurants({
                    lat: target.lat,
                    lng: target.lng,
                    page: p,
                    size,
                });
                const list = Array.isArray(json.data) ? json.data : [];
                setRestaurants(list);
                setTotal(json.totalElements);
                setMapMarkers((prev) => {
                    const filtered = prev.filter((m) => m.title !== '내 위치');
                    const list = (json.data as Restaurant[]).map((r) => ({
                        lat: (r as any).latitude ?? (r as any).lat,
                        lng: (r as any).longitude ?? (r as any).lng,
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
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userPos, page]
    );

    const kakaoSearchNearby = useCallback(
        async (
            pos: { lat: number; lng: number },
            radiusMeters = 2000,
            p = 1
        ) => {
            try {
                if (typeof window === 'undefined' || !(window as any).kakao) {
                    window.alert('카카오 맵이 준비되지 않았습니다.');
                    return;
                }
                const kakao = (window as any).kakao;
                const places = new kakao.maps.services.Places();
                const optionsBase = {
                    location: new kakao.maps.LatLng(pos.lat, pos.lng),
                    radius: Math.min(20000, Math.max(1, radiusMeters)),
                } as any;

                const accum: any[] = [];
                await new Promise<void>((resolve, reject) => {
                    const callback = (
                        data: any[],
                        status: any,
                        pagination: any
                    ) => {
                        try {
                            if (
                                status === kakao.maps.services.Status.OK &&
                                Array.isArray(data)
                            ) {
                                accum.push(...data);
                                if (pagination && pagination.hasNextPage) {
                                    pagination.nextPage();
                                    return;
                                }
                                const full = accum.map((it) => ({
                                    id:
                                        Number(it.id) ||
                                        -Math.floor(Math.random() * 1000000),
                                    name: it.place_name,
                                    phone: it.phone,
                                    jibunAddress: it.address_name,
                                    roadAddress: it.road_address_name,
                                    latitude: Number(it.y),
                                    longitude: Number(it.x),
                                    placeUrl:
                                        it.place_url || it.place_url2 || null,
                                    averageRating: undefined,
                                    reviewCount: undefined,
                                    image: '/placeholder.svg',
                                }));
                                const withDist = full.map(
                                    (it) =>
                                        ({
                                            ...it,
                                            distanceMeters: distanceMeters(
                                                pos.lat,
                                                pos.lng,
                                                it.latitude,
                                                it.longitude
                                            ),
                                        } as any)
                                );
                                const sorted = withDist.sort(
                                    (a: any, b: any) =>
                                        a.distanceMeters - b.distanceMeters
                                );
                                setNearbyUsingKakao(true);
                                setAllResults(sorted);
                                setRestaurants(sorted.slice(0, size));
                                setTotal(sorted.length);
                                const base: {
                                    lat: number;
                                    lng: number;
                                    title?: string;
                                    variant?:
                                        | 'default'
                                        | 'current'
                                        | 'selected';
                                    id?: number | string;
                                }[] = [];
                                base.push({
                                    lat: pos.lat,
                                    lng: pos.lng,
                                    title: '선택한 위치',
                                    variant: 'selected',
                                });
                                if (userPos) {
                                    base.unshift({
                                        lat: userPos.lat,
                                        lng: userPos.lng,
                                        title: '내 위치',
                                        variant: 'current',
                                    });
                                }
                                base.push(
                                    ...sorted.map((r) => ({
                                        id: r.id,
                                        lat: r.latitude,
                                        lng: r.longitude,
                                        title: r.name,
                                    }))
                                );
                                setMapMarkers(base);
                                resolve();
                            } else if (
                                status ===
                                kakao.maps.services.Status.ZERO_RESULT
                            ) {
                                setNearbyUsingKakao(true);
                                setAllResults([]);
                                setRestaurants([]);
                                setTotal(0);
                                const base: {
                                    lat: number;
                                    lng: number;
                                    title?: string;
                                    variant?:
                                        | 'default'
                                        | 'current'
                                        | 'selected';
                                }[] = userPos
                                    ? [
                                          {
                                              lat: userPos.lat,
                                              lng: userPos.lng,
                                              title: '내 위치',
                                              variant: 'current',
                                          },
                                      ]
                                    : [];
                                base.push({
                                    lat: pos.lat,
                                    lng: pos.lng,
                                    title: '선택한 위치',
                                    variant: 'selected',
                                });
                                setMapMarkers(base);
                                resolve();
                            } else {
                                reject(
                                    new Error(
                                        'Kakao Places search failed: ' + status
                                    )
                                );
                            }
                        } catch (e) {
                            reject(e);
                        }
                    };

                    places.categorySearch('FD6', callback, {
                        ...optionsBase,
                        page: 1,
                    });
                });
            } catch (err) {
                console.error('kakaoSearchNearby error', err);
                window.alert('카카오로 주변 식당을 불러오지 못했습니다.');
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userPos]
    );

    useEffect(() => {
        if (nearbyUsingKakao && allResults && allResults.length) {
            const start = (page - 1) * size;
            setRestaurants(allResults.slice(start, start + size));
        }
    }, [page, allResults, nearbyUsingKakao]);

    useEffect(() => {
        loadRestaurants().catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
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
        handleItemClick: (r: Restaurant) => {
            // convenience helper kept for compatibility
            const lat = (r as any).latitude ?? (r as any).lat;
            const lng = (r as any).longitude ?? (r as any).lng;
            if (lat && lng) setMapCenter({ lat, lng });
            setHighlightedId((r as any).id ?? null);
            // do not set selected here (UI responsibility)
        },
    };
}

export default useRestaurants;
