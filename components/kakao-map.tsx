'use client';

import Script from 'next/script';
import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        kakao: any;
    }
}

type Marker = {
    id?: number | string;
    lat: number;
    lng: number;
    title?: string;
    variant?: 'default' | 'current' | 'selected';
};

type Props = {
    className?: string;
    center?: { lat: number; lng: number };
    level?: number;
    markers?: Marker[];
    highlightId?: number | string | null;
    onMapClick?: (pos: { lat: number; lng: number }) => void;
    // onMarkerClick now may receive optional pos for markers without an id
    onMarkerClick?: (
        id: number | string | undefined,
        pos?: { lat: number; lng: number }
    ) => void;
    enableClickDebug?: boolean;
};

export default function KakaoMap({
    className,
    center,
    level,
    markers = [],
    highlightId = null,
    onMapClick,
    onMarkerClick,
    enableClickDebug = false,
}: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any | null>(null);
    const markersRef = useRef<any[]>([]);
    const overlayMapRef = useRef<Record<string, any>>({});
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const clickDebugMarkerRef = useRef<any | null>(null);
    const clickListenerRef = useRef<any | null>(null);
    const selectedOverlayRef = useRef<any | null>(null);
    const selectedIdRef = useRef<number | string | null>(null);
    const currentOverlayRef = useRef<any | null>(null);
    const [sdkLoaded, setSdkLoaded] = useState(false);

    const envKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ?? '';
    const invalidKey = !envKey;

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).kakao?.maps)
            setSdkLoaded(true);
    }, []);

    useEffect(() => {
        if (!sdkLoaded) return;
        if (!containerRef.current) return;
        if (!window.kakao?.maps) return;

        window.kakao.maps.load(() => {
            const lat = center?.lat ?? 33.450701;
            const lng = center?.lng ?? 126.570667;
            const mapCenter = new window.kakao.maps.LatLng(lat, lng);

            if (!mapRef.current) {
                const mapOpts: any = { center: mapCenter };
                if (typeof level === 'number') mapOpts.level = level;
                mapRef.current = new window.kakao.maps.Map(
                    containerRef.current!,
                    mapOpts
                );
            } else {
                try {
                    try {
                        if (typeof level === 'number') {
                            if (
                                typeof (mapRef.current as any).getLevel ===
                                'function'
                            ) {
                                const curLevel = mapRef.current.getLevel();
                                if (level !== curLevel) {
                                    mapRef.current.setLevel(level);
                                }
                            } else {
                                mapRef.current.setLevel(level);
                            }
                        }
                    } catch {}

                    if (typeof (mapRef.current as any).panTo === 'function')
                        (mapRef.current as any).panTo(mapCenter);
                    else mapRef.current.setCenter(mapCenter);
                } catch {}
            }
            try {
                if (clickListenerRef.current && mapRef.current) {
                    window.kakao.maps.event.removeListener(
                        mapRef.current,
                        'click',
                        clickListenerRef.current
                    );
                    clickListenerRef.current = null;
                }
            } catch {}
            try {
                if (
                    (typeof onMapClick === 'function' || enableClickDebug) &&
                    mapRef.current
                ) {
                    const handler = (mouseEvent: any) => {
                        try {
                            const lat = mouseEvent.latLng.getLat();
                            const lng = mouseEvent.latLng.getLng();
                            if (enableClickDebug) {
                                try {
                                    if (clickDebugMarkerRef.current) {
                                        clickDebugMarkerRef.current.setMap(
                                            null
                                        );
                                        clickDebugMarkerRef.current = null;
                                    }
                                    const dbgMarker =
                                        new window.kakao.maps.Marker({
                                            position:
                                                new window.kakao.maps.LatLng(
                                                    lat,
                                                    lng
                                                ),
                                        });
                                    dbgMarker.setMap(mapRef.current);
                                    clickDebugMarkerRef.current = dbgMarker;
                                } catch {}
                            }
                            if (typeof onMapClick === 'function') {
                                onMapClick({ lat, lng });
                            }
                        } catch {}
                    };
                    window.kakao.maps.event.addListener(
                        mapRef.current,
                        'click',
                        handler
                    );
                    clickListenerRef.current = handler;
                }
            } catch {}

            setTimeout(() => {
                try {
                    if ((mapRef.current as any)?.relayout)
                        (mapRef.current as any).relayout();
                    else if (
                        window.kakao &&
                        window.kakao.maps &&
                        window.kakao.maps.event
                    )
                        window.kakao.maps.event.trigger(
                            mapRef.current,
                            'resize'
                        );
                    if (typeof (mapRef.current as any).panTo === 'function')
                        (mapRef.current as any).panTo(mapCenter);
                    else mapRef.current.setCenter(mapCenter);
                } catch {}
            }, 60);

            try {
                markersRef.current.forEach((m) => {
                    try {
                        if (m && m.setMap) m.setMap(null);
                        if (m.marker && m.marker.setMap) m.marker.setMap(null);
                        if (m.overlay && m.overlay.setMap)
                            m.overlay.setMap(null);
                    } catch {}
                });
            } catch {}
            // Also clear any hover/overlay entries that were stored separately
            try {
                const overlayMap = overlayMapRef.current || {};
                Object.keys(overlayMap).forEach((k) => {
                    try {
                        const ov = overlayMap[k];
                        if (ov && ov.setMap) ov.setMap(null);
                    } catch {}
                });
            } catch {}
            overlayMapRef.current = {};
            markersRef.current = [];

            if (Array.isArray(markers) && markers.length && mapRef.current) {
                const overlayMap: Record<string, any> = overlayMapRef.current;
                const currentPosSet = new Set<string>();
                markers.forEach((m) => {
                    if (m.variant === 'current') {
                        const key = `${Number(m.lat).toFixed(6)}|${Number(
                            m.lng
                        ).toFixed(6)}`;
                        currentPosSet.add(key);
                    }
                });
                const createHoverOverlay = (pos: any, title?: string) => {
                    const el = document.createElement('div');
                    el.style.padding = '6px 8px';
                    el.style.background = 'white';
                    el.style.border = '1px solid rgba(0,0,0,0.08)';
                    el.style.borderRadius = '6px';
                    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                    el.style.transform = 'translate(-50%, -120%)';
                    el.style.transition = 'transform 120ms ease';
                    el.style.fontSize = '12px';
                    el.style.whiteSpace = 'nowrap';
                    el.style.pointerEvents = 'none';
                    el.textContent = title ?? '';
                    return new window.kakao.maps.CustomOverlay({
                        position: pos,
                        content: el,
                    });
                };

                markers.forEach((m) => {
                    const pos = new window.kakao.maps.LatLng(m.lat, m.lng);
                    if (m.variant === 'current') {
                        const el = document.createElement('div');
                        el.style.width = '34px';
                        el.style.height = '34px';
                        el.style.pointerEvents = 'none';
                        el.innerHTML =
                            '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#ff3b30" stroke="#fff" stroke-width="0.5"/></svg>';
                        const overlay = new window.kakao.maps.CustomOverlay({
                            position: pos,
                            content: el,
                            yAnchor: 1,
                        });
                        overlay.setMap(mapRef.current);
                        currentOverlayRef.current = overlay;
                        markersRef.current.push({ id: m.id, overlay });
                        return;
                    }

                    const makeSvgUrl = (fill = '#1E90FF', size = 28) => {
                        const svg =
                            '<svg xmlns="http://www.w3.org/2000/svg" width="' +
                            size +
                            '" height="' +
                            size +
                            '" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="' +
                            fill +
                            '" stroke="%23fff" stroke-width="1"/><circle cx="12" cy="9" r="3" fill="%23fff"/></svg>';
                        return (
                            'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
                        );
                    };
                    const normalSize = 36;
                    const hoverSize = 48;
                    const normalUrl = makeSvgUrl('#1E90FF', normalSize);
                    const hoverUrl = makeSvgUrl('#1E90FF', hoverSize);
                    const normalImg = new window.kakao.maps.MarkerImage(
                        normalUrl,
                        new window.kakao.maps.Size(normalSize, normalSize)
                    );
                    const hoverImg = new window.kakao.maps.MarkerImage(
                        hoverUrl,
                        new window.kakao.maps.Size(hoverSize, hoverSize)
                    );
                    const marker = new window.kakao.maps.Marker({
                        position: pos,
                        title: m.title,
                        clickable: true,
                        image: normalImg,
                    });
                    const posKey = `${Number(m.lat).toFixed(6)}|${Number(
                        m.lng
                    ).toFixed(6)}`;
                    const markerAdded = !currentPosSet.has(posKey);
                    if (markerAdded) {
                        marker.setMap(mapRef.current);
                        markersRef.current.push({
                            id: m.id,
                            marker,
                            normalImg,
                            hoverImg,
                        });
                    } else {
                        markersRef.current.push({ id: m.id });
                    }

                    const key = String(m.id ?? `${m.lat}_${m.lng}`);
                    const onOver = () => {
                        try {
                            marker.setImage(hoverImg);
                        } catch {}
                        if (!overlayMap[key]) {
                            overlayMap[key] = createHoverOverlay(pos, m.title);
                            overlayMap[key].setMap(mapRef.current);
                        }
                    };
                    const onOut = () => {
                        try {
                            marker.setImage(normalImg);
                        } catch {}
                        if (overlayMap[key]) {
                            try {
                                overlayMap[key].setMap(null);
                            } catch {}
                            delete overlayMap[key];
                        }
                    };
                    if (markerAdded) {
                        window.kakao.maps.event.addListener(
                            marker,
                            'mouseover',
                            onOver
                        );
                        window.kakao.maps.event.addListener(
                            marker,
                            'mouseout',
                            onOut
                        );
                        window.kakao.maps.event.addListener(
                            marker,
                            'click',
                            () => {
                                try {
                                    // debug: log marker click and whether callback exists
                                    try {
                                        console.debug(
                                            '[KakaoMap] marker clicked',
                                            {
                                                id: m.id,
                                                lat: m.lat,
                                                lng: m.lng,
                                                hasHandler:
                                                    typeof onMarkerClick ===
                                                    'function',
                                            }
                                        );
                                    } catch {}

                                    if (typeof onMarkerClick === 'function') {
                                        try {
                                            onMarkerClick(m.id as any, {
                                                lat: m.lat,
                                                lng: m.lng,
                                            });
                                        } catch (e) {
                                            console.error(
                                                '[KakaoMap] onMarkerClick handler error',
                                                e
                                            );
                                        }
                                    }
                                } catch (e) {
                                    console.error(
                                        '[KakaoMap] marker click wrapper error',
                                        e
                                    );
                                }
                                try {
                                    const p = new window.kakao.maps.LatLng(
                                        m.lat,
                                        m.lng
                                    );
                                    if (
                                        typeof (mapRef.current as any).panTo ===
                                        'function'
                                    )
                                        (mapRef.current as any).panTo(p);
                                    else mapRef.current.setCenter(p);
                                } catch (e) {
                                    console.error('[KakaoMap] panTo error', e);
                                }
                            }
                        );
                    }
                });
            }
        });
    }, [
        sdkLoaded,
        center?.lat,
        center?.lng,
        level,
        JSON.stringify(markers),
        highlightId,
        enableClickDebug,
    ]);

    useEffect(() => {
        if (!sdkLoaded || !mapRef.current) return;
        try {
            if (selectedOverlayRef.current) {
                try {
                    selectedOverlayRef.current.setMap(null);
                } catch {}
                selectedOverlayRef.current = null;
            }
            if (selectedIdRef.current != null) {
                const prev = markersRef.current.find(
                    (e) => String(e.id) === String(selectedIdRef.current)
                );
                if (prev && prev.marker && prev.normalImg) {
                    try {
                        prev.marker.setImage(prev.normalImg);
                    } catch {}
                }
                const prevKey = String(selectedIdRef.current);
                if (overlayMapRef.current[prevKey]) {
                    try {
                        overlayMapRef.current[prevKey].setMap(null);
                    } catch {}
                    delete overlayMapRef.current[prevKey];
                }
                selectedIdRef.current = null;
            }

            if (!highlightId) return;

            const entry = markersRef.current.find(
                (e) => String(e.id) === String(highlightId)
            );
            if (entry && entry.marker) {
                selectedIdRef.current = highlightId;
                try {
                    entry.marker.setImage(entry.hoverImg);
                } catch {}
                const pos = entry.marker.getPosition
                    ? entry.marker.getPosition()
                    : new window.kakao.maps.LatLng(entry.lat, entry.lng);
                const el = document.createElement('div');
                el.style.padding = '8px 10px';
                el.style.background = '#111827';
                el.style.color = 'white';
                el.style.borderRadius = '8px';
                el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)';
                el.style.transform = 'translate(-50%, -130%)';
                el.style.whiteSpace = 'nowrap';
                el.style.pointerEvents = 'none';
                el.textContent = entry.title ?? '';
                selectedOverlayRef.current =
                    new window.kakao.maps.CustomOverlay({
                        position: pos,
                        content: el,
                    });
                selectedOverlayRef.current.setMap(mapRef.current);
                try {
                    if (typeof (mapRef.current as any).panTo === 'function')
                        (mapRef.current as any).panTo(pos);
                    else mapRef.current.setCenter(pos);
                } catch {}
            } else if (entry && entry.overlay) {
                try {
                    const pos = entry.overlay.getPosition();
                    if (typeof (mapRef.current as any).panTo === 'function')
                        (mapRef.current as any).panTo(pos);
                    else mapRef.current.setCenter(pos);
                } catch {}
            }
        } catch (e) {
            console.error('[KakaoMap] highlight handling error', e);
        }
    }, [highlightId, sdkLoaded]);

    useEffect(() => {
        if (!containerRef.current) return;
        if (typeof ResizeObserver === 'undefined') return;
        try {
            resizeObserverRef.current = new ResizeObserver(() => {
                try {
                    if (mapRef.current) {
                        if (
                            typeof (mapRef.current as any).relayout ===
                            'function'
                        )
                            (mapRef.current as any).relayout();
                        else if (
                            window.kakao &&
                            window.kakao.maps &&
                            window.kakao.maps.event
                        )
                            window.kakao.maps.event.trigger(
                                mapRef.current,
                                'resize'
                            );
                    }
                } catch {}
            });
            resizeObserverRef.current.observe(containerRef.current);
        } catch {}
        return () => {
            try {
                resizeObserverRef.current?.disconnect();
                resizeObserverRef.current = null;
            } catch {}
        };
    }, [sdkLoaded]);

    if (invalidKey) {
        return (
            <div
                className={`flex items-center justify-center text-sm text-red-600 bg-white ${
                    className ?? ''
                }`}
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
                onLoad={() => setSdkLoaded(true)}
                onError={(e) =>
                    console.error('[KakaoMap] script load error', e)
                }
            />
            <div className={(className ?? 'w-full h-full') + ' relative'}>
                {!sdkLoaded && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.7)',
                            zIndex: 20,
                        }}
                    >
                        <div style={{ fontSize: 14, color: '#333' }}>
                            카카오 SDK 로딩 중...
                        </div>
                    </div>
                )}
                <div ref={containerRef} className="w-full h-full" />
            </div>
        </>
    );
}
