import { create } from "zustand";

interface FocusStore {
  isFocused: boolean;
  /** Sidebar state before entering focus mode */
  previousSidebarState: "pinned" | "hidden" | null;
  enter: (previousSidebarState: "pinned" | "hidden") => void;
  exit: () => void;
}

export const useFocusStore = create<FocusStore>((set) => ({
  isFocused: false,
  previousSidebarState: null,
  enter: (previousSidebarState) =>
    set({ isFocused: true, previousSidebarState }),
  exit: () => set({ isFocused: false, previousSidebarState: null }),
}));
