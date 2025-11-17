'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { createRestaurant } from '@/lib/restaurants';

type Props = {
    lastClicked: { lat: number; lng: number } | null;
    onSuccess: (pos: { lat: number; lng: number }) => void;
};

export default function AddRestaurantDialog({ lastClicked, onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        jibunAddress: '',
        roadAddress: '',
        phone: '',
        latitude: '',
        longitude: '',
    });

    const setFromClick = () => {
        if (!lastClicked) {
            window.alert('먼저 지도를 클릭해 좌표를 선택하세요.');
            return;
        }
        setForm((f) => ({
            ...f,
            latitude: String(lastClicked.lat),
            longitude: String(lastClicked.lng),
        }));
    };

    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, jibunAddress, roadAddress, phone, latitude, longitude } =
            form;
        if (
            !name ||
            !jibunAddress ||
            !roadAddress ||
            !phone ||
            !latitude ||
            !longitude
        ) {
            window.alert('모든 필드를 입력해주세요.');
            return;
        }
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            window.alert('위도/경도는 숫자여야 합니다.');
            return;
        }
        try {
            await createRestaurant({
                name,
                jibunAddress,
                roadAddress,
                phone,
                latitude: lat,
                longitude: lng,
            });
            window.alert('식당이 등록되었습니다.');
            setOpen(false);
            setForm({
                name: '',
                jibunAddress: '',
                roadAddress: '',
                phone: '',
                latitude: '',
                longitude: '',
            });
            onSuccess({ lat, lng });
        } catch (err) {
            console.error('add restaurant error', err);
            window.alert('등록 중 오류가 발생했습니다.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    식당 추가
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>식당 추가</DialogTitle>
                </DialogHeader>
                <form onSubmit={submitAdd} className="space-y-3">
                    <div>
                        <label className="block text-xs mb-1">식당명</label>
                        <Input
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs mb-1">지번주소</label>
                        <Input
                            value={form.jibunAddress}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    jibunAddress: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs mb-1">도로명주소</label>
                        <Input
                            value={form.roadAddress}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    roadAddress: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs mb-1">전화번호</label>
                        <Input
                            value={form.phone}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs mb-1">
                                위도 (latitude)
                            </label>
                            <Input
                                value={form.latitude}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        latitude: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs mb-1">
                                경도 (longitude)
                            </label>
                            <Input
                                value={form.longitude}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        longitude: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {lastClicked ? (
                            <span>
                                최근 지도 클릭 좌표:{' '}
                                {lastClicked.lat.toFixed(6)},{' '}
                                {lastClicked.lng.toFixed(6)}{' '}
                            </span>
                        ) : (
                            <span>
                                지도를 클릭하면 좌표를 확인할 수 있어요.
                            </span>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 px-2 h-6"
                            onClick={setFromClick}
                        >
                            지도에서 선택
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            취소
                        </Button>
                        <Button type="submit">등록</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
