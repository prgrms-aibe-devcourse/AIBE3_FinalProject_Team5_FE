'use client';

import KakaoMap from '@/components/kakao-map';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

type Marker = {
    lat: number;
    lng: number;
    title?: string;
    variant?: 'default' | 'current';
};

type Props = {
    center: { lat: number; lng: number };
    markers: Marker[];
    onMapClick?: (pos: { lat: number; lng: number }) => void;
};

export default function MapPanel({ center, markers, onMapClick }: Props) {
    return (
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
            <KakaoMap
                className="w-full h-full"
                center={center}
                level={5}
                markers={markers}
                enableClickDebug
                onMapClick={onMapClick}
            />

            {/* Static sample overlays preserved */}
            <div className="absolute top-4 right-4 space-y-2">
                <Card className="shadow-lg">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                                수목원 야시장
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Card className="shadow-lg">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                                제주동화마을
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
