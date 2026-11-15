import { DEFAULT_SETTINGS, type Attempt, type CardState, type Settings, type Snapshot } from "@/types";
import { SENTENCES_BY_ID } from "./content";
import { kvClear, kvGet, kvSet } from "./db";

const CARDS_KEY = "cards";
const SETTINGS_KEY = "settings";
const ATTEMPTS_KEY = "attempts";

/** Attempts are a learning log, not a ledger: a few thousand is plenty. */
const MAX_ATTEMPTS = 5000;
export const BACKUP_VERSION = 1;

/**
 * Records written by an older build are repaired rather than trusted. This is the
 * rule that was learned the hard way on the bike app: adding a field to a record
 * type is a data migration, and the only safe place to do it is where records come
 * off the disk.
 */
export function normaliseCard(raw: Partial<CardState> & { sentenceId: string }): CardState {
  return {
    sentenceId: raw.sentenceId,
    stage: clampStage(raw.stage),
    stability: Number.isFinite(raw.stability) && (raw.stability as number) > 0 ? (raw.stability as number) : 0.4,
    difficulty: Number.isFinite(raw.difficulty) ? Math.min(10, Math.max(1, raw.difficulty as number)) : 5,
    due: Number.isFinite(raw.due) ? (raw.due as number) : Date.now(),
    reps: Number.isFinite(raw.reps) ? (raw.reps as number) : 0,
    lapses: Number.isFinite(raw.lapses) ? (raw.lapses as number) : 0,
    lastReview: Number.isFinite(raw.lastReview) ? (raw.lastReview as number) : null,
  };
}

function clampStage(stage: unknown): number {
  const value = Number(stage);
  if (!Number.isFinite(value)) return 0;
  return Math.min(3, Math.max(0, Math.round(value)));
}

export function normaliseSettings(raw: Partial<Settings> | undefined): Settings {
  return {
    dailyNew: Number.isFinite(raw?.dailyNew) ? Math.min(40, Math.max(0, raw!.dailyNew!)) : DEFAULT_SETTINGS.dailyNew,
    desiredRetention: Number.isFinite(raw?.desiredRetention)
      ? Math.min(0.97, Math.max(0.7, raw!.desiredRetention!))
      : DEFAULT_SETTINGS.desiredRetention,
    rate: Number.isFinite(raw?.rate) ? Math.min(1.5, Math.max(0.5, raw!.rate!)) : DEFAULT_SETTINGS.rate,
  };
}

export async function loadSnapshot(): Promise<Snapshot> {
  const [cards, settings, attempts] = await Promise.all([
    kvGet<unknown>(CARDS_KEY),
    kvGet<unknown>(SETTINGS_KEY),
    kvGet<unknown>(ATTEMPTS_KEY),
  ]);

  const rawCards = Array.isArray(cards) ? (cards as Array<Partial<CardState> & { sentenceId: string }>) : [];
  const known = rawCards.filter((card) => card && typeof card.sentenceId === "string" && SENTENCES_BY_ID.has(card.sentenceId));

  return {
    cards: known.map(normaliseCard),
    settings: normaliseSettings(settings as Partial<Settings> | undefined),
    attempts: Array.isArray(attempts) ? (attempts as Attempt[]) : [],
  };
}

export async function saveCards(cards: CardState[]): Promise<void> {
  await kvSet(CARDS_KEY, cards);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await kvSet(SETTINGS_KEY, settings);
}

export async function appendAttempt(attempt: Attempt): Promise<Attempt[]> {
  const existing = (await kvGet<Attempt[]>(ATTEMPTS_KEY)) ?? [];
  const next = [...existing, attempt].slice(-MAX_ATTEMPTS);
  await kvSet(ATTEMPTS_KEY, next);
  return next;
}

export async function resetAll(): Promise<void> {
  await kvClear();
}

export function exportSnapshot(snapshot: Snapshot): string {
  return JSON.stringify(
    {
      app: "taal",
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      ...snapshot,
    },
    null,
    2,
  );
}

export interface ImportResult {
  snapshot: Snapshot;
  cards: number;
  attempts: number;
}

/** Restores replace everything, which is why the UI asks first. */
export async function importSnapshot(text: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not JSON.");
  }

  const value = parsed as Partial<Snapshot> & { app?: string };
  if (!value || typeof value !== "object" || !Array.isArray(value.cards)) {
    throw new Error("That file does not look like a Taal backup.");
  }

  const cards = value.cards
    .filter((card) => card && typeof (card as CardState).sentenceId === "string")
    .map((card) => normaliseCard(card as Partial<CardState> & { sentenceId: string }))
    .filter((card) => SENTENCES_BY_ID.has(card.sentenceId));

  const attempts = Array.isArray(value.attempts) ? (value.attempts as Attempt[]).slice(-MAX_ATTEMPTS) : [];
  const settings = normaliseSettings(value.settings);

  await saveCards(cards);
  await saveSettings(settings);
  await kvSet(ATTEMPTS_KEY, attempts);

  return { snapshot: { cards, settings, attempts }, cards: cards.length, attempts: attempts.length };
}
