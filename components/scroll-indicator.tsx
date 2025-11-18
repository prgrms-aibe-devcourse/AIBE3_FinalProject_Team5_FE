'use client';

import React, { useEffect, useState } from 'react';

export default function ScrollIndicator() {
    const [sections, setSections] = useState<
        Array<{ id: string; title: string }>
    >([]);
    const [active, setActive] = useState<string | null>(null);

    const handleClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        id: string
    ) => {
        if (!id) return;
        e.preventDefault();
        const el = document.getElementById(id);
        if (!el) return;
        const reduce =
            typeof window !== 'undefined' &&
            (window as any).matchMedia &&
            (window as any).matchMedia('(prefers-reduced-motion: reduce)')
                .matches;
        try {
            el.scrollIntoView({
                behavior: reduce ? 'auto' : 'smooth',
                block: 'start',
            });
            if (history && history.replaceState) {
                history.replaceState(null, '', `#${id}`);
            }
        } catch (err) {
            el.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    };

    useEffect(() => {
        const raw = Array.from(
            document.querySelectorAll<HTMLElement>('[data-scroll]')
        )
            .map((el) => ({
                id: el.id || el.getAttribute('data-scroll') || '',
                title:
                    el.getAttribute('data-scroll-title') ||
                    el.getAttribute('data-scroll') ||
                    '',
            }))
            .filter((s) => s.id)
            .filter((s) => s.id !== 'footer' && s.title !== '푸터');

        const seen = new Set<string>();
        const els = raw.filter((s) => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
        });

        if (typeof window !== 'undefined' && (window as any).console) {
            console.debug(
                '[ScrollIndicator] discovered sections:',
                els.map((e) => e.id)
            );
        }

        setSections(els);
        if (!els.length) return;

        const rootEl = document.querySelector('main');

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.intersectionRatio > 0);
                if (visible.length === 0) return;
                visible.sort(
                    (a, b) => b.intersectionRatio - a.intersectionRatio
                );
                const top = visible[0];
                const id =
                    (top.target as HTMLElement).id ||
                    (top.target as HTMLElement).getAttribute('data-scroll');
                if (id) setActive(String(id));
            },
            {
                root: rootEl || null,
                rootMargin: '0px',
                threshold: [0, 0.25, 0.5, 0.75, 1],
            }
        );

        els.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    if (!sections.length) return null;

    return (
        <nav
            aria-label="Scroll indicator"
            className="fixed right-6 top-1/2 z-50 hidden md:flex md:flex-col md:items-center md:gap-4 md:-translate-y-1/2"
        >
            {sections.map((s) => {
                const isActive = s.id === active;
                return (
                    <a
                        key={s.id}
                        href={`#${s.id}`}
                        onClick={(e) => handleClick(e, s.id)}
                        className={`group flex items-start gap-3 transition-all no-underline ${
                            isActive ? 'text-primary' : 'text-foreground'
                        }`}
                        aria-current={isActive ? 'true' : undefined}
                        aria-label={s.title}
                        title={s.title}
                    >
                        <span
                            className={`rounded-full transition-all ${
                                isActive
                                    ? 'w-3.5 h-8 bg-primary block'
                                    : 'w-2.5 h-2.5 bg-muted/100 block group-hover:bg-primary'
                            }`}
                            aria-hidden
                        />
                    </a>
                );
            })}
        </nav>
    );
}
