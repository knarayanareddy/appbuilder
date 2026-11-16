import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type Attempt, type CardState, type Snapshot } from "@/types";
import { buildRegistry, itemKey, unitKey, type Registry } from "./module";
import { DAY_MS } from "./fsrs";
import {
  applyAnswer,
  buildSession,
  dueCount,
  gradeFor,
  introducedToday,
  kindForStage,
  newAvailable,
  startOfDay,
  type SessionItem,
} from "./session";

const NOW = 1_700_000_000_000;
const registry: Registry = buildRegistry([]);
const FIRST = itemKey("nl-basis", "kennismaking", "s001");
const SECOND = itemKey("nl-basis", "kennismaking", "s002");

function snapshot(cards: CardState[] = [], attempts: Attempt[] = []): Snapshot {
  return { cards, attempts, settings: DEFAULT_SETTINGS, modules: [], reports: [] };
}

function card(itemId: string, overrides: Partial<CardState> = {}): CardState {
  return {
    itemId,
    stage: 1,
    stability: 4,
    difficulty: 5,
    due: NOW - 1000,
    reps: 2,
    lapses: 0,
    lastReview: NOW - DAY_MS,
    ...overrides,
  };
}

const deterministic = () => 0.42;

describe("the drill ladder", () => {
  it("walks from reading to production", () => {
    expect(kindForStage(0)).toBe("study");
    expect(kindForStage(1)).toBe("cloze");
    expect(kindForStage(2)).toBe("choice");
    expect(kindForStage(3)).toBe("bank");
    expect(kindForStage(4)).toBe("listen");
    expect(kindForStage(5)).toBe("produce");
    expect(kindForStage(99)).toBe("produce");
  });

  it("grades an almost-answer as hard rather than good", () => {
    expect(gradeFor({ correct: true, almost: false })).toBe(3);
    expect(gradeFor({ correct: true, almost: true })).toBe(2);
    expect(gradeFor({ correct: false, almost: false })).toBe(1);
  });
});

describe("daily session", () => {
  it("does reviews first and drops a new sentence in every fifth slot", () => {
    const queue = buildSession(registry, snapshot([card(FIRST), card(SECOND)]), NOW, { mode: "daily" });

    expect(queue.slice(0, 2).every((item) => !item.isNew)).toBe(true);
    expect(queue.filter((item) => item.isNew)).toHaveLength(DEFAULT_SETTINGS.dailyNew);
    expect(queue[4]?.isNew).toBe(true);
  });

  it("respects the pace once sentences have been introduced today", () => {
    const introduced: Attempt = {
      id: "a",
      itemId: FIRST,
      kind: "study",
      at: startOfDay(NOW) + 1000,
      grade: 2,
      correct: true,
      ms: 1000,
      typed: "",
    };

    expect(introducedToday([introduced], NOW)).toBe(1);
    expect(introducedToday([{ ...introduced, at: NOW - 3 * DAY_MS }], NOW)).toBe(0);
    expect(newAvailable(registry, snapshot([], [introduced]), NOW)).toBe(DEFAULT_SETTINGS.dailyNew - 1);
  });

  it("counts only cards that are actually due", () => {
    expect(dueCount(snapshot([card(FIRST), card(SECOND, { due: NOW + DAY_MS })]), NOW)).toBe(1);
  });
});

describe("unlimited modes", () => {
  it("practise never runs out of material, even at pace zero", () => {
    const tight = { ...DEFAULT_SETTINGS, dailyNew: 0 };
    const queue = buildSession(registry, { ...snapshot([]), settings: tight }, NOW, { mode: "practice", limit: 40 });
    expect(queue.length).toBe(40);
    expect(queue.every((item) => item.isNew)).toBe(true);
  });

  it("practise prioritises what is weakest after the due cards", () => {
    const weak = card(FIRST, { due: NOW + DAY_MS, stability: 1 });
    const strong = card(SECOND, { due: NOW + DAY_MS, stability: 30 });
    const queue = buildSession(registry, snapshot([weak, strong]), NOW, { mode: "practice", limit: 4 });
    expect(queue[0].key).toBe(FIRST);
  });

  it("a quiz tests instead of teaching", () => {
    const queue = buildSession(registry, snapshot([card(FIRST, { stage: 0 })]), NOW, { mode: "quiz", limit: 12 }, deterministic);
    expect(queue).toHaveLength(12);
    expect(queue.some((item) => item.kind === "study")).toBe(false);
    // The card that had only ever been read is served as a choice, not as a reading card.
    expect(queue.find((item) => item.key === FIRST)?.kind).toBe("choice");
    expect(queue.every((item) => item.kind !== "study")).toBe(true);
  });

  it("a unit session walks that unit in order", () => {
    const queue = buildSession(registry, snapshot([]), NOW, { mode: "unit", unitKey: unitKey("nl-basis", "wonen") });
    expect(queue).toHaveLength(8);
    expect(queue[0].item.text).toBe("Ik huur een klein appartement.");
    expect(queue.every((item) => item.unit.id === "wonen")).toBe(true);
  });

  it("mistakes contains what you got wrong or forgot", () => {
    const miss: Attempt = {
      id: "m",
      itemId: SECOND,
      kind: "cloze",
      at: NOW - DAY_MS,
      grade: 1,
      correct: false,
      ms: 900,
      typed: "verkeerd",
    };
    const queue = buildSession(registry, snapshot([card(FIRST), card(SECOND)], [miss]), NOW, { mode: "mistakes" }, deterministic);
    expect(queue).toHaveLength(1);
    expect(queue[0].key).toBe(SECOND);
  });
});

