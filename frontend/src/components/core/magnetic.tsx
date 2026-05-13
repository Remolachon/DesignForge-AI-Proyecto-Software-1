"use client";

import React, { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticProps {
  children: React.ReactElement;
  intensity?: number;
  intensityX?: number;
  intensityY?: number;
  springOptions?: any;
  actionArea?: "local" | "global";
  range?: number;
}

export function Magnetic({
  children,
  intensity = 0.5,
  intensityX,
  intensityY,
  springOptions = { type: "spring", stiffness: 150, damping: 15, mass: 0.1 },
  actionArea = "local",
  range = 200,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, springOptions);
  const springY = useSpring(y, springOptions);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const { clientX, clientY } = e;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      const distance = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2));

      if (actionArea === "global" && distance < range) {
        x.set((clientX - centerX) * (intensityX !== undefined ? intensityX : intensity));
        y.set((clientY - centerY) * (intensityY !== undefined ? intensityY : intensity));
      } else if (actionArea === "global" && distance >= range) {
        x.set(0);
        y.set(0);
      }
    };

    if (actionArea === "global") {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [actionArea, intensity, intensityX, intensityY, range, x, y]);

  const handleLocalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (actionArea !== "local" || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    x.set((clientX - centerX) * (intensityX !== undefined ? intensityX : intensity));
    y.set((clientY - centerY) * (intensityY !== undefined ? intensityY : intensity));
  };

  const handleLocalMouseLeave = () => {
    if (actionArea !== "local") return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleLocalMouseMove}
      onMouseLeave={handleLocalMouseLeave}
      style={{ x: springX, y: springY, display: "inline-block", position: "relative", zIndex: 50 }}
    >
      {children}
    </motion.div>
  );
}
