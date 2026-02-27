"use client";

import DOMPurify from "dompurify";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Gauge, Loader2, Settings } from "lucide-react";
import { Dialog } from "radix-ui";
import { SpeedReader } from "@/components/speed-reader";
import { Slider } from "@/components/ui/slider";
import { extractTextFromHtml, wrapWordsInHtml } from "@/lib/speed-reader";
import { cn } from "@/lib/utils";

const ArticleBody = forwardRef<
  HTMLDivElement,
  { html: string; wordIndex: number; onWordClick?: (index: number) => void }
>(function ArticleBody({ html, wordIndex, onWordClick }, ref) {
  const prevHighlightRef = useRef<HTMLElement | null>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = (e.target as HTMLElement).closest("[data-word-index]");
    if (target) {
      const index = parseInt(target.getAttribute("data-word-index") ?? "0", 10);
      onWordClick?.(index);
    }
  }

  useEffect(() => {
    const container =
      typeof ref !== "function" && ref !== null
        ? (ref as React.RefObject<HTMLDivElement>).current
        : null;
    if (!container) return;

    const span = container.querySelector(
      `[data-word-index="${wordIndex}"]`,
    ) as HTMLElement | null;

    const prevSpan = prevHighlightRef.current;
    const prevRect = prevSpan?.getBoundingClientRect();
    if (prevSpan) {
      prevSpan.classList.remove("speed-reader-highlight");
      prevHighlightRef.current = null;
    }

    if (span) {
      span.classList.add("speed-reader-highlight");
      prevHighlightRef.current = span;
      const rect = span.getBoundingClientRect();
      const lineHeight = rect.height;
      const isNewLine =
        !prevRect || Math.abs(rect.top - prevRect.top) > lineHeight * 0.5;
      const viewportHeight = window.innerHeight;
      const margin = viewportHeight * 0.2;
      const isComfortablyVisible =
        rect.top >= margin && rect.bottom <= viewportHeight - margin;
      if (isNewLine || !isComfortablyVisible) {
        span.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [wordIndex, ref]);

  return (
    <div
      ref={ref}
      onClick={onWordClick ? handleClick : undefined}
      className={cn(
        "reader-article space-y-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_p]:leading-7 [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_img]:rounded-lg [&_img]:max-w-full",
        onWordClick &&
          "cursor-pointer [&_[data-word-index]]:cursor-pointer [&_[data-word-index]]:rounded-sm [&_[data-word-index]]:transition-colors [&_[data-word-index]]:hover:bg-muted/50",
      )}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html, {
          ALLOWED_ATTR: ["href", "src", "alt", "title", "data-word-index"],
          ADD_ATTR: ["data-word-index"],
        }),
      }}
    />
  );
});

interface ArticleData {
  title: string | null;
  content: string;
  textContent?: string;
  excerpt: string | null;
  byline: string | null;
  siteName: string | null;
}

const DEFAULT_SENTENCE_END_MS = 500;
const DEFAULT_SPEECH_BREAK_MS = 250;

