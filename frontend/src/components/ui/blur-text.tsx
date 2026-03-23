"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface BlurTextProps {
  /** The text to render with blur-in animation */
  text: string;
  /** Additional className */
  className?: string;
  /** Delay between each word animating in (seconds) */
  delay?: number;
  /** HTML element to render as */
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function BlurText({
  text,
  className,
  delay = 0.05,
  as: Tag = "h2",
}: BlurTextProps) {
  const words = text.split(" ");

  return (
    <Tag className={cn("flex flex-wrap", className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ filter: "blur(10px)", opacity: 0, y: 5 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: i * delay,
            ease: "easeOut",
          }}
          className="mr-[0.25em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}
