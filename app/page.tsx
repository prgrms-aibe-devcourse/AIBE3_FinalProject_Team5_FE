'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/hero-section';
import { ServicesSection } from '@/components/services-section';
import { LatestPostsSection } from '@/components/latest-posts-section';
import { CtaSection } from '@/components/cta-section';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import ScrollIndicator from '@/components/scroll-indicator';
import BackgroundSlideshow from '@/components/background-slideshow';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        try {
            const stored = sessionStorage.getItem('postLoginRedirect');
            if (stored) {
                try {
                    sessionStorage.removeItem('postLoginRedirect');
                } catch (e) {}
                router.replace(stored);
                return () => {};
            }
        } catch (e) {}

        return () => {
            document.body.style.overflow = prev || '';
        };
    }, [router]);
    return (
        <div className="min-h-screen overflow-hidden relative">
            <BackgroundSlideshow images={['/bg-user.jpg']} />
            <Header />
            <main
                className="overflow-y-auto snap-y snap-mandatory scroll-smooth hide-scrollbar"
                style={{ height: 'calc(100vh - 80px)' }}
            >
                <section
                    id="hero"
                    data-scroll="hero"
                    data-scroll-title="홈"
                    className="snap-start flex items-center justify-center"
                    style={{ height: 'calc(100vh - 80px)' }}
                >
                    <HeroSection />
                </section>

                <section
                    id="services"
                    data-scroll="services"
                    data-scroll-title="서비스"
                    className="snap-start flex items-center justify-center"
                    style={{ height: 'calc(100vh - 80px)' }}
                >
                    <ServicesSection />
                </section>

                <section
                    id="latest-posts"
                    data-scroll="latest-posts"
                    data-scroll-title="최신글"
                    className="snap-start flex items-center justify-center"
                    style={{ height: 'calc(100vh - 80px)' }}
                >
                    <LatestPostsSection />
                </section>

                <section
                    id="cta"
                    data-scroll="cta"
                    data-scroll-title="가입하기"
                    className="snap-start flex flex-col items-center"
                    style={{ height: 'calc(100vh - 80px)' }}
                >
                    <div className="w-full flex items-center justify-center mt-auto mb-auto">
                        <CtaSection />
                    </div>

                    <div className="w-full mt-auto">
                        <Footer />
                    </div>
                </section>
            </main>

            <ScrollIndicator />
        </div>
    );
}
