import type { Attempt, Snapshot } from "@/types";
import { SENTENCES, THEMES } from "./content";
import { DAY_MS, isKnown } from "./fsrs";
import { attemptsToday, dueCount, newAvailable, startOfDay } from "./session";

export interface Stats {
  due: number;
  newAvailable: number;
  known: number;
  learning: number;
  untouched: number;
  retention: number | null;
  reviewsLast7: number;
  attemptsToday: number;
  streak: number;
  byTheme: Array<{ theme: string; known: number; total: number }>;
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
export function hardestTags(attempts: Attempt[], now: number, limit = 4): Array<{ tag: string; misses: number }> {
  const misses = new Map<string, number>();
  const sentencesById = new Map(SENTENCES.map((sentence) => [sentence.id, sentence]));
  for (const attempt of attempts) {
    if (attempt.correct || attempt.at < now - 30 * DAY_MS) continue;
    const sentence = sentencesById.get(attempt.sentenceId);
    if (!sentence) continue;
    for (const tag of sentence.tags) {
      misses.set(tag, (misses.get(tag) ?? 0) + 1);
    }
  }
  return [...misses.entries()]
    .map(([tag, count]) => ({ tag, misses: count }))
    .sort((a, b) => b.misses - a.misses)
    .slice(0, limit);
}

export function computeStats(snapshot: Snapshot, now: number): Stats {
  const knownCards = snapshot.cards.filter(isKnown);
  const knownIds = new Set(knownCards.map((card) => card.sentenceId));

  return {
    due: dueCount(snapshot, now),
    newAvailable: newAvailable(snapshot, now),
    known: knownCards.length,
    learning: snapshot.cards.length - knownCards.length,
    untouched: SENTENCES.length - snapshot.cards.length,
    retention: retention(snapshot.attempts, now),
    reviewsLast7: snapshot.attempts.filter((attempt) => attempt.at >= now - WEEK_MS && attempt.kind !== "study").length,
    attemptsToday: attemptsToday(snapshot.attempts, now),
    streak: streakDays(snapshot.attempts, now),
    byTheme: THEMES.map((theme) => {
      const inTheme = SENTENCES.filter((sentence) => sentence.theme === theme);
      return {
        theme,
        total: inTheme.length,
        known: inTheme.filter((sentence) => knownIds.has(sentence.id)).length,
      };
    }),
    hardestTags: hardestTags(snapshot.attempts, now),
  };
}
