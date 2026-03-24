"use client";

/**
 * Magnet effect for CTA buttons — ReactBits pattern.
 *
 * Wraps a button (or any element) so it subtly follows
 * the cursor when hovered, creating a magnetic pull effect.
 *
 * Used by: Primary CTA buttons only (per SKILL.md rules)
 */

import { useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";

interface MagnetProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export function Magnet({ children, className, strength = 0.3 }: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) * strength;
    const y = (e.clientY - top - height / 2) * strength;
    setPosition({ x, y });
  };

  const handleLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
