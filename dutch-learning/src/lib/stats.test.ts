import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type Attempt, type CardState, type Snapshot } from "@/types";
import { SENTENCES } from "./content";
import { DAY_MS } from "./fsrs";
import { computeStats, hardestTags, retention, streakDays } from "./stats";

const NOW = 1_700_006_400_000;

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: Math.random().toString(36).slice(2),
    sentenceId: SENTENCES[0].id,
    kind: "cloze",
    at: NOW - 1000,
    grade: 3,
    correct: true,
    ms: 3000,
    typed: "fiets",
    ...overrides,
  };
}

function card(overrides: Partial<CardState> = {}): CardState {
  return {
    sentenceId: SENTENCES[0].id,
    stage: 3,
    stability: 30,
    difficulty: 4,
    due: NOW,
    reps: 6,
    lapses: 0,
    lastReview: NOW - DAY_MS,
    ...overrides,
  };
}

function snapshot(cards: CardState[], attempts: Attempt[]): Snapshot {
  return { cards, attempts, settings: DEFAULT_SETTINGS };
}

describe("stats", () => {
  it("ignores first presentations when measuring recall", () => {
    const attempts = [attempt({ kind: "study", correct: true }), attempt({ correct: false }), attempt({ correct: true })];
    expect(retention(attempts, NOW)).toBe(0.5);
  });

  it("returns nothing to measure when there are no reviews", () => {
    expect(retention([], NOW)).toBeNull();
    expect(retention([attempt({ kind: "study" })], NOW)).toBeNull();
  });

  it("only looks at the last week", () => {
    expect(retention([attempt({ at: NOW - 9 * DAY_MS, correct: false })], NOW)).toBeNull();
  });

  it("counts a streak across consecutive days", () => {
    const attempts = [attempt({ at: NOW }), attempt({ at: NOW - DAY_MS }), attempt({ at: NOW - 2 * DAY_MS })];
    expect(streakDays(attempts, NOW)).toBe(3);
  });

  it("keeps the streak alive from yesterday so a morning session is not punished", () => {
    expect(streakDays([attempt({ at: NOW - DAY_MS })], NOW)).toBe(1);
  });

  it("surfaces the tags that keep costing marks", () => {
    const separable = SENTENCES.find((sentence) => sentence.tags.includes("separable"))!;
    const tags = hardestTags([attempt({ sentenceId: separable.id, correct: false })], NOW);
    expect(tags.map((entry) => entry.tag)).toContain("separable");
    expect(tags.length).toBeGreaterThan(0);
  });

  it("summarises the library", () => {
    const stats = computeStats(snapshot([card()], [attempt()]), NOW);
    expect(stats.known).toBe(1);
    expect(stats.learning).toBe(0);
    expect(stats.untouched).toBe(SENTENCES.length - 1);
    expect(stats.byTheme.length).toBeGreaterThan(5);
  });
});
