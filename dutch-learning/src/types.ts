export type Level = "A1" | "A2";
export type Skill = "lezen" | "luisteren" | "schrijven" | "spreken" | "knm";

export interface Sentence {
  id: string;
  /** The Dutch sentence as it is shown and spoken. */
  nl: string;
  /** Natural English. */
  en: string;
  /** Word-for-word English, so the Dutch order is visible even when it looks wrong. */
  lit: string;
  level: Level;
  theme: string;
  tags: string[];
  skills: Skill[];
}

/** Which drill a card has reached. 0 is presentation, 3 is full production. */
export type Stage = 0 | 1 | 2 | 3;
export type CardKind = "study" | "cloze" | "listen" | "produce";

/** One row per sentence: the scheduling state. */
export interface CardState {
  sentenceId: string;
  stage: number;
  stability: number;
  difficulty: number;
  /** Epoch milliseconds. */
  due: number;
  reps: number;
  lapses: number;
  lastReview: number | null;
}

export interface Attempt {
  id: string;
  sentenceId: string;
  kind: CardKind;
  at: number;
  /** 1 again, 2 hard, 3 good, 4 easy — the FSRS grade that was applied. */
  grade: number;
  correct: boolean;
  ms: number;
  typed: string;
}

export interface Settings {
  /** New sentences introduced per day. */
  dailyNew: number;
  /** Target recall probability when a card comes back. FSRS default 0.9. */
  desiredRetention: number;
  /** Speech rate for the Dutch voice, 0.6–1.2. */
  rate: number;
}

export interface Snapshot {
  cards: CardState[];
  settings: Settings;
  attempts: Attempt[];
}

export const DEFAULT_SETTINGS: Settings = {
  dailyNew: 6,
  desiredRetention: 0.9,
  rate: 0.9,
};
