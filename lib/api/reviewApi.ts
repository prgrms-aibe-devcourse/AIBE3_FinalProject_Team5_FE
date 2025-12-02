const API_BASE =
    (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(
        /\/$/,
        ''
    ) + '/api/v1';

interface RsData<T> {
    resultCode: string;
    msg: string;
    data: T;
}

export type Review = {
    id: number;
    restaurantId: number;
    memberId?: number | null;
    memberNickname?: string | null;
    rating: number;
    content?: string;
    createdAt?: string;
    updatedAt?: string;
};

async function handleRes<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        try {
            const parsed = txt ? JSON.parse(txt) : null;
            if (parsed && typeof parsed.msg === 'string') {
                const err: any = new Error(parsed.msg || `HTTP ${res.status}`);
                err.rsData = parsed;
                err.status = res.status;
                throw err;
            }
        } catch (e) {}
        const err: any = new Error(txt || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    const body = await res.json().catch(() => null);
    if (body && body.data !== undefined) return body.data as T;
    return body as T;
}

export async function fetchReviews(restaurantId: number): Promise<Review[]> {
    const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/reviews`, {
        credentials: 'include',
        cache: 'no-store',
    });
    return handleRes<Review[]>(res);
}

export async function createReview(
    restaurantId: number,
    payload: { rating: number; content?: string }
): Promise<Review> {
    const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleRes<Review>(res);
}

export async function updateReview(
    id: number,
    payload: { rating: number; content?: string }
): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleRes<Review>(res);
}

export async function deleteReview(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await handleRes<void>(res);
}

export default {};
