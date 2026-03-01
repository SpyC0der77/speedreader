export function wordEndsSentence(word: string): boolean {
  const trimmed = word.trim();
  return trimmed.length > 0 && /[.!?]["']?$/.test(trimmed);
}

export function wordHasPausePunctuation(word: string): boolean {
  return /[,:;—]["']?$|--["']?$/.test(word.trim());
}

/**
 * Calculates total reading time in ms for a range of words, using the same
 * timing logic as playback: base ms/word from WPM plus scaled punctuation delays.
 */
export function calculateReadingTimeMs(
  words: string[],
  wordsPerMinute: number,
  sentenceEndDurationMsAt250Wpm: number,
  speechBreakDurationMsAt250Wpm: number,
  fromIndex = 0,
  toIndex?: number,
): number {
  if (words.length === 0) return 0;
  const end = toIndex ?? words.length - 1;
  const start = Math.max(0, Math.min(fromIndex, end));

  const baseMsPerWord = Math.max(30, Math.round(60000 / wordsPerMinute));
  const wpmScale = 250 / wordsPerMinute;
  const sentenceDelay = Math.round(sentenceEndDurationMsAt250Wpm * wpmScale);
  const pauseDelay = Math.round(speechBreakDurationMsAt250Wpm * wpmScale);

  let total = 0;
  for (let i = start; i <= end; i++) {
    const word = words[i] ?? "";
    const extra =
      wordEndsSentence(word)
        ? sentenceDelay
        : wordHasPausePunctuation(word)
          ? pauseDelay
          : 0;
    total += baseMsPerWord + extra;
  }
  return total;
}
