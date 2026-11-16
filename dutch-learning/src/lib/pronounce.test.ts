import { describe, expect, it } from "vitest";
import { normaliseSpeech, scoreSpeech, words } from "./pronounce";

describe("normalising what a recogniser returns", () => {
  it("ignores case, punctuation and accents", () => {
    expect(normaliseSpeech("  Ik heet  Anna! ")).toBe("ik heet anna");
    expect(normaliseSpeech("Hé, hoe gaat het?")).toBe("he, hoe gaat het".replace(",", ""));
  });

  it("splits into words and drops punctuation-only fragments", () => {
    expect(words("Ik wil graag een kilo appels.")).toEqual(["ik", "wil", "graag", "een", "kilo", "appels"]);
    expect(words("   ")).toEqual([]);
  });
});

describe("scoring a spoken sentence", () => {
  const target = "Ik wil graag een kilo appels.";

  it("accepts a clean reading", () => {
    const score = scoreSpeech("ik wil graag een kilo appels", target);
    expect(score.verdict).toBe("good");
    expect(score.score).toBe(1);
    expect(score.missing).toEqual([]);
  });

  it("treats a misheard word as almost — accepted, not perfect", () => {
    const score = scoreSpeech("ik wil graag een kilo appel", target);
    expect(score.verdict).toBe("almost");
    expect(score.score).toBeGreaterThan(0.5);
  });

  it("calls a missing word almost, not a failure", () => {
    const score = scoreSpeech("ik wil een kilo appels", target);
    expect(score.verdict).toBe("almost");
    expect(score.missing).toContain("graag");
  });

  it("ignores filler sounds", () => {
    expect(scoreSpeech("eh ik wil graag een kilo appels", target).verdict).toBe("good");
  });

  it("reports a miss when the words are not there", () => {
    const score = scoreSpeech("goedemorgen allemaal", target);
    expect(score.verdict).toBe("miss");
    expect(score.score).toBeLessThan(0.55);
  });

  it("does not punish silence as if it were an answer", () => {
    const score = scoreSpeech("", target);
    expect(score.verdict).toBe("miss");
    expect(score.score).toBe(0);
  });

  it("handles a target with no words at all", () => {
    expect(scoreSpeech("iets", "").verdict).toBe("miss");
  });
});
