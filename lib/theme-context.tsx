"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "speedreader-theme";

export type Theme = "black" | "gray";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (value: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("gray");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "black" || stored === "gray") {
        setThemeState(stored);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setTheme = useCallback((value: Theme) => {
    setThemeState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        data-theme={mounted ? theme : "gray"}
        className="min-h-screen"
        style={{ display: "contents" }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: "gray" as Theme, setTheme: () => {} };
  }
  return ctx;
}
