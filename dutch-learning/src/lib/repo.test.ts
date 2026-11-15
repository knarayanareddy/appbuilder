import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type Attempt, type CardState } from "@/types";
import { itemKey } from "./module";
import { configureDb, kvSet } from "./db";
import {
  appendAttempt,
  appendReport,
  exportSnapshot,
  importSnapshot,
  loadSnapshot,
  normaliseCard,
  normaliseModules,
  saveCards,
  saveModules,
  saveSettings,
} from "./repo";

const KEY = itemKey("nl-basis", "kennismaking", "s001");
let counter = 0;

beforeEach(() => {
  counter += 1;
  configureDb({ name: `taal-repo-test-${counter}` });
});

function card(overrides: Partial<CardState> = {}): CardState {
  return {
    itemId: KEY,
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

const module = {
  schemaVersion: 1 as const,
  id: "es-proef",
  language: "es",
  title: "Proef",
  description: "Test module",
  units: [{ id: "hola", title: "Hola", blurb: "", level: "A1" as const, items: [{ id: "a", text: "Hola.", translation: "Hi.", tags: [] }] }],
};

describe("repo", () => {
  it("starts empty with the default settings", async () => {
    const snapshot = await loadSnapshot();
    expect(snapshot.cards).toEqual([]);
    expect(snapshot.attempts).toEqual([]);
    expect(snapshot.modules).toEqual([]);
    expect(snapshot.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips cards and settings", async () => {
    await saveCards([card()]);
    await saveSettings({ ...DEFAULT_SETTINGS, dailyNew: 12, rate: 1.1 });

    const snapshot = await loadSnapshot();
    expect(snapshot.cards).toHaveLength(1);
    expect(snapshot.cards[0].stability).toBe(4);
    expect(snapshot.settings.dailyNew).toBe(12);
    expect(snapshot.settings.rate).toBe(1.1);
  });

  it("repairs a card written by an older build", async () => {
    await kvSet("cards", [{ itemId: KEY }]);
    const [repaired] = (await loadSnapshot()).cards;
    expect(repaired.stage).toBe(0);
    expect(repaired.stability).toBeGreaterThan(0);
    expect(repaired.difficulty).toBe(5);
    expect(repaired.lastReview).toBeNull();
  });

  it("keeps the schedule of cards made before modules existed", async () => {
    // The first build wrote "s001"; that id must survive the upgrade.
    await kvSet("cards", [{ sentenceId: "s001", stage: 2, stability: 9, difficulty: 4, due: 123, reps: 5, lapses: 1 }]);
    const [migrated] = (await loadSnapshot()).cards;
    expect(migrated.itemId).toBe(KEY);
    expect(migrated.stability).toBe(9);
    expect(migrated.stage).toBe(2);
  });

  it("clamps nonsense values instead of keeping them", () => {
    expect(normaliseCard({ itemId: KEY, stage: 99 })!.stage).toBe(5);
    expect(normaliseCard({ itemId: KEY, stage: -4 })!.stage).toBe(0);
    expect(normaliseCard({ itemId: KEY, difficulty: 400 })!.difficulty).toBe(10);
    expect(normaliseCard({ itemId: "" })).toBeNull();
  });

  it("drops cards whose sentence no longer exists", async () => {
    await kvSet("cards", [card(), { itemId: "gone/away/1", stage: 1, stability: 2, difficulty: 5, due: 1, reps: 1, lapses: 0, lastReview: null }]);
    expect((await loadSnapshot()).cards).toHaveLength(1);
  });

  it("stores modules only when they validate", async () => {
    expect(normaliseModules([module, { id: "broken" }])).toHaveLength(1);
    await saveModules([module]);
    const snapshot = await loadSnapshot();
    expect(snapshot.modules).toHaveLength(1);
    expect(snapshot.modules[0].title).toBe("Proef");
  });

  it("appends attempts and reports", async () => {
    const attempt: Attempt = {
      id: "a1",
      itemId: KEY,
      kind: "cloze",
      at: Date.now(),
      grade: 3,
      correct: true,
      ms: 4200,
      typed: "fiets",
    };
    await appendAttempt(attempt);
    await appendAttempt({ ...attempt, id: "a2" });
    await appendReport({ itemId: KEY, note: "gloss looks off", at: Date.now() });

    const snapshot = await loadSnapshot();
    expect(snapshot.attempts.map((entry) => entry.id)).toEqual(["a1", "a2"]);
    expect(snapshot.reports[0].note).toBe("gloss looks off");
  });

  it("exports and restores a backup, modules included", async () => {
    await saveCards([card()]);
    await saveModules([module]);
    await saveSettings({ ...DEFAULT_SETTINGS, dailyNew: 9 });
    const original = await loadSnapshot();

    const result = await importSnapshot(exportSnapshot(original));
    expect(result.cards).toBe(1);
    expect(result.modules).toBe(1);
    expect(result.snapshot.settings.dailyNew).toBe(9);
    expect((await loadSnapshot()).modules).toHaveLength(1);
  });

  it("refuses a file that is not a backup", async () => {
    await expect(importSnapshot("not json at all")).rejects.toThrow(/not JSON/i);
    await expect(importSnapshot('{"hello":true}')).rejects.toThrow(/Taal backup/i);
  });
});
