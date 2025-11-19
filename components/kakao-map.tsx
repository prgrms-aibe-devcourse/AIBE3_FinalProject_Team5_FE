'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        kakao: any;
    }
}

type Marker = {
    lat: number;
    lng: number;
    title?: string;
    variant?: 'default' | 'current';
};

type KakaoMapProps = {
    className?: string;
    center?: { lat: number; lng: number };
    level?: number;
    markers?: Marker[];
    onMapClick?: (pos: { lat: number; lng: number }) => void;
    enableClickDebug?: boolean;
    lookupOnClick?: boolean;
    placeSearchRadius?: number;
    placeCategory?: string;
    onLookupResult?: (result: {
        center: { lat: number; lng: number };
        address?: { address?: string; roadAddress?: string };
        places: Array<{
            id: string;
            name: string;
            address?: string;
            roadAddress?: string;
            lat: number;
            lng: number;
            phone?: string;
            url?: string;
            distance?: number;
        }>;
    }) => void;
};

export default function KakaoMap({
    className,
    center,
    level = 3,
    markers = [],
    onMapClick,
    enableClickDebug = false,
    lookupOnClick = false,
    placeSearchRadius = 1000,
    placeCategory = 'FD6',
    onLookupResult,
}: KakaoMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const mapRef = useRef<any | null>(null);
    const markersRef = useRef<any[]>([]);
    const currentOverlayRef = useRef<any | null>(null);
    const clickDebugMarkerRef = useRef<any | null>(null);
    const clickHandlerRef = useRef<any | null>(null);

    const envKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ?? '';
    const invalidKey = !envKey;

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).kakao?.maps) {
            setSdkLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!sdkLoaded) return;
        if (!containerRef.current) return;
        if (!window.kakao?.maps) {
            console.error('[KakaoMap] window.kakao.maps 가 존재하지 않습니다.');
            return;
        }
        window.kakao.maps.load(() => {
            const lat = center?.lat ?? 33.450701;
            const lng = center?.lng ?? 126.570667;
            const mapCenter = new window.kakao.maps.LatLng(lat, lng);

            // 지도 생성 또는 갱신
            if (!mapRef.current) {
                mapRef.current = new window.kakao.maps.Map(
                    containerRef.current,
                    {
                        center: mapCenter,
                        level,
                    }
                );
                (window as any).__KAKAO_MAP__ = mapRef.current;
            } else {
                mapRef.current.setLevel(level);
                mapRef.current.setCenter(mapCenter);
            }

            // 기존 마커/오버레이 제거
            markersRef.current.forEach((mk) => mk.setMap && mk.setMap(null));
            markersRef.current = [];
            if (currentOverlayRef.current) {
                currentOverlayRef.current.setMap(null);
                currentOverlayRef.current = null;
            }
            if (clickDebugMarkerRef.current) {
                clickDebugMarkerRef.current.setMap(null);
                clickDebugMarkerRef.current = null;
            }

            // 새 마커/오버레이 추가
            if (markers && markers.length) {
                markers.forEach((m) => {
                    const pos = new window.kakao.maps.LatLng(m.lat, m.lng);
                    // 모든 마커를 카카오 기본 마커로 렌더링 (variant 무시)
                    const marker = new window.kakao.maps.Marker({
                        position: pos,
                        title: m.title,
                        clickable: true,
                    });
                    marker.setMap(mapRef.current);
                    markersRef.current.push(marker);
                });
            }

            // 클릭 리스너 (테스트용)
            if (clickHandlerRef.current) {
                try {
                    window.kakao.maps.event.removeListener(
                        mapRef.current,
                        'click',
                        clickHandlerRef.current
                    );
                } catch {}
                clickHandlerRef.current = null;
            }
            const handleClick = (mouseEvent: any) => {
                const latlng = mouseEvent.latLng;
                const cLat = latlng.getLat();
                const cLng = latlng.getLng();
                console.debug('[KakaoMap] map click:', {
                    lat: cLat,
                    lng: cLng,
                });
                try {
                    onMapClick && onMapClick({ lat: cLat, lng: cLng });
                } catch (e) {
                    console.error('[KakaoMap] onMapClick error', e);
                }
                if (enableClickDebug) {
                    // 임시 클릭 마커 표시(한 개만 유지)
                    if (clickDebugMarkerRef.current) {
                        clickDebugMarkerRef.current.setMap(null);
                        clickDebugMarkerRef.current = null;
                    }
                    const marker = new window.kakao.maps.Marker({
                        position: new window.kakao.maps.LatLng(cLat, cLng),
                        title: 'clicked',
                    });
                    marker.setMap(mapRef.current);
                    clickDebugMarkerRef.current = marker;
                }

                if (lookupOnClick) {
                    try {
                        const geocoder =
                            new window.kakao.maps.services.Geocoder();
                        const places = new window.kakao.maps.services.Places(
                            mapRef.current
                        );
                        geocoder.coord2Address(
                            cLng,
                            cLat,
                            (addrResult: any, addrStatus: any) => {
                                const addressPayload: {
                                    address?: string;
                                    roadAddress?: string;
                                } = {};
                                if (
                                    addrStatus ===
                                        window.kakao.maps.services.Status.OK &&
                                    addrResult?.length
                                ) {
                                    const r0 = addrResult[0];
                                    addressPayload.address =
                                        r0?.address?.address_name;
                                    addressPayload.roadAddress =
                                        r0?.road_address?.address_name;
                                }
                                const options = {
                                    location: new window.kakao.maps.LatLng(
                                        cLat,
                                        cLng
                                    ),
                                    radius: Math.min(
                                        20000,
                                        Math.max(1, placeSearchRadius)
                                    ),
                                };
                                const callback = (data: any[], status: any) => {
                                    let placesPayload: any[] = [];
                                    if (
                                        status ===
                                            window.kakao.maps.services.Status
                                                .OK &&
                                        Array.isArray(data)
                                    ) {
                                        placesPayload = data.map((p) => ({
                                            id: String(p.id),
                                            name: p.place_name,
                                            address: p.address_name,
                                            roadAddress: p.road_address_name,
                                            lat: Number(p.y),
                                            lng: Number(p.x),
                                            phone: p.phone,
                                            url: p.place_url,
                                            distance: p.distance
                                                ? Number(p.distance)
                                                : undefined,
                                        }));
                                    }
                                    try {
                                        onLookupResult &&
                                            onLookupResult({
                                                center: {
                                                    lat: cLat,
                                                    lng: cLng,
                                                },
                                                address: addressPayload,
                                                places: placesPayload,
                                            });
                                    } catch (err) {
                                        console.error(
                                            '[KakaoMap] onLookupResult error',
                                            err
                                        );
                                    }
                                };
                                if (placeCategory) {
                                    places.categorySearch(
                                        placeCategory,
                                        callback,
                                        options
                                    );
                                } else {
                                    onLookupResult &&
                                        onLookupResult({
                                            center: { lat: cLat, lng: cLng },
                                            address: addressPayload,
                                            places: [],
                                        });
                                }
                            }
                        );
                    } catch (err) {
                        console.error('[KakaoMap] lookupOnClick failed', err);
                    }
                }
            };
            window.kakao.maps.event.addListener(
                mapRef.current,
                'click',
                handleClick
            );
            clickHandlerRef.current = handleClick;
        });
    }, [
        sdkLoaded,
        center?.lat,
        center?.lng,
        level,
        JSON.stringify(markers),
        enableClickDebug,
        lookupOnClick,
        placeSearchRadius,
        placeCategory,
    ]);

    if (invalidKey) {
        return (
            <div
                className={
                    'flex items-center justify-center text-sm text-red-600 bg-white ' +
                    (className ?? '')
                }
            >
                카카오 JavaScript 키가 설정되지 않았습니다. 환경변수
                NEXT_PUBLIC_KAKAO_MAP_API_KEY를 확인하세요.
            </div>
        );
    }

    return (
        <>
            <Script
                id="kakao-maps-sdk"
                src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${envKey}&autoload=false&libraries=services,clusterer`}
                strategy="afterInteractive"
                onLoad={() => {
                    console.debug('[KakaoMap] Kakao SDK script loaded');
                    setSdkLoaded(true);
                }}
                onError={(e) => {
                    console.error('[KakaoMap] Kakao SDK script load error', e);
                    try {
                        const el = document.getElementById(
                            'kakao-maps-sdk'
                        ) as HTMLScriptElement | null;
                        if (el) console.error('[KakaoMap] script src:', el.src);
                    } catch {}
                }}
            />
            <div ref={containerRef} className={className} />
        </>
    );
}
