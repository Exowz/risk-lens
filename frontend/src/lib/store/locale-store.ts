import { create } from "zustand";

export type Locale = "fr" | "en" | "es" | "zh";

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "fr";
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith("risklens-locale="));
  const value = cookie?.split("=")[1];
  if (value && ["fr", "en", "es", "zh"].includes(value)) {
    return value as Locale;
  }
  return "fr";
};

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale) => {
    document.cookie = `risklens-locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    set({ locale });
  },
}));
