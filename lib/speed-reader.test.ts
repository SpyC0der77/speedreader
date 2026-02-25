import { describe, it, expect } from "vitest";
import {
  parseWords,
  wordEndsSentence,
  wordHasPausePunctuation,
  getFocalCharacterIndex,
  getWordParts,
} from "./speed-reader";

describe("parseWords", () => {
  describe("basic splitting on whitespace", () => {
    it("splits on single spaces", () => {
      expect(parseWords("hello world")).toEqual(["hello", "world"]);
      expect(parseWords("one two three")).toEqual(["one", "two", "three"]);
    });

    it("collapses multiple spaces/newlines/tabs to single delimiter", () => {
      expect(parseWords("hello   world")).toEqual(["hello", "world"]);
      expect(parseWords("hello\n\tworld")).toEqual(["hello", "world"]);
      expect(parseWords("a  b   c    d")).toEqual(["a", "b", "c", "d"]);
    });

    it("trims leading and trailing whitespace", () => {
      expect(parseWords("  hello world  ")).toEqual(["hello", "world"]);
      expect(parseWords("\n\tfoo bar\n")).toEqual(["foo", "bar"]);
    });

    it("returns empty array for whitespace-only input", () => {
      expect(parseWords("")).toEqual([]);
      expect(parseWords("   ")).toEqual([]);
      expect(parseWords("\n\t  ")).toEqual([]);
    });
  });

  describe("punctuation handling — punctuation stays attached to words", () => {
    it("keeps trailing period attached to word", () => {
      expect(parseWords("Hello.")).toEqual(["Hello."]);
      expect(parseWords("The end.")).toEqual(["The", "end."]);
    });

    it("keeps trailing comma attached to word", () => {
      expect(parseWords("Hello, world")).toEqual(["Hello,", "world"]);
      expect(parseWords("one, two, three")).toEqual(["one,", "two,", "three"]);
    });

    it("keeps trailing question mark and exclamation attached", () => {
      expect(parseWords("Really?")).toEqual(["Really?"]);
      expect(parseWords("Wow!")).toEqual(["Wow!"]);
      expect(parseWords("Is it? Yes!")).toEqual(["Is", "it?", "Yes!"]);
    });

    it("keeps trailing quotes after punctuation", () => {
      expect(parseWords('He said "Hello."')).toEqual(["He", "said", '"Hello."']);
      expect(parseWords("What's that?")).toEqual(["What's", "that?"]);
    });

    it("keeps colon and semicolon attached", () => {
      expect(parseWords("Note: important")).toEqual(["Note:", "important"]);
      expect(parseWords("first; second")).toEqual(["first;", "second"]);
    });

    it("keeps em dash attached", () => {
      expect(parseWords("one—two")).toEqual(["one—two"]);
      expect(parseWords("word—another")).toEqual(["word—another"]);
    });

    it("keeps hyphenated words as single tokens", () => {
      expect(parseWords("well-known")).toEqual(["well-known"]);
      expect(parseWords("state-of-the-art")).toEqual(["state-of-the-art"]);
    });

    it("keeps double hyphen (--) attached", () => {
      expect(parseWords("word--another")).toEqual(["word--another"]);
    });

    it("handles mixed punctuation in sentence", () => {
      expect(parseWords("Hello, world! How are you?")).toEqual([
        "Hello,",
        "world!",
        "How",
        "are",
        "you?",
      ]);
    });

    it("handles ellipsis as single token when no spaces", () => {
      expect(parseWords("Wait...")).toEqual(["Wait..."]);
      expect(parseWords("No... really?")).toEqual(["No...", "really?"]);
    });

    it("handles apostrophes in contractions", () => {
      expect(parseWords("don't can't")).toEqual(["don't", "can't"]);
      expect(parseWords("it's")).toEqual(["it's"]);
    });

    it("handles numbers with punctuation", () => {
      expect(parseWords("3.14")).toEqual(["3.14"]);
      expect(parseWords("1,000")).toEqual(["1,000"]);
    });
  });

  describe("improper grammar and edge cases", () => {
    it("missing space after comma — treats as single token", () => {
      expect(parseWords("Hello,world")).toEqual(["Hello,world"]);
      expect(parseWords("one,two,three")).toEqual(["one,two,three"]);
    });

    it("double space after period (common typo)", () => {
      expect(parseWords("The end.  Next sentence.")).toEqual([
        "The",
        "end.",
        "Next",
        "sentence.",
      ]);
    });

    it("multiple exclamation or question marks", () => {
      expect(parseWords("Wow!!!")).toEqual(["Wow!!!"]);
      expect(parseWords("Really???")).toEqual(["Really???"]);
      expect(parseWords("What?!")).toEqual(["What?!"]);
      expect(parseWords("No way!?")).toEqual(["No", "way!?"]);
    });

    it("run-on sentence with no punctuation between clauses", () => {
      expect(parseWords("I went to the store I bought milk")).toEqual([
        "I",
        "went",
        "to",
        "the",
        "store",
        "I",
        "bought",
        "milk",
      ]);
    });

    it("sentence with no ending punctuation", () => {
      expect(parseWords("This has no period")).toEqual([
        "This",
        "has",
        "no",
        "period",
      ]);
    });

    it("punctuation at start of token (no space before)", () => {
      expect(parseWords("Hello .World")).toEqual(["Hello", ".World"]);
      expect(parseWords("Yes ,no")).toEqual(["Yes", ",no"]);
    });

    it("Unicode ellipsis character (…) vs three periods", () => {
      expect(parseWords("Wait…")).toEqual(["Wait…"]);
      expect(parseWords("No… really")).toEqual(["No…", "really"]);
    });

    it("em dash with inconsistent spacing", () => {
      expect(parseWords("word — another")).toEqual(["word", "—", "another"]);
      expect(parseWords("word— another")).toEqual(["word—", "another"]);
    });

    it("abbreviations that could be sentence boundaries", () => {
      expect(parseWords("Mr. Smith left")).toEqual(["Mr.", "Smith", "left"]);
      expect(parseWords("Dr. Jones said")).toEqual(["Dr.", "Jones", "said"]);
      expect(parseWords("etc. and more")).toEqual(["etc.", "and", "more"]);
    });

    it("all caps", () => {
      expect(parseWords("HELLO WORLD")).toEqual(["HELLO", "WORLD"]);
      expect(parseWords("STOP!!!")).toEqual(["STOP!!!"]);
    });

    it("punctuation-only or nearly-empty tokens", () => {
      expect(parseWords("...")).toEqual(["..."]);
      expect(parseWords("---")).toEqual(["---"]);
      expect(parseWords("... and then")).toEqual(["...", "and", "then"]);
    });

    it("odd spacing around punctuation", () => {
      expect(parseWords("word  ,  word")).toEqual(["word", ",", "word"]);
      expect(parseWords("hello  .  world")).toEqual(["hello", ".", "world"]);
    });

    it("comma splice (grammatically incorrect but common)", () => {
      expect(parseWords("I ran, she walked")).toEqual([
        "I",
        "ran,",
        "she",
        "walked",
      ]);
    });

    it("fragment starting with conjunction", () => {
      expect(parseWords("And then he left.")).toEqual([
        "And",
        "then",
        "he",
        "left.",
      ]);
    });

    it("repeated punctuation in middle of sentence", () => {
      expect(parseWords("He said... um... nothing.")).toEqual([
        "He",
        "said...",
        "um...",
        "nothing.",
      ]);
    });
  });
});

