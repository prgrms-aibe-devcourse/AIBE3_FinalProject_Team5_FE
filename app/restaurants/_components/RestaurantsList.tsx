'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Restaurant } from '@/lib/restaurants';
import { distanceMeters, formatDistance } from '@/lib/geo';

type Props = {
    restaurants: Restaurant[];
    userPos?: { lat: number; lng: number } | null;
    onItemClick?: (r: Restaurant) => void;
};

export default function RestaurantsList({
    restaurants,
    userPos,
    onItemClick,
}: Props) {
    return (
        <div className="divide-y">
            {restaurants.map((r) => {
                const lat = (r as any).latitude ?? (r as any).lat ?? 0;
                const lng = (r as any).longitude ?? (r as any).lng ?? 0;
                const distMetersFromApi =
                    (r as any).distanceMeters ??
                    ((r as any).distanceKm
                        ? (r as any).distanceKm * 1000
                        : undefined);
                const distanceStr =
                    typeof distMetersFromApi === 'number'
                        ? formatDistance(distMetersFromApi)
                        : userPos
                        ? formatDistance(
                              distanceMeters(userPos.lat, userPos.lng, lat, lng)
                          )
                        : null;

                const rating = (r as any).averageRating ?? (r as any).rating;
                const reviews = (r as any).reviewCount ?? (r as any).reviews;
                const location =
                    (r as any).roadAddress ??
                    (r as any).jibunAddress ??
                    (r as any).location;

                return (
                    <div
                        key={r.id}
                        className="block hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => onItemClick && onItemClick(r)}
                    >
                        <div className="p-4">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <Image
                                        src={
                                            (r as any).image ||
                                            '/placeholder.svg'
                                        }
                                        alt={r.name}
                                        width={80}
                                        height={80}
                                        className="rounded-lg object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-semibold text-sm truncate mb-1">
                                            {r.name}
                                        </h3>
                                        {distanceStr && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {distanceStr}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 mt-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs font-medium">
                                            {rating ?? '-'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            ({reviews ?? 0})
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {location}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
