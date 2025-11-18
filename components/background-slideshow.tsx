'use client';

import React, { useEffect, useMemo, useState } from 'react';

type BackgroundSlideshowProps = {
    images?: string[]; // paths relative to public/
    interval?: number; // ms
    transition?: number; // ms
};

export default function BackgroundSlideshow({
    images = ['/bg-1.jpg', '/bg-2.jpg', '/bg-3.jpg'],
    interval = 6000,
    transition = 1000,
}: BackgroundSlideshowProps) {
    const [index, setIndex] = useState(0);
    const prefersReduced = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    useEffect(() => {
        if (prefersReduced) return; // don't auto-play
        const id = setInterval(() => {
            setIndex((s) => (s + 1) % images.length);
        }, interval);

        return () => clearInterval(id);
    }, [images.length, interval, prefersReduced]);

    return (
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
            {images.map((src, i) => {
                const isActive = i === index;
                // show image at 10% opacity when active so background is subtle
                return (
                    <div
                        key={src + i}
                        className="absolute inset-0 bg-center bg-cover transition-opacity"
                        style={{
                            backgroundImage: `url(${src})`,
                            opacity: isActive ? 0.4 : 0,
                            transitionDuration: `${transition}ms`,
                        }}
                    />
                );
            })}
        </div>
    );
}
