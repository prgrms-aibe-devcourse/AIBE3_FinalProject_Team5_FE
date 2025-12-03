'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { Restaurant } from '@/lib/restaurants';
import { useAuth } from '@/app/global/auth/useAuth';
import {
    deleteRestaurant,
    recommendRestaurant,
    createRestaurant,
    createRestaurantWithOpts,
} from '@/lib/restaurants';

type Props = {
    restaurant: Restaurant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleted: (id: number) => void;
    onEditLocal?: (r: Restaurant) => void;
};

export default function RestaurantDetailDialog({
    restaurant,
    open,
    onOpenChange,
    onDeleted,
    onEditLocal,
}: Props) {
    const router = useRouter();
    const { loginMember, isLogin } = useAuth();
    const [loading, setLoading] = useState(false);
    const rawOwner =
        (restaurant as any)?.ownerId ?? (restaurant as any)?.memberId ?? null;
    const ownerId =
        rawOwner !== null && rawOwner !== undefined ? Number(rawOwner) : null;
    const isOwner = Boolean(
        isLogin &&
            ownerId !== null &&
            loginMember &&
            Number(loginMember.id) === ownerId
    );
    // isUserCreated means this restaurant was created by the current user
    const isUserCreated = isOwner;
    const rawIsLocal = Boolean((restaurant as any)?.isLocal);
    const idNum = Number((restaurant as any)?.id ?? 0);
    // Broaden detection: treat item as "local" UI when:
    // - explicit `isLocal` flag is true,
    // - id is a temporary negative id,
    // - it has an `ownerId` (user-created), or
    // - it was created by the current user (isUserCreated)
    const hasOwnerFlag =
        (restaurant as any)?.ownerId ?? (restaurant as any)?.memberId ?? null;

    // Also consult sessionStorage for restaurants created by this client.
    let sessionMarkerMatch = false;
    try {
        const stored = JSON.parse(
            sessionStorage.getItem('myCreatedRestaurants') || '[]'
        );
        if (stored && Array.isArray(stored)) {
            const rLat = Number(
                (restaurant as any)?.latitude ?? (restaurant as any)?.lat ?? 0
            );
            const rLng = Number(
                (restaurant as any)?.longitude ?? (restaurant as any)?.lng ?? 0
            );
            for (const it of stored) {
                if (it == null) continue;
                if (
                    it.id &&
                    (restaurant as any)?.id &&
                    String(it.id) === String((restaurant as any).id)
                ) {
                    sessionMarkerMatch = true;
                    break;
                }
                const itLat = Number(it.lat ?? it.latitude ?? 0);
                const itLng = Number(it.lng ?? it.longitude ?? 0);
                if (
                    Math.abs(itLat - rLat) < 1e-4 &&
                    Math.abs(itLng - rLng) < 1e-4
                ) {
                    sessionMarkerMatch = true;
                    break;
                }
            }
        }
    } catch (e) {
        /* ignore */
    }

    const isLocalDetected =
        rawIsLocal ||
        (Number.isFinite(idNum) && idNum < 0) ||
        Boolean(hasOwnerFlag) ||
        isUserCreated ||
        sessionMarkerMatch;

    // Robustness: if this appears to be a Kakao-imported place (has `placeUrl` or
    // `placeId`) and the current user is NOT the owner, treat it as non-local
    // regardless of owner flags to avoid accidentally showing local edit UI.
    const looksLikeKakao = Boolean(
        (restaurant as any)?.placeUrl || (restaurant as any)?.placeId
    );

    const effectiveIsLocal =
        looksLikeKakao && !isOwner ? false : isLocalDetected;

    const initialYes = (restaurant as any)?.soloYesCount ?? 0;
    const initialNo = (restaurant as any)?.soloNoCount ?? 0;
    const [soloYes, setSoloYes] = useState<number>(initialYes);
    const [soloNo, setSoloNo] = useState<number>(initialNo);
    const [userSoloVote, setUserSoloVote] = useState<'yes' | 'no' | null>(null);

    useEffect(() => {}, [
        restaurant,
        ownerId,
        isOwner,
        rawIsLocal,
        isLocalDetected,
        effectiveIsLocal,
    ]);

    useEffect(() => {
        try {
            if (!restaurant) return;
            const place = (restaurant as any)?.placeUrl;
            if (!place) return;
            const name = restaurant.name ?? '';
            const lat = Number(
                (restaurant as any)?.latitude ?? (restaurant as any)?.lat ?? NaN
            );
            const lng = Number(
                (restaurant as any)?.longitude ??
                    (restaurant as any)?.lng ??
                    NaN
            );
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
            const key = `${name}::${(Math.round(lat * 1e5) / 1e5).toFixed(
                5
            )}::${(Math.round(lng * 1e5) / 1e5).toFixed(5)}`;
            try {
                const raw =
                    sessionStorage.getItem('kakaoPlaceUrlCache') || '{}';
                const cache = JSON.parse(raw || '{}');
                cache[key] = place;
                sessionStorage.setItem(
                    'kakaoPlaceUrlCache',
                    JSON.stringify(cache)
                );
            } catch (e) {
                // ignore store errors
            }
        } catch (e) {
            /* ignore */
        }
    }, [restaurant]);

    useEffect(() => {
        try {
            if (!restaurant) return;
            const key = `solo_vote_${(restaurant as any).id}`;
            const v = localStorage.getItem(key);
            if (v === 'yes' || v === 'no') setUserSoloVote(v);
        } catch (e) {
            console.error('load solo vote', e);
        }
    }, [restaurant]);

    const setLocalVote = (vote: 'yes' | 'no' | null) => {
        try {
            const key = `solo_vote_${(restaurant as any).id}`;
            if (vote === null) localStorage.removeItem(key);
            else localStorage.setItem(key, vote);
        } catch (e) {
            console.error('set solo vote', e);
        }
    };

    const handleSoloVote = (vote: 'yes' | 'no') => {
        if (!isLogin) {
            if (
                confirm(
                    '투표하려면 로그인해야 합니다. 로그인 페이지로 이동하시겠습니까?'
                )
            ) {
                router.push('/login');
                onOpenChange(false);
            }
            return;
        }

        const prev = userSoloVote;
        if (prev === vote) {
            if (vote === 'yes') setSoloYes((s) => Math.max(0, s - 1));
            else setSoloNo((s) => Math.max(0, s - 1));
            setUserSoloVote(null);
            setLocalVote(null);
            return;
        }
        if (vote === 'yes') setSoloYes((s) => s + 1);
        else setSoloNo((s) => s + 1);
        if (prev === 'yes') setSoloYes((s) => Math.max(0, s - 1));
        if (prev === 'no') setSoloNo((s) => Math.max(0, s - 1));
        setUserSoloVote(vote);
        setLocalVote(vote);
    };

    const handleDelete = async () => {
        if (!restaurant) return;
        if (!confirm('내 식당 목록에서 삭제하시겠어요?')) return;
        setLoading(true);
        try {
            await deleteRestaurant(restaurant.id);
            onDeleted(restaurant.id);
            onOpenChange(false);
        } catch (err) {
            console.error('delete error', err);
            window.alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRecommend = async () => {
        if (!restaurant) return;
        if (!confirm('관리자에게 정식 등록을 요청하시겠습니까?')) return;
        setLoading(true);
        try {
            await recommendRestaurant(restaurant.id);
            window.alert(
                '요청이 전송되었습니다. 관리자의 확인을 기다려주세요.'
            );
        } catch (err) {
            console.error('recommend error', err);
            window.alert('요청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!restaurant) return null;

    let placeUrl: string | undefined = (restaurant as any)?.placeUrl;
    try {
        if (!placeUrl) {
            const selRaw = sessionStorage.getItem('selectedRestaurant');
            if (selRaw) {
                const parsed = JSON.parse(selRaw);
                const selId = parsed && parsed.id ? String(parsed.id) : null;
                const curId = (restaurant as any)?.id
                    ? String((restaurant as any).id)
                    : null;
                // coordinate-based fuzzy match: allow stored placeUrl when the
                // stored entry's coordinates are very close to the current
                // restaurant's coordinates (covers cases where id differs
                // because one is server-created and the other is the Kakao
                // source object). Also allow when names match closely.
                const parsedLat = parsed && (parsed.latitude ?? parsed.lat);
                const parsedLng = parsed && (parsed.longitude ?? parsed.lng);
                const curLat =
                    (restaurant as any)?.latitude ?? (restaurant as any)?.lat;
                const curLng =
                    (restaurant as any)?.longitude ?? (restaurant as any)?.lng;
                let coordsMatch = false;
                if (
                    Number.isFinite(parsedLat) &&
                    Number.isFinite(parsedLng) &&
                    Number.isFinite(curLat) &&
                    Number.isFinite(curLng)
                ) {
                    const dLat = Math.abs(Number(parsedLat) - Number(curLat));
                    const dLng = Math.abs(Number(parsedLng) - Number(curLng));
                    // ~11m tolerance (about 1e-4 degrees)
                    coordsMatch = dLat < 1e-4 && dLng < 1e-4;
                }
                const nameMatch =
                    parsed &&
                    parsed.name &&
                    restaurant &&
                    parsed.name === restaurant.name;

                const shouldUseStored =
                    Boolean(parsed && parsed.placeUrl) &&
                    (looksLikeKakao ||
                        (selId && curId && selId === curId) ||
                        coordsMatch ||
                        nameMatch);
                if (shouldUseStored) {
                    placeUrl = parsed.placeUrl;
                } else {
                    // try fallback to kakaoPlaceUrlCache (name+coords keyed)
                    try {
                        const name = restaurant?.name ?? '';
                        const lat =
                            (restaurant as any)?.latitude ??
                            (restaurant as any)?.lat;
                        const lng =
                            (restaurant as any)?.longitude ??
                            (restaurant as any)?.lng;
                        if (
                            Number.isFinite(lat) &&
                            Number.isFinite(lng) &&
                            name
                        ) {
                            const key = `${name}::${(
                                Math.round(Number(lat) * 1e5) / 1e5
                            ).toFixed(5)}::${(
                                Math.round(Number(lng) * 1e5) / 1e5
                            ).toFixed(5)}`;
                            const cacheRaw =
                                sessionStorage.getItem('kakaoPlaceUrlCache') ||
                                '{}';
                            const cache = JSON.parse(cacheRaw || '{}');
                            if (cache && cache[key]) {
                                placeUrl = cache[key];
                            }
                        }
                    } catch (e) {
                        /* ignore */
                    }
                }
            }
        }
    } catch (e) {
        /* ignore parse errors */
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{restaurant.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="w-full h-40 relative rounded overflow-hidden bg-gray-100">
                        <Image
                            src={
                                (restaurant as any).image || '/placeholder.svg'
                            }
                            alt={restaurant.name}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                    <div className="text-sm space-y-2">
                        <div>
                            <strong>도로명:</strong>{' '}
                            {(restaurant as any).roadAddress}
                        </div>
                        <div>
                            <strong>전화번호:</strong>{' '}
                            {((restaurant as any).phone && (
                                <a
                                    href={`tel:${(restaurant as any).phone}`}
                                    className="text-primary"
                                >
                                    {(restaurant as any).phone}
                                </a>
                            )) ||
                                '-'}
                        </div>

                        <div className="flex items-center gap-4">
                            <div>
                                <strong>평점:</strong>{' '}
                                {(restaurant as any).averageRating ?? '-'}
                            </div>
                            <div className="text-muted-foreground">
                                ({(restaurant as any).reviewCount ?? 0})
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="text-sm font-medium">혼밥 자리</div>
                            <div className="mt-1 flex items-center gap-3">
                                {(() => {
                                    const total = soloYes + soloNo;
                                    const yesPct =
                                        total === 0
                                            ? 0
                                            : Math.round(
                                                  (soloYes / total) * 100
                                              );
                                    const noPct =
                                        total === 0 ? 0 : 100 - yesPct;
                                    return (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm">
                                                    <button
                                                        className={`mx-1 px-2 py-1 rounded border text-sm cursor-pointer ${
                                                            userSoloVote ===
                                                            'yes'
                                                                ? 'bg-green-50 border-green-400'
                                                                : 'bg-white'
                                                        }`}
                                                        onClick={() =>
                                                            handleSoloVote(
                                                                'yes'
                                                            )
                                                        }
                                                        type="button"
                                                    >
                                                        Y
                                                    </button>
                                                    <button
                                                        className={`mx-1 px-2 py-1 rounded border text-sm cursor-pointer ${
                                                            userSoloVote ===
                                                            'no'
                                                                ? 'bg-red-50 border-red-400'
                                                                : 'bg-white'
                                                        }`}
                                                        onClick={() =>
                                                            handleSoloVote('no')
                                                        }
                                                        type="button"
                                                    >
                                                        N
                                                    </button>
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    ({yesPct}:{noPct})
                                                </div>
                                            </div>

                                            <div className="text-xs text-muted-foreground">
                                                투표 참여로 다른 이용자에게
                                                도움이 됩니다.
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex gap-2">
                        {placeUrl ? (
                            <Button
                                className="cursor-pointer"
                                variant="outline"
                                onClick={() => {
                                    try {
                                        const url = placeUrl;
                                        if (url) {
                                            window.open(
                                                url as string,
                                                '_blank',
                                                'noopener,noreferrer'
                                            );
                                        } else {
                                            window.alert(
                                                '해당 식당의 카카오 상세 페이지가 없습니다.'
                                            );
                                        }
                                        onOpenChange(false);
                                    } catch (e) {
                                        console.error('open kakao url', e);
                                        window.alert(
                                            '카카오 페이지를 열지 못했습니다.'
                                        );
                                    }
                                }}
                            >
                                카카오에서 보기
                            </Button>
                        ) : null}
                        {effectiveIsLocal ? (
                            <>
                                {isOwner ? (
                                    <>
                                        <Button
                                            className="cursor-pointer"
                                            variant="outline"
                                            onClick={() => {
                                                const id = (restaurant as any)
                                                    .id;
                                                // Instead of navigating away, open the inline editor
                                                if (
                                                    (restaurant as any) &&
                                                    typeof (restaurant as any) ===
                                                        'object'
                                                ) {
                                                    if (
                                                        typeof onEditLocal ===
                                                        'function'
                                                    ) {
                                                        try {
                                                            onEditLocal(
                                                                restaurant as Restaurant
                                                            );
                                                            onOpenChange(false);
                                                            return;
                                                        } catch (e) {
                                                            console.error(
                                                                'onEditLocal handler failed',
                                                                e
                                                            );
                                                        }
                                                    }
                                                }
                                                window.alert(
                                                    '수정할 식당 정보가 없습니다.'
                                                );
                                            }}
                                        >
                                            수정하기
                                        </Button>

                                        <Button
                                            className="cursor-pointer"
                                            variant="destructive"
                                            onClick={handleDelete}
                                            disabled={loading}
                                        >
                                            삭제
                                        </Button>
                                    </>
                                ) : null}

                                <Button
                                    className="cursor-pointer"
                                    variant="outline"
                                    onClick={() => {
                                        (async () => {
                                            try {
                                                const id = (restaurant as any)
                                                    .id;
                                                // if restaurant already has positive server id, navigate
                                                if (id && Number(id) > 0) {
                                                    const payload = {
                                                        id: id,
                                                        name: restaurant.name,
                                                        roadAddress: (
                                                            restaurant as any
                                                        ).roadAddress,
                                                        jibunAddress: (
                                                            restaurant as any
                                                        ).jibunAddress,
                                                        image: (
                                                            restaurant as any
                                                        ).image,
                                                        phone: (
                                                            restaurant as any
                                                        ).phone,
                                                        averageRating: (
                                                            restaurant as any
                                                        ).averageRating,
                                                        reviewCount: (
                                                            restaurant as any
                                                        ).reviewCount,
                                                        latitude: (
                                                            restaurant as any
                                                        ).latitude,
                                                        longitude: (
                                                            restaurant as any
                                                        ).longitude,
                                                        placeUrl: (
                                                            restaurant as any
                                                        ).placeUrl,
                                                    };
                                                    try {
                                                        sessionStorage.setItem(
                                                            'selectedRestaurant',
                                                            JSON.stringify(
                                                                payload
                                                            )
                                                        );
                                                    } catch (e) {
                                                        console.error(
                                                            'store selectedRestaurant',
                                                            e
                                                        );
                                                    }
                                                    router.push(
                                                        `/restaurants/${id}/reviews`
                                                    );
                                                    onOpenChange(false);
                                                    return;
                                                }

                                                // otherwise, create a backend restaurant entry first
                                                const createPayload = {
                                                    name: restaurant.name ?? '',
                                                    jibunAddress:
                                                        (restaurant as any)
                                                            .jibunAddress ?? '',
                                                    roadAddress:
                                                        (restaurant as any)
                                                            .roadAddress ?? '',
                                                    phone:
                                                        (restaurant as any)
                                                            .phone ?? '',
                                                    latitude:
                                                        (restaurant as any)
                                                            .latitude ??
                                                        (restaurant as any)
                                                            .lat ??
                                                        0,
                                                    longitude:
                                                        (restaurant as any)
                                                            .longitude ??
                                                        (restaurant as any)
                                                            .lng ??
                                                        0,
                                                };

                                                // If this item looks like a Kakao-imported place
                                                // (has a placeUrl or placeId), ensure we create it
                                                // with `asImported=true` so the backend does NOT
                                                // assign the current user as owner.
                                                const looksLikeKakao = Boolean(
                                                    (restaurant as any)
                                                        .placeUrl ||
                                                        (restaurant as any)
                                                            .placeId
                                                );

                                                const created = looksLikeKakao
                                                    ? await createRestaurantWithOpts(
                                                          createPayload,
                                                          { asImported: true }
                                                      )
                                                    : await createRestaurant(
                                                          createPayload
                                                      );
                                                try {
                                                    const payload = {
                                                        id: created.id,
                                                        name: created.name,
                                                        roadAddress:
                                                            created.roadAddress,
                                                        jibunAddress:
                                                            created.jibunAddress,
                                                        image: created.image,
                                                        phone: created.phone,
                                                        averageRating:
                                                            created.averageRating,
                                                        reviewCount:
                                                            created.reviewCount,
                                                        latitude:
                                                            created.latitude,
                                                        longitude:
                                                            created.longitude,
                                                        placeUrl:
                                                            (created as any)
                                                                .placeUrl ||
                                                            (restaurant as any)
                                                                .placeUrl,
                                                    };
                                                    sessionStorage.setItem(
                                                        'selectedRestaurant',
                                                        JSON.stringify(payload)
                                                    );
                                                } catch (e) {
                                                    console.error(
                                                        'store selectedRestaurant after create',
                                                        e
                                                    );
                                                }
                                                router.push(
                                                    `/restaurants/${created.id}/reviews`
                                                );
                                                onOpenChange(false);
                                            } catch (e: any) {
                                                console.error(
                                                    'review nav/create',
                                                    e
                                                );
                                                const msg =
                                                    e && e.message
                                                        ? String(e.message)
                                                        : '리뷰 페이지로 이동할 수 없습니다.';
                                                window.alert(
                                                    `리뷰 등록 중 오류: ${msg}`
                                                );
                                            }
                                        })();
                                    }}
                                >
                                    리뷰보기
                                </Button>

                                <Button
                                    className="cursor-pointer"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    닫기
                                </Button>
                            </>
                        ) : (
                            // Non-local: original actions
                            <>
                                {/* 카카오 링크는 상단에서 non-local일 때만 표시합니다 (중복 방지) */}

                                <Button
                                    className="cursor-pointer"
                                    variant="outline"
                                    onClick={() => {
                                        (async () => {
                                            try {
                                                const id = (restaurant as any)
                                                    .id;
                                                if (id && Number(id) > 0) {
                                                    const payload = {
                                                        id: id,
                                                        name: restaurant.name,
                                                        roadAddress: (
                                                            restaurant as any
                                                        ).roadAddress,
                                                        jibunAddress: (
                                                            restaurant as any
                                                        ).jibunAddress,
                                                        image: (
                                                            restaurant as any
                                                        ).image,
                                                        phone: (
                                                            restaurant as any
                                                        ).phone,
                                                        averageRating: (
                                                            restaurant as any
                                                        ).averageRating,
                                                        reviewCount: (
                                                            restaurant as any
                                                        ).reviewCount,
                                                        latitude: (
                                                            restaurant as any
                                                        ).latitude,
                                                        longitude: (
                                                            restaurant as any
                                                        ).longitude,
                                                        placeUrl: (
                                                            restaurant as any
                                                        ).placeUrl,
                                                    };
                                                    try {
                                                        sessionStorage.setItem(
                                                            'selectedRestaurant',
                                                            JSON.stringify(
                                                                payload
                                                            )
                                                        );
                                                    } catch (e) {
                                                        console.error(
                                                            'store selectedRestaurant',
                                                            e
                                                        );
                                                    }
                                                    router.push(
                                                        `/restaurants/${id}/reviews`
                                                    );
                                                    onOpenChange(false);
                                                    return;
                                                }

                                                // create backend entry for kakao-sourced item then navigate
                                                const createPayload = {
                                                    name: restaurant.name ?? '',
                                                    jibunAddress:
                                                        (restaurant as any)
                                                            .jibunAddress ?? '',
                                                    roadAddress:
                                                        (restaurant as any)
                                                            .roadAddress ?? '',
                                                    phone:
                                                        (restaurant as any)
                                                            .phone ?? '',
                                                    latitude:
                                                        (restaurant as any)
                                                            .latitude ??
                                                        (restaurant as any)
                                                            .lat ??
                                                        0,
                                                    longitude:
                                                        (restaurant as any)
                                                            .longitude ??
                                                        (restaurant as any)
                                                            .lng ??
                                                        0,
                                                };
                                                const created =
                                                    await createRestaurantWithOpts(
                                                        createPayload,
                                                        { asImported: true }
                                                    );
                                                try {
                                                    const payload = {
                                                        id: created.id,
                                                        name: created.name,
                                                        roadAddress:
                                                            created.roadAddress,
                                                        jibunAddress:
                                                            created.jibunAddress,
                                                        image: created.image,
                                                        phone: created.phone,
                                                        averageRating:
                                                            created.averageRating,
                                                        reviewCount:
                                                            created.reviewCount,
                                                        latitude:
                                                            created.latitude,
                                                        longitude:
                                                            created.longitude,
                                                        placeUrl:
                                                            (created as any)
                                                                .placeUrl ||
                                                            (restaurant as any)
                                                                .placeUrl,
                                                    };
                                                    sessionStorage.setItem(
                                                        'selectedRestaurant',
                                                        JSON.stringify(payload)
                                                    );
                                                } catch (e) {
                                                    console.error(
                                                        'store selectedRestaurant after create',
                                                        e
                                                    );
                                                }
                                                router.push(
                                                    `/restaurants/${created.id}/reviews`
                                                );
                                                onOpenChange(false);
                                            } catch (e: any) {
                                                console.error(
                                                    'review nav/create',
                                                    e
                                                );
                                                const msg =
                                                    e && e.message
                                                        ? String(e.message)
                                                        : '리뷰 페이지로 이동할 수 없습니다.';
                                                window.alert(
                                                    `리뷰 등록 중 오류: ${msg}`
                                                );
                                            }
                                        })();
                                    }}
                                >
                                    리뷰보기
                                </Button>

                                <Button
                                    className="cursor-pointer"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    닫기
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
