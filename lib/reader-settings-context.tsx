"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { FontFamilyKey, FontSizeKey } from "@/components/speed-reader";

const STORAGE_KEY = "speedreader-reader-settings";

const DEFAULT_SENTENCE_END_MS = 500;
const DEFAULT_SPEECH_BREAK_MS = 250;

interface StoredSettings {
  fontSize: FontSizeKey;
  fontFamily: FontFamilyKey;
  sentenceEndDurationMs: number;
  speechBreakDurationMs: number;
}

const DEFAULTS: StoredSettings = {
  fontSize: "md",
  fontFamily: "serif",
  sentenceEndDurationMs: DEFAULT_SENTENCE_END_MS,
  speechBreakDurationMs: DEFAULT_SPEECH_BREAK_MS,
};

function loadStored(): StoredSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      fontSize:
        parsed.fontSize && ["sm", "md", "lg", "xl"].includes(parsed.fontSize)
          ? parsed.fontSize
          : DEFAULTS.fontSize,
      fontFamily:
        parsed.fontFamily && ["sans", "serif", "mono"].includes(parsed.fontFamily)
          ? parsed.fontFamily
          : DEFAULTS.fontFamily,
      sentenceEndDurationMs:
        typeof parsed.sentenceEndDurationMs === "number" &&
        parsed.sentenceEndDurationMs >= 0 &&
        parsed.sentenceEndDurationMs <= 1000
          ? parsed.sentenceEndDurationMs
          : DEFAULTS.sentenceEndDurationMs,
      speechBreakDurationMs:
        typeof parsed.speechBreakDurationMs === "number" &&
        parsed.speechBreakDurationMs >= 0 &&
        parsed.speechBreakDurationMs <= 1000
          ? parsed.speechBreakDurationMs
          : DEFAULTS.speechBreakDurationMs,
    };
  } catch {
    return DEFAULTS;
  }
}

function saveStored(settings: StoredSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

interface ReaderSettingsContextValue extends StoredSettings {
  setFontSize: (v: FontSizeKey) => void;
  setFontFamily: (v: FontFamilyKey) => void;
  setSentenceEndDurationMs: (v: number) => void;
  setSpeechBreakDurationMs: (v: number) => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextValue | null>(
  null,
);

export function ReaderSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(DEFAULTS);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- load from localStorage on mount */
    setSettings(loadStored());
  }, []);

  const setFontSize = useCallback((fontSize: FontSizeKey) => {
    setSettings((s) => {
      const next = { ...s, fontSize };
      saveStored(next);
      return next;
    });
  }, []);

  const setFontFamily = useCallback((fontFamily: FontFamilyKey) => {
    setSettings((s) => {
      const next = { ...s, fontFamily };
      saveStored(next);
      return next;
    });
  }, []);

  const setSentenceEndDurationMs = useCallback((sentenceEndDurationMs: number) => {
    setSettings((s) => {
      const next = { ...s, sentenceEndDurationMs };
      saveStored(next);
      return next;
    });
  }, []);

  const setSpeechBreakDurationMs = useCallback((speechBreakDurationMs: number) => {
    setSettings((s) => {
      const next = { ...s, speechBreakDurationMs };
      saveStored(next);
      return next;
    });
  }, []);

  const value: ReaderSettingsContextValue = {
    ...settings,
    setFontSize,
    setFontFamily,
    setSentenceEndDurationMs,
    setSpeechBreakDurationMs,
  };

  return (
    <ReaderSettingsContext.Provider value={value}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettings() {
  const ctx = useContext(ReaderSettingsContext);
  if (!ctx) {
    return {
      ...DEFAULTS,
      setFontSize: () => {},
      setFontFamily: () => {},
      setSentenceEndDurationMs: () => {},
      setSpeechBreakDurationMs: () => {},
    };
  }
  return ctx;
}
