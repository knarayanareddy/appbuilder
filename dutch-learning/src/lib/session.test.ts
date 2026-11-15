import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type Attempt, type CardState, type Snapshot } from "@/types";
import { SENTENCES } from "./content";
import { DAY_MS } from "./fsrs";
import {
  applyAnswer,
  buildQueue,
  dueCount,
  gradeFor,
  introducedToday,
  kindForStage,
  newAvailable,
  startOfDay,
  type QueueItem,
} from "./session";

const NOW = 1_700_000_000_000;

function snapshot(cards: CardState[] = [], attempts: Attempt[] = []): Snapshot {
  return { cards, attempts, settings: DEFAULT_SETTINGS };
}

function card(sentenceId: string, overrides: Partial<CardState> = {}): CardState {
  return {
    sentenceId,
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

describe("session", () => {
  it("maps a stage to a drill and back again", () => {
    expect(kindForStage(0)).toBe("study");
    expect(kindForStage(1)).toBe("cloze");
    expect(kindForStage(2)).toBe("listen");
    expect(kindForStage(3)).toBe("produce");
  });

  it("queues due cards and the day's new sentences, reviews first", () => {
    const queue = buildQueue(snapshot([card(SENTENCES[0].id), card(SENTENCES[1].id)]), NOW);

    expect(queue.slice(0, 2).every((item) => !item.isNew)).toBe(true);
    const newItems = queue.filter((item) => item.isNew);
    expect(newItems).toHaveLength(DEFAULT_SETTINGS.dailyNew);
    // the fifth slot is the first new sentence: four reviews, then something new
    expect(queue[4]?.isNew).toBe(true);
  });

  it("respects the new-sentence allowance once they have been introduced today", () => {
    const introduced: Attempt = {
      id: "a",
      sentenceId: SENTENCES[0].id,
      kind: "study",
      at: startOfDay(NOW) + 1000,
      grade: 2,
      correct: true,
      ms: 1000,
      typed: "",
    };

    expect(introducedToday([introduced], NOW)).toBe(1);
    expect(introducedToday([{ ...introduced, at: NOW - 3 * DAY_MS }], NOW)).toBe(0);
    expect(newAvailable(snapshot([], [introduced]), NOW)).toBe(DEFAULT_SETTINGS.dailyNew - 1);
  });

  it("counts only cards that are due", () => {
    expect(dueCount(snapshot([card(SENTENCES[0].id), card(SENTENCES[1].id, { due: NOW + DAY_MS })]), NOW)).toBe(1);
  });

  it("introduces a new sentence and moves it straight to the first drill", () => {
    const item: QueueItem = {
      sentence: SENTENCES[0],
      card: card(SENTENCES[0].id),
      kind: "study",
      isNew: true,
    };

    const updated = applyAnswer(item, { correct: true, almost: false }, NOW);
    expect(updated.stage).toBe(1);
    expect(updated.reps).toBe(1);
    expect(updated.due).toBeGreaterThan(NOW);
  });

  it("promotes on success and demotes on failure", () => {
    const item: QueueItem = { sentence: SENTENCES[0], card: card(SENTENCES[0].id, { stage: 2 }), kind: "listen", isNew: false };

    expect(applyAnswer(item, { correct: true, almost: false }, NOW).stage).toBe(3);
    expect(applyAnswer(item, { correct: false, almost: false }, NOW).stage).toBe(1);
    expect(applyAnswer(item, { correct: false, almost: false }, NOW).lapses).toBe(1);
  });

  it("grades an almost-answer as hard rather than good", () => {
    expect(gradeFor({ correct: true, almost: false })).toBe(3);
    expect(gradeFor({ correct: true, almost: true })).toBe(2);
    expect(gradeFor({ correct: false, almost: false })).toBe(1);
  });

  it("never promotes past the last stage", () => {
    const item: QueueItem = { sentence: SENTENCES[0], card: card(SENTENCES[0].id, { stage: 3 }), kind: "produce", isNew: false };
    expect(applyAnswer(item, { correct: true, almost: false }, NOW).stage).toBe(3);
  });
});