describe("wordEndsSentence", () => {
  it("returns true for words ending in period", () => {
    expect(wordEndsSentence("end.")).toBe(true);
    expect(wordEndsSentence("Dr.")).toBe(true);
    expect(wordEndsSentence("U.S.A.")).toBe(true);
  });

  it("returns true for words ending in question mark", () => {
    expect(wordEndsSentence("really?")).toBe(true);
    expect(wordEndsSentence("what?")).toBe(true);
  });

  it("returns true for words ending in exclamation", () => {
    expect(wordEndsSentence("wow!")).toBe(true);
    expect(wordEndsSentence("stop!")).toBe(true);
  });

  it("returns true when sentence-ending punctuation is followed by closing quote", () => {
    expect(wordEndsSentence('said."')).toBe(true);
    expect(wordEndsSentence('end."')).toBe(true);
    expect(wordEndsSentence("really?'")).toBe(true);
  });

  it("returns false for words ending in comma", () => {
    expect(wordEndsSentence("hello,")).toBe(false);
    expect(wordEndsSentence("well,")).toBe(false);
  });

  it("returns false for words ending in colon or semicolon", () => {
    expect(wordEndsSentence("Note:")).toBe(false);
    expect(wordEndsSentence("first;")).toBe(false);
  });

  it("returns false for words ending in em dash", () => {
    expect(wordEndsSentence("word—")).toBe(false);
  });

  it("returns false for words without sentence-ending punctuation", () => {
    expect(wordEndsSentence("hello")).toBe(false);
    expect(wordEndsSentence("middle")).toBe(false);
  });

  it("returns false for empty or whitespace-only", () => {
    expect(wordEndsSentence("")).toBe(false);
    expect(wordEndsSentence("   ")).toBe(false);
  });

  it("handles period in middle of word", () => {
    expect(wordEndsSentence("U.S.A")).toBe(false);
    expect(wordEndsSentence("3.14")).toBe(false);
  });

  it("mixed interrobang-style punctuation (?! or !?)", () => {
    expect(wordEndsSentence("What?!")).toBe(true);
    expect(wordEndsSentence("Really!?")).toBe(true);
  });
});

