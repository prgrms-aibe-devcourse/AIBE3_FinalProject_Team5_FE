'use client';

import React, { useEffect, useState, useRef } from 'react';
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
import {
    createRestaurant,
    updateRestaurant,
    uploadRestaurantImage,
} from '@/lib/restaurants';

import type { Restaurant } from '@/lib/restaurants';

type Props = {
    lastClicked: { lat: number; lng: number } | null;
    onSuccess: (created: Restaurant) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialData?: Restaurant | null;
    mode?: 'create' | 'edit';
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
    async function resizeImageFile(
        file: File,
        maxWidth = 1280,
        maxHeight = 1280,
        quality = 0.8
    ): Promise<File> {
        const imgBitmap = await createImageBitmap(file);
        let { width, height } = imgBitmap;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        const targetWidth = Math.round(width * ratio);
        const targetHeight = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');
        ctx.drawImage(imgBitmap, 0, 0, targetWidth, targetHeight);

        const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob(resolve as BlobCallback, 'image/jpeg', quality)
        );
        if (!blob) throw new Error('이미지 변환에 실패했습니다.');
        const newFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg' }
        );
        return newFile;
    }
    const [openInternal, setOpenInternal] = useState(false);
    const open = controlledOpen === undefined ? openInternal : controlledOpen;
    const setOpen =
        controlledOnOpenChange === undefined
            ? setOpenInternal
            : controlledOnOpenChange;
    const router = useRouter();
    const { isLogin } = useAuth();

    const [form, setForm] = useState({
        name: '',
        jibunAddress: '',
        roadAddress: '',
        phone: '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [awaitingPick, setAwaitingPick] = useState(false);

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
        if (!open) {
            setSelectedFile(null);
            try {
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (e) {}
        }
    }, [open]);

    const setFromClick = () => {
        if (typeof onRequestMapPick === 'function') {
            try {
                sessionStorage.setItem(
                    'addRestaurantDraft',
                    JSON.stringify(form)
                );
            } catch (e) {}
            setAwaitingPick(true);
            setOpen(false);
            onRequestMapPick();
            return;
        }
        if (!lastClicked) {
            window.alert('먼저 지도를 클릭해 좌표를 선택하세요.');
            return;
        }
        setSelectedLocation({ lat: lastClicked.lat, lng: lastClicked.lng });
    };

    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, jibunAddress, roadAddress, phone } = form;
        if (!name || !jibunAddress || !roadAddress)
            return window.alert('식당명과 주소는 필수입니다.');
        if (!selectedLocation && !lastClicked)
            return window.alert('위치를 지도에서 선택해 주세요.');
        const lat = selectedLocation ? selectedLocation.lat : lastClicked!.lat;
        const lng = selectedLocation ? selectedLocation.lng : lastClicked!.lng;

        try {
            if (mode === 'edit') {
                const payload = {
                    name,
                    jibunAddress,
                    roadAddress,
                    phone,
                    latitude: lat,
                    longitude: lng,
                };
                const id = (initialData as any)?.id ?? null;
                if (id && Number(id) > 0) {
                    let updated = await updateRestaurant(id, payload);
                    if (selectedFile && (updated as any).id) {
                        try {
                            updated = await uploadRestaurantImage(
                                (updated as any).id,
                                selectedFile
                            );
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    if (onUpdate) onUpdate(updated as Restaurant);
                    else onSuccess(updated as Restaurant);
                } else {
                    if (!isLogin) {
                        sessionStorage.setItem(
                            'postLoginRedirect',
                            '/restaurants'
                        );
                        router.push(
                            `/login?next=${encodeURIComponent('/restaurants')}`
                        );
                        return;
                    }
                    const created = await createRestaurant(payload);
                    console.debug(
                        '[AddRestaurantDialog] created (edit fallback)',
                        created
                    );
                    if (selectedFile && (created as any).id) {
                        try {
                            const updated = await uploadRestaurantImage(
                                (created as any).id,
                                selectedFile
                            );
                            if (onUpdate) onUpdate(updated as Restaurant);
                            else onSuccess(updated as Restaurant);
                        } catch (e) {
                            if (onUpdate) onUpdate(created as Restaurant);
                            else onSuccess(created as Restaurant);
                        }
                    } else {
                        if (onUpdate) onUpdate(created as Restaurant);
                        else onSuccess(created as Restaurant);
                    }
                }
            } else {
                if (!isLogin) {
                    sessionStorage.setItem('postLoginRedirect', '/restaurants');
                    router.push(
                        `/login?next=${encodeURIComponent('/restaurants')}`
                    );
                    return;
                }
                const created = await createRestaurant({
                    name,
                    jibunAddress,
                    roadAddress,
                    phone,
                    latitude: lat,
                    longitude: lng,
                });
                console.debug('[AddRestaurantDialog] created', created);
                if (selectedFile && (created as any).id) {
                    try {
                        const updated = await uploadRestaurantImage(
                            (created as any).id,
                            selectedFile
                        );
                        onSuccess(updated as Restaurant);
                    } catch (e) {
                        onSuccess(created as Restaurant);
                    }
                } else {
                    onSuccess(created as Restaurant);
                }
            }
            setOpen(false);
            setForm({ name: '', jibunAddress: '', roadAddress: '', phone: '' });
            setSelectedLocation(null);
            setSelectedFile(null);
        } catch (err) {
            console.error(err);
            window.alert('오류가 발생했습니다.');
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
                            sessionStorage.setItem(
                                'postLoginRedirect',
                                '/restaurants'
                            );
                            router.push(
                                `/login?next=${encodeURIComponent(
                                    '/restaurants'
                                )}`
                            );
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
                        <label className="block text-xs mb-1">
                            전화번호 (선택)
                        </label>
                        <Input
                            value={form.phone}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-xs mb-1">
                            사진 (선택)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="restaurant-image-input"
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const f =
                                        e.target.files && e.target.files[0];
                                    if (f) {
                                        try {
                                            const resized =
                                                await resizeImageFile(
                                                    f,
                                                    1280,
                                                    1280,
                                                    0.8
                                                );
                                            setSelectedFile(resized);
                                        } catch (err) {
                                            console.error(
                                                '[image resize]',
                                                err
                                            );
                                            // 실패 시 원본 사용
                                            setSelectedFile(f);
                                        }
                                    } else setSelectedFile(null);
                                }}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                사진 업로드
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                {selectedFile ? selectedFile.name : ''}
                            </span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <label className="block text-xs mb-1">위치</label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFromClick()}
                            >
                                지도에서 위치추가하기
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setOpen(false);
                                setSelectedFile(null);
                                try {
                                    if (fileInputRef.current)
                                        fileInputRef.current.value = '';
                                } catch (e) {}
                            }}
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
