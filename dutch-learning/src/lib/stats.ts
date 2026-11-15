import type { Attempt, Snapshot } from "@/types";
import { DAY_MS, isKnown } from "./fsrs";
import type { Registry } from "./module";
import { attemptsToday, dueCount, newAvailable, startOfDay } from "./session";

export interface UnitProgress {
  key: string;
  title: string;
  module: string;
  known: number;
  started: number;
  total: number;
}

export interface Stats {
  due: number;
  newAvailable: number;
  known: number;
  learning: number;
  untouched: number;
  total: number;
  retention: number | null;
  reviewsLast7: number;
  attemptsToday: number;
  streak: number;
  units: UnitProgress[];
  hardestTags: Array<{ tag: string; misses: number }>;
}

const WEEK_MS = 7 * DAY_MS;

/** Recall over the last week, ignoring the presentation step (it cannot be failed). */
export function retention(attempts: Attempt[], now: number): number | null {
  const recent = attempts.filter((attempt) => attempt.at >= now - WEEK_MS && attempt.kind !== "study");
  if (recent.length === 0) return null;
  return recent.filter((attempt) => attempt.correct).length / recent.length;
}

/** Consecutive days ending today (or yesterday, so a morning session keeps the run). */
export function streakDays(attempts: Attempt[], now: number): number {
  if (attempts.length === 0) return 0;
  const days = new Set(attempts.map((attempt) => startOfDay(attempt.at)));
  let cursor = startOfDay(now);
  if (!days.has(cursor)) cursor -= DAY_MS;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

/**
 * Most-missed grammar tags. This is the curriculum bending: if "separables" keeps
 * appearing here, the sentence mix should change.
 */
export function hardestTags(
  attempts: Attempt[],
  registry: Registry,
  now: number,
  limit = 5,
): Array<{ tag: string; misses: number }> {
  const misses = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.correct || attempt.at < now - 30 * DAY_MS) continue;
    const ref = registry.items.get(attempt.itemId);
    if (!ref) continue;
    for (const tag of ref.item.tags) {
      misses.set(tag, (misses.get(tag) ?? 0) + 1);
    }
  }
  return [...misses.entries()]
    .map(([tag, count]) => ({ tag, misses: count }))
    .sort((a, b) => b.misses - a.misses)
    .slice(0, limit);
}

export function computeStats(registry: Registry, snapshot: Snapshot, now: number): Stats {
  const knownCards = snapshot.cards.filter(isKnown);
  const knownIds = new Set(knownCards.map((card) => card.itemId));
  const startedIds = new Set(snapshot.cards.map((card) => card.itemId));

  return {
    due: dueCount(snapshot, now),
    newAvailable: newAvailable(registry, snapshot, now),
    known: knownCards.length,
    learning: snapshot.cards.length - knownCards.length,
    untouched: registry.items.size - snapshot.cards.length,
    total: registry.items.size,
    retention: retention(snapshot.attempts, now),
    reviewsLast7: snapshot.attempts.filter((attempt) => attempt.at >= now - WEEK_MS && attempt.kind !== "study").length,
    attemptsToday: attemptsToday(snapshot.attempts, now),
    streak: streakDays(snapshot.attempts, now),
    units: registry.units.map((entry) => ({
      key: entry.key,
      title: entry.unit.title,
      module: entry.module.title,
      total: entry.items.length,
      known: entry.items.filter((ref) => knownIds.has(ref.key)).length,
      started: entry.items.filter((ref) => startedIds.has(ref.key)).length,
    })),
    hardestTags: hardestTags(snapshot.attempts, registry, now),
  };
}
