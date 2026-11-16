import type { Attempt, CardKind, CardState, Item, Module, SessionMode, Snapshot, Unit } from "@/types";
import { DAY_MS, isKnown, newCard, review } from "./fsrs";
import type { Registry } from "./module";
import { languageFor } from "./languages";

export interface SessionItem {
  key: string;
  item: Item;
  unit: Unit;
  module: Module;
  card: CardState;
  kind: CardKind;
  isNew: boolean;
  ttsLocale: string;
}

export interface SessionRequest {
  mode: SessionMode;
  unitKey?: string;
  limit?: number;
  /** Placement check: right answers are scheduled as if already learned. */
  seed?: boolean;
}

/** The drill ladder. Every sentence climbs it; a failure drops it one rung. */
export const STAGE_KINDS: CardKind[] = ["study", "cloze", "choice", "bank", "listen", "produce"];
export const MAX_STAGE = STAGE_KINDS.length - 1;

export function kindForStage(stage: number): CardKind {
  return STAGE_KINDS[Math.min(MAX_STAGE, Math.max(0, Math.round(stage)))];
}

export function nextStage(stage: number, correct: boolean): number {
  return correct ? Math.min(MAX_STAGE, stage + 1) : Math.max(0, stage - 1);
}

export function startOfDay(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function introducedToday(attempts: Attempt[], now: number): number {
  const dayStart = startOfDay(now);
  const introduced = new Set(
    attempts.filter((attempt) => attempt.kind === "study" && attempt.at >= dayStart).map((attempt) => attempt.itemId),
  );
  return introduced.size;
}

export interface Answer {
  correct: boolean;
  /** Accepted but not exact — a spelling slip worth mentioning without failing the card. */
  almost: boolean;
}

/** 3 = good, 2 = hard, 1 = forgot. There is no "easy" button by design. */
export function gradeFor(answer: Answer): number {
  if (!answer.correct) return 1;
  return answer.almost ? 2 : 3;
}

function freshCard(key: string, now: number, retention: number): CardState {
  return { ...newCard(key, 2, now, retention), stage: 0 };
}

function toSessionItem(
  registry: Registry,
  key: string,
  card: CardState,
  kind: CardKind,
  isNew: boolean,
): SessionItem | null {
  const ref = registry.items.get(key);
  if (!ref) return null;
  return {
    key,
    item: ref.item,
    unit: ref.unit,
    module: ref.module,
    card,
    kind,
    isNew,
    ttsLocale: languageFor(ref.module.language).ttsLocale,
  };
}

function interleave(due: SessionItem[], fresh: SessionItem[], limit: number): SessionItem[] {
  const queue: SessionItem[] = [];
  let dueIndex = 0;
  let newIndex = 0;

  while ((dueIndex < due.length || newIndex < fresh.length) && queue.length < limit) {
    for (let i = 0; i < 4 && dueIndex < due.length && queue.length < limit; i += 1) {
      queue.push(due[dueIndex]);
      dueIndex += 1;
    }
    if (newIndex < fresh.length && queue.length < limit) {
      queue.push(fresh[newIndex]);
      newIndex += 1;
    }
  }
  return queue;
}

function shuffle<T>(list: T[], random: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * One function decides what you see next, for every mode. The daily session respects
 * the new-sentence pace; everything else is deliberately unlimited, because the point
 * of "keep going" is that nothing in the app should stop you.
 */
export function buildSession(
  registry: Registry,
  snapshot: Snapshot,
  now: number,
  request: SessionRequest,
  random: () => number = Math.random,
): SessionItem[] {
  const cards = new Map(snapshot.cards.map((card) => [card.itemId, card]));
  const retention = snapshot.settings.desiredRetention;
  const limit = request.limit ?? 80;

  const dueItems = () =>
    snapshot.cards
      .filter((card) => card.due <= now && card.stage > 0)
      .sort((a, b) => a.due - b.due)
      .map((card) => toSessionItem(registry, card.itemId, card, kindForStage(card.stage), false))
      .filter((entry): entry is SessionItem => entry !== null);

  const newItems = (cap: number) =>
    registry.units
      .flatMap((unit) => unit.items)
      .filter((ref) => !cards.has(ref.key))
      .slice(0, cap)
      .map((ref) => toSessionItem(registry, ref.key, freshCard(ref.key, now, retention), "study", true))
      .filter((entry): entry is SessionItem => entry !== null);

  if (request.mode === "daily") {
    const allowance = Math.max(0, snapshot.settings.dailyNew - introducedToday(snapshot.attempts, now));
    return interleave(dueItems(), newItems(allowance), limit);
  }

  if (request.mode === "practice") {
    // Everything due, then the weakest learning cards, then new material: no cap on
    // any of it, so "I want to keep going" is answered by the queue itself.
    const due = dueItems();
    const seen = new Set(due.map((entry) => entry.key));
    const weak = snapshot.cards
      .filter((card) => card.due > now && !seen.has(card.itemId) && card.stage > 0)
      .sort((a, b) => a.stability - b.stability)
      .map((card) => toSessionItem(registry, card.itemId, card, kindForStage(card.stage), false))
      .filter((entry): entry is SessionItem => entry !== null);

    return interleave(due, [...weak, ...newItems(limit)], limit);
  }

  if (request.mode === "quiz") {
    // A quiz tests, it does not teach: no study cards, and the answer is graded
    // against whatever rung the sentence is on.
    const pool: SessionItem[] = [];
    for (const unit of registry.units) {
      for (const ref of unit.items) {
        const card = cards.get(ref.key);
        const stage = card ? Math.max(2, card.stage) : 2;
        const base = card ?? { ...freshCard(ref.key, now, retention), stage: 2 };
        const entry = toSessionItem(registry, ref.key, base, kindForStage(stage), !card);
        if (entry) pool.push(entry);
      }
    }
    return shuffle(pool, random).slice(0, request.limit ?? 12);
  }

  if (request.mode === "unit") {
    const unit = registry.units.find((entry) => entry.key === request.unitKey);
    if (!unit) return [];
    return unit.items
      .map((ref) => {
        const card = cards.get(ref.key);
        return card
          ? toSessionItem(registry, ref.key, card, kindForStage(Math.max(1, card.stage)), false)
          : toSessionItem(registry, ref.key, freshCard(ref.key, now, retention), "study", true);
      })
      .filter((entry): entry is SessionItem => entry !== null)
      .slice(0, limit);
  }

  // mistakes: forgotten cards and anything answered wrong recently.
  const recentMisses = new Set(
    snapshot.attempts
      .filter((attempt) => !attempt.correct && attempt.at >= now - 14 * DAY_MS)
      .map((attempt) => attempt.itemId),
  );
  const troubled = snapshot.cards.filter((card) => card.lapses > 0 || recentMisses.has(card.itemId));
  const source = troubled.length > 0 ? troubled : snapshot.cards.filter((card) => !isKnown(card) && card.stage > 0);

  return shuffle(
    source
      .sort((a, b) => b.lapses - a.lapses || a.stability - b.stability)
      .map((card) => toSessionItem(registry, card.itemId, card, kindForStage(Math.max(1, card.stage)), false))
      .filter((entry): entry is SessionItem => entry !== null),
    random,
  ).slice(0, request.limit ?? 20);
}

/**
 * The single place a card moves. A new sentence is introduced with grade 2 (it was
 * just shown, not recalled) and promoted to the first real drill. Quizzes record the
 * answer but leave the schedule alone, which keeps a test from wrecking tomorrow.
 */
export function applyAnswer(
  item: SessionItem,
  answer: Answer,
  now: number,
  retention = 0.9,
  options: { reschedule?: boolean } = {},
): CardState {
  const reschedule = options.reschedule ?? true;
  const grade = gradeFor(answer);

  if (item.isNew) {
    const introduced = newCard(item.key, 2, now, retention);
    return { ...introduced, stage: reschedule ? 1 : item.card.stage };
  }

  if (!reschedule) {
    return { ...item.card, reps: item.card.reps + 1 };
  }

  const reviewed = review(item.card, grade, now, retention);
  return { ...reviewed, stage: nextStage(item.card.stage, answer.correct) };
}

export function dueCount(snapshot: Snapshot, now: number): number {
  return snapshot.cards.filter((card) => card.due <= now && card.stage > 0).length;
}

export function newAvailable(registry: Registry, snapshot: Snapshot, now: number): number {
  const known = new Set(snapshot.cards.map((card) => card.itemId));
  const remaining = [...registry.items.keys()].filter((key) => !known.has(key)).length;
  const allowance = Math.max(0, snapshot.settings.dailyNew - introducedToday(snapshot.attempts, now));
  return Math.min(remaining, allowance);
}

export function attemptsToday(attempts: Attempt[], now: number): number {
  const dayStart = startOfDay(now);
  return attempts.filter((attempt) => attempt.at >= dayStart).length;
}

export { DAY_MS };
