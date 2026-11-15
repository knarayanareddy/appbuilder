import { DEFAULT_SETTINGS, type Attempt, type CardState, type Module, type Report, type Settings, type Snapshot } from "@/types";
import { buildRegistry, resolveKey, validateModule } from "./module";
import { kvClear, kvGet, kvSet } from "./db";

const CARDS_KEY = "cards";
const SETTINGS_KEY = "settings";
const ATTEMPTS_KEY = "attempts";
const MODULES_KEY = "modules";
const REPORTS_KEY = "reports";

/** Attempts are a learning log, not a ledger: a few thousand is plenty. */
const MAX_ATTEMPTS = 5000;
export const BACKUP_VERSION = 2;

/**
 * Records written by an older build are repaired rather than trusted. This is the
 * rule that was learned the hard way on the bike app: adding a field to a record
 * type is a data migration, and the only safe place to do it is where records come
 * off the disk.
 */
export function normaliseCard(raw: Partial<CardState> & { itemId?: string; sentenceId?: string }): CardState | null {
  const itemId = raw.itemId ?? raw.sentenceId;
  if (typeof itemId !== "string" || itemId.trim() === "") return null;

  return {
    itemId,
    stage: clampNumber(raw.stage, 0, 5, 0),
    stability: clampNumber(raw.stability, 0.1, 36_500, 0.4),
    difficulty: clampNumber(raw.difficulty, 1, 10, 5),
    due: clampNumber(raw.due, 0, Number.MAX_SAFE_INTEGER, Date.now()),
    reps: clampNumber(raw.reps, 0, 1e6, 0),
    lapses: clampNumber(raw.lapses, 0, 1e6, 0),
    lastReview: Number.isFinite(raw.lastReview) ? (raw.lastReview as number) : null,
  };
}

function clampNumber(value: unknown, low: number, high: number, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(high, Math.max(low, numeric));
}

export function normaliseSettings(raw: Partial<Settings> | undefined): Settings {
  return {
    dailyNew: clampNumber(raw?.dailyNew, 0, 100, DEFAULT_SETTINGS.dailyNew),
    desiredRetention: clampNumber(raw?.desiredRetention, 0.7, 0.97, DEFAULT_SETTINGS.desiredRetention),
    rate: clampNumber(raw?.rate, 0.5, 1.5, DEFAULT_SETTINGS.rate),
    voice: typeof raw?.voice === "string" && raw.voice ? raw.voice : null,
    autoPlay: typeof raw?.autoPlay === "boolean" ? raw.autoPlay : DEFAULT_SETTINGS.autoPlay,
    language: typeof raw?.language === "string" && raw.language ? raw.language : DEFAULT_SETTINGS.language,
  };
}

export function normaliseModules(raw: unknown): Module[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => validateModule(entry))
    .filter((result): result is { ok: true; errors: string[]; module: Module } => result.ok && Boolean(result.module))
    .map((result) => result.module);
}

export async function loadSnapshot(): Promise<Snapshot> {
  const [cards, settings, attempts, modules, reports] = await Promise.all([
    kvGet<unknown>(CARDS_KEY),
    kvGet<unknown>(SETTINGS_KEY),
    kvGet<unknown>(ATTEMPTS_KEY),
    kvGet<unknown>(MODULES_KEY),
    kvGet<unknown>(REPORTS_KEY),
  ]);

  const imported = normaliseModules(modules);
  const registry = buildRegistry(imported);

  const rawCards = Array.isArray(cards) ? (cards as Array<Partial<CardState> & { sentenceId?: string }>) : [];
  const seen = new Set<string>();
  const migrated: CardState[] = [];

  for (const raw of rawCards) {
    const normalised = normaliseCard(raw);
    if (!normalised) continue;

    // Cards written before modules existed carry a bare id like "s001"; map it once.
    const key = resolveKey(registry, normalised.itemId);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    migrated.push({ ...normalised, itemId: key });
  }

  const rawAttempts = Array.isArray(attempts) ? (attempts as Array<Attempt & { sentenceId?: string }>) : [];
  const migratedAttempts = rawAttempts
    .map((attempt) => {
      const legacyId = attempt.itemId ?? attempt.sentenceId;
      const key = typeof legacyId === "string" ? resolveKey(registry, legacyId) : undefined;
      return key ? { ...attempt, itemId: key } : null;
    })
    .filter((attempt): attempt is Attempt => attempt !== null);

  return {
    cards: migrated,
    settings: normaliseSettings(settings as Partial<Settings> | undefined),
    attempts: migratedAttempts,
    modules: imported,
    reports: Array.isArray(reports) ? (reports as Report[]) : [],
  };
}

export async function saveCards(cards: CardState[]): Promise<void> {
  await kvSet(CARDS_KEY, cards);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await kvSet(SETTINGS_KEY, settings);
}

export async function saveModules(modules: Module[]): Promise<void> {
  await kvSet(MODULES_KEY, modules);
}

export async function appendAttempt(attempt: Attempt): Promise<Attempt[]> {
  const existing = (await kvGet<Attempt[]>(ATTEMPTS_KEY)) ?? [];
  const next = [...existing, attempt].slice(-MAX_ATTEMPTS);
  await kvSet(ATTEMPTS_KEY, next);
  return next;
}

export async function appendReport(report: Report): Promise<Report[]> {
  const existing = (await kvGet<Report[]>(REPORTS_KEY)) ?? [];
  const next = [...existing, report].slice(-500);
  await kvSet(REPORTS_KEY, next);
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
  modules: number;
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

  const modules = normaliseModules(value.modules);
  const registry = buildRegistry(modules);

  const cards = value.cards
    .map((card) => normaliseCard(card as Partial<CardState> & { sentenceId?: string }))
    .filter((card): card is CardState => card !== null)
    .map((card) => ({ ...card, itemId: resolveKey(registry, card.itemId) ?? card.itemId }))
    .filter((card) => registry.items.has(card.itemId));

  const attempts = Array.isArray(value.attempts) ? (value.attempts as Attempt[]).slice(-MAX_ATTEMPTS) : [];
  const settings = normaliseSettings(value.settings);
  const reports = Array.isArray(value.reports) ? (value.reports as Report[]) : [];

  await saveCards(cards);
  await saveSettings(settings);
  await saveModules(modules);
  await kvSet(ATTEMPTS_KEY, attempts);
  await kvSet(REPORTS_KEY, reports);

  return { snapshot: { cards, settings, attempts, modules, reports }, cards: cards.length, attempts: attempts.length, modules: modules.length };
}
