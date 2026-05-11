"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

export type TiltProps = {
  children: React.ReactNode;
  rotationFactor?: number;
  isRevese?: boolean;
  className?: string;
  style?: React.CSSProperties;
  springOptions?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
};

export function Tilt({
  children,
  rotationFactor = 15,
  isRevese = false,
  className,
  style,
  springOptions = { stiffness: 300, damping: 20, mass: 0.5 },
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, springOptions);
  const mouseYSpring = useSpring(y, springOptions);

  const rotateX = useTransform(
    mouseYSpring,
    [-0.3, 0.3],
    isRevese
      ? [rotationFactor, -rotationFactor]
      : [-rotationFactor, rotationFactor]
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.3, 0.3],
    isRevese
      ? [-rotationFactor, rotationFactor]
      : [rotationFactor, -rotationFactor]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
