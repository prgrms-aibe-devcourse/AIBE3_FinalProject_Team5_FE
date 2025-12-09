'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Home, Users, ShoppingCart, Lightbulb } from 'lucide-react';

const services = [
    {
        title: '혼라이프',
        description: '혼자 사는 일상 꿀팁과 정보를 나누는 공간',
        features: ['자유 게시판', '꿀팁 게시판', '정보 게시판'],
        icon: Home,
        href: '/onelife',
        bgColor: 'bg-[#ffffff]',
    },
    {
        title: '혼밥 식당',
        description: '우리 동네에서 혼밥하기 좋은 식당 추천',
        features: ['주변 식당', '식당 리뷰', '혼밥 여부'],
        icon: Users,
        href: '/restaurants',
        bgColor: 'bg-[#ffffff]',
    },
    {
        title: 'AI 레시피',
        description: '인공지능이 추천하는 맞춤형 요리 레시피',
        features: ['맞춤형 레시피', '요리 카테고리', '재료 추천'],
        icon: ShoppingCart,
        href: '/recipe',
        bgColor: 'bg-[#ffffff]',
    },
    {
        title: '공동구매 / 소모임',
        description: '같이 사면 더 좋은 공동구매와 소모임 정보',
        features: ['함께하는 소통', '공동구매 모집', '소모임 모집'],
        icon: Lightbulb,
        href: '/group-buying',
        bgColor: 'bg-[#ffffff]',
    },
];

export function ServicesSection() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const prefersReduced =
            typeof window !== 'undefined' &&
            (window as any).matchMedia &&
            (window as any).matchMedia('(prefers-reduced-motion: reduce)')
                .matches;

        const grid = containerRef.current;
        if (!grid) return;

        if (prefersReduced) {
            Array.from(grid.querySelectorAll('[data-anim-card]')).forEach(
                (el) => {
                    el.classList.remove('opacity-0', 'translate-y-6');
                    el.classList.add('opacity-100', 'translate-y-0');
                }
            );
            return;
        }

        const timeouts: number[] = [];
        const rootEl = document.querySelector('main') || null;

        const reveal = () => {
            const cards = Array.from(
                grid.querySelectorAll('[data-anim-card]')
            ) as HTMLElement[];
            cards.forEach((card, i) => {
                const t = window.setTimeout(() => {
                    card.classList.remove('opacity-0', 'translate-y-6');
                    card.classList.add('opacity-100', 'translate-y-0');
                }, i * 120);
                timeouts.push(t);
            });
        };

        const reset = () => {
            timeouts.forEach((id) => clearTimeout(id));
            timeouts.length = 0;
            Array.from(grid.querySelectorAll('[data-anim-card]')).forEach(
                (el) => {
                    el.classList.add('opacity-0', 'translate-y-6');
                    el.classList.remove('opacity-100', 'translate-y-0');
                }
            );
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        reveal();
                    } else {
                        reset();
                    }
                });
            },
            { root: rootEl, threshold: 0.25 }
        );

        observer.observe(grid);
        return () => {
            observer.disconnect();
            timeouts.forEach((id) => clearTimeout(id));
        };
    }, []);

    return (
        <section className="py-20 md:py-24">
            <div className="w-full max-w-[2400px] mx-auto px-6">
                <div className="text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                        OneLife 서비스
                    </h2>
                    <p className="text-lg text-muted-foreground text-pretty font-semibold">
                        혼자 살아도 함께하는 즐거움을 경험해보세요.
                    </p>
                </div>

                <div
                    ref={containerRef}
                    className="grid gap-12 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 items-stretch"
                >
                    {services.map((service) => {
                        const Icon = service.icon;
                        return (
                            <Link key={service.title} href={service.href}>
                                <Card
                                    data-anim-card
                                    className={`h-full transition-all duration-700 ease-out opacity-0 translate-y-6 hover:shadow-lg hover:scale-105 ${service.bgColor} border-0 p-12 md:p-14 min-h-[380px] flex flex-col justify-between`}
                                >
                                    <CardHeader className="flex flex-col items-center text-center">
                                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-lg mx-auto">
                                            <Icon className="h-10 w-10 md:h-12 md:w-12 text-primary2" />
                                        </div>
                                        <CardTitle className="text-xl md:text-xl lg:text-xl font-semibold md:whitespace-nowrap">
                                            {service.title}
                                        </CardTitle>
                                        <CardDescription className="text-sm leading-relaxed mt-1 text-black">
                                            {service.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3 mt-4">
                                            {service.features.map((feature) => (
                                                <li
                                                    key={feature}
                                                    className="flex items-center text-sm text-muted-foreground"
                                                >
                                                    <span className="mr-3 h-2 w-2 rounded-full bg-primary2" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
