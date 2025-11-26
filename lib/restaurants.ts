export type Restaurant = {
    id: number;
    name: string;
    phone?: string;
    jibunAddress?: string;
    roadAddress?: string;
    latitude: number;
    longitude: number;
    averageRating?: number;
    reviewCount?: number;
    // optional fields used by frontend
    image?: string;
    // if backend provides distance in km (as in your service), it will be present
    distanceKm?: number;
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
            credentials: 'include',
        }
    );
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(
            '[fetchRestaurants] url=',
            url,
            'status=',
            res.status,
            'body=',
            body
        );
        throw new Error(`Failed to fetch restaurants: ${res.status} ${body}`);
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
            credentials: 'include',
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
    // backend expects radius in km per your service signature
    radiusKm?: number;
}): Promise<RestaurantListResponse> {
    const { lat, lng, page = 1, size = 10, radiusKm } = params;
    const qs = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        page: String(page),
        size: String(size),
    });
    if (radiusKm !== undefined) qs.set('radiusKm', String(radiusKm));
    const url =
        `${API_BASE}/api/v1/restaurants/nearby?${qs.toString()}`.replace(
            /^\//,
            ''
        );
    const res = await fetch(
        url.startsWith('http')
            ? url
            : `/api/v1/restaurants/nearby?${qs.toString()}`,
        { cache: 'no-store', credentials: 'include' }
    );
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(
            '[fetchNearbyRestaurants] url=',
            url,
            'status=',
            res.status,
            'body=',
            body
        );
        throw new Error(
            `Failed to fetch nearby restaurants: ${res.status} ${body}`
        );
    }
    return res.json();
}

export async function deleteRestaurant(id: number): Promise<void> {
    const url = `${API_BASE}/api/v1/restaurants/${id}`.replace(/\/$/, '');
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants/${id}`,
        {
            method: 'DELETE',
            credentials: 'include',
        }
    );
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || '삭제 실패');
    }
}

export async function fetchRestaurantById(
    id: number | string
): Promise<Restaurant> {
    const rid = String(id);
    const url = `${API_BASE}/api/v1/restaurants/${rid}`.replace(/^\//, '');
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants/${rid}`,
        { cache: 'no-store', credentials: 'include' }
    );
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(
            '[fetchRestaurantById] url=',
            url,
            'status=',
            res.status,
            'body=',
            body
        );
        throw new Error(`Failed to fetch restaurant: ${res.status} ${body}`);
    }
    return res.json();
}

export async function recommendRestaurant(id: number): Promise<void> {
    const url = `${API_BASE}/api/v1/restaurants/${id}/recommend`;
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants/${id}/recommend`,
        {
            method: 'POST',
            credentials: 'include',
        }
    );
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || '추천 요청 실패');
    }
}
