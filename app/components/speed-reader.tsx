"use client";

import { Settings } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface WordParts {
  left: string;
  focalCharacter: string;
  right: string;
}

function getFocalCharacterIndex(word: string): number {
  const length = word.length;

  if (length <= 1) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  if (length <= 13) return 3;

  return Math.min(4, length - 1);
}

function getWordParts(word: string): WordParts {
  const focalCharacterIndex = getFocalCharacterIndex(word);

  return {
    left: word.slice(0, focalCharacterIndex),
    focalCharacter: word[focalCharacterIndex] ?? "",
    right: word.slice(focalCharacterIndex + 1),
  };
}

function parseWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

const SAMPLE_TEXT =
  "Paste your own text below, press play, and read one focal point at a time.";

const FONT_SIZES = {
  sm: { label: "Small", className: "text-4xl sm:text-5xl" },
  md: { label: "Medium", className: "text-5xl sm:text-6xl" },
  lg: { label: "Large", className: "text-6xl sm:text-7xl" },
  xl: { label: "Extra large", className: "text-7xl sm:text-8xl" },
} as const;

const FONT_FAMILIES = {
  sans: { label: "Sans", className: "font-sans" },
  serif: { label: "Serif (Recommended)", className: "font-serif" },
  mono: { label: "Mono", className: "font-mono" },
} as const;

type FontSizeKey = keyof typeof FONT_SIZES;
type FontFamilyKey = keyof typeof FONT_FAMILIES;

export function SpeedReader(): React.ReactElement {
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXT);
  const [wordsPerMinute, setWordsPerMinute] = useState<number>(300);
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<FontSizeKey>("md");
  const [fontFamily, setFontFamily] = useState<FontFamilyKey>("serif");

  const words = useMemo(() => parseWords(inputText), [inputText]);
  const activeWordIndex =
    words.length === 0 ? 0 : Math.min(wordIndex, words.length - 1);
  const activeWord = words[activeWordIndex] ?? "";
  const { left, focalCharacter, right } = useMemo(
    () => getWordParts(activeWord),
    [activeWord],
  );

  useEffect(() => {
    if (!isPlaying) return;
    if (words.length === 0) return;

    const millisecondsPerWord = Math.max(
      30,
      Math.round(60000 / wordsPerMinute),
    );
    const interval = window.setInterval(() => {
      setWordIndex((previousIndex) => {
        if (previousIndex >= words.length - 1) {
          setIsPlaying(false);
          return previousIndex;
        }

        return previousIndex + 1;
      });
    }, millisecondsPerWord);

    return () => window.clearInterval(interval);
  }, [isPlaying, words.length, wordsPerMinute]);

  const isFinished =
    words.length > 0 && !isPlaying && activeWordIndex >= words.length - 1;

  function handlePlayPauseRestart(): void {
    if (words.length === 0) return;
    if (isFinished) {
      setWordIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }

  function handleTextChange(value: string): void {
    setInputText(value);
    setWordIndex(0);
    setIsPlaying(false);
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-4 py-10 sm:px-8">
      <Dialog.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Dialog.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open settings"
            className={cn(
              "fixed right-4 top-4 z-50 size-9 transition-opacity duration-300 sm:right-8 sm:top-8",
              isPlaying ? "opacity-40" : "opacity-100"
            )}
          >
            <Settings className="size-5" />
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-black/80",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )}
          />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
          >
            <Dialog.Title className="mb-4 text-lg font-semibold text-zinc-100">
              Settings
            </Dialog.Title>
            <Dialog.Description className="mb-4 text-sm text-muted-foreground">
              Customize the reading experience.
            </Dialog.Description>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="font-size"
                  className="mb-2 block text-sm font-medium text-zinc-100"
                >
                  Font size
                </label>
                <select
                  id="font-size"
                  value={fontSize}
                  onChange={(e) =>
                    setFontSize(e.target.value as FontSizeKey)
                  }
                  className="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  {(Object.keys(FONT_SIZES) as FontSizeKey[]).map((key) => (
                    <option key={key} value={key}>
                      {FONT_SIZES[key].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="font-family"
                  className="mb-2 block text-sm font-medium text-zinc-100"
                >
                  Font family
                </label>
                <select
                  id="font-family"
                  value={fontFamily}
                  onChange={(e) =>
                    setFontFamily(e.target.value as FontFamilyKey)
                  }
                  className="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  {(Object.keys(FONT_FAMILIES) as FontFamilyKey[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {FONT_FAMILIES[key].label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="min-h-0 flex-1 shrink-0" aria-hidden />
      <section className="w-full shrink-0">
        <div className="relative mx-auto flex h-60 w-full max-w-4xl items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/50">
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
          <div className="pointer-events-none absolute inset-x-0 top-14 h-px bg-white/12" />
          <div className="pointer-events-none absolute inset-x-0 bottom-14 h-px bg-white/12" />

          <div
            className={cn(
              "grid w-full max-w-2xl grid-cols-[1fr_auto_1fr] items-baseline px-6 leading-none",
              FONT_SIZES[fontSize].className,
              FONT_FAMILIES[fontFamily].className
            )}
          >
            <span className="justify-self-end pr-1 text-zinc-100">{left}</span>
            <span className="text-rose-500">{focalCharacter || "•"}</span>
            <span className="justify-self-start pl-1 text-zinc-100">
              {right}
            </span>
          </div>
        </div>

        <div
          className={`mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground transition-opacity duration-300 ${isPlaying ? "opacity-40" : "opacity-100"}`}
        >
          <p>{wordsPerMinute} wpm</p>
          <p>•</p>
          <p>
            {words.length === 0 ? 0 : activeWordIndex + 1}/{words.length}
          </p>
        </div>
        {words.length > 0 && (
          <div
            className={`mx-auto mt-4 w-full max-w-4xl px-2 transition-opacity duration-300 ${isPlaying ? "opacity-40" : "opacity-100"}`}
          >
            <Slider
              min={0}
              max={Math.max(0, words.length - 1)}
              step={1}
              value={[activeWordIndex]}
              onValueChange={([v]) => setWordIndex(v ?? 0)}
              className="cursor-pointer"
            />
          </div>
        )}
      </section>
      <div className="min-h-0 flex-1 shrink-0" aria-hidden />
      <section
        className={`flex w-full max-w-4xl flex-wrap items-center justify-center gap-4 pb-6 transition-opacity duration-300 ${isPlaying ? "opacity-40" : "opacity-100"}`}
      >
        <Button
          variant="outline"
          onClick={handlePlayPauseRestart}
          disabled={words.length === 0}
        >
          {isPlaying ? "Pause" : isFinished ? "Restart" : "Play"}
        </Button>
        <div className="flex min-w-[200px] max-w-[280px] items-center gap-3">
          <span className="shrink-0 text-sm text-muted-foreground">WPM</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-1 min-w-0">
                <Slider
                  min={50}
                  max={1200}
                  step={25}
                  value={[wordsPerMinute]}
                  onValueChange={([v]) => setWordsPerMinute(v ?? 300)}
                  className="cursor-pointer"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">{wordsPerMinute} wpm</TooltipContent>
          </Tooltip>
        </div>
      </section>

      <section
        className={`w-full max-w-4xl transition-opacity duration-300 ${isPlaying ? "opacity-40" : "opacity-100"}`}
      >
        <label
          htmlFor="reader-text"
          className="mb-2 block text-sm font-medium text-muted-foreground"
        >
          Text to read
        </label>
        <Textarea
          id="reader-text"
          value={inputText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Paste text here..."
          className="min-h-44 resize-y"
        />
      </section>
    </main>
  );
}
