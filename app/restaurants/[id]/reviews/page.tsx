'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    fetchReviews,
    createReview,
    deleteReview,
    Review,
} from '@/lib/api/reviewApi';
import {
    fetchRestaurantById,
    createRestaurant,
    createRestaurantWithOpts,
    Restaurant,
} from '@/lib/restaurants';
import Image from 'next/image';
import { useAuth } from '@/app/global/auth/useAuth';

export default function ReviewsPage() {
    const params = useParams();
    const id = Number(params?.id ?? NaN);
    const router = useRouter();
    const { isLogin, loginMember } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [restaurantInfo, setRestaurantInfo] = useState<Restaurant | null>(
        null
    );
    const [loadingRestaurant, setLoadingRestaurant] = useState(false);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');

    useEffect(() => {
        async function init() {
            try {
                setLoadingRestaurant(true);
                const raw = sessionStorage.getItem('selectedRestaurant');
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        const parsedId = Number(
                            parsed && parsed.id ? parsed.id : NaN
                        );

                        if (
                            Number.isFinite(parsedId) &&
                            Number.isFinite(id) &&
                            parsedId === id
                        ) {
                            setRestaurantInfo(parsed as Restaurant);
                        } else if (!Number.isFinite(id) || Number.isNaN(id)) {
                            setRestaurantInfo(parsed as Restaurant);
                        } else {
                            try {
                                const fetched = await fetchRestaurantById(id);
                                setRestaurantInfo(fetched);
                            } catch (e) {
                                console.error(
                                    'fetchRestaurantById (mismatch fallback) failed',
                                    e
                                );

                                setRestaurantInfo(parsed as Restaurant);
                            }
                        }
                    } catch (e) {
                        console.error('parse selectedRestaurant', e);

                        try {
                            const fetched = await fetchRestaurantById(id);
                            setRestaurantInfo(fetched);
                        } catch (ef) {
                            console.error(
                                'fetchRestaurantById fallback failed',
                                ef
                            );
                        }
                    }
                } else {
                    try {
                        const fetched = await fetchRestaurantById(id);
                        setRestaurantInfo(fetched);
                    } catch (e) {
                        console.error('fetchRestaurantById fallback failed', e);
                    }
                }
            } catch (e) {
                console.error('init restaurant info failed', e);
            } finally {
                setLoadingRestaurant(false);
            }

            await load();
        }
        init();
    }, [id]);

    async function load() {
        if (!Number.isFinite(id) || Number.isNaN(id)) {
            console.warn(
                'invalid restaurant id in route, skipping fetchReviews:',
                id
            );
            setReviews([]);
            return;
        }
        try {
            setLoading(true);
            const res = await fetchReviews(id);
            setReviews(res || []);
        } catch (e) {
            console.error('fetch reviews failed', e);
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isLogin) {
            if (
                confirm(
                    '리뷰 작성은 로그인 후 가능합니다. 로그인 페이지로 이동할까요?'
                )
            ) {
                router.push('/login');
            }
            return;
        }

        const useId =
            Number.isFinite(id) && !Number.isNaN(id)
                ? id
                : Number(restaurantInfo?.id ?? NaN);

        if (!Number.isFinite(useId) || Number.isNaN(useId) || useId <= 0) {
            window.alert(
                '이 식당은 서버에 등록되어 있지 않아 리뷰 작성이 불가능합니다.'
            );
            return;
        }

        if (!content || content.trim().length === 0) {
            window.alert('리뷰 내용을 입력해주세요.');
            return;
        }
        try {
            console.debug(
                '[reviews:onSubmit] routeId=',
                id,
                'restaurantInfo.id=',
                restaurantInfo?.id,
                'useId=',
                useId,
                'rating=',
                rating
            );
            setLoading(true);
            await createReview(useId, { rating, content });
            console.debug(
                '[reviews:onSubmit] createReview succeeded for useId=',
                useId
            );

            try {
                const refreshed = await fetchRestaurantById(useId);
                setRestaurantInfo(refreshed as Restaurant);
                try {
                    const payload = {
                        id: refreshed.id,
                        name: refreshed.name,
                        roadAddress: refreshed.roadAddress,
                        jibunAddress: refreshed.jibunAddress,
                        image: refreshed.image,
                        phone: refreshed.phone,
                        averageRating: refreshed.averageRating,
                        reviewCount: refreshed.reviewCount,
                        latitude: refreshed.latitude,
                        longitude: refreshed.longitude,
                        placeUrl:
                            (refreshed as any).placeUrl ||
                            (restaurantInfo as any)?.placeUrl,
                    };
                    sessionStorage.setItem(
                        'selectedRestaurant',
                        JSON.stringify(payload)
                    );
                } catch (e) {
                    console.error(
                        'store selectedRestaurant after review create',
                        e
                    );
                }
            } catch (e) {
                console.error(
                    'refresh restaurant after review create failed',
                    e
                );
            }
            setContent('');
            setRating(5);
            await load();

            try {
                const key = 'myReviewedRestaurants';
                const raw = sessionStorage.getItem(key) || '[]';
                const arr = JSON.parse(raw);
                const next = Array.isArray(arr) ? arr.slice() : [];
                const rid = Number(useId);
                if (!next.includes(rid)) {
                    next.push(rid);
                    sessionStorage.setItem(key, JSON.stringify(next));
                }
            } catch (e) {
                console.error('store myReviewedRestaurants failed', e);
            }
            try {
                router.replace(`/restaurants/${useId}/reviews`);
            } catch (e) {}
        } catch (err) {
            console.error('create review failed', err);

            try {
                const maybe = err as any;
                const serverMsg =
                    maybe && maybe.rsData && maybe.rsData.msg
                        ? maybe.rsData.msg
                        : err instanceof Error
                        ? err.message
                        : String(err);
                const resultCode =
                    maybe && maybe.rsData && maybe.rsData.resultCode
                        ? maybe.rsData.resultCode
                        : null;
                const notFoundLike =
                    resultCode === '404-001' ||
                    /존재하지|404|Not Found/i.test(serverMsg);
                if (notFoundLike && restaurantInfo) {
                    try {
                        const payload = {
                            name: restaurantInfo.name ?? '',
                            jibunAddress: restaurantInfo.jibunAddress ?? '',
                            roadAddress: restaurantInfo.roadAddress ?? '',
                            phone: restaurantInfo.phone ?? '',
                            latitude:
                                (restaurantInfo as any).latitude ??
                                (restaurantInfo as any).lat ??
                                NaN,
                            longitude:
                                (restaurantInfo as any).longitude ??
                                (restaurantInfo as any).lng ??
                                NaN,
                        };
                        if (
                            !Number.isFinite(payload.latitude) ||
                            !Number.isFinite(payload.longitude)
                        ) {
                            throw new Error(
                                '레스토랑 좌표 정보가 충분하지 않습니다.'
                            );
                        }
                        const created = await createRestaurantWithOpts(
                            payload as any,
                            { asImported: true }
                        );
                        try {
                            const key = 'kakaoImportedRestaurants';
                            const stored = JSON.parse(
                                sessionStorage.getItem(key) || '[]'
                            );
                            if (Array.isArray(stored)) {
                                stored.push(Number((created as any).id));
                                sessionStorage.setItem(
                                    key,
                                    JSON.stringify(stored)
                                );
                            } else {
                                sessionStorage.setItem(
                                    key,
                                    JSON.stringify([
                                        Number((created as any).id),
                                    ])
                                );
                            }
                        } catch (e) {
                            console.error('store kakaoImportedRestaurants', e);
                        }
                        if (created && (created as any).id) {
                            const createdId = Number((created as any).id);
                            console.debug(
                                '[reviews:onSubmit] recovery created restaurant id=',
                                createdId
                            );
                            await createReview(createdId, {
                                rating,
                                content,
                            });

                            try {
                                setRestaurantInfo(created as any);
                                const payload = {
                                    id: created.id,
                                    name: created.name,
                                    roadAddress: created.roadAddress,
                                    jibunAddress: created.jibunAddress,
                                    image: created.image,
                                    phone: created.phone,
                                    averageRating: created.averageRating,
                                    reviewCount: created.reviewCount,
                                    latitude: created.latitude,
                                    longitude: created.longitude,
                                    placeUrl:
                                        (created as any).placeUrl ||
                                        (restaurantInfo as any).placeUrl,
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

                            try {
                                const fresh = await fetchReviews(createdId);
                                setReviews(fresh || []);
                            } catch (e) {
                                console.error(
                                    'fetch reviews after recovery failed',
                                    e
                                );
                            }

                            try {
                                const key = 'myReviewedRestaurants';
                                const raw = sessionStorage.getItem(key) || '[]';
                                const arr = JSON.parse(raw);
                                const next = Array.isArray(arr)
                                    ? arr.slice()
                                    : [];
                                if (!next.includes(createdId)) {
                                    next.push(createdId);
                                    sessionStorage.setItem(
                                        key,
                                        JSON.stringify(next)
                                    );
                                }
                            } catch (e) {
                                console.error(
                                    'store myReviewedRestaurants (recovery) failed',
                                    e
                                );
                            }

                            setContent('');
                            setRating(5);
                            try {
                                router.replace(
                                    `/restaurants/${createdId}/reviews`
                                );
                            } catch (e) {}
                            return;
                        }
                    } catch (e2) {
                        console.error('recovery createRestaurant failed', e2);
                    }
                }
            } catch (e) {
                console.error('create review recovery check failed', e);
            }

            try {
                const maybe = err as any;
                const serverMsg =
                    maybe && maybe.rsData && maybe.rsData.msg
                        ? maybe.rsData.msg
                        : maybe?.message;
                if (serverMsg) window.alert(`리뷰 등록 중 오류: ${serverMsg}`);
                else window.alert('리뷰 등록 중 오류가 발생했습니다.');
            } catch (e) {
                window.alert('리뷰 등록 중 오류가 발생했습니다.');
            }
        } finally {
            setLoading(false);
        }
    }

    async function onDelete(rid: number) {
        if (!confirm('리뷰를 삭제하시겠습니까?')) return;
        try {
            await deleteReview(rid);
            await load();
        } catch (e) {
            console.error('delete review failed', e);
            window.alert('삭제 중 오류가 발생했습니다.');
        }
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">리뷰</h2>
                <button
                    onClick={() => router.push('/restaurants')}
                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                    식당 지도 돌아가기
                </button>
            </div>

            {restaurantInfo && (
                <div className="mb-6 flex items-center gap-4">
                    <div className="w-24 h-24 relative rounded overflow-hidden bg-gray-100">
                        <Image
                            src={restaurantInfo.image || '/placeholder.svg'}
                            alt={restaurantInfo.name || '식당'}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                    <div>
                        <div className="text-lg font-bold">
                            {restaurantInfo.name}
                        </div>
                        <div className="text-sm">
                            {restaurantInfo.roadAddress ||
                                restaurantInfo.jibunAddress}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            평점:{' '}
                            {typeof restaurantInfo.averageRating === 'number' &&
                            Number.isFinite(restaurantInfo.averageRating)
                                ? (
                                      Math.round(
                                          Number(restaurantInfo.averageRating) *
                                              10
                                      ) / 10
                                  ).toFixed(1)
                                : '-'}{' '}
                            ({restaurantInfo.reviewCount ?? 0})
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <form onSubmit={onSubmit} className="space-y-2">
                    <div>
                        <label className="block text-sm">평점</label>
                        <select
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="mt-1 cursor-pointer"
                        >
                            {[5, 4, 3, 2, 1].map((v) => (
                                <option key={v} value={v}>
                                    {v}점
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm">내용</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="w-full border rounded px-2 py-1"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="px-3 py-2 bg-primary text-white rounded cursor-pointer"
                            disabled={loading}
                        >
                            작성
                        </button>
                    </div>
                </form>
            </div>

            <div>
                {loading && <div>로딩중...</div>}
                {!loading && reviews.length === 0 && (
                    <div className="text-muted-foreground">
                        등록된 리뷰가 없습니다.
                    </div>
                )}
                <ul className="space-y-4">
                    {reviews.map((r) => (
                        <li key={r.id} className="p-3 border rounded">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium">
                                        {r.memberNickname ?? '익명'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(
                                            r.createdAt || ''
                                        ).toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-sm font-bold">
                                    {r.rating}점
                                </div>
                            </div>
                            <div className="mt-2 text-sm">{r.content}</div>
                            <div className="mt-2 text-right">
                                {loginMember &&
                                r.memberId &&
                                Number(loginMember.id) ===
                                    Number(r.memberId) ? (
                                    <button
                                        onClick={() => onDelete(r.id)}
                                        className="text-sm text-red-600 cursor-pointer"
                                    >
                                        삭제
                                    </button>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
