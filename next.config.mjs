console.log(
    '[next.config] NEXT_PUBLIC_KAKAO_MAP_API_KEY =',
    process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    // 클라이언트 번들로 주입할 환경 변수 명시
    env: {
        NEXT_PUBLIC_KAKAO_MAP_API_KEY:
            process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY,
    },
};

export default nextConfig;
