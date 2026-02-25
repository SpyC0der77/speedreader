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
