'use client';

import { Button } from '@/components/ui/button';
import type { Restaurant } from '@/lib/restaurants';

type Props = {
    restaurant: Restaurant;
    placeUrl?: string;
    effectiveIsLocal: boolean;
    isOwner: boolean;
    isLogin: boolean;
    loading: boolean;
    onOpenChange: (open: boolean) => void;
    onEditLocal?: (r: Restaurant) => void;
    handleDelete: () => Promise<void> | void;
    handleOpenReviews: () => Promise<void> | void;
};

export default function RestaurantDetailActions({
    restaurant,
    placeUrl,
    effectiveIsLocal,
    isOwner,
    isLogin,
    loading,
    onOpenChange,
    onEditLocal,
    handleDelete,
    handleOpenReviews,
}: Props) {
    return (
        <>
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
                                        if (
                                            restaurant &&
                                            typeof onEditLocal === 'function'
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
                    </>
                ) : null}

                <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={handleOpenReviews}
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
            </div>
        </>
    );
}
