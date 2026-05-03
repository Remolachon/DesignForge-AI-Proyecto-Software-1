"use client";

import React, { useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate, useAnimationFrame } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export const InfiniteGrid = ({ children, className }: { children?: React.ReactNode, className?: string }) => {
    const gridSize = 40;
    const containerRef = useRef<HTMLDivElement>(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    };

    const gridOffsetX = useMotionValue(0);
    const gridOffsetY = useMotionValue(0);

    const speedX = 0.15;
    const speedY = 0.15;

    useAnimationFrame(() => {
        const currentX = gridOffsetX.get();
        const currentY = gridOffsetY.get();
        gridOffsetX.set((currentX + speedX) % gridSize);
        gridOffsetY.set((currentY + speedY) % gridSize);
    });

    const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

    return (
        <section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className={cn(
                "relative w-full overflow-hidden bg-background/50",
                className
            )}
        >
            {/* Layer 1: Subtle background grid (always visible) */}
            <div className="absolute inset-0 z-0 opacity-[0.05]">
                <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} />
            </div>

            {/* Layer 2: Highlighted grid (revealed by mouse mask) */}
            <motion.div
                className="absolute inset-0 z-0 opacity-40"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            >
                <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} />
            </motion.div>

            {/* Decorative Blur Spheres */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute right-[0%] top-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 dark:bg-orange-600/10 blur-[100px]" />
                <div className="absolute right-[20%] top-[10%] w-[20%] h-[20%] rounded-full bg-primary/10 blur-[80px]" />
                <div className="absolute left-[-5%] bottom-[-10%] w-[35%] h-[35%] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[100px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                {children}
            </div>
        </section>
    );
};

const GridPattern = ({ offsetX, offsetY, size }: { offsetX: any; offsetY: any; size: number }) => {
    return (
        <svg className="w-full h-full absolute inset-0">
            <defs>
                <motion.pattern
                    id="grid-pattern"
                    width={size}
                    height={size}
                    patternUnits="userSpaceOnUse"
                    x={offsetX}
                    y={offsetY}
                >
                    <path
                        d={`M ${size} 0 L 0 0 0 ${size}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-muted-foreground"
                    />
                </motion.pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
    );
};
