export type Restaurant = {
    id: number;
    name: string;
    lat: number;
    lng: number;
    rank?: number;
    category?: string;
    tags?: string[];
    location?: string;
    image?: string;
    rating?: number;
    reviews?: number;
};

export type RestaurantListResponse = {
    data: Restaurant[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

export async function fetchRestaurants(params: {
    keyword?: string;
    page?: number;
    size?: number;
}): Promise<RestaurantListResponse> {
    const { keyword = '', page = 1, size = 10 } = params;
    const qs = new URLSearchParams({
        keyword,
        page: String(page),
        size: String(size),
    });
    const res = await fetch(`/api/v1/restaurants?${qs.toString()}`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch restaurants: ${res.status}`);
    }
    return res.json();
}

export async function createRestaurant(payload: {
    name: string;
    jibunAddress: string;
    roadAddress: string;
    phone: string;
    latitude: number;
    longitude: number;
}): Promise<void> {
    const res = await fetch('/api/v1/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || '등록 실패');
    }
}
