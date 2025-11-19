'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Restaurant } from '@/lib/restaurants';

type Props = {
    restaurants: Restaurant[];
};

export default function RestaurantsList({ restaurants }: Props) {
    return (
        <div className="divide-y">
            {restaurants.map((restaurant) => (
                <Link
                    key={restaurant.id}
                    href={`/restaurants/${restaurant.id}`}
                    className="block hover:bg-muted/50 transition-colors"
                >
                    <div className="p-4">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <Image
                                    src={restaurant.image || '/placeholder.svg'}
                                    alt={restaurant.name}
                                    width={80}
                                    height={80}
                                    className="rounded-lg object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate mb-1">
                                    {restaurant.name}
                                </h3>
                                <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-medium">
                                        {restaurant.rating}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({restaurant.reviews})
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {restaurant.location}
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
