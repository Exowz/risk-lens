"use client";

/**
 * Expert / Beginner mode context with localStorage persistence.
 *
 * Provides useMode() hook to all dashboard components.
 * Persists choice in localStorage so it survives sessions.
 *
 * Depends on: react
 * Used by: dashboard layout, risk/markowitz/stress/report pages
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Mode = "expert" | "beginner";

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

const STORAGE_KEY = "risklens-mode";

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("beginner");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "expert" || stored === "beginner") {
      setModeState(stored);
    }
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  }, []);

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return ctx;
}
