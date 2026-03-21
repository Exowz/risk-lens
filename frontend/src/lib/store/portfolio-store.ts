/**
 * Zustand store for active portfolio UI state.
 *
 * Stores which portfolio is currently selected in the dashboard.
 * Server data (portfolio details) lives in TanStack Query cache -- not here.
 *
 * Depends on: zustand
 * Used by: dashboard layout, portfolio page, risk/markowitz/stress pages
 */

import { create } from "zustand";

interface PortfolioStore {
  activePortfolioId: string | null;
  setActivePortfolio: (id: string | null) => void;
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  activePortfolioId: null,
  setActivePortfolio: (id) => set({ activePortfolioId: id }),
}));
