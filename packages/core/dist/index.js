// src/word-timing.ts
function wordEndsSentence(word) {
  const trimmed = word.trim();
  return trimmed.length > 0 && /[.!?]["']?$/.test(trimmed);
}
function wordHasPausePunctuation(word) {
  return /[,:;—]["']?$|--["']?$/.test(word.trim());
}
function calculateReadingTimeMs(words, wordsPerMinute, sentenceEndDurationMsAt250Wpm, speechBreakDurationMsAt250Wpm, fromIndex = 0, toIndex) {
  if (words.length === 0) return 0;
  const maxIndex = words.length - 1;
  const intFromIndex = Number.isFinite(fromIndex) ? Math.floor(fromIndex) : 0;
  const intToIndex = toIndex !== void 0 && Number.isFinite(toIndex) ? Math.floor(toIndex) : void 0;
  const rawEnd = intToIndex ?? maxIndex;
  const end = Math.max(0, Math.min(rawEnd, maxIndex));
  const start = Math.max(0, Math.min(intFromIndex, end));
  const safeWpm = Number.isFinite(wordsPerMinute) && wordsPerMinute > 0 ? wordsPerMinute : 1;
  const baseMsPerWord = Math.max(30, Math.round(6e4 / safeWpm));
  const wpmScale = 250 / safeWpm;
  const sentenceDelay = Math.round(sentenceEndDurationMsAt250Wpm * wpmScale);
  const pauseDelay = Math.round(speechBreakDurationMsAt250Wpm * wpmScale);
  let total = 0;
  for (let i = start; i <= end; i++) {
    const word = words[i] ?? "";
    const extra = wordEndsSentence(word) ? sentenceDelay : wordHasPausePunctuation(word) ? pauseDelay : 0;
    total += baseMsPerWord + extra;
  }
  return total;
}

// src/text-preprocessing.ts
function parseWords(text) {
  return text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}
function getGraphemeClusters(word) {
  const segmenter = new Intl.Segmenter(void 0, { granularity: "grapheme" });
  return [...segmenter.segment(word)].map((s) => s.segment);
}
function getFocalCharacterIndex(word) {
  const clusters = getGraphemeClusters(word);
  const length = clusters.length;
  if (length <= 1) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  if (length <= 13) return 3;
  return Math.min(4, length - 1);
}
function getWordParts(word) {
  const clusters = getGraphemeClusters(word);
  const focalCharacterIndex = getFocalCharacterIndex(word);
  return {
    left: clusters.slice(0, focalCharacterIndex).join(""),
    focalCharacter: clusters[focalCharacterIndex] ?? "",
    right: clusters.slice(focalCharacterIndex + 1).join("")
  };
}
function attachTrailingCommasToLinks(html) {
  return html.replace(/(<\/a>)(\s*,\s*)/g, (_, tag, punct) => {
    const trailingSpace = /\s$/.test(punct) ? " " : "";
    return "," + tag + trailingSpace;
  });
}
function extractTextFromHtml(html) {
  if (typeof document === "undefined") return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const parts = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
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
    const needsLeadingSpace = hasContent && !startsWithSpace && hasProcessedWords;
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
function wrapWordsInHtml(html) {
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  let wordIndex = 0;
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
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
    const needsLeadingSpace = hasContent && !startsWithSpace && hasProcessedWords;
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
export {
  attachTrailingCommasToLinks,
  calculateReadingTimeMs,
  extractTextFromHtml,
  getFocalCharacterIndex,
  getWordParts,
  parseWords,
  wordEndsSentence,
  wordHasPausePunctuation,
  wrapWordsInHtml
};
