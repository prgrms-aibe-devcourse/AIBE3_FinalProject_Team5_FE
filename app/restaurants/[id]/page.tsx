import Link from 'next/link';
import Image from 'next/image';
import type { Restaurant } from '@/lib/restaurants';
import { fetchRestaurantById } from '@/lib/restaurants';

type Props = {
    params: {
        id: string;
    };
};

function StarRow({ value }: { value?: number }) {
    const v = Math.round((value ?? 0) * 2) / 2;
    const stars = [0, 1, 2, 3, 4].map((i) => {
        const pos = i + 1;
        if (v >= pos) return 'full';
        if (v + 0.5 >= pos) return 'half';
        return 'empty';
    });
    return (
        <div className="flex items-center space-x-1 text-yellow-500">
            {stars.map((s, idx) => (
                <svg
                    key={idx}
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill={s === 'full' ? 'currentColor' : 'none'}
                    stroke="currentColor"
                >
                    <path d="M12 .587l3.668 7.431L24 9.748l-6 5.849L19.335 24 12 19.897 4.665 24 6 15.597 0 9.748l8.332-1.73z" />
                </svg>
            ))}
        </div>
    );
}

export default async function RestaurantPage({ params }: Props) {
    const { id } = params;
    let restaurant: Restaurant | null = null;
    try {
        restaurant = await fetchRestaurantById(id);
    } catch (err) {
        console.error('fetch restaurant error', err);
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-lg font-medium">
                        식당 정보를 불러오지 못했습니다.
                    </p>
                    <Link
                        href="/restaurants"
                        className="text-primary mt-3 inline-block"
                    >
                        목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <p>식당을 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto">
                <Link href="/restaurants" className="text-sm text-primary">
                    ← 목록으로
                </Link>

                <div className="mt-4 bg-white dark:bg-card p-6 rounded shadow">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <div className="w-full h-56 md:h-72 relative rounded overflow-hidden bg-gray-100">
                                <Image
                                    src={
                                        (restaurant as any).image ||
                                        '/placeholder.svg'
                                    }
                                    alt={restaurant.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <h1 className="text-3xl font-bold">
                                {restaurant.name}
                            </h1>
                            <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <StarRow value={restaurant.averageRating} />
                                    <div className="text-sm text-muted-foreground">
                                        {restaurant.averageRating ?? '-'} · 리뷰{' '}
                                        {restaurant.reviewCount ?? 0}
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    ID: {restaurant.id}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="font-medium">전화번호</div>
                                    <div>
                                        {(restaurant.phone && (
                                            <a
                                                href={`tel:${restaurant.phone}`}
                                                className="text-primary"
                                            >
                                                {restaurant.phone}
                                            </a>
                                        )) ||
                                            '-'}
                                    </div>
                                </div>

                                <div>
                                    <div className="font-medium">주소</div>
                                    <div>
                                        {restaurant.roadAddress ??
                                            restaurant.jibunAddress ??
                                            '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <a
                                    target="_blank"
                                    rel="noreferrer"
                                    href={`https://map.kakao.com/link/map/${restaurant.latitude},${restaurant.longitude}`}
                                    className="inline-block px-3 py-2 rounded border text-sm bg-white"
                                >
                                    카카오 지도에서 보기
                                </a>

                                <a
                                    href={`mailto:?subject=${encodeURIComponent(
                                        '식당 정보 수정 제안: ' +
                                            restaurant.name
                                    )}&body=${encodeURIComponent(
                                        '식당명: ' +
                                            restaurant.name +
                                            '\n아이디: ' +
                                            restaurant.id
                                    )}`}
                                    className="inline-block px-3 py-2 rounded border text-sm"
                                >
                                    정보수정제안 보내기
                                </a>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-lg font-semibold">
                                    영업시간
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    영업시간 정보
                                </p>
                            </div>

                            <div className="mt-4">
                                <h3 className="text-lg font-semibold">메뉴</h3>
                                <p className="text-sm text-muted-foreground">
                                    메뉴 정보
                                </p>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-lg font-semibold">리뷰</h3>
                                <div className="mt-2 text-sm text-muted-foreground">
                                    리뷰 목록
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
