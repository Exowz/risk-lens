"use client";

/**
 * Aceternity-style expandable card adapted for educational content.
 *
 * Collapsed: compact card with title + chevron.
 * Expanded: smooth layoutId animation into a centered overlay panel
 * with backdrop, escape-to-close, and outside-click-to-close.
 *
 * Based on: @aceternity/expandable-card-demo-standard
 * Depends on: motion/react, hooks/use-outside-click, lib/utils
 * Used by: components/shared/why-card.tsx
 */

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { cn } from "@/lib/utils";

interface ExpandableCardProps {
  /** Title shown in the expanded overlay header */
  title?: string;
  /** Custom collapsed header content (replaces title in collapsed view) */
  header?: React.ReactNode;
  /** Content revealed on expand */
  children: React.ReactNode;
  /** Whether the card starts expanded (opens overlay on mount) */
  defaultOpen?: boolean;
  /** Controlled open state — takes precedence over internal state */
  open?: boolean;
  /** Callback when open state changes (required for controlled mode) */
  onOpenChange?: (open: boolean) => void;
  /** Additional className for the outer wrapper */
  className?: string;
}

const CloseIcon = () => (
  <motion.svg
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.05 } }}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4 text-muted-foreground"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </motion.svg>
);

export function ExpandableCard({
  title = "Why does this matter?",
  header,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
}: ExpandableCardProps) {
  const [internalActive, setInternalActive] = useState(defaultOpen);
  const [wobble, setWobble] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const ref = useRef<HTMLDivElement>(null!);
  const id = useId();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / 80;
      const y = (e.clientY - (rect.top + rect.height / 2)) / 80;
      setWobble({ x, y });
    },
    [],
  );

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setWobble({ x: 0, y: 0 });
  }, []);

  const isControlled = controlledOpen !== undefined;
  const active = isControlled ? controlledOpen : internalActive;

  const setActive = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!isControlled) setInternalActive(value);
  };

  // Sync with prop changes (e.g. mode switch) — only for uncontrolled mode
  useEffect(() => {
    if (!isControlled) {
      setInternalActive(defaultOpen);
    }
  }, [defaultOpen, isControlled]);

  // Lock scroll when overlay is open + Escape to close
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [active]);

  useOutsideClick(ref, () => setActive(false));

  return (
    <>
      {/* ── Backdrop ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 h-full w-full bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ── Expanded overlay ── */}
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <motion.div
              layoutId={`expandable-card-${id}`}
              ref={ref}
              className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <motion.h3
                  layoutId={`expandable-title-${id}`}
                  className="text-sm font-semibold text-foreground"
                >
                  {title}
                </motion.h3>
                <motion.button
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  onClick={() => setActive(false)}
                  className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-muted"
                >
                  <CloseIcon />
                </motion.button>
              </div>

              {/* Content */}
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-h-[60vh] overflow-auto px-6 py-5 text-sm leading-relaxed text-muted-foreground [scrollbar-width:none] [-ms-overflow-style:none]"
              >
                {children}
              </motion.div>

              {/* Gradient accent at bottom */}
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* ── Collapsed card (inline) ── */}
      <motion.div
        layoutId={`expandable-card-${id}`}
        onClick={() => setActive(true)}
        onMouseMove={header ? handleMouseMove : undefined}
        onMouseEnter={header ? handleMouseEnter : undefined}
        onMouseLeave={header ? handleMouseLeave : undefined}
        style={
          header
            ? {
                transform: isHovering
                  ? `translate3d(${wobble.x}px, ${wobble.y}px, 0) scale3d(1.015, 1.015, 1)`
                  : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
                transition: "transform 0.15s ease-out, border-color 0.15s ease-out, box-shadow 0.15s ease-out",
                borderColor: isHovering ? "rgba(255,255,255,0.16)" : undefined,
                boxShadow: isHovering ? "0 0 20px rgba(255,255,255,0.03)" : undefined,
              }
            : undefined
        }
        className={cn(
          "cursor-pointer rounded-xl border border-border bg-card overflow-hidden transition-colors hover:bg-muted/30",
          !header && "border-dashed",
          className,
        )}
      >
        {header ? (
          <div className="px-6 py-4">
            {header}
          </div>
        ) : (
          <div className="flex items-center justify-between px-6 py-4">
            <motion.h3
              layoutId={`expandable-title-${id}`}
              className="text-sm font-medium text-muted-foreground"
            >
              {title}
            </motion.h3>
          </div>
        )}
      </motion.div>
    </>
  );
}
