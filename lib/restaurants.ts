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

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(
    /\/$/,
    ''
);

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
    const url = `${API_BASE}/api/v1/restaurants?${qs.toString()}`.replace(
        /^\//,
        ''
    );
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants?${qs.toString()}`,
        {
            cache: 'no-store',
        }
    );
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
    const postUrl = `${API_BASE}/api/v1/restaurants`;
    const res = await fetch(
        postUrl.startsWith('http') ? postUrl : '/api/v1/restaurants',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }
    );
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || '등록 실패');
    }
}

export async function fetchNearbyRestaurants(params: {
    lat: number;
    lng: number;
    page?: number;
    size?: number;
    radiusMeters?: number; // optional if backend supports
}): Promise<RestaurantListResponse> {
    const { lat, lng, page = 1, size = 10, radiusMeters } = params;
    const qs = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        page: String(page),
        size: String(size),
    });
    if (radiusMeters) qs.set('radius', String(radiusMeters));
    const url =
        `${API_BASE}/api/v1/restaurants/nearby?${qs.toString()}`.replace(
            /^\//,
            ''
        );
    const res = await fetch(
        url.startsWith('http')
            ? url
            : `/api/v1/restaurants/nearby?${qs.toString()}`,
        { cache: 'no-store' }
    );
    if (!res.ok) {
        throw new Error(`Failed to fetch nearby restaurants: ${res.status}`);
    }
    return res.json();
}
