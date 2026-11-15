import { describe, expect, it } from "vitest";
import { DAY_MS, initialDifficulty, intervalDays, newCard, retrievability, review } from "./fsrs";

const NOW = 1_700_000_000_000;
const card = () => newCard("s001", 3, NOW, 0.9);

describe("fsrs", () => {
  it("schedules a new card roughly its stability ahead at 90% retention", () => {
    const fresh = card();
    expect(fresh.due).toBeGreaterThan(NOW);
    const days = (fresh.due - NOW) / DAY_MS;
    // At 90% the interval is about the stability itself (w[2] ≈ 3.7 days for "good").
    expect(days).toBeGreaterThanOrEqual(3);
    expect(days).toBeLessThanOrEqual(5);
  });

  it("loses retrievability as time passes", () => {
    const stability = 10;
    expect(retrievability(0, stability)).toBeCloseTo(1, 5);
    expect(retrievability(5, stability)).toBeGreaterThan(retrievability(30, stability));
    expect(retrievability(365, stability)).toBeLessThan(0.75);
  });

  it("grows the interval after a good review", () => {
    const fresh = card();
    const later = review(fresh, 3, NOW + 2 * DAY_MS, 0.9);
    expect(later.stability).toBeGreaterThan(fresh.stability);
    expect(later.due - (NOW + 2 * DAY_MS)).toBeGreaterThan(fresh.due - NOW);
    expect(later.reps).toBe(fresh.reps + 1);
    expect(later.lapses).toBe(0);
  });

  it("pulls a forgotten card back to tomorrow and never pushes it out", () => {
    const remembered = review(card(), 3, NOW + 2 * DAY_MS, 0.9);
    const forgotten = review(remembered, 1, NOW + 4 * DAY_MS, 0.9);

    expect(forgotten.lapses).toBe(1);
    expect(forgotten.stability).toBeLessThanOrEqual(remembered.stability);
    expect(Math.round((forgotten.due - (NOW + 4 * DAY_MS)) / DAY_MS)).toBe(1);
  });

  it("rewards easy over hard", () => {
    const base = review(card(), 3, NOW + 2 * DAY_MS, 0.9);
    const hard = review(base, 2, NOW + 4 * DAY_MS, 0.9);
    const easy = review(base, 4, NOW + 4 * DAY_MS, 0.9);
    expect(easy.stability).toBeGreaterThan(hard.stability);
  });

  it("asks for shorter intervals when the learner wants higher recall", () => {
    expect(intervalDays(30, 0.95)).toBeLessThan(intervalDays(30, 0.8));
    expect(intervalDays(30, 0.9)).toBeGreaterThan(20);
  });

  it("keeps difficulty inside its bounds", () => {
    let current = card();
    for (let i = 0; i < 30; i += 1) current = review(current, 1, NOW + (i + 1) * DAY_MS, 0.9);
    expect(current.difficulty).toBeGreaterThanOrEqual(1);
    expect(current.difficulty).toBeLessThanOrEqual(10);
    expect(initialDifficulty(1)).toBeGreaterThan(initialDifficulty(4));
  });

  it("caps intervals at a year so nothing disappears forever", () => {
    expect(intervalDays(10_000, 0.9)).toBeLessThanOrEqual(365);
  });
});
