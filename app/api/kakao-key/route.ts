export async function GET() {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '';
    return new Response(JSON.stringify({ appKey }), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
    });
}
