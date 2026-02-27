"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { useReduceTransparency } from "@/lib/reduce-transparency-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SpeedReader } from "@/components/speed-reader";

const PASSAGE_250 =
  "The ancient library stood at the edge of the village, its stone walls weathered by centuries of rain and wind. Inside, tall wooden shelves held thousands of books, each one carefully preserved. The librarian, an elderly woman with silver hair, knew every volume by heart. She would often tell visitors that books were like windows into other worlds, and that reading was the key to understanding them.";

const QUESTIONS_250 = [
  {
    question: "Where was the library located?",
    options: ["In the center of town", "At the edge of the village", "On a mountain", "By the sea"],
    correct: 1,
  },
  {
    question: "What did the librarian compare books to?",
    options: ["Doors", "Windows into other worlds", "Keys", "Mirrors"],
    correct: 1,
  },
];

const PASSAGE_350 =
  "Scientists have discovered that honeybees communicate through a complex dance known as the waggle dance. When a forager finds a rich source of nectar, she returns to the hive and performs this dance on the vertical surface of the honeycomb. The angle of the dance indicates the direction of the food source relative to the sun, while the duration of the waggle phase encodes the distance. Other workers observe the dance and use this information to navigate directly to the flowers.";

const QUESTIONS_350 = [
  {
    question: "What does the waggle dance communicate?",
    options: ["The quality of nectar", "Direction and distance to food", "Weather conditions", "Danger warnings"],
    correct: 1,
  },
  {
    question: "Where do bees perform the waggle dance?",
    options: ["In the air", "On flowers", "On the honeycomb surface", "Outside the hive"],
    correct: 2,
  },
];

const PASSAGE_450 =
  "The invention of the printing press in the fifteenth century revolutionized the spread of knowledge across Europe. Before Gutenberg's innovation, books had to be copied by hand, making them rare and expensive. The press allowed for the mass production of texts, dramatically lowering costs and increasing literacy rates. Within decades, ideas could travel faster than ever before, fueling the Renaissance and the scientific revolution that would reshape human understanding of the world.";

const QUESTIONS_450 = [
  {
    question: "What made books rare before the printing press?",
    options: ["Lack of paper", "Hand copying only", "Government restrictions", "Language barriers"],
    correct: 1,
  },
  {
    question: "What movements did the printing press help fuel?",
    options: ["The Industrial Revolution", "The Renaissance and scientific revolution", "The Enlightenment only", "Colonial expansion"],
    correct: 1,
  },
];

const READING_LEVELS = [
  { wpm: 250, passage: PASSAGE_250, questions: QUESTIONS_250 },
  { wpm: 350, passage: PASSAGE_350, questions: QUESTIONS_350 },
  { wpm: 450, passage: PASSAGE_450, questions: QUESTIONS_450 },
] as const;

type Stage = "reading" | "questions" | "complete";

export default function ReadingTestPage() {
  const { reduceTransparency } = useReduceTransparency();
  const [levelIndex, setLevelIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("reading");
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [achievedWpm, setAchievedWpm] = useState<number | null>(null);

  const level = READING_LEVELS[levelIndex];
  const isLastLevel = levelIndex === READING_LEVELS.length - 1;

  function handleReadingComplete() {
    setStage("questions");
    setSelectedAnswers(new Array(level.questions.length).fill(-1));
  }

  function handleAnswerSelect(questionIndex: number, optionIndex: number) {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  function handleSubmitAnswers() {
    const allCorrect = level.questions.every(
      (q, i) => selectedAnswers[i] === q.correct
    );

    if (!allCorrect) {
      setAchievedWpm(levelIndex === 0 ? 0 : READING_LEVELS[levelIndex - 1].wpm);
      setStage("complete");
      return;
    }

    if (isLastLevel) {
      setAchievedWpm(level.wpm);
      setStage("complete");
      return;
    }

    setLevelIndex((i) => i + 1);
    setStage("reading");
    setSelectedAnswers([]);
  }

  function handleRestart() {
    setLevelIndex(0);
    setStage("reading");
    setSelectedAnswers([]);
    setAchievedWpm(null);
  }

  if (stage === "complete") {
    return (
      <div className="min-h-screen bg-background">
        <header
          className={cn(
            "sticky top-0 z-10 border-b border-border/50",
            reduceTransparency
              ? "bg-background"
              : "bg-background/95 backdrop-blur",
          )}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/" aria-label="Back to home">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
          </div>
        </header>
        <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
          <div
            className={cn(
              "rounded-2xl border px-8 py-12 shadow-xl",
              reduceTransparency
                ? "border-zinc-700 bg-zinc-900"
                : "border-white/10 bg-black/30",
            )}
          >
            <Trophy className="mx-auto mb-6 size-16 text-amber-400" />
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {achievedWpm !== null && achievedWpm > 0
                ? `You Read at ${achievedWpm} WPM!`
                : "Keep Practicing!"}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {achievedWpm === 450
                ? "Outstanding! You've mastered all three speed levels."
                : achievedWpm !== null && achievedWpm > 0
                  ? "Great progress! Try again to reach the next level."
                  : "Answer the comprehension questions correctly to earn your WPM score."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button onClick={handleRestart} size="lg">
                Try Again
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (stage === "questions") {
    return (
      <div className="min-h-screen bg-background">
        <header
          className={cn(
            "sticky top-0 z-10 border-b border-border/50",
            reduceTransparency
              ? "bg-background"
              : "bg-background/95 backdrop-blur",
          )}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/" aria-label="Back to home">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">
              Level {levelIndex + 1} — Comprehension Check
            </h1>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-8">
          <p className="mb-8 text-muted-foreground">
            Answer the questions below to advance to the next speed level.
          </p>
          <div className="space-y-8">
            {level.questions.map((q, qIndex) => (
              <div key={qIndex} className="space-y-3">
                <p className="font-medium">{q.question}</p>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oIndex) => (
                    <Button
                      key={oIndex}
                      variant={selectedAnswers[qIndex] === oIndex ? "default" : "outline"}
                      className="justify-start text-left"
                      onClick={() => handleAnswerSelect(qIndex, oIndex)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button
            className="mt-8 w-full"
            size="lg"
            onClick={handleSubmitAnswers}
            disabled={selectedAnswers.some((a) => a < 0)}
          >
            Submit Answers
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className={cn(
          "sticky top-0 z-10 border-b border-border/50",
          reduceTransparency
            ? "bg-background"
            : "bg-background/95 backdrop-blur",
        )}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/" aria-label="Back to home">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">
            Reading Test — Level {levelIndex + 1} ({level.wpm} WPM)
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="mb-6 text-muted-foreground">
          Read the passage at {level.wpm} WPM. When you finish, you&apos;ll
          answer comprehension questions to advance.
        </p>
        <ReadingTestReader
          text={level.passage}
          wpm={level.wpm}
          onComplete={handleReadingComplete}
        />
      </main>
    </div>
  );
}

interface ReadingTestReaderProps {
  text: string;
  wpm: number;
  onComplete: () => void;
}

function ReadingTestReader({ text, wpm, onComplete }: ReadingTestReaderProps) {
  const { reduceTransparency } = useReduceTransparency();
  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-2xl border p-6",
          reduceTransparency
            ? "border-zinc-700 bg-zinc-900"
            : "border-white/10 bg-black/30",
        )}
      >
        <SpeedReader
          key={text}
          variant="test"
          text={text}
          wordsPerMinute={wpm}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
}
