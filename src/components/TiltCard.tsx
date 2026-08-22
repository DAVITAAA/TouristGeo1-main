import React, { useRef, useCallback } from 'react';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    maxTilt?: number;
    glareOpacity?: number;
}

export default function TiltCard({
    children,
    className = '',
    maxTilt = 6,
}: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * maxTilt * 2;
        const rotateX = (0.5 - y) * maxTilt * 2;

        card.style.transition = 'none';
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
    }, [maxTilt]);

    const handleMouseLeave = useCallback(() => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0, 0, 1)';
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }, []);

    return (
        <div
            ref={cardRef}
            className={`tilt-card ${className}`}
            style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
}
