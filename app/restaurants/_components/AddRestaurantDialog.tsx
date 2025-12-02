'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/global/auth/useAuth';
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
import { createRestaurant, updateRestaurant } from '@/lib/restaurants';

import type { Restaurant } from '@/lib/restaurants';

type Props = {
    lastClicked: { lat: number; lng: number } | null;
    onSuccess: (created: Restaurant) => void;
    // optional controlled editing mode
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialData?: Restaurant | null;
    mode?: 'create' | 'edit';
    // when in edit mode for local items, call this instead of creating
    onUpdate?: (updated: Restaurant) => void;
    onRequestMapPick?: () => void;
};

export default function AddRestaurantDialog({
    lastClicked,
    onSuccess,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    initialData,
    mode,
    onUpdate,
    onRequestMapPick,
}: Props) {
    const [openInternal, setOpenInternal] = useState(false);
    const open = controlledOpen === undefined ? openInternal : controlledOpen;
    const setOpen =
        controlledOnOpenChange === undefined
            ? setOpenInternal
            : controlledOnOpenChange;
    const router = useRouter();
    const { isLogin, loginMember } = useAuth();
    const [form, setForm] = useState({
        name: '',
        jibunAddress: '',
        roadAddress: '',
        phone: '',
    });
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [awaitingPick, setAwaitingPick] = useState(false);

    const setFromClick = () => {
        if (typeof onRequestMapPick === 'function') {
            try {
                try {
                    window.alert('지도를 클릭해 좌표를 선택하세요.');
                } catch (err) {
                    console.debug('alert unavailable', err);
                }

                try {
                    const draft = { ...form };
                    sessionStorage.setItem(
                        'addRestaurantDraft',
                        JSON.stringify(draft)
                    );
                } catch (e) {
                    console.error('store addRestaurantDraft', e);
                }

                setAwaitingPick(true);
                setOpen(false);
                onRequestMapPick();
                return;
            } catch (e) {
                console.error('request map pick failed', e);
            }
        }

        if (!lastClicked) {
            window.alert('먼저 지도를 클릭해 좌표를 선택하세요.');
            return;
        }
        setSelectedLocation({ lat: lastClicked.lat, lng: lastClicked.lng });
    };

    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name ?? '',
                jibunAddress: initialData.jibunAddress ?? '',
                roadAddress: initialData.roadAddress ?? '',
                phone: initialData.phone ?? '',
            });
            const lat =
                (initialData as any).latitude ?? (initialData as any).lat;
            const lng =
                (initialData as any).longitude ?? (initialData as any).lng;
            if (lat && lng) setSelectedLocation({ lat, lng });
        }
    }, [initialData]);

    useEffect(() => {
        if (awaitingPick && lastClicked) {
            setSelectedLocation({ lat: lastClicked.lat, lng: lastClicked.lng });
            setAwaitingPick(false);
        }
    }, [awaitingPick, lastClicked]);

    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, jibunAddress, roadAddress, phone } = form;
        if (!name || !jibunAddress || !roadAddress || !phone) {
            window.alert('모든 필드를 입력해주세요.');
            return;
        }
        if (!selectedLocation && !lastClicked) {
            window.alert('위치를 지도에서 선택해 주세요.');
            return;
        }
        const lat = selectedLocation ? selectedLocation.lat : lastClicked!.lat;
        const lng = selectedLocation ? selectedLocation.lng : lastClicked!.lng;
        try {
            if (mode === 'edit') {
                const updatedPayload = {
                    name,
                    jibunAddress,
                    roadAddress,
                    phone,
                    latitude: lat,
                    longitude: lng,
                };

                try {
                    const id = (initialData as any)?.id ?? null;
                    if (id && Number(id) > 0) {
                        const updated = await updateRestaurant(
                            id,
                            updatedPayload
                        );

                        if (onUpdate) onUpdate(updated as Restaurant);
                        else onSuccess(updated as Restaurant);
                        window.alert('식당 정보가 저장되었습니다.');
                        setOpen(false);
                        setForm({
                            name: '',
                            jibunAddress: '',
                            roadAddress: '',
                            phone: '',
                        });
                        setSelectedLocation(null);
                    } else {
                        const updated = {
                            ...(initialData || {}),
                            ...updatedPayload,
                            isLocal: true,
                            ownerId:
                                (initialData as any)?.ownerId ??
                                loginMember?.id ??
                                null,
                        } as Restaurant;
                        if (onUpdate) onUpdate(updated);
                        else onSuccess(updated);
                        window.alert('식당 정보가 저장되었습니다.');
                        setOpen(false);
                        setForm({
                            name: '',
                            jibunAddress: '',
                            roadAddress: '',
                            phone: '',
                        });
                        setSelectedLocation(null);
                    }
                } catch (e) {
                    console.error('update restaurant failed', e);
                    window.alert('식당 수정 중 오류가 발생했습니다.');
                }
            } else {
                const created = await createRestaurant({
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
                });
                setSelectedLocation(null);

                let savedId: number | string = -Date.now();
                let createdObj: any = null;
                if (created && (created as any).id) {
                    createdObj = created as Restaurant;
                    onSuccess(created as Restaurant);
                    savedId = (created as any).id;
                } else {
                    const local: any = {
                        id: savedId,
                        name,
                        phone,
                        jibunAddress,
                        roadAddress,
                        latitude: lat,
                        longitude: lng,
                        image: '/placeholder.svg',
                        averageRating: undefined,
                        reviewCount: 0,
                        ownerId: loginMember?.id ?? null,
                    };
                    createdObj = local;
                    onSuccess(local as Restaurant);
                }

                try {
                    const shouldMarkClientCreated =
                        Number(savedId) < 0 ||
                        (createdObj &&
                            (createdObj as any).ownerId &&
                            loginMember &&
                            Number((createdObj as any).ownerId) ===
                                Number(loginMember.id));
                    if (shouldMarkClientCreated) {
                        const existing = JSON.parse(
                            sessionStorage.getItem('myCreatedRestaurants') ||
                                '[]'
                        );
                        const entry = {
                            id: savedId,
                            lat,
                            lng,
                        };
                        existing.push(entry);
                        sessionStorage.setItem(
                            'myCreatedRestaurants',
                            JSON.stringify(existing)
                        );
                    }
                } catch (e) {
                    console.error('store myCreatedRestaurants', e);
                }
            }
        } catch (err) {
            console.error('add restaurant error', err);
            window.alert('등록 중 오류가 발생했습니다.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {controlledOpen === undefined ? (
                isLogin ? (
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                        >
                            식당 추가
                        </Button>
                    </DialogTrigger>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => {
                            router.push('/login');
                        }}
                    >
                        식당 추가
                    </Button>
                )
            ) : null}
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
                    <div className="mt-2">
                        <label className="block text-xs mb-1">위치</label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={setFromClick}
                            >
                                지도에서 위치추가하기
                            </Button>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <span>지도를 클릭하면 좌표를 확인할 수 있어요.</span>
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
