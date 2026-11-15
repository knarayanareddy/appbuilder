import { beforeEach, describe, expect, it } from "vitest";
import type { Attempt, CardState } from "@/types";
import { SENTENCES } from "./content";
import { configureDb, kvSet } from "./db";
import {
  appendAttempt,
  exportSnapshot,
  importSnapshot,
  loadSnapshot,
  normaliseCard,
  saveCards,
  saveSettings,
} from "./repo";

let counter = 0;

beforeEach(() => {
  counter += 1;
  configureDb({ name: `taal-repo-test-${counter}` });
});

function card(overrides: Partial<CardState> = {}): CardState {
  return {
    sentenceId: SENTENCES[0].id,
    stage: 1,
    stability: 4,
    difficulty: 5,
    due: Date.now(),
    reps: 3,
    lapses: 0,
    lastReview: Date.now(),
    ...overrides,
  };
}

describe("repo", () => {
  it("starts empty with the default settings", async () => {
    const snapshot = await loadSnapshot();
    expect(snapshot.cards).toEqual([]);
    expect(snapshot.attempts).toEqual([]);
    expect(snapshot.settings.dailyNew).toBe(6);
    expect(snapshot.settings.desiredRetention).toBe(0.9);
  });

  it("round-trips cards and settings", async () => {
    await saveCards([card()]);
    await saveSettings({ dailyNew: 12, desiredRetention: 0.85, rate: 1.1 });

    const snapshot = await loadSnapshot();
    expect(snapshot.cards).toHaveLength(1);
    expect(snapshot.cards[0].stability).toBe(4);
    expect(snapshot.settings.dailyNew).toBe(12);
    expect(snapshot.settings.rate).toBe(1.1);
  });

  it("repairs a card written by an older build", async () => {
    // A record with only an id: everything else must be filled in, not trusted.
    await kvSet("cards", [{ sentenceId: SENTENCES[1].id }]);

    const [repaired] = (await loadSnapshot()).cards;
    expect(repaired.stage).toBe(0);
    expect(repaired.stability).toBeGreaterThan(0);
    expect(repaired.difficulty).toBe(5);
    expect(repaired.reps).toBe(0);
    expect(repaired.lastReview).toBeNull();
  });

  it("clamps nonsense values instead of keeping them", () => {
    expect(normaliseCard({ sentenceId: "s001", stage: 99 }).stage).toBe(3);
    expect(normaliseCard({ sentenceId: "s001", stage: -4 }).stage).toBe(0);
    expect(normaliseCard({ sentenceId: "s001", difficulty: 400 }).difficulty).toBe(10);
  });

  it("drops cards whose sentence no longer exists", async () => {
    await kvSet("cards", [card(), { sentenceId: "removed-999", stage: 1 }]);
    expect((await loadSnapshot()).cards).toHaveLength(1);
  });

  it("appends attempts in order", async () => {
    const attempt: Attempt = {
      id: "a1",
      sentenceId: SENTENCES[0].id,
      kind: "cloze",
      at: Date.now(),
      grade: 3,
      correct: true,
      ms: 4200,
      typed: "fiets",
    };
    await appendAttempt(attempt);
    await appendAttempt({ ...attempt, id: "a2" });

    const snapshot = await loadSnapshot();
    expect(snapshot.attempts.map((entry) => entry.id)).toEqual(["a1", "a2"]);
  });

  it("exports and restores a backup", async () => {
    await saveCards([card()]);
    await saveSettings({ dailyNew: 9, desiredRetention: 0.92, rate: 0.8 });
    const original = await loadSnapshot();

    const result = await importSnapshot(exportSnapshot(original));
    expect(result.cards).toBe(1);
    expect(result.snapshot.settings.dailyNew).toBe(9);
    expect((await loadSnapshot()).cards).toHaveLength(1);
  });

  it("refuses a file that is not a backup", async () => {
    await expect(importSnapshot("not json at all")).rejects.toThrow(/not JSON/i);
    await expect(importSnapshot('{"hello":true}')).rejects.toThrow(/Taal backup/i);
  });
});
