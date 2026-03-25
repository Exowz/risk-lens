import { create } from "zustand";

export type IslandNotificationType = "montecarlo" | "stress" | "report" | "allocation";

export interface IslandNotification {
  type: IslandNotificationType;
  title: string;
  subtitle: string;
  positive: boolean;
}

interface NotificationIslandStore {
  notification: IslandNotification | null;
  show: (notification: IslandNotification) => void;
  dismiss: () => void;
}

export const useNotificationIsland = create<NotificationIslandStore>(
  (set) => ({
    notification: null,
    show: (notification) => set({ notification }),
    dismiss: () => set({ notification: null }),
  }),
);