describe("applyAnswer", () => {
  const item = (overrides: Partial<SessionItem> = {}): SessionItem => ({
    key: FIRST,
    item: registry.items.get(FIRST)!.item,
    unit: registry.items.get(FIRST)!.unit,
    module: registry.items.get(FIRST)!.module,
    card: card(FIRST),
    kind: "cloze",
    isNew: false,
    ttsLocale: "nl-NL",
    ...overrides,
  });

  it("introduces a new sentence and moves it to the first drill", () => {
    const updated = applyAnswer(item({ isNew: true, card: card(FIRST, { stage: 0 }) }), { correct: true, almost: false }, NOW);
    expect(updated.stage).toBe(1);
    expect(updated.reps).toBe(1);
    expect(updated.due).toBeGreaterThan(NOW);
  });

  it("promotes on success and demotes on failure", () => {
    expect(applyAnswer(item({ card: card(FIRST, { stage: 2 }) }), { correct: true, almost: false }, NOW).stage).toBe(3);
    expect(applyAnswer(item({ card: card(FIRST, { stage: 2 }) }), { correct: false, almost: false }, NOW).stage).toBe(1);
    expect(applyAnswer(item({ card: card(FIRST, { stage: 2 }) }), { correct: false, almost: false }, NOW).lapses).toBe(1);
  });

  it("never promotes past the top of the ladder", () => {
    expect(applyAnswer(item({ card: card(FIRST, { stage: 5 }) }), { correct: true, almost: false }, NOW).stage).toBe(5);
  });

  it("leaves the schedule alone in a quiz", () => {
    const before = card(FIRST, { stage: 3 });
    const after = applyAnswer(item({ card: before }), { correct: false, almost: false }, NOW, 0.9, { reschedule: false });
    expect(after.due).toBe(before.due);
    expect(after.stage).toBe(3);
    expect(after.lapses).toBe(before.lapses);
  });
});

describe("the flashcard deck", () => {
  it("reviews what is due, then adds new material up to the pace", () => {
    const queue = buildSession(registry, snapshot([card(FIRST), card(SECOND)]), NOW, {
      mode: "cards",
      limit: 6,
    });

    expect(queue.length).toBe(6);
    // Due sentences come first and are presented as plain fronts, not as a rung.
    expect(queue[0].key).toBe(FIRST);
    expect(queue[0].kind).toBe("study");
    expect(queue[1].key).toBe(SECOND);
    expect(queue.slice(2).every((entry) => entry.kind === "study")).toBe(true);
  });

  it("never invents more new sentences than the daily pace", () => {
    const early = snapshot([], []);
    const capped = buildSession(registry, early, NOW, { mode: "cards", limit: 40 });
    expect(capped.length).toBe(DEFAULT_SETTINGS.dailyNew);
  });

  it("keeps the deck review-only once today's pace is spent", () => {
    const introduced: Attempt[] = Array.from({ length: DEFAULT_SETTINGS.dailyNew }, (_, index) => ({
      id: `a${index}`,
      itemId: `nl-basis/kennismaking/s00${index + 1}`,
      kind: "study",
      at: startOfDay(NOW) + index,
      grade: 3,
      correct: true,
      ms: 900,
      typed: "",
    }));
    const queue = buildSession(registry, snapshot([card(FIRST)], introduced), NOW, { mode: "cards" });
    expect(queue.length).toBe(1);
    expect(queue[0].key).toBe(FIRST);
  });
});
