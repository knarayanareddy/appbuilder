import { describe, expect, it } from "vitest";
import { clozeIndex, clozeParts, feedback, judge, levenshtein, maskWord, normalise } from "./text";

describe("text", () => {
  it("normalises case, punctuation and spacing", () => {
    expect(normalise("  Ik  heet   Anna! ")).toBe("ik heet anna");
    expect(normalise("Hoe gaat het?")).toBe("hoe gaat het");
  });

  it("accepts an exact answer", () => {
    expect(judge("De fiets staat hier.", "de fiets staat hier").ok).toBe(true);
    expect(judge("de fiets staat hier", "de fiets staat hier").almost).toBe(false);
  });

  it("accepts a small typo but marks it as almost", () => {
    const result = judge("de fiets stact hier", "de fiets staat hier");
    expect(result.ok).toBe(true);
    expect(result.almost).toBe(true);
  });

  it("rejects a different word", () => {
    const result = judge("de fiets staat daar", "de fiets staat hier");
    expect(result.ok).toBe(false);
  });

  it("measures edit distance", () => {
    expect(levenshtein("fiets", "fiets")).toBe(0);
    expect(levenshtein("fiets", "viets")).toBe(1);
    expect(levenshtein("", "abc")).toBe(3);
  });

  it("points at the missing word", () => {
    const tokens = feedback("de fiets staat", "de fiets staat hier");
    expect(tokens).toEqual([
      { token: "de", status: "ok" },
      { token: "fiets", status: "ok" },
      { token: "staat", status: "ok" },
      { token: "hier", status: "wrong" },
    ]);
  });

  it("hides the longest word in a cloze", () => {
    const sentence = "De verwarming werkt niet.";
    const parts = clozeParts(sentence);
    expect(parts.word).toBe("verwarming");
    expect(parts.before).toBe("De");
    expect(parts.after).toBe("werkt niet.");
    expect(clozeIndex(sentence)).toBe(1);
  });

  it("masks a word by length without revealing it", () => {
    expect(maskWord("station")).toBe("s······");
    expect(maskWord("de")).toBe("d·");
  });
});