describe("wordHasPausePunctuation", () => {
  it("returns true for words ending in comma", () => {
    expect(wordHasPausePunctuation("hello,")).toBe(true);
    expect(wordHasPausePunctuation("well,")).toBe(true);
  });

  it("returns true for words ending in colon", () => {
    expect(wordHasPausePunctuation("Note:")).toBe(true);
    expect(wordHasPausePunctuation("following:")).toBe(true);
  });

  it("returns true for words ending in semicolon", () => {
    expect(wordHasPausePunctuation("first;")).toBe(true);
    expect(wordHasPausePunctuation("however;")).toBe(true);
  });

  it("returns true for words ending in em dash", () => {
    expect(wordHasPausePunctuation("word—")).toBe(true);
    expect(wordHasPausePunctuation("something—")).toBe(true);
  });

  it("returns true for words ending in double hyphen", () => {
    expect(wordHasPausePunctuation("word--")).toBe(true);
  });

  it("returns true when pause punctuation is followed by closing quote", () => {
    expect(wordHasPausePunctuation('said,"')).toBe(true);
    expect(wordHasPausePunctuation("well—'")).toBe(true);
  });

  it("returns false for words ending in period, question, or exclamation", () => {
    expect(wordHasPausePunctuation("end.")).toBe(false);
    expect(wordHasPausePunctuation("really?")).toBe(false);
    expect(wordHasPausePunctuation("wow!")).toBe(false);
  });

  it("returns false for words without pause punctuation", () => {
    expect(wordHasPausePunctuation("hello")).toBe(false);
    expect(wordHasPausePunctuation("middle")).toBe(false);
  });

  it("returns false for empty or whitespace-only", () => {
    expect(wordHasPausePunctuation("")).toBe(false);
    expect(wordHasPausePunctuation("   ")).toBe(false);
  });

  it("punctuation-only token (e.g. stray comma or em dash)", () => {
    expect(wordHasPausePunctuation(",")).toBe(true);
    expect(wordHasPausePunctuation("—")).toBe(true);
    expect(wordHasPausePunctuation("--")).toBe(true);
  });
});

describe("getFocalCharacterIndex", () => {
  it("returns 0 for single-character words", () => {
    expect(getFocalCharacterIndex("a")).toBe(0);
    expect(getFocalCharacterIndex("I")).toBe(0);
  });

  it("returns 1 for words 2–5 characters", () => {
    expect(getFocalCharacterIndex("ab")).toBe(1);
    expect(getFocalCharacterIndex("word")).toBe(1);
    expect(getFocalCharacterIndex("hello")).toBe(1);
  });

  it("returns 2 for words 6–9 characters", () => {
    expect(getFocalCharacterIndex("longer")).toBe(2);
    expect(getFocalCharacterIndex("beautiful")).toBe(2);
  });

  it("returns 3 for words 10–13 characters", () => {
    expect(getFocalCharacterIndex("extraordinary")).toBe(3);
  });

  it("returns 4 for words 14+ characters", () => {
    expect(getFocalCharacterIndex("supercalifragilistic")).toBe(4);
  });
});

describe("getWordParts", () => {
  it("splits word into left, focal character, and right", () => {
    expect(getWordParts("hello")).toEqual({
      left: "h",
      focalCharacter: "e",
      right: "llo",
    });
  });

  it("handles single character", () => {
    expect(getWordParts("a")).toEqual({
      left: "",
      focalCharacter: "a",
      right: "",
    });
  });

  it("handles word with punctuation (focal logic unchanged)", () => {
    const parts = getWordParts("world!");
    expect(parts.focalCharacter).toBeDefined();
    expect(parts.left + parts.focalCharacter + parts.right).toBe("world!");
  });
});
