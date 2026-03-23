"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Target number to count up to */
  to: number;
  /** Starting number (default 0) */
  from?: number;
  /** Animation duration in ms */
  duration?: number;
  /** Decimal places to display */
  decimals?: number;
  /** Prefix string (e.g. "$", "+") */
  prefix?: string;
  /** Suffix string (e.g. "%") */
  suffix?: string;
  /** Additional className */
  className?: string;
  /** Easing function */
  easing?: "easeOut" | "easeInOut" | "linear";
}

function ease(t: number, type: CountUpProps["easing"]): number {
  switch (type) {
    case "easeOut":
      return 1 - Math.pow(1 - t, 3);
    case "easeInOut":
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    default:
      return t;
  }
}

export function CountUp({
  to,
  from = 0,
  duration = 1200,
  decimals = 2,
  prefix = "",
  suffix = "",
  className,
  easing = "easeOut",
}: CountUpProps) {
  const [display, setDisplay] = useState(from);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = ease(progress, easing);
      const current = from + (to - from) * easedProgress;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [to, from, duration, easing]);

  return (
    <span className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
