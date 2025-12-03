import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/global/auth/useAuth';
import type { Restaurant } from '@/lib/restaurants';
import { fetchRestaurants, fetchNearbyRestaurants } from '@/lib/restaurants';
import { distanceMeters } from '@/lib/geo';

type Marker = {
    lat: number;
    lng: number;
    title?: string;
    variant?: 'default' | 'current' | 'selected';
    id?: number | string;
};

export function useRestaurants(
    initialCenter = { lat: 33.450701, lng: 126.570667 }
) {
    const { isLogin, loginMember } = useAuth();
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
        initialCenter
    );
    const [mapMarkers, setMapMarkers] = useState<Marker[]>([
        {
            lat: initialCenter.lat,
            lng: initialCenter.lng,
            title: '제주동화마을',
        },
    ]);

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [allResults, setAllResults] = useState<Restaurant[]>([]);
    const [localAdded, setLocalAdded] = useState<Restaurant[]>([]);
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
            const rawList = Array.isArray(json) ? json : [];
            const list = (rawList as Restaurant[]).filter((r: any) => {
                const ownerId = r?.ownerId ?? r?.memberId ?? null;
                if (!ownerId) return true;
                if (
                    isLogin &&
                    loginMember &&
                    Number(ownerId) === Number(loginMember.id)
                )
                    return true;
                return false;
            });

            const ref = userPos ?? mapCenter;
            const merged = [...(list as Restaurant[])];
            if (isLogin && localAdded && localAdded.length) {
                const existingIds = new Set(merged.map((r) => (r as any).id));
                for (const la of localAdded) {
                    const ownerId =
                        (la as any).ownerId ?? (la as any).memberId ?? null;
                    if (
                        loginMember &&
                        ownerId &&
                        Number(ownerId) === Number(loginMember.id)
                    ) {
                        if (!existingIds.has((la as any).id))
                            merged.unshift(la);
                    }
                }
            }
            if (ref) {
                merged.forEach((r) => {
                    const lat = (r as any).latitude ?? (r as any).lat;
                    const lng = (r as any).longitude ?? (r as any).lng;
                    (r as any).distanceMeters = distanceMeters(
                        ref.lat,
                        ref.lng,
                        lat,
                        lng
                    );
                });
                merged.sort(
                    (a: any, b: any) =>
                        (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0)
                );
            }
            setRestaurants(merged.slice((p - 1) * size, (p - 1) * size + size));
            setTotal(merged.length);
            setMapMarkers((prev) => {
                const current = prev.find((m) => m.title === '내 위치');
                const markersForServer: Marker[] = (list as Restaurant[]).map(
                    (r) => ({
                        lat: (r as any).latitude ?? (r as any).lat,
                        lng: (r as any).longitude ?? (r as any).lng,
                        title: r.name,
                    })
                );
                const base: Marker[] = current
                    ? [current, ...markersForServer]
                    : markersForServer;
                if (isLogin && localAdded && localAdded.length) {
                    const existing = new Set(
                        base.map((m) => `${m.lat}:${m.lng}`)
                    );
                    for (const la of localAdded) {
                        const ownerId =
                            (la as any).ownerId ?? (la as any).memberId ?? null;
                        if (
                            loginMember &&
                            ownerId &&
                            Number(ownerId) === Number(loginMember.id)
                        ) {
                            const lat = (la as any).latitude ?? (la as any).lat;
                            const lng =
                                (la as any).longitude ?? (la as any).lng;
                            const key = `${lat}:${lng}`;
                            if (!existing.has(key))
                                base.push({
                                    id: la.id,
                                    lat,
                                    lng,
                                    title: la.name,
                                } as Marker);
                        }
                    }
                }
                return base as Marker[];
            });
        },
        [keyword, page, userPos, mapCenter, isLogin, localAdded, loginMember]
    );

    const loadNearbyRestaurants = useCallback(
        async (p = page, pos?: { lat: number; lng: number }) => {
            const target = pos || userPos;
            if (!target) return;
            try {
                console.debug('[useRestaurants] loadNearbyRestaurants called', {
                    page: p,
                    pos: target,
                });
                const json = await fetchNearbyRestaurants({
                    lat: target.lat,
                    lng: target.lng,
                    page: p,
                    size,
                });
                const rawList = Array.isArray(json) ? json : [];
                const list = (rawList as Restaurant[]).filter((r: any) => {
                    const ownerId = r?.ownerId ?? r?.memberId ?? null;
                    if (!ownerId) return true;
                    if (
                        isLogin &&
                        loginMember &&
                        Number(ownerId) === Number(loginMember.id)
                    )
                        return true;
                    return false;
                });
                const merged = [...(list as Restaurant[])];
                if (isLogin && localAdded && localAdded.length) {
                    const existingIds = new Set(
                        merged.map((r) => (r as any).id)
                    );
                    for (const la of localAdded) {
                        const ownerId =
                            (la as any).ownerId ?? (la as any).memberId ?? null;
                        if (
                            loginMember &&
                            ownerId &&
                            Number(ownerId) === Number(loginMember.id)
                        ) {
                            if (!existingIds.has((la as any).id))
                                merged.unshift(la);
                        }
                    }
                }
                merged.forEach((r) => {
                    const lat = (r as any).latitude ?? (r as any).lat;
                    const lng = (r as any).longitude ?? (r as any).lng;
                    (r as any).distanceMeters = distanceMeters(
                        target.lat,
                        target.lng,
                        lat,
                        lng
                    );
                });
                merged.sort(
                    (a: any, b: any) =>
                        (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0)
                );
                setRestaurants(
                    merged.slice((p - 1) * size, (p - 1) * size + size)
                );
                setTotal(merged.length);
                setMapMarkers((prev) => {
                    const filtered = prev.filter((m) => m.title !== '내 위치');
                    const markersForServer: Marker[] = (
                        list as Restaurant[]
                    ).map((r) => ({
                        lat: (r as any).latitude ?? (r as any).lat,
                        lng: (r as any).longitude ?? (r as any).lng,
                        title: r.name,
                    }));
                    const baseList: Marker[] = [
                        {
                            lat: target.lat,
                            lng: target.lng,
                            title: '내 위치',
                            variant: 'current',
                        },
                        ...markersForServer,
                    ];

                    if (isLogin && localAdded && localAdded.length) {
                        const mine = localAdded.filter((la) => {
                            const ownerId =
                                (la as any).ownerId ??
                                (la as any).memberId ??
                                null;
                            return (
                                loginMember &&
                                ownerId &&
                                Number(ownerId) === Number(loginMember.id)
                            );
                        });
                        if (mine.length) {
                            return [
                                ...baseList,
                                ...mine.map(
                                    (r) =>
                                        ({
                                            id: r.id,
                                            lat:
                                                (r as any).latitude ??
                                                (r as any).lat,
                                            lng:
                                                (r as any).longitude ??
                                                (r as any).lng,
                                            title: r.name,
                                        } as Marker)
                                ),
                            ] as Marker[];
                        }
                    }

                    return baseList as Marker[];
                });
            } catch (e) {
                console.error('nearby fetch error', e);
            }
        },
        [userPos, page, isLogin, localAdded, loginMember]
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
                    const callback = async (
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

                                let mergedResults: any[] = sorted;
                                try {
                                    if (isLogin) {
                                        const radiusKm = Math.min(
                                            20,
                                            Math.max(0.001, radiusMeters / 1000)
                                        );
                                        const backend =
                                            await fetchNearbyRestaurants({
                                                lat: pos.lat,
                                                lng: pos.lng,
                                                page: 1,
                                                size: 200,
                                                radiusKm,
                                            }).catch((e) => {
                                                console.error(
                                                    'backend nearby fetch failed',
                                                    e
                                                );
                                                return [] as any[];
                                            });

                                        const backendFiltered = (
                                            backend || []
                                        ).filter((r: any) => {
                                            const ownerId =
                                                r?.ownerId ??
                                                r?.memberId ??
                                                null;
                                            if (!ownerId) return true;
                                            if (
                                                isLogin &&
                                                loginMember &&
                                                Number(ownerId) ===
                                                    Number(loginMember.id)
                                            )
                                                return true;
                                            return false;
                                        });

                                        const backendWithDist = (
                                            backendFiltered || []
                                        ).map((r: any) => ({
                                            ...r,
                                            distanceMeters: distanceMeters(
                                                pos.lat,
                                                pos.lng,
                                                (r as any).latitude ??
                                                    (r as any).lat,
                                                (r as any).longitude ??
                                                    (r as any).lng
                                            ),
                                        }));

                                        const localMine = (localAdded || [])
                                            .filter((la) => {
                                                const ownerId =
                                                    (la as any).ownerId ??
                                                    (la as any).memberId ??
                                                    null;
                                                return (
                                                    loginMember &&
                                                    ownerId &&
                                                    Number(ownerId) ===
                                                        Number(loginMember.id)
                                                );
                                            })
                                            .map((la) => ({
                                                ...la,
                                                isLocal: true,
                                                distanceMeters: distanceMeters(
                                                    pos.lat,
                                                    pos.lng,
                                                    (la as any).latitude ??
                                                        (la as any).lat,
                                                    (la as any).longitude ??
                                                        (la as any).lng
                                                ),
                                            }));

                                        const keyed = new Map<string, any>();
                                        const keyOf = (it: any) =>
                                            `${Number(
                                                it.latitude ?? it.lat
                                            ).toFixed(6)}:${Number(
                                                it.longitude ?? it.lng
                                            ).toFixed(6)}`;

                                        for (const l of localMine)
                                            keyed.set(keyOf(l), l);
                                        for (const b of backendWithDist)
                                            if (!keyed.has(keyOf(b)))
                                                keyed.set(keyOf(b), b);
                                        for (const k of sorted) {
                                            const key = keyOf(k);
                                            if (!keyed.has(key))
                                                keyed.set(key, k);
                                        }

                                        mergedResults = Array.from(
                                            keyed.values()
                                        );
                                    }
                                } catch (e) {
                                    console.error(
                                        'merge nearby results error',
                                        e
                                    );
                                }

                                console.debug(
                                    '[useRestaurants] kakaoSearchNearby set results',
                                    { count: mergedResults.length }
                                );
                                setNearbyUsingKakao(true);
                                setAllResults(mergedResults);
                                setRestaurants(mergedResults.slice(0, size));
                                setTotal(mergedResults.length);
                                const base: Marker[] = [];
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
                                    ...mergedResults.map((r: any) => ({
                                        id: r.id,
                                        lat:
                                            (r as any).latitude ??
                                            (r as any).lat,
                                        lng:
                                            (r as any).longitude ??
                                            (r as any).lng,
                                        title: r.name,
                                    }))
                                );

                                setMapMarkers(base as Marker[]);
                                resolve();
                            } else if (
                                status ===
                                kakao.maps.services.Status.ZERO_RESULT
                            ) {
                                console.debug(
                                    '[useRestaurants] kakaoSearchNearby ZERO_RESULT'
                                );
                                setNearbyUsingKakao(true);
                                setAllResults([]);
                                setRestaurants([]);
                                setTotal(0);
                                const base: Marker[] = userPos
                                    ? [
                                          {
                                              lat: userPos.lat,
                                              lng: userPos.lng,
                                              title: '내 위치',
                                              variant: 'current',
                                          } as Marker,
                                      ]
                                    : [];
                                base.push({
                                    lat: pos.lat,
                                    lng: pos.lng,
                                    title: '선택한 위치',
                                    variant: 'selected',
                                });
                                setMapMarkers(base as Marker[]);
                                if (
                                    isLogin &&
                                    localAdded &&
                                    localAdded.length
                                ) {
                                    setMapMarkers(
                                        (prev) =>
                                            [
                                                ...prev,
                                                ...localAdded.map(
                                                    (r) =>
                                                        ({
                                                            id: r.id,
                                                            lat:
                                                                (r as any)
                                                                    .latitude ??
                                                                (r as any).lat,
                                                            lng:
                                                                (r as any)
                                                                    .longitude ??
                                                                (r as any).lng,
                                                            title: r.name,
                                                        } as Marker)
                                                ),
                                            ] as Marker[]
                                    );
                                }
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
        [userPos, isLogin, localAdded, loginMember]
    );

    const searchByKeyword = useCallback(
        async (kw: string, p = 1) => {
            const q = (kw || '').trim();
            if (nearbyUsingKakao) {
                try {
                    const lowered = q.toLowerCase();
                    const filtered = !lowered
                        ? allResults.slice()
                        : allResults.filter((r) => {
                              try {
                                  const name = ((r as any).name ||
                                      '') as string;
                                  const jibun = ((r as any).jibunAddress ||
                                      '') as string;
                                  const road = ((r as any).roadAddress ||
                                      '') as string;
                                  return (
                                      name.toLowerCase().includes(lowered) ||
                                      jibun.toLowerCase().includes(lowered) ||
                                      road.toLowerCase().includes(lowered)
                                  );
                              } catch (e) {
                                  return false;
                              }
                          });

                    setPage(p);
                    setRestaurants(
                        filtered.slice((p - 1) * size, (p - 1) * size + size)
                    );
                    setTotal(filtered.length);

                    setMapMarkers(() => {
                        const base: Marker[] = [];
                        if (userPos) {
                            base.push({
                                lat: userPos.lat,
                                lng: userPos.lng,
                                title: '내 위치',
                                variant: 'current',
                            } as Marker);
                        }
                        base.push(
                            ...filtered.map(
                                (r: any) =>
                                    ({
                                        id: r.id,
                                        lat: r.latitude ?? r.lat,
                                        lng: r.longitude ?? r.lng,
                                        title: r.name,
                                    } as Marker)
                            )
                        );
                        return base as Marker[];
                    });
                    return;
                } catch (e) {
                    console.error('searchByKeyword (client) failed', e);
                }
            }

            await loadRestaurants(q, p);
        },
        [nearbyUsingKakao, allResults, userPos, loadRestaurants]
    );

    useEffect(() => {
        if (nearbyUsingKakao && allResults && allResults.length) {
            const start = (page - 1) * size;
            console.debug(
                '[useRestaurants] paging nearbyUsingKakao -> updating restaurants page',
                { page, start }
            );
            setRestaurants(allResults.slice(start, start + size));
        }
    }, [page, allResults, nearbyUsingKakao]);

    const addLocalRestaurant = useCallback(
        (r: Restaurant) => {
            if (!isLogin) {
                console.warn(
                    'Attempted to add local restaurant while not logged-in'
                );
                return;
            }
            const ref = userPos ?? mapCenter;
            const lat = (r as any).latitude ?? (r as any).lat;
            const lng = (r as any).longitude ?? (r as any).lng;
            const withDist = {
                ...r,
                distanceMeters: ref
                    ? distanceMeters(ref.lat, ref.lng, lat, lng)
                    : undefined,
                isLocal: true,
                ownerId: (r as any).ownerId ?? loginMember?.id ?? null,
            } as Restaurant & { distanceMeters?: number };
            const isServerCreated = Number((r as any).id) > 0;

            const reconcile = (created: Restaurant) => {
                const createdLat =
                    (created as any).latitude ?? (created as any).lat;
                const createdLng =
                    (created as any).longitude ?? (created as any).lng;
                const ownerId =
                    (created as any).ownerId ?? loginMember?.id ?? null;

                const shouldMarkLocal =
                    ownerId &&
                    loginMember &&
                    Number(ownerId) === Number(loginMember.id);

                setLocalAdded((prev) => {
                    const idx = prev.findIndex((it) => {
                        const itOwner =
                            (it as any).ownerId ?? (it as any).memberId ?? null;
                        const itLat = (it as any).latitude ?? (it as any).lat;
                        const itLng = (it as any).longitude ?? (it as any).lng;
                        const negativeId = Number((it as any).id) < 0;
                        const sameOwner =
                            ownerId &&
                            itOwner &&
                            Number(ownerId) === Number(itOwner);
                        const sameCoords =
                            Number(
                                Math.abs(Number(itLat) - Number(createdLat))
                            ) < 1e-6 &&
                            Number(
                                Math.abs(Number(itLng) - Number(createdLng))
                            ) < 1e-6;
                        return negativeId && sameOwner && sameCoords;
                    });

                    if (idx >= 0) {
                        const next = [...prev];
                        (created as any).isLocal = Boolean(shouldMarkLocal);
                        (created as any).ownerId =
                            (created as any).ownerId ?? ownerId;
                        next[idx] = created;
                        return next;
                    }
                    return [created, ...prev];
                });

                setAllResults((prev) => {
                    const idx = prev.findIndex((it) => {
                        const itLat = (it as any).latitude ?? (it as any).lat;
                        const itLng = (it as any).longitude ?? (it as any).lng;
                        return (
                            Number(
                                Math.abs(Number(itLat) - Number(createdLat))
                            ) < 1e-6 &&
                            Number(
                                Math.abs(Number(itLng) - Number(createdLng))
                            ) < 1e-6
                        );
                    });
                    let next: Restaurant[];
                    if (idx >= 0) {
                        next = [...prev];
                        next[idx] = created;
                    } else {
                        next = [created, ...prev];
                    }
                    if (
                        next.every(
                            (it) => (it as any).distanceMeters !== undefined
                        )
                    ) {
                        next.sort(
                            (a: any, b: any) =>
                                (a.distanceMeters ?? 0) -
                                (b.distanceMeters ?? 0)
                        );
                    }
                    const start = (page - 1) * size;
                    setRestaurants(next.slice(start, start + size));
                    setTotal(next.length);
                    return next;
                });

                setMapMarkers((prev) => {
                    const key = `${createdLat}:${createdLng}`;
                    let replaced = false;
                    const next = prev.map((m) => {
                        const mKey = `${m.lat}:${m.lng}`;
                        if (mKey === key) {
                            replaced = true;
                            return {
                                id: created.id,
                                lat: createdLat,
                                lng: createdLng,
                                title: created.name,
                            };
                        }
                        return m;
                    });
                    if (!replaced) {
                        next.push({
                            id: created.id,
                            lat: createdLat,
                            lng: createdLng,
                            title: created.name,
                        } as Marker);
                    }
                    return next as Marker[];
                });
            };

            if (isServerCreated) {
                reconcile(r);
                return;
            }
            try {
                const refLat = Number(
                    (r as any).latitude ?? (r as any).lat ?? NaN
                );
                const refLng = Number(
                    (r as any).longitude ?? (r as any).lng ?? NaN
                );
                if (Number.isFinite(refLat) && Number.isFinite(refLng)) {
                    const existingServer = (allResults || []).find((it) => {
                        const itLat = Number(
                            (it as any).latitude ?? (it as any).lat ?? NaN
                        );
                        const itLng = Number(
                            (it as any).longitude ?? (it as any).lng ?? NaN
                        );
                        if (!Number.isFinite(itLat) || !Number.isFinite(itLng))
                            return false;
                        const sameCoords =
                            Math.abs(itLat - refLat) < 1e-6 &&
                            Math.abs(itLng - refLng) < 1e-6;
                        return sameCoords && Number((it as any).id) > 0;
                    });
                    if (existingServer) {
                        const looksLikeKakao = Boolean(
                            (existingServer as any).placeUrl ||
                                (existingServer as any).placeId
                        );
                        if (looksLikeKakao) {
                            console.debug(
                                '[useRestaurants] skip adding local duplicate; server kakao exists',
                                { existingServer }
                            );
                            setAllResults((prev) => {
                                const idx = prev.findIndex(
                                    (it) =>
                                        String((it as any).id) ===
                                        String((existingServer as any).id)
                                );
                                if (idx >= 0) return prev;
                                return [existingServer, ...prev];
                            });
                            return;
                        }
                        reconcile(existingServer as any);
                        return;
                    }
                }
            } catch (e) {
                console.error('check existing server duplicate failed', e);
            }

            setLocalAdded((prev) => [withDist, ...prev]);
            setAllResults((prev) => {
                const merged = [withDist, ...prev];
                if (
                    merged.every(
                        (it) => (it as any).distanceMeters !== undefined
                    )
                ) {
                    merged.sort(
                        (a: any, b: any) =>
                            (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0)
                    );
                }
                const start = (page - 1) * size;
                setRestaurants(merged.slice(start, start + size));
                setTotal((t) => t + 1);
                return merged;
            });

            // add marker
            setMapMarkers(
                (prev) =>
                    [
                        ...prev,
                        {
                            id: withDist.id,
                            lat,
                            lng,
                            title: withDist.name,
                        } as Marker,
                    ] as Marker[]
            );
        },
        [mapCenter, page, size, userPos, isLogin, loginMember]
    );

    const updateLocalRestaurant = useCallback(
        (updated: Restaurant) => {
            try {
                const updatedLat =
                    (updated as any).latitude ?? (updated as any).lat;
                const updatedLng =
                    (updated as any).longitude ?? (updated as any).lng;

                setLocalAdded((prev) => {
                    const idx = prev.findIndex((it) => {
                        const itLat = (it as any).latitude ?? (it as any).lat;
                        const itLng = (it as any).longitude ?? (it as any).lng;
                        const sameCoords =
                            Math.abs(Number(itLat) - Number(updatedLat)) <
                                1e-6 &&
                            Math.abs(Number(itLng) - Number(updatedLng)) < 1e-6;
                        const sameId =
                            (it as any).id !== undefined &&
                            (updated as any).id !== undefined &&
                            String((it as any).id) ===
                                String((updated as any).id);
                        return sameId || sameCoords;
                    });
                    if (idx >= 0) {
                        const next = [...prev];
                        next[idx] = {
                            ...(next[idx] as any),
                            ...(updated as any),
                            isLocal: true,
                        } as Restaurant;
                        return next;
                    }
                    return prev;
                });

                setAllResults((prev) => {
                    const idx = prev.findIndex((it) => {
                        const itLat = (it as any).latitude ?? (it as any).lat;
                        const itLng = (it as any).longitude ?? (it as any).lng;
                        const sameCoords =
                            Math.abs(Number(itLat) - Number(updatedLat)) <
                                1e-6 &&
                            Math.abs(Number(itLng) - Number(updatedLng)) < 1e-6;
                        const sameId =
                            (it as any).id !== undefined &&
                            (updated as any).id !== undefined &&
                            String((it as any).id) ===
                                String((updated as any).id);
                        return sameId || sameCoords;
                    });
                    let next = [...prev];
                    if (idx >= 0) {
                        next[idx] = {
                            ...(next[idx] as any),
                            ...(updated as any),
                            isLocal: true,
                        } as Restaurant;
                    } else {
                        next = [
                            {
                                ...(updated as any),
                                isLocal: true,
                            } as Restaurant,
                            ...prev,
                        ];
                    }
                    const ref = userPos ?? mapCenter;
                    if (ref) {
                        next = next.map((r) => {
                            const lat = (r as any).latitude ?? (r as any).lat;
                            const lng = (r as any).longitude ?? (r as any).lng;
                            return {
                                ...(r as any),
                                distanceMeters: distanceMeters(
                                    ref.lat,
                                    ref.lng,
                                    lat,
                                    lng
                                ),
                            } as any;
                        });
                        next.sort(
                            (a: any, b: any) =>
                                (a.distanceMeters ?? 0) -
                                (b.distanceMeters ?? 0)
                        );
                    }
                    const start = (page - 1) * size;
                    setRestaurants(next.slice(start, start + size));
                    setTotal(next.length);
                    return next;
                });

                setMapMarkers((prev) => {
                    const key = `${Number(updatedLat)}:${Number(updatedLng)}`;
                    let replaced = false;
                    const next = prev.map((m) => {
                        const mKey = `${m.lat}:${m.lng}`;
                        if (mKey === key) {
                            replaced = true;
                            return {
                                id: (updated as any).id ?? m.id,
                                lat: Number(updatedLat),
                                lng: Number(updatedLng),
                                title: updated.name,
                            };
                        }
                        return m;
                    });
                    if (!replaced) {
                        next.push({
                            id: (updated as any).id,
                            lat: Number(updatedLat),
                            lng: Number(updatedLng),
                            title: updated.name,
                        } as Marker);
                    }
                    return next as Marker[];
                });
            } catch (e) {
                console.error('updateLocalRestaurant error', e);
            }
        },
        [mapCenter, page, size, userPos]
    );

    const removeLocalRestaurant = useCallback(
        (identifier: number | { lat: number; lng: number }) => {
            try {
                let removedId: number | string | null = null;
                if (typeof identifier === 'number') {
                    const id = identifier;
                    setLocalAdded((prev) => {
                        const next = prev.filter(
                            (it) => String((it as any).id) !== String(id)
                        );
                        return next;
                    });
                    removedId = id;
                } else {
                    const lat = Number(identifier.lat);
                    const lng = Number(identifier.lng);
                    setLocalAdded((prev) =>
                        prev.filter((it) => {
                            const itLat = Number(
                                (it as any).latitude ?? (it as any).lat ?? NaN
                            );
                            const itLng = Number(
                                (it as any).longitude ?? (it as any).lng ?? NaN
                            );
                            return !(
                                Number.isFinite(itLat) &&
                                Number.isFinite(itLng) &&
                                Math.abs(itLat - lat) < 1e-6 &&
                                Math.abs(itLng - lng) < 1e-6
                            );
                        })
                    );
                }

                setAllResults((prev) => {
                    const next = prev.filter((it) => {
                        if (
                            removedId !== null &&
                            (it as any).id !== undefined
                        ) {
                            if (String((it as any).id) === String(removedId))
                                return false;
                        }
                        return true;
                    });
                    const start = (page - 1) * size;
                    setRestaurants(next.slice(start, start + size));
                    setTotal(next.length);
                    return next;
                });

                setMapMarkers((prev) =>
                    prev.filter(
                        (m) => String((m as any).id) !== String(removedId)
                    )
                );

                try {
                    const stored = JSON.parse(
                        sessionStorage.getItem('myCreatedRestaurants') || '[]'
                    );
                    if (Array.isArray(stored)) {
                        const next = stored.filter(
                            (it) => String(it.id) !== String(removedId)
                        );
                        sessionStorage.setItem(
                            'myCreatedRestaurants',
                            JSON.stringify(next)
                        );
                    }
                } catch (e) {}
            } catch (e) {
                console.error('removeLocalRestaurant error', e);
            }
        },
        [page, size]
    );

    useEffect(() => {
        if (!isLogin) {
            setLocalAdded([]);
            loadRestaurants().catch(console.error);
        }
    }, [isLogin]);

    useEffect(() => {
        loadRestaurants().catch(console.error);
    }, []);

    return {
        mapCenter,
        setMapCenter,
        mapMarkers,
        setMapMarkers,
        restaurants,
        allResults,
        localAdded,
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
        searchByKeyword,
        addLocalRestaurant,
        updateLocalRestaurant,
        removeLocalRestaurant,
        handleItemClick: (r: Restaurant) => {
            const lat = (r as any).latitude ?? (r as any).lat;
            const lng = (r as any).longitude ?? (r as any).lng;
            if (lat && lng) setMapCenter({ lat, lng });
            setHighlightedId((r as any).id ?? null);
        },
    };
}

export default useRestaurants;
