"use client";

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "speedreader-theme";
const VALID_THEMES = ["black", "gray"] as const;
const DEFAULT_THEME: Theme = "black";

const THEMES = {
  black: "Black",
  gray: "Gray",
} as const;

type Theme = (typeof VALID_THEMES)[number];

function isValidTheme(value: unknown): value is Theme {
  return typeof value === "string" && VALID_THEMES.includes(value as Theme);
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function setThemeExternal(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore
  }
  emitChange();
}

function getSnapshot(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const attr = document.documentElement.getAttribute("data-theme");
  return isValidTheme(attr) ? attr : DEFAULT_THEME;
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Inline script that runs before React hydrates to set the data-theme
 * attribute, preventing FOUC and hydration mismatches.
 */
export function ThemeScript() {
  const scriptContent = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="gray"||t==="black"){document.documentElement.setAttribute("data-theme",t)}else{document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}")}}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}")}})()`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: scriptContent }}
      suppressHydrationWarning
    />
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((value: Theme) => {
    setThemeExternal(value);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: DEFAULT_THEME, setTheme: () => {} };
  }
  return ctx;
}

export { THEMES };
export type { Theme };
