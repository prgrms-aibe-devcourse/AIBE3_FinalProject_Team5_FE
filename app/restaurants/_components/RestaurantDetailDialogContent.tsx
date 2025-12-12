'use client';

import Image from 'next/image';
import type { Restaurant } from '@/lib/restaurants';

type Props = {
    restaurant: Restaurant;
    soloYes: number;
    soloNo: number;
    userSoloVote: 'yes' | 'no' | null;
    handleSoloVote: (v: 'yes' | 'no') => void;
};

export default function RestaurantDetailDialogContent({
    restaurant,
    soloYes,
    soloNo,
    userSoloVote,
    handleSoloVote,
}: Props) {
    const rating =
        (restaurant as any).averageRating ?? (restaurant as any).rating;
    const ratingStr =
        typeof rating === 'number' && Number.isFinite(rating)
            ? (Math.round(Number(rating) * 10) / 10).toFixed(1)
            : '-';
    return (
        <>
            <div className="space-y-3">
                <div className="w-full h-40 relative rounded overflow-hidden bg-gray-100">
                    <Image
                        src={(restaurant as any).image || '/placeholder.svg'}
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
                            <strong>평점:</strong> {ratingStr}
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
                                        : Math.round((soloYes / total) * 100);
                                const noPct = total === 0 ? 0 : 100 - yesPct;
                                return (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm">
                                                <button
                                                    className={`mx-1 px-2 py-1 rounded border text-sm cursor-pointer ${
                                                        userSoloVote === 'yes'
                                                            ? 'bg-green-50 border-green-400'
                                                            : 'bg-white'
                                                    }`}
                                                    onClick={() =>
                                                        handleSoloVote('yes')
                                                    }
                                                    type="button"
                                                >
                                                    Y
                                                </button>
                                                <button
                                                    className={`mx-1 px-2 py-1 rounded border text-sm cursor-pointer ${
                                                        userSoloVote === 'no'
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
                                            투표 참여로 다른 이용자에게 도움이
                                            됩니다.
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
