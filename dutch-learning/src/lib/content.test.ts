import { describe, expect, it } from "vitest";
import { CONTENT_STATS, KNOWN_TAGS, SENTENCES, THEMES, sentenceById } from "./content";

describe("content", () => {
  it("has a usable seed", () => {
    expect(CONTENT_STATS.total).toBeGreaterThanOrEqual(80);
    expect(CONTENT_STATS.themes).toBeGreaterThanOrEqual(8);
    expect(CONTENT_STATS.a1).toBeGreaterThan(30);
    expect(CONTENT_STATS.a2).toBeGreaterThan(20);
  });

  it("uses unique ids and does not repeat a sentence", () => {
    const ids = new Set(SENTENCES.map((sentence) => sentence.id));
    expect(ids.size).toBe(SENTENCES.length);

    const dutch = new Set(SENTENCES.map((sentence) => sentence.nl.toLowerCase()));
    expect(dutch.size).toBe(SENTENCES.length);
  });

  it("fills every field the UI reads", () => {
    for (const sentence of SENTENCES) {
      expect(sentence.nl.trim().length).toBeGreaterThan(3);
      expect(sentence.en.trim().length).toBeGreaterThan(3);
      expect(sentence.lit.trim().length).toBeGreaterThan(3);
      expect(["A1", "A2"]).toContain(sentence.level);
      expect(sentence.skills.length).toBeGreaterThan(0);
      expect(THEMES).toContain(sentence.theme);
      for (const tag of sentence.tags) expect(KNOWN_TAGS).toContain(tag);
    }
  });

  it("starts Dutch sentences with a capital and ends them like a sentence", () => {
    for (const sentence of SENTENCES) {
      expect(sentence.nl[0]).toBe(sentence.nl[0].toUpperCase());
      expect(sentence.nl.trim().slice(-1)).toMatch(/[.?!]/);
    }
  });

  it("looks sentences up by id", () => {
    expect(sentenceById(SENTENCES[0].id)?.nl).toBe(SENTENCES[0].nl);
    expect(sentenceById("nope")).toBeUndefined();
  });
});
