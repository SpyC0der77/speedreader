export function parseWords(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

export function getFocalCharacterIndex(word: string): number {
  const length = word.length;
  if (length <= 1) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  if (length <= 13) return 3;
  return Math.min(4, length - 1);
}

export function getWordParts(word: string) {
  const focalCharacterIndex = getFocalCharacterIndex(word);
  return {
    left: word.slice(0, focalCharacterIndex),
    focalCharacter: word[focalCharacterIndex] ?? "",
    right: word.slice(focalCharacterIndex + 1),
  };
}

export function wordEndsSentence(word: string): boolean {
  const trimmed = word.trim();
  return trimmed.length > 0 && /[.!?]["']?$/.test(trimmed);
}

export function wordHasPausePunctuation(word: string): boolean {
  return /[,:;—]["']?$|--["']?$/.test(word.trim());
}

/**
 * Preprocesses HTML so trailing commas after links are moved inside the link.
 * E.g. `<a href="...">link</a>, ` becomes `<a href="...">link,</a> `.
 * This ensures the comma is attached to the last word of the link for
 * parseWords/wrapWordsInHtml, rather than being treated as its own word.
 */
export function attachTrailingCommasToLinks(html: string): string {
  return html.replace(/(<\/a>)(\s*,\s*)/g, (_, tag, punct) => {
    const trailingSpace = /\s$/.test(punct) ? " " : "";
    return "," + tag + trailingSpace;
  });
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

/**
 * Extracts plain text from HTML using the SAME word-boundary logic as
 * wrapWordsInHtml. Must be used for SpeedReader text so indices match the
 * Reader View highlight. Client-only (DOMParser).
 */
export function extractTextFromHtml(html: string): string {
  if (typeof document === "undefined") return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const parts: string[] = [];

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node instanceof Text) textNodes.push(node);
  }

  let hasProcessedWords = false;

  for (const node of textNodes) {
    const text = (node.textContent ?? "").replace(/\s+/g, " ");
    const nodeParts = text.split(/( )/);

    const hasContent = text.trim().length > 0;
    const startsWithSpace = /^\s/.test(text);
    const needsLeadingSpace =
      hasContent && !startsWithSpace && hasProcessedWords;

    if (needsLeadingSpace) {
      parts.push(" ");
    }

    for (const part of nodeParts) {
      if (part === " ") {
        parts.push(" ");
      } else if (part) {
        parts.push(part);
        hasProcessedWords = true;
      }
    }
  }

  return parts.join("").replace(/\s+/g, " ").trim();
}

/**
 * Client-only utility that wraps each word in the HTML with spans containing
 * data-word-index for highlighting. Depends on window/document (DOMParser).
 * During SSR (typeof document === "undefined"), returns the unmodified HTML.
 * Callers must invoke this only from client contexts (e.g., inside useEffect or
 * a Client Component) so words are indexed/highlighted. For stricter behavior,
 * consider throwing when document is undefined or guarding call sites.
 */
export function wrapWordsInHtml(html: string): string {
  if (typeof document === "undefined") return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  let wordIndex = 0;

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node instanceof Text) textNodes.push(node);
  }

  let hasProcessedWords = false;

  for (const node of textNodes) {
    const text = (node.textContent ?? "").replace(/\s+/g, " ");
    const parts = text.split(/( )/);
    const fragment = doc.createDocumentFragment();

    const hasContent = text.trim().length > 0;
    const startsWithSpace = /^\s/.test(text);
    const needsLeadingSpace =
      hasContent && !startsWithSpace && hasProcessedWords;

    if (needsLeadingSpace) {
      fragment.appendChild(doc.createTextNode(" "));
    }

    for (const part of parts) {
      if (part === " ") {
        fragment.appendChild(doc.createTextNode(" "));
      } else if (part) {
        const span = doc.createElement("span");
        span.setAttribute("data-word-index", String(wordIndex++));
        span.textContent = part;
        fragment.appendChild(span);
        hasProcessedWords = true;
      }
    }

    node.parentNode?.replaceChild(fragment, node);
  }

  return doc.body.innerHTML;
}
