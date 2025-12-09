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
import type { Restaurant } from '@/lib/restaurants';
import { useAuth } from '@/app/global/auth/useAuth';
import {
    deleteRestaurant,
    recommendRestaurant,
    createRestaurant,
    createRestaurantWithOpts,
    fetchRestaurantById,
    fetchSoloVoteSummary,
    postSoloVote,
    deleteSoloVote,
} from '@/lib/restaurants';
import RestaurantDetailDialogContent from './RestaurantDetailDialogContent';
import RestaurantDetailActions from './RestaurantDetailActions';

type Props = {
    restaurant: Restaurant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleted: (id: number) => void;
    onEditLocal?: (r: Restaurant) => void;
    onCreated?: (r: Restaurant) => void;
};

export default function RestaurantDetailDialog({
    restaurant,
    open,
    onOpenChange,
    onDeleted,
    onEditLocal,
    onCreated,
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
    const isUserCreated = isOwner;
    const rawIsLocal = Boolean((restaurant as any)?.isLocal);
    const idNum = Number((restaurant as any)?.id ?? 0);
    const hasOwnerFlag =
        (restaurant as any)?.ownerId ?? (restaurant as any)?.memberId ?? null;
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
    } catch (e) {}

    const isLocalDetected =
        rawIsLocal ||
        (Number.isFinite(idNum) && idNum < 0) ||
        Boolean(hasOwnerFlag) ||
        isUserCreated ||
        sessionMarkerMatch;

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

    // Reset local solo-vote state whenever the `restaurant` prop changes.
    // If the subsequent server probe/fetch fails, this prevents leftover
    // values from a previously-opened restaurant from showing up.
    useEffect(() => {
        try {
            setSoloYes(initialYes ?? 0);
            setSoloNo(initialNo ?? 0);
            // Load any persisted local vote for this restaurant id
            try {
                const key = `solo_vote_${(restaurant as any)?.id}`;
                const v = localStorage.getItem(key);
                if (v === 'yes' || v === 'no')
                    setUserSoloVote(v as 'yes' | 'no');
                else setUserSoloVote(null);
            } catch (e) {
                setUserSoloVote(null);
            }
        } catch (e) {
            // ignore
        }
    }, [
        restaurant,
        initialYes,
        initialNo,
        ownerId,
        isOwner,
        rawIsLocal,
        isLocalDetected,
        effectiveIsLocal,
    ]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!restaurant) return;
                const id = (restaurant as any)?.id;
                if (!id || Number(id) <= 0) return;
                const summary = await fetchSoloVoteSummary(id);
                if (!mounted) return;
                setSoloYes(summary.yesCount ?? 0);
                setSoloNo(summary.noCount ?? 0);
                setUserSoloVote(
                    summary.myChoice === null
                        ? null
                        : summary.myChoice
                        ? 'yes'
                        : 'no'
                );
                try {
                    const key = `solo_vote_${(restaurant as any).id}`;
                    if (summary.myChoice === null) localStorage.removeItem(key);
                    else
                        localStorage.setItem(
                            key,
                            summary.myChoice ? 'yes' : 'no'
                        );
                } catch (e) {}
            } catch (e) {
                // ignore fetch errors; keep local state
            }
        })();
        return () => {
            mounted = false;
        };
    }, [restaurant]);

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
            } catch (e) {}
        } catch (e) {}
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

    const handleSoloVote = async (vote: 'yes' | 'no') => {
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
        let id = (restaurant as any)?.id;
        const looksLikeKakao = Boolean(
            (restaurant as any)?.placeUrl || (restaurant as any)?.placeId
        );

        // Ensure `id` actually exists on backend. It's possible a Kakao placeId was stored
        // in `id` on client objects; in that case server GET/POST will 400. Try to probe
        // the server for the id; if it fails and this looks like a Kakao place, create it.
        if (id && Number(id) > 0) {
            try {
                // Probe server to verify that a Restaurant with this id exists.
                // We use `fetchRestaurantById` which will throw for 4xx/5xx,
                // allowing us to detect "not found" and create-asImported.
                await fetchRestaurantById(id);
            } catch (probeErr) {
                // probe failed (likely 400/not found). If this is a Kakao-like item,
                // create the restaurant on server and use returned id.
                if (looksLikeKakao) {
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

                    try {
                        const createPayload = {
                            name: restaurant?.name ?? '',
                            jibunAddress:
                                (restaurant as any)?.jibunAddress ?? '',
                            roadAddress: (restaurant as any)?.roadAddress ?? '',
                            phone: (restaurant as any)?.phone ?? undefined,
                            latitude:
                                (restaurant as any)?.latitude ??
                                (restaurant as any)?.lat ??
                                0,
                            longitude:
                                (restaurant as any)?.longitude ??
                                (restaurant as any)?.lng ??
                                0,
                        };

                        let created: any = null;
                        if (
                            shouldCreateAsImported(
                                effectiveIsLocal,
                                looksLikeKakao
                            )
                        ) {
                            created = await createRestaurantWithOpts(
                                createPayload,
                                {
                                    asImported: true,
                                }
                            );
                        } else {
                            created = await createRestaurant(createPayload);
                        }

                        if (created && created.id) {
                            id = created.id;
                            const payload = buildSelectedPayload(
                                Object.assign({}, created, {
                                    placeUrl:
                                        (created as any)?.placeUrl ||
                                        (restaurant as any)?.placeUrl,
                                })
                            );
                            storeSelected(payload);
                            try {
                                if (onCreated) onCreated(created as Restaurant);
                            } catch (e) {
                                console.error('onCreated handler failed', e);
                            }
                            console.debug(
                                '[RestaurantDetailDialog] created for solo-vote',
                                created
                            );
                        }
                    } catch (e) {
                        console.error(
                            'create imported restaurant for solo-vote failed',
                            e
                        );
                        window.alert(
                            '투표를 위해 식당을 서버에 등록하는 중 오류가 발생했습니다.'
                        );
                        return;
                    }
                } else {
                    // Not a kakao-like item and probe failed: abort
                    window.alert('이 식당에 대한 서버 조회에 실패했습니다.');
                    return;
                }
            }
        }

        // If no id yet (e.g. initial case), create it if needed
        if (!id || Number(id) <= 0) {
            if (!isLogin) {
                // Shouldn't happen because we checked isLogin earlier, but guard just in case
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

            try {
                const createPayload = {
                    name: restaurant?.name ?? '',
                    jibunAddress: (restaurant as any)?.jibunAddress ?? '',
                    roadAddress: (restaurant as any)?.roadAddress ?? '',
                    phone: (restaurant as any)?.phone ?? undefined,
                    latitude:
                        (restaurant as any)?.latitude ??
                        (restaurant as any)?.lat ??
                        0,
                    longitude:
                        (restaurant as any)?.longitude ??
                        (restaurant as any)?.lng ??
                        0,
                };

                const looksLikeKakao = Boolean(
                    (restaurant as any)?.placeUrl ||
                        (restaurant as any)?.placeId
                );

                let created: any = null;
                if (shouldCreateAsImported(effectiveIsLocal, looksLikeKakao)) {
                    created = await createRestaurantWithOpts(createPayload, {
                        asImported: true,
                    });
                } else {
                    created = await createRestaurant(createPayload);
                }

                if (created && created.id) {
                    id = created.id;
                    // store selected so other flows see it
                    const payload = buildSelectedPayload(
                        Object.assign({}, created, {
                            placeUrl:
                                (created as any)?.placeUrl ||
                                (restaurant as any)?.placeUrl,
                        })
                    );
                    storeSelected(payload);
                    try {
                        if (onCreated) onCreated(created as Restaurant);
                    } catch (e) {
                        console.error('onCreated handler failed', e);
                    }
                    console.debug(
                        '[RestaurantDetailDialog] created (no-id case) ',
                        created
                    );
                }
            } catch (e) {
                console.error(
                    'create imported restaurant for solo-vote failed',
                    e
                );
                window.alert(
                    '투표를 위해 식당을 서버에 등록하는 중 오류가 발생했습니다.'
                );
                return;
            }
        }

        // optimistic UI update
        if (prev === vote) {
            if (vote === 'yes') setSoloYes((s) => Math.max(0, s - 1));
            else setSoloNo((s) => Math.max(0, s - 1));
            setUserSoloVote(null);
            setLocalVote(null);
            // call DELETE to remove vote on server
            (async () => {
                try {
                    await deleteSoloVote(id);
                } catch (e) {
                    // rollback: fetch summary
                    try {
                        const summary = await fetchSoloVoteSummary(id);
                        setSoloYes(summary.yesCount ?? 0);
                        setSoloNo(summary.noCount ?? 0);
                        setUserSoloVote(
                            summary.myChoice === null
                                ? null
                                : summary.myChoice
                                ? 'yes'
                                : 'no'
                        );
                    } catch (e2) {}
                }
            })();
            return;
        }

        // new vote or change
        if (vote === 'yes') setSoloYes((s) => s + 1);
        else setSoloNo((s) => s + 1);
        if (prev === 'yes') setSoloYes((s) => Math.max(0, s - 1));
        if (prev === 'no') setSoloNo((s) => Math.max(0, s - 1));
        setUserSoloVote(vote);
        setLocalVote(vote);

        (async () => {
            try {
                let resp = await postSoloVote(id, vote === 'yes');

                // Defensive fallback: if server returned a "no record" summary
                // (myChoice === null) for a Kakao-like item, attempt to create
                // the restaurant on the server as an imported entry and retry
                // the vote once. This handles cases where the probe/create
                // step earlier didn't persist the kakao item for any reason.
                if (
                    (resp.myChoice === null || resp.myChoice === undefined) &&
                    looksLikeKakao
                ) {
                    try {
                        const createPayload = {
                            name: restaurant?.name ?? '',
                            jibunAddress:
                                (restaurant as any)?.jibunAddress ?? '',
                            roadAddress: (restaurant as any)?.roadAddress ?? '',
                            phone: (restaurant as any)?.phone ?? undefined,
                            latitude:
                                (restaurant as any)?.latitude ??
                                (restaurant as any)?.lat ??
                                0,
                            longitude:
                                (restaurant as any)?.longitude ??
                                (restaurant as any)?.lng ??
                                0,
                        };
                        const created = await createRestaurantWithOpts(
                            createPayload,
                            {
                                asImported: true,
                            }
                        );
                        console.debug(
                            '[RestaurantDetailDialog] fallback created for solo-vote',
                            created
                        );
                        if (created && created.id) {
                            id = created.id;
                            // Retry the vote once with the newly created id
                            resp = await postSoloVote(id, vote === 'yes');
                        }
                    } catch (e) {
                        console.error(
                            'fallback create for solo-vote failed',
                            e
                        );
                    }
                }

                setSoloYes(resp.yesCount ?? 0);
                setSoloNo(resp.noCount ?? 0);
                setUserSoloVote(
                    resp.myChoice === null ? null : resp.myChoice ? 'yes' : 'no'
                );
                try {
                    const key = `solo_vote_${id}`;
                    if (resp.myChoice === null) localStorage.removeItem(key);
                    else
                        localStorage.setItem(key, resp.myChoice ? 'yes' : 'no');
                } catch (e) {}
            } catch (e) {
                // rollback by fetching summary
                try {
                    const summary = await fetchSoloVoteSummary(id);
                    setSoloYes(summary.yesCount ?? 0);
                    setSoloNo(summary.noCount ?? 0);
                    setUserSoloVote(
                        summary.myChoice === null
                            ? null
                            : summary.myChoice
                            ? 'yes'
                            : 'no'
                    );
                } catch (e2) {}
            }
        })();
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
                    } catch (e) {}
                }
            }
        }
    } catch (e) {}
    const buildSelectedPayload = (r: any) => {
        return {
            id: r?.id,
            name: r?.name,
            roadAddress: r?.roadAddress,
            jibunAddress: r?.jibunAddress,
            image: r?.image,
            phone: r?.phone,
            averageRating: r?.averageRating,
            reviewCount: r?.reviewCount,
            latitude: r?.latitude,
            longitude: r?.longitude,
            placeUrl: r?.placeUrl,
        };
    };

    const storeSelected = (payload: any) => {
        try {
            console.debug(
                '[RestaurantDetailDialog] storing selectedRestaurant id=',
                payload?.id
            );
            sessionStorage.setItem(
                'selectedRestaurant',
                JSON.stringify(payload)
            );
        } catch (e) {
            console.error('store selectedRestaurant', e);
        }
    };

    const shouldCreateAsImported = (
        effectiveLocalFlag: boolean,
        kakaoLike: boolean
    ) => {
        return effectiveLocalFlag ? kakaoLike : true;
    };

    const handleOpenReviews = async () => {
        try {
            const id = (restaurant as any)?.id;
            if (id && Number(id) > 0) {
                const payload = buildSelectedPayload(restaurant);
                storeSelected(payload);
                router.push(`/restaurants/${id}/reviews`);
                onOpenChange(false);
                return;
            }

            const createPayload = {
                name: restaurant.name ?? '',
                jibunAddress: (restaurant as any)?.jibunAddress ?? '',
                roadAddress: (restaurant as any)?.roadAddress ?? '',
                phone: (restaurant as any)?.phone ?? undefined,
                latitude:
                    (restaurant as any)?.latitude ??
                    (restaurant as any)?.lat ??
                    0,
                longitude:
                    (restaurant as any)?.longitude ??
                    (restaurant as any)?.lng ??
                    0,
            };

            const looksLikeKakao = Boolean(
                (restaurant as any)?.placeUrl || (restaurant as any)?.placeId
            );

            if (!isLogin) {
                const payload = buildSelectedPayload(
                    Object.assign({}, createPayload, {
                        placeUrl: (restaurant as any)?.placeUrl,
                    })
                );
                storeSelected(payload);

                router.push(`/restaurants/preview/reviews`);
                onOpenChange(false);
                return;
            }
            let created: any;
            if (shouldCreateAsImported(effectiveIsLocal, looksLikeKakao)) {
                created = await createRestaurantWithOpts(createPayload, {
                    asImported: true,
                });
            } else {
                created = await createRestaurant(createPayload);
            }

            const payload = buildSelectedPayload(
                Object.assign({}, created, {
                    placeUrl:
                        (created as any)?.placeUrl ||
                        (restaurant as any)?.placeUrl,
                })
            );
            storeSelected(payload);
            router.push(`/restaurants/${created.id}/reviews`);
            onOpenChange(false);
        } catch (e: any) {
            console.error('review nav/create', e);
            const msg =
                e && e.message
                    ? String(e.message)
                    : '리뷰 페이지로 이동할 수 없습니다.';
            window.alert(`리뷰 등록 중 오류: ${msg}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{restaurant?.name}</DialogTitle>
                </DialogHeader>

                <RestaurantDetailDialogContent
                    restaurant={restaurant as Restaurant}
                    soloYes={soloYes}
                    soloNo={soloNo}
                    userSoloVote={userSoloVote}
                    handleSoloVote={handleSoloVote}
                />

                <DialogFooter>
                    <RestaurantDetailActions
                        restaurant={restaurant as Restaurant}
                        placeUrl={placeUrl}
                        effectiveIsLocal={effectiveIsLocal}
                        isOwner={isOwner}
                        isLogin={isLogin}
                        loading={loading}
                        onOpenChange={onOpenChange}
                        onEditLocal={onEditLocal}
                        handleDelete={handleDelete}
                        handleOpenReviews={handleOpenReviews}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
