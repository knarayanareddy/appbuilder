import type { Attempt, CardKind, CardState, Sentence, Snapshot } from "@/types";
import { SENTENCES, SENTENCES_BY_ID } from "./content";
import { DAY_MS, newCard, review } from "./fsrs";

export interface QueueItem {
  sentence: Sentence;
  card: CardState;
  kind: CardKind;
  isNew: boolean;
}

export function kindForStage(stage: number): CardKind {
  if (stage <= 0) return "study";
  if (stage === 1) return "cloze";
  if (stage === 2) return "listen";
  return "produce";
}

export function startOfDay(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** New sentences already introduced today, counted from the attempt log. */
export function introducedToday(attempts: Attempt[], now: number): number {
  const dayStart = startOfDay(now);
  const introduced = new Set(
    attempts.filter((attempt) => attempt.kind === "study" && attempt.at >= dayStart).map((attempt) => attempt.sentenceId),
  );
  return introduced.size;
}

/**
 * Reviews first, then new material, with a new sentence dropped in after every
 * fourth review — so a session alternates between "I know this" and "this is new"
 * instead of dumping all the unknown ones at the end.
 */
export function buildQueue(snapshot: Snapshot, now: number, limit = 80): QueueItem[] {
  const cardsBySentence = new Map(snapshot.cards.map((card) => [card.sentenceId, card]));

  const due = snapshot.cards
    .filter((card) => card.due <= now)
    .sort((a, b) => a.due - b.due)
    .map<QueueItem>((card) => ({
      sentence: SENTENCES_BY_ID.get(card.sentenceId)!,
      card,
      kind: kindForStage(card.stage),
      isNew: false,
    }))
    .filter((item) => Boolean(item.sentence));

  const allowance = Math.max(0, snapshot.settings.dailyNew - introducedToday(snapshot.attempts, now));
  const fresh = SENTENCES.filter((sentence) => !cardsBySentence.has(sentence.id))
    .slice(0, allowance)
    .map<QueueItem>((sentence) => ({
      sentence,
      card: newCard(sentence.id, 2, now, snapshot.settings.desiredRetention),
      kind: "study",
      isNew: true,
    }));

  const queue: QueueItem[] = [];
  let dueIndex = 0;
  let newIndex = 0;

  while (dueIndex < due.length || newIndex < fresh.length) {
    for (let i = 0; i < 4 && dueIndex < due.length; i += 1) {
      queue.push(due[dueIndex]);
      dueIndex += 1;
    }
    if (newIndex < fresh.length) {
      queue.push(fresh[newIndex]);
      newIndex += 1;
    }
  }

  return queue.slice(0, limit);
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

export function nextStage(stage: number, correct: boolean): number {
  return correct ? Math.min(3, stage + 1) : Math.max(0, stage - 1);
}

/**
 * The single place a card moves. A new sentence is introduced with grade 2 (it was
 * just shown, not recalled) and immediately promoted to the first real drill.
 */
export function applyAnswer(item: QueueItem, answer: Answer, now: number, retention = 0.9): CardState {
  const grade = gradeFor(answer);

  if (item.isNew) {
    const introduced = newCard(item.sentence.id, 2, now, retention);
    return { ...introduced, stage: 1 };
  }

  const reviewed = review(item.card, grade, now, retention);
  return { ...reviewed, stage: nextStage(item.card.stage, answer.correct) };
}

export function dueCount(snapshot: Snapshot, now: number): number {
  return snapshot.cards.filter((card) => card.due <= now).length;
}

export function newAvailable(snapshot: Snapshot, now: number): number {
  const known = new Set(snapshot.cards.map((card) => card.sentenceId));
  const remaining = SENTENCES.filter((sentence) => !known.has(sentence.id)).length;
  const allowance = Math.max(0, snapshot.settings.dailyNew - introducedToday(snapshot.attempts, now));
  return Math.min(remaining, allowance);
}

export function attemptsToday(attempts: Attempt[], now: number): number {
  const dayStart = startOfDay(now);
  return attempts.filter((attempt) => attempt.at >= dayStart).length;
}

export { DAY_MS };
