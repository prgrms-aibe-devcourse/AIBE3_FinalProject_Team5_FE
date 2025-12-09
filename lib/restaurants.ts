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
    image?: string;
    ownerId?: number | null;
    isLocal?: boolean;
    distanceKm?: number;
};

export type RestaurantListResponse = Restaurant[];

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(
    /\/$/,
    ''
);

function normalizeImageUrl(img: any) {
    try {
        if (!img || typeof img !== 'string') return img;
        if (/^https?:\/\//i.test(img)) return img;
        if (img.startsWith('/')) {
            if (API_BASE && API_BASE.startsWith('http')) {
                return API_BASE.replace(/\/$/, '') + img;
            }
            if (typeof window !== 'undefined' && window.location) {
                return window.location.origin.replace(/\/$/, '') + img;
            }
        }
        return img;
    } catch (e) {
        return img;
    }
}

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
    const body = await res.json();
    const data = (body && body.data) || [];
    if (Array.isArray(data)) {
        data.forEach((it: any) => {
            if (it && typeof it === 'object')
                it.image = normalizeImageUrl(it.image);
        });
    }
    return data;
}

export async function updateRestaurant(
    id: number | string,
    payload: {
        name?: string;
        jibunAddress?: string;
        roadAddress?: string;
        phone?: string;
        latitude?: number;
        longitude?: number;
    }
): Promise<Restaurant> {
    const rid = String(id);
    const url = `${API_BASE}/api/v1/restaurants/${rid}`.replace(/\/$/, '');
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants/${rid}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        }
    );
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || '수정 실패');
    }
    const body = await res.json();
    const data = (body && body.data) || body;
    if (data && typeof data === 'object')
        (data as any).image = normalizeImageUrl((data as any).image);
    return data;
}

export async function createRestaurant(payload: {
    name: string;
    jibunAddress?: string;
    roadAddress?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
}): Promise<Restaurant> {
    const url = `${API_BASE}/api/v1/restaurants`.replace(/\/$/, '');
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        }
    );
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || '생성 실패');
    }
    const body = await res.json();
    const data = (body && body.data) || body;
    if (data && typeof data === 'object')
        (data as any).image = normalizeImageUrl((data as any).image);
    return data;
}

export async function createRestaurantWithOpts(
    payload: {
        name: string;
        jibunAddress?: string;
        roadAddress?: string;
        phone?: string;
        latitude?: number;
        longitude?: number;
    },
    opts?: { asImported?: boolean }
): Promise<Restaurant> {
    const qs = opts && opts.asImported ? '?asImported=true' : '';
    const url = `${API_BASE}/api/v1/restaurants${qs}`.replace(/\/$/, '');
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants${qs}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        }
    );
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || '생성 실패');
    }
    const body = await res.json();
    const data = (body && body.data) || body;
    if (data && typeof data === 'object')
        (data as any).image = normalizeImageUrl((data as any).image);
    return data;
}
export async function fetchNearbyRestaurants(params: {
    lat: number;
    lng: number;
    page?: number;
    size?: number;
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
    const body = await res.json();
    const data = (body && body.data) || [];
    if (Array.isArray(data)) {
        data.forEach((it: any) => {
            if (it && typeof it === 'object')
                it.image = normalizeImageUrl(it.image);
        });
    }
    return data;
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
    const body = await res.json();
    const data = (body && body.data) || body;
    if (data && typeof data === 'object')
        (data as any).image = normalizeImageUrl((data as any).image);
    return data;
}

export async function fetchSoloVoteSummary(
    restaurantId: number | string
): Promise<{ yesCount: number; noCount: number; myChoice: boolean | null }> {
    const rid = String(restaurantId);
    const url = `${API_BASE}/api/v1/restaurants/${rid}/solo-vote`.replace(
        /\/$/,
        ''
    );
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants/${rid}/solo-vote`,
        {
            cache: 'no-store',
            credentials: 'include',
        }
    );
    if (!res.ok) {
        if (res.status === 400 || res.status === 404) {
            try {
                await res.text().catch(() => '');
            } catch (e) {}
            return { yesCount: 0, noCount: 0, myChoice: null };
        }
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to fetch solo vote');
    }
    const body = await res.json();
    const data = (body && body.data) || {};
    return {
        yesCount: data.yesCount || 0,
        noCount: data.noCount || 0,
        myChoice:
            data.myChoice === null || data.myChoice === undefined
                ? null
                : Boolean(data.myChoice),
    };
}

export async function postSoloVote(
    restaurantId: number | string,
    willEatAlone: boolean
): Promise<{ yesCount: number; noCount: number; myChoice: boolean | null }> {
    const rid = String(restaurantId);
    const url = `${API_BASE}/api/v1/restaurants/${rid}/solo-vote`;
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants/${rid}/solo-vote`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ willEatAlone }),
        }
    );
    if (!res.ok) {
        if (res.status === 400 || res.status === 404) {
            try {
                await res.text().catch(() => '');
            } catch (e) {}
            return { yesCount: 0, noCount: 0, myChoice: null };
        }
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to post solo vote');
    }
    const body = await res.json();
    const data = (body && body.data) || {};
    return {
        yesCount: data.yesCount || 0,
        noCount: data.noCount || 0,
        myChoice:
            data.myChoice === null || data.myChoice === undefined
                ? null
                : Boolean(data.myChoice),
    };
}

export async function uploadRestaurantImage(
    restaurantId: number | string,
    file: File
): Promise<Restaurant> {
    const rid = String(restaurantId);
    const form = new FormData();
    form.append('image', file);
    const url = `${API_BASE}/api/v1/restaurants/${rid}/image`;
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants/${rid}/image`,
        {
            method: 'POST',
            credentials: 'include',
            body: form,
        }
    );
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to upload image');
    }
    const resp = await res.json();
    const result = (resp && resp.data) || resp;
    try {
        if (result && typeof result === 'object')
            (result as any).image = normalizeImageUrl((result as any).image);
    } catch (e) {}
    return result as Restaurant;
}

export async function deleteSoloVote(
    restaurantId: number | string
): Promise<{ yesCount: number; noCount: number; myChoice: boolean | null }> {
    const rid = String(restaurantId);
    const url = `${API_BASE}/api/v1/restaurants/${rid}/solo-vote`;
    const res = await fetch(
        url.startsWith('http') ? url : `/api/v1/restaurants/${rid}/solo-vote`,
        {
            method: 'DELETE',
            credentials: 'include',
        }
    );
    if (!res.ok) {
        if (res.status === 400 || res.status === 404) {
            try {
                await res.text().catch(() => '');
            } catch (e) {}
            return { yesCount: 0, noCount: 0, myChoice: null };
        }
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to delete solo vote');
    }
    const body = await res.json();
    const data = (body && body.data) || {};
    return {
        yesCount: data.yesCount || 0,
        noCount: data.noCount || 0,
        myChoice:
            data.myChoice === null || data.myChoice === undefined
                ? null
                : Boolean(data.myChoice),
    };
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
