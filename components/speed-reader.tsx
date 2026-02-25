"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getWordParts,
  parseWords,
  wordEndsSentence,
  wordHasPausePunctuation,
} from "@/lib/speed-reader";
import { cn } from "@/lib/utils";

const SAMPLE_TEXT =
  "Paste your own text below, press play, and read one focal point at a time.";

const SENTENCE_END_DELAY_MS_AT_250_WPM = 500;
const PAUSE_PUNCTUATION_DELAY_MS_AT_250_WPM = 250;

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

interface SpeedReaderBaseProps {
  wordsPerMinute?: number;
  onWordIndexChange?: (index: number) => void;
  sentenceEndDurationMsAt250Wpm?: number;
  speechBreakDurationMsAt250Wpm?: number;
  /** When provided, syncs to this index (e.g. when user clicks a word in the article) */
  controlledWordIndex?: number;
}

interface SpeedReaderFullProps extends SpeedReaderBaseProps {
  variant: "full";
}

interface SpeedReaderPanelProps extends SpeedReaderBaseProps {
  variant: "panel";
  text: string;
  className?: string;
}

type SpeedReaderProps = SpeedReaderFullProps | SpeedReaderPanelProps;

export function SpeedReader(props: SpeedReaderProps): React.ReactElement {
  const isFull = props.variant === "full";

  const [inputText, setInputText] = useState(
    isFull ? SAMPLE_TEXT : (props as SpeedReaderPanelProps).text,
  );
  const [wordsPerMinute, setWordsPerMinute] = useState(
    props.wordsPerMinute ?? 300,
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSizeKey>("md");
  const [fontFamily, setFontFamily] = useState<FontFamilyKey>("serif");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const text = isFull ? inputText : (props as SpeedReaderPanelProps).text;
  const words = useMemo(() => parseWords(text), [text]);
  const activeWordIndex =
    words.length === 0 ? 0 : Math.min(wordIndex, words.length - 1);
  const activeWord = words[activeWordIndex] ?? "";
  const { left, focalCharacter, right } = useMemo(
    () => getWordParts(activeWord),
    [activeWord],
  );

  useEffect(() => {
    if (!isFull && text !== inputText) {
      setInputText(text);
    }
  }, [text, isFull, inputText]);

  const onWordIndexChange = "onWordIndexChange" in props ? props.onWordIndexChange : undefined;
  const controlledWordIndex = props.controlledWordIndex;
  const lastControlledRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (controlledWordIndex === undefined) return;
    if (lastControlledRef.current === controlledWordIndex) return;
    lastControlledRef.current = controlledWordIndex;
    setWordIndex(controlledWordIndex);
  }, [controlledWordIndex]);

  useEffect(() => {
    onWordIndexChange?.(activeWordIndex);
  }, [activeWordIndex, onWordIndexChange]);

  useEffect(() => {
    if (!isPlaying || words.length === 0) return;

    const baseMsPerWord = Math.max(
      30,
      Math.round(60000 / wordsPerMinute),
    );
    const wpmScale = 250 / wordsPerMinute;
    const sentenceEndMs =
      props.sentenceEndDurationMsAt250Wpm ?? SENTENCE_END_DELAY_MS_AT_250_WPM;
    const speechBreakMs =
      props.speechBreakDurationMsAt250Wpm ?? PAUSE_PUNCTUATION_DELAY_MS_AT_250_WPM;
    const sentenceDelay = Math.round(sentenceEndMs * wpmScale);
    const pauseDelay = Math.round(speechBreakMs * wpmScale);

    const currentWord = words[activeWordIndex] ?? "";
    const extraDelay = wordEndsSentence(currentWord)
      ? sentenceDelay
      : wordHasPausePunctuation(currentWord)
        ? pauseDelay
        : 0;
    const delay = baseMsPerWord + extraDelay;

    timeoutRef.current = window.setTimeout(() => {
      setWordIndex((prev) => {
        if (prev >= words.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    isPlaying,
    words.length,
    wordsPerMinute,
    activeWordIndex,
    words,
    props.sentenceEndDurationMsAt250Wpm,
    props.speechBreakDurationMsAt250Wpm,
  ]);

  const isFinished =
    words.length > 0 && !isPlaying && activeWordIndex >= words.length - 1;

  function handlePlayPauseRestart() {
    if (words.length === 0) return;
    if (isFinished) {
      setWordIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }

  function handleTextChange(value: string) {
    setInputText(value);
    setWordIndex(0);
    setIsPlaying(false);
  }

  if (!isFull && words.length === 0) return null;

  const wordDisplayClassName = isFull
    ? cn(FONT_SIZES[fontSize].className, FONT_FAMILIES[fontFamily].className)
    : "text-5xl font-serif sm:text-6xl";

  const content = (
    <>
      <section className="w-full shrink-0">
        <div className="relative mx-auto flex h-60 w-full max-w-4xl items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/50">
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
          <div className="pointer-events-none absolute inset-x-0 top-14 h-px bg-white/12" />
          <div className="pointer-events-none absolute inset-x-0 bottom-14 h-px bg-white/12" />

          <div
            className={cn(
              "grid w-full max-w-2xl grid-cols-[1fr_auto_1fr] items-baseline px-6 leading-none",
              wordDisplayClassName,
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
          className={cn(
            "mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground transition-opacity duration-300",
            isPlaying ? "opacity-40" : "opacity-100",
          )}
        >
          <p>{wordsPerMinute} wpm</p>
          <p>•</p>
          <p>
            {words.length === 0 ? 0 : activeWordIndex + 1}/{words.length}
          </p>
        </div>
        {words.length > 0 && (
          <div
            className={cn(
              "mx-auto mt-4 max-w-4xl px-2 transition-opacity duration-300",
              isPlaying ? "opacity-40" : "opacity-100",
            )}
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

      <section
        className={cn(
          "flex max-w-4xl flex-wrap items-center justify-center gap-4 transition-opacity duration-300",
          isPlaying ? "opacity-40" : "opacity-100",
        )}
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
              <div className="min-w-0 flex-1">
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
    </>
  );

  if (props.variant === "panel") {
    const { className } = props;
    return (
      <div
        className={cn(
          "flex flex-col gap-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-8",
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-4 py-10 sm:px-8">
      <div
        className={cn(
          "fixed right-4 top-4 z-50 flex items-center gap-2 transition-opacity duration-300 sm:right-8 sm:top-8",
          isPlaying ? "opacity-40" : "opacity-100",
        )}
      >
        <Link
          href="/reader"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Article Reader
        </Link>
        <Dialog.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <Dialog.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open settings"
              className="size-9"
            >
              <Settings className="size-5" />
            </Button>
          </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-black/80",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}
          />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
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
                    ),
                  )}
                </select>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
        </Dialog.Root>
      </div>
      <div className="min-h-0 flex-1 shrink-0" aria-hidden />
      {content}
      <div className="min-h-0 flex-1 shrink-0" aria-hidden />
      <section
        className={cn(
          "w-full max-w-4xl transition-opacity duration-300",
          isPlaying ? "opacity-40" : "opacity-100",
        )}
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
