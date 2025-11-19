'use client';

import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

type Props = {
    onLocated: (pos: { lat: number; lng: number }) => void;
};

export default function CurrentLocationButton({ onLocated }: Props) {
    const handleClick = () => {
        if (!('geolocation' in navigator)) {
            window.alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                onLocated({ lat: latitude, lng: longitude });
            },
            (err) => {
                console.error('geolocation error', err);
                window.alert(
                    '현재 위치를 가져오지 못했습니다. 브라우저 권한을 확인해주세요.'
                );
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    return (
        <Button
            variant="default"
            size="sm"
            className="group cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={handleClick}
        >
            <MapPin className="h-4 w-4 mr-1 transition-transform group-hover:scale-110" />
            현위치
        </Button>
    );
}