export default function ReaderPage() {
  const [url, setUrl] = useState("");
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [wrappedContent, setWrappedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sentenceEndDurationMs, setSentenceEndDurationMs] = useState(
    DEFAULT_SENTENCE_END_MS,
  );
  const [speechBreakDurationMs, setSpeechBreakDurationMs] = useState(
    DEFAULT_SPEECH_BREAK_MS,
  );
  const [showArticleOnMobile, setShowArticleOnMobile] = useState(false);
  const articleBodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(420);

  // Use same word-boundary logic as wrapWordsInHtml so Reader View highlight matches SpeedReader.
  const articleText = useMemo(
    () => (article ? extractTextFromHtml(article.content) : ""),
    [article?.content],
  );

  useEffect(() => {
    if (!article?.content) {
      setWrappedContent(null);
      return;
    }
    setWrappedContent(wrapWordsInHtml(article.content));
    setWordIndex(0);
    setShowArticleOnMobile(false);
  }, [article?.content]);

  function handleWordClick(index: number) {
    setWordIndex(index);
    setShowArticleOnMobile(false);
  }

  const COMPACT_VIEW_MIN_HEIGHT = 750;

  const [isCompactView, setIsCompactView] = useState(true);
  useEffect(() => {
    const mqWide = window.matchMedia("(min-width: 768px)");
    const mqTall = window.matchMedia(
      `(min-height: ${COMPACT_VIEW_MIN_HEIGHT}px)`,
    );
    const update = () => setIsCompactView(!(mqWide.matches && mqTall.matches));
    update();
    mqWide.addEventListener("change", update);
    mqTall.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mqWide.removeEventListener("change", update);
      mqTall.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const setHeight = () =>
      setPanelHeight(!isCompactView ? el.offsetHeight : 0);
    setHeight();
    const ro = new ResizeObserver(setHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [article, isCompactView]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setArticle(null);
    setWrappedContent(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to extract article");
      }

      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/" aria-label="Back to home">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
            <Input
              type="url"
              placeholder="Enter article URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Read"}
            </Button>
          </form>
          <Dialog.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <Dialog.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open settings">
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
                  Reader Settings
                </Dialog.Title>
                <Dialog.Description className="mb-4 text-sm text-muted-foreground">
                  Adjust pause durations (values at 250 WPM; scale with speed).
                </Dialog.Description>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="sentence-end"
                      className="mb-2 block text-sm font-medium text-zinc-100"
                    >
                      Sentence End Duration ({sentenceEndDurationMs}ms)
                    </label>
                    <Slider
                      id="sentence-end"
                      min={0}
                      max={1000}
                      step={50}
                      value={[sentenceEndDurationMs]}
                      onValueChange={([v]) =>
                        setSentenceEndDurationMs(v ?? DEFAULT_SENTENCE_END_MS)
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="speech-break"
                      className="mb-2 block text-sm font-medium text-zinc-100"
                    >
                      Speech Break Duration ({speechBreakDurationMs}ms)
                    </label>
                    <Slider
                      id="speech-break"
                      min={0}
                      max={1000}
                      step={25}
                      value={[speechBreakDurationMs]}
                      onValueChange={([v]) =>
                        setSpeechBreakDurationMs(v ?? DEFAULT_SPEECH_BREAK_MS)
                      }
                    />
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto flex max-w-3xl flex-1 flex-col px-4 pt-8",
          article && "min-h-0",
        )}
        style={
          article && !isCompactView
            ? { paddingBottom: `${panelHeight}px` }
            : undefined
        }
      >
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive">
            {error}
          </div>
        )}

        {article && (
          <article className="reader-content flex min-h-0 flex-1 flex-col">
            <header className={cn("shrink-0", isCompactView ? "mb-4" : "mb-8")}>
              {(article.siteName || article.byline) && (
                <p className="mb-2 text-sm text-muted-foreground">
                  {[article.siteName, article.byline]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {article.title ?? "Untitled"}
              </h1>
              {article.excerpt && (
                <p className="mt-3 text-lg text-muted-foreground">
                  {article.excerpt}
                </p>
              )}
              <div
                className={cn("mt-4 flex w-full", !isCompactView && "hidden")}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowArticleOnMobile(!showArticleOnMobile)}
                  className="w-full gap-2"
                >
                  {showArticleOnMobile ? (
                    <>
                      <Gauge className="size-4" />
                      Show speed reader
                    </>
                  ) : (
                    <>
                      <BookOpen className="size-4" />
                      Show article
                    </>
                  )}
                </Button>
              </div>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                className={cn(
                  "min-h-0 flex-1 flex-col overflow-auto",
                  showArticleOnMobile || !isCompactView ? "flex" : "hidden",
                  !isCompactView && "flex-none overflow-visible",
                )}
              >
                <ArticleBody
                  ref={articleBodyRef}
                  html={wrappedContent ?? article.content}
                  wordIndex={wordIndex}
                  onWordClick={handleWordClick}
                />
              </div>

              {articleText && (
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col",
                    (!isCompactView || showArticleOnMobile) && "hidden",
                  )}
                >
                  <SpeedReader
                    key={article.content}
                    variant="panel"
                    text={articleText}
                    onWordIndexChange={setWordIndex}
                    controlledWordIndex={wordIndex}
                    sentenceEndDurationMsAt250Wpm={sentenceEndDurationMs}
                    speechBreakDurationMsAt250Wpm={speechBreakDurationMs}
                    fillHeight
                    className="flex-1 min-h-0 justify-center border-0"
                  />
                </div>
              )}
            </div>
          </article>
        )}

        {!article && !error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground">
              Paste an article URL above to extract and read it in a clean,
              focused view.
            </p>
          </div>
        )}
      </main>

      {article && articleText && (
        <div
          ref={panelRef}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-20",
            isCompactView ? "hidden" : "block",
          )}
        >
          <SpeedReader
            key={article.content}
            variant="panel"
            text={articleText}
            onWordIndexChange={setWordIndex}
            controlledWordIndex={wordIndex}
            sentenceEndDurationMsAt250Wpm={sentenceEndDurationMs}
            speechBreakDurationMsAt250Wpm={speechBreakDurationMs}
          />
        </div>
      )}
    </div>
  );
}
