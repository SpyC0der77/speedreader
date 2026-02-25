"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const SAMPLE_TEXT =
  "Paste your own text below, press play, and read one focal point at a time.";

export function SpeedReader(): JSX.Element {
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXT);
  const [wordsPerMinute, setWordsPerMinute] = useState<number>(300);
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const words = useMemo(() => parseWords(inputText), [inputText]);
  const activeWordIndex =
    words.length === 0 ? 0 : Math.min(wordIndex, words.length - 1);
  const activeWord = words[activeWordIndex] ?? "";
  const { left, focalCharacter, right } = useMemo(
    () => getWordParts(activeWord),
    [activeWord]
  );

  useEffect(() => {
    if (!isPlaying) return;
    if (words.length === 0) return;

    const millisecondsPerWord = Math.max(30, Math.round(60000 / wordsPerMinute));
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-4 py-10 sm:px-8">
      <div className="min-h-0 flex-1 shrink-0" aria-hidden />
      <section className="w-full shrink-0">
        <div className="relative mx-auto flex h-60 w-full max-w-4xl items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/50">
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
          <div className="pointer-events-none absolute inset-x-0 top-14 h-px bg-white/12" />
          <div className="pointer-events-none absolute inset-x-0 bottom-14 h-px bg-white/12" />

          <div className="grid w-full max-w-2xl grid-cols-[1fr_auto_1fr] items-baseline px-6 font-serif text-5xl leading-none sm:text-7xl">
            <span className="justify-self-end pr-1 text-zinc-100">{left}</span>
            <span className="text-rose-500">{focalCharacter || "•"}</span>
            <span className="justify-self-start pl-1 text-zinc-100">{right}</span>
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
            className={`mt-4 w-full max-w-4xl px-2 transition-opacity duration-300 ${isPlaying ? "opacity-40" : "opacity-100"}`}
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
                  onValueChange={([v]) =>
                    setWordsPerMinute(v ?? 300)
                  }
                  className="cursor-pointer"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              {wordsPerMinute} wpm
            </TooltipContent>
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
