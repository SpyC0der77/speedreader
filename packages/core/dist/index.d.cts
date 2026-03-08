declare function wordEndsSentence(word: string): boolean;
declare function wordHasPausePunctuation(word: string): boolean;
/**
 * Calculates total reading time in ms for a range of words, using the same
 * timing logic as playback: base ms/word from WPM plus scaled punctuation delays.
 */
declare function calculateReadingTimeMs(words: string[], wordsPerMinute: number, sentenceEndDurationMsAt250Wpm: number, speechBreakDurationMsAt250Wpm: number, fromIndex?: number, toIndex?: number): number;

declare function parseWords(text: string): string[];
declare function getFocalCharacterIndex(word: string): number;
declare function getWordParts(word: string): {
    left: string;
    focalCharacter: string;
    right: string;
};
/**
 * Preprocesses HTML so trailing commas after links are moved inside the link.
 * E.g. `<a href="...">link</a>, ` becomes `<a href="...">link,</a> `.
 * This ensures the comma is attached to the last word of the link for
 * parseWords/wrapWordsInHtml, rather than being treated as its own word.
 */
declare function attachTrailingCommasToLinks(html: string): string;
/**
 * Extracts plain text from HTML using the SAME word-boundary logic as
 * wrapWordsInHtml. Must be used for SpeedReader text so indices match the
 * Reader View highlight. Client-only (DOMParser); returns "" during SSR.
 */
declare function extractTextFromHtml(html: string): string;
/**
 * Wraps each word in the HTML with spans containing data-word-index for
 * highlighting. Depends on window/document (DOMParser). During SSR
 * (typeof document === "undefined"), returns the unmodified HTML.
 */
declare function wrapWordsInHtml(html: string): string;

export { attachTrailingCommasToLinks, calculateReadingTimeMs, extractTextFromHtml, getFocalCharacterIndex, getWordParts, parseWords, wordEndsSentence, wordHasPausePunctuation, wrapWordsInHtml };
