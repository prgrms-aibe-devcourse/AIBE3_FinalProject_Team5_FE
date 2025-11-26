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
import { deleteRestaurant, recommendRestaurant } from '@/lib/restaurants';

type Props = {
    restaurant: Restaurant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleted: (id: number) => void;
};

export default function RestaurantDetailDialog({
    restaurant,
    open,
    onOpenChange,
    onDeleted,
}: Props) {
    const router = useRouter();
    const { loginMember, isLogin } = useAuth();
    const [loading, setLoading] = useState(false);

    // Avoid returning early before hooks are declared — keep hooks order stable.
    const ownerId =
        (restaurant as any)?.ownerId ?? (restaurant as any)?.memberId ?? null;
    const isOwner =
        isLogin && ownerId && loginMember && loginMember.id === ownerId;
    const isUserCreated = Boolean(ownerId);

    // --- Solo-dining vote state (localStorage-backed optimistic UI) ---
    // backend not defined; use restaurant fields if available or fallback to 0
    const initialYes = (restaurant as any)?.soloYesCount ?? 0;
    const initialNo = (restaurant as any)?.soloNoCount ?? 0;
    const [soloYes, setSoloYes] = useState<number>(initialYes);
    const [soloNo, setSoloNo] = useState<number>(initialNo);
    const [userSoloVote, setUserSoloVote] = useState<'yes' | 'no' | null>(null);

    // Read saved vote from localStorage on mount (client-only)
    useEffect(() => {
        try {
            if (!restaurant) return;
            const key = `solo_vote_${(restaurant as any).id}`;
            const v = localStorage.getItem(key);
            if (v === 'yes' || v === 'no') setUserSoloVote(v);
        } catch (e) {
            // ignore
        }
    }, [restaurant]);

    const setLocalVote = (vote: 'yes' | 'no' | null) => {
        try {
            const key = `solo_vote_${(restaurant as any).id}`;
            if (vote === null) localStorage.removeItem(key);
            else localStorage.setItem(key, vote);
        } catch (e) {
            // ignore
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

        // optimistic local update
        const prev = userSoloVote;
        if (prev === vote) {
            // undo
            if (vote === 'yes') setSoloYes((s) => Math.max(0, s - 1));
            else setSoloNo((s) => Math.max(0, s - 1));
            setUserSoloVote(null);
            setLocalVote(null);
            return;
        }

        // switch or new vote
        if (vote === 'yes') setSoloYes((s) => s + 1);
        else setSoloNo((s) => s + 1);
        if (prev === 'yes') setSoloYes((s) => Math.max(0, s - 1));
        if (prev === 'no') setSoloNo((s) => Math.max(0, s - 1));
        setUserSoloVote(vote);
        setLocalVote(vote);

        // TODO: call backend endpoint to persist vote when available
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

    // If restaurant is not provided, render nothing. Hooks must run before this check.
    if (!restaurant) return null;

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

                        {/* Solo-dining vote summary */}
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
                        <Button
                            className="cursor-pointer"
                            variant="outline"
                            onClick={() => {
                                // Explicit Kakao detail action: open placeUrl in new tab
                                try {
                                    const url = (restaurant as any).placeUrl;
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

                        <Button
                            className="cursor-pointer"
                            variant="outline"
                            onClick={() => {
                                // Navigate to local detail page (in-app)
                                if (restaurant && (restaurant as any).id) {
                                    router.push(
                                        `/restaurants/${(restaurant as any).id}`
                                    );
                                    onOpenChange(false);
                                }
                            }}
                        >
                            상세보기
                        </Button>

                        <Button
                            className="cursor-pointer"
                            variant="outline"
                            onClick={() => {
                                const suggested = window.prompt(
                                    '수정하고 싶은 내용을 적어주세요. (예: 전화번호, 주소, 이름 등)'
                                );
                                if (!suggested) return;
                                const subject = encodeURIComponent(
                                    `식당 정보 수정 제안: ${
                                        restaurant?.name || ''
                                    }`
                                );
                                const body = encodeURIComponent(
                                    `식당명: ${
                                        restaurant?.name || ''
                                    }\n아이디: ${
                                        (restaurant as any).id ?? ''
                                    }\n\n제안 내용:\n${suggested}`
                                );
                                window.open(
                                    `mailto:?subject=${subject}&body=${body}`
                                );
                            }}
                        >
                            정보수정제안
                        </Button>

                        <Button
                            className="cursor-pointer"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            닫기
                        </Button>

                        {/* 사용자(직접추가) 등록 항목에 대해서만 추천 버튼 노출 (로그인 필요) */}
                        {isUserCreated && isLogin && (
                            <Button
                                className="cursor-pointer"
                                onClick={handleRecommend}
                                disabled={loading}
                            >
                                관리자에게 추천
                            </Button>
                        )}

                        {/* 삭제는 소유자만 가능 */}
                        {isOwner && (
                            <Button
                                className="cursor-pointer"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                삭제
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
