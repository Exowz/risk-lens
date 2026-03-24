import { create } from "zustand";

export type SidebarState = "pinned" | "hidden";

interface SidebarStore {
  state: SidebarState;
  isPeeking: boolean;
  setState: (state: SidebarState) => void;
  toggle: () => void;
  setPeeking: (peeking: boolean) => void;
}

const getInitialState = (): SidebarState => {
  if (typeof window === "undefined") return "pinned";
  return (localStorage.getItem("sidebar-state") as SidebarState) ?? "pinned";
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  state: getInitialState(),
  isPeeking: false,
  setState: (state) => {
    localStorage.setItem("sidebar-state", state);
    set({ state, isPeeking: false });
  },
  toggle: () =>
    set((prev) => {
      const next = prev.state === "pinned" ? "hidden" : "pinned";
      localStorage.setItem("sidebar-state", next);
      return { state: next, isPeeking: false };
    }),
  setPeeking: (isPeeking) => set({ isPeeking }),
}));
