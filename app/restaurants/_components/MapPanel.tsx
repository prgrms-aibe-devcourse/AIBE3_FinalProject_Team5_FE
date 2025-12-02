'use client';

import KakaoMap from '@/components/kakao-map';

type Marker = {
    lat: number;
    lng: number;
    title?: string;
    variant?: 'default' | 'current' | 'selected';
};

type Props = {
    center: { lat: number; lng: number };
    markers: Marker[];
    onMapClick?: (pos: { lat: number; lng: number }) => void;
    onMarkerClick?: (id: number | string) => void;
    highlightId?: number | string | null;
};

export default function MapPanel({
    center,
    markers,
    onMapClick,
    onMarkerClick,
    highlightId,
}: Props) {
    return (
        <div
            id="restaurant-map-panel"
            className="flex-1 h-full relative bg-gray-100 dark:bg-gray-900"
            style={{ height: 'calc(100vh - 80px)' }}
        >
            <KakaoMap
                className="w-full h-full"
                center={center}
                markers={markers}
                enableClickDebug={false}
                onMapClick={onMapClick}
                onMarkerClick={onMarkerClick}
            />
        </div>
    );
}
