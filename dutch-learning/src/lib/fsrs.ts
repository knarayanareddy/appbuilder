import type { CardState } from "@/types";

/**
 * FSRS (Free Spaced Repetition Scheduler) — the same family of formulas Anki ships
 * as an alternative to SM-2, with the published default weights. Intervals are
 * derived from a target recall probability instead of a fixed multiplier, which is
 * what makes "90% retention" a real setting rather than a slogan.
 *
 * Reference: open-spaced-repetition/free-spaced-repetition-scheduler.
 */
export const FSRS_WEIGHTS = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246,
  1.587, 0.2272, 2.8755,
];

const DECAY = -0.5;
const FACTOR = 19 / 81;
export const DAY_MS = 86_400_000;
export const MIN_STABILITY = 0.1;
/** A year is enough; beyond that the schedule stops being meaningful. */
const MAX_INTERVAL_DAYS = 365;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** Probability of remembering something `elapsedDays` after it was last seen. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

/** Days until recall drops to `retention` (0.9 → roughly the stability itself). */
export function intervalDays(stability: number, retention: number): number {
  const target = clamp(retention, 0.7, 0.97);
  const raw = (stability / FACTOR) * (Math.pow(target, 1 / DECAY) - 1);
  return clamp(Math.round(raw), 1, MAX_INTERVAL_DAYS);
}

export function initialDifficulty(grade: number): number {
  return clamp(FSRS_WEIGHTS[4] - (grade - 3) * FSRS_WEIGHTS[5], 1, 10);
}

export function initialStability(grade: number): number {
  return Math.max(MIN_STABILITY, FSRS_WEIGHTS[clamp(grade, 1, 4) - 1]);
}

/** A card for a sentence that has never been seen. */
export function newCard(itemId: string, grade: number, now: number, retention: number): CardState {
  const stability = initialStability(grade);
  return {
    itemId,
    stage: 0,
    stability,
    difficulty: initialDifficulty(grade),
    due: now + intervalDays(stability, retention) * DAY_MS,
    reps: 1,
    lapses: 0,
    lastReview: now,
  };
}

/**
 * Apply one graded review. Grade 1 = forgot, 2 = hard, 3 = good, 4 = easy.
 * A lapse never pushes the card further out than it already was, which keeps the
 * scheduler honest when a forgotten card is re-shown the same day.
 */
export function review(card: CardState, grade: number, now: number, retention: number): CardState {
  const w = FSRS_WEIGHTS;
  const elapsed = card.lastReview === null ? 0 : Math.max(0, (now - card.lastReview) / DAY_MS);
  const recall = retrievability(elapsed, card.stability);

  const dPrime = card.difficulty - w[6] * (grade - 3);
  const difficulty = clamp(w[7] * w[4] + (1 - w[7]) * dPrime, 1, 10);

  let stability: number;
  if (grade <= 1) {
    stability =
      w[11] *
      Math.pow(difficulty, -w[12]) *
      (Math.pow(card.stability + 1, w[13]) - 1) *
      Math.exp(w[14] * (1 - recall));
    stability = clamp(stability, MIN_STABILITY, Math.max(MIN_STABILITY, card.stability));
  } else {
    const hardPenalty = grade === 2 ? w[15] : 1;
    const easyBonus = grade === 4 ? w[16] : 1;
    stability =
      card.stability *
      (1 +
        Math.exp(w[8]) *
          (11 - difficulty) *
          Math.pow(card.stability, -w[9]) *
          (Math.exp(w[10] * (1 - recall)) - 1) *
          hardPenalty *
          easyBonus);
    stability = Math.max(MIN_STABILITY, stability);
  }

  const interval = grade <= 1 ? 1 : intervalDays(stability, retention);

  return {
    ...card,
    stability,
    difficulty,
    due: now + interval * DAY_MS,
    reps: card.reps + 1,
    lapses: card.lapses + (grade <= 1 ? 1 : 0),
    lastReview: now,
  };
}

/** A card is "known" once it survives three weeks of not being seen. */
export const KNOWN_STABILITY = 21;

export function isKnown(card: CardState): boolean {
  return card.stability >= KNOWN_STABILITY;
}
