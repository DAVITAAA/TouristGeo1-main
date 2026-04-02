import React, { useRef, useState, useCallback } from 'react';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    maxTilt?: number;
    glareOpacity?: number;
}

export default function TiltCard({
    children,
    className = '',
    maxTilt = 8,
    glareOpacity = 0.15,
}: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg)');
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * maxTilt * 2;
        const rotateX = (0.5 - y) * maxTilt * 2;

        setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
        setGlarePos({ x: x * 100, y: y * 100 });
    }, [maxTilt]);

    const handleMouseLeave = useCallback(() => {
        setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
        setIsHovered(false);
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    return (
        <div
            ref={cardRef}
            className={`tilt-card ${className}`}
            style={{
                transform,
                transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {children}
            {/* Glare overlay */}
            <div
                className="tilt-card-glare"
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    opacity: isHovered ? glareOpacity : 0,
                    transition: 'opacity 0.3s ease',
                    background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                    zIndex: 10,
                }}
            />
        </div>
    );
}
