'use client';

import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

type Props = {
    onLocated: (pos: { lat: number; lng: number }) => void;
    currentPos?: { lat: number; lng: number } | null;
    onPanToCurrent?: (pos: { lat: number; lng: number }) => void;
};

export default function CurrentLocationButton({
    onLocated,
    currentPos,
    onPanToCurrent,
}: Props) {
    const handleClick = () => {
        if (currentPos && typeof onPanToCurrent === 'function') {
            try {
                onPanToCurrent(currentPos);
            } catch (e) {
                console.error('onPanToCurrent error', e);
            }
            return;
        }

        if (!('geolocation' in navigator)) {
            window.alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
            return;
        }
        // Check permission state first (if supported) to give clearer guidance
        const proceedGet = () => {
            // Use slightly more lenient options: some desktops fail with high accuracy
            const opts: PositionOptions = {
                enableHighAccuracy: false,
                timeout: 20000,
                maximumAge: 60000,
            };
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    onLocated({ lat: latitude, lng: longitude });
                },
                (err) => {
                    console.error('geolocation error', err);
                    // err.code: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
                    const code = (err && (err as any).code) || 'unknown';
                    const msg = (err && (err as any).message) || '';
                    window.alert(
                        `현재 위치를 가져오지 못했습니다. (${code}) ${msg}\n\n브라우저 권한, OS 위치 설정, 또는 HTTPS 환경(localhost 제외)을 확인해주세요.`
                    );
                },
                opts
            );
        };

        if (
            'permissions' in navigator &&
            (navigator as any).permissions.query
        ) {
            try {
                (navigator as any).permissions
                    .query({ name: 'geolocation' })
                    .then((status: any) => {
                        // state: 'granted' | 'prompt' | 'denied'
                        if (status.state === 'denied') {
                            window.alert(
                                '이 사이트에 대한 위치 액세스가 차단되어 있습니다. 브라우저 주소창의 사이트 권한 설정에서 위치 사용을 허용해 주세요.'
                            );
                            return;
                        }
                        // if granted or prompt, try to get location
                        proceedGet();
                    })
                    .catch(() => {
                        // permission API not available or failed — proceed anyway
                        proceedGet();
                    });
            } catch (e) {
                proceedGet();
            }
        } else {
            proceedGet();
        }
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
