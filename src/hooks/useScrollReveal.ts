import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook that detects when an element enters the viewport.
 * Returns a ref to attach and a boolean indicating visibility.
 */
export function useScrollReveal(threshold = 0.15, rootMargin = '0px 0px -60px 0px') {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el); // Only trigger once
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    return { ref, isVisible };
}
