export type Level = "A1" | "A2" | "B1";
export type Skill = "lezen" | "luisteren" | "spreken" | "schrijven" | "knm";

/** One sentence or phrase, bilingual. `literal` is a word-for-word gloss on purpose. */
export interface Item {
  id: string;
  text: string;
  translation: string;
  literal?: string;
  tags: string[];
  tip?: string;
}

export interface Unit {
  id: string;
  title: string;
  blurb: string;
  level: Level;
  /** Grammar note shown at the top of the unit and on its first cards. */
  tip?: string;
  items: Item[];
}

export interface StoryLine {
  speaker: string;
  text: string;
  translation: string;
}

/** A short dialogue: read it, hear it, reveal the English when you need it. */
export interface Story {
  id: string;
  title: string;
  situation: string;
  lines: StoryLine[];
}

/**
 * A module is the unit of content exchange. It is deliberately plain JSON so a
 * person (or another model) can write one and drop it in — see docs/MODULE-FORMAT.md.
 */
export interface Module {
  schemaVersion: 1;
  id: string;
  language: string;
  title: string;
  description: string;
  author?: string;
  units: Unit[];
  stories?: Story[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  ttsLocale: string;
  flag: string;
}

export type CardKind = "study" | "cloze" | "choice" | "bank" | "listen" | "produce";

export type SessionMode = "daily" | "practice" | "quiz" | "unit" | "mistakes";

export interface CardState {
  itemId: string;
  /** 0 read · 1 fill the gap · 2 choose · 3 word bank · 4 dictation · 5 produce */
  stage: number;
  stability: number;
  difficulty: number;
  due: number;
  reps: number;
  lapses: number;
  lastReview: number | null;
}

export interface Attempt {
  id: string;
  itemId: string;
  kind: CardKind;
  at: number;
  grade: number;
  correct: boolean;
  ms: number;
  typed: string;
  mode?: SessionMode;
}

export type Theme = "dark" | "light" | "system";

export interface Settings {
  /** How many new sentences the daily session introduces. Practice is never capped. */
  dailyNew: number;
  desiredRetention: number;
  rate: number;
  /** voiceURI chosen by the learner; null means "pick the best Dutch voice". */
  voice: string | null;
  autoPlay: boolean;
  /** Language being learned, so a second module in another language still works. */
  language: string;
  theme: Theme;
  sound: boolean;
  haptics: boolean;
  /** False until the intro has been seen once. */
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyNew: 10,
  desiredRetention: 0.9,
  rate: 0.9,
  voice: null,
  autoPlay: true,
  language: "nl",
  theme: "system",
  sound: true,
  haptics: true,
  onboarded: false,
};

/** Items whose translation looks wrong, kept on the device so they can be exported. */
export interface Report {
  itemId: string;
  note: string;
  at: number;
}

export interface Snapshot {
  cards: CardState[];
  settings: Settings;
  attempts: Attempt[];
  /** Modules imported by the learner; built-in ones are code, not data. */
  modules: Module[];
  reports: Report[];
}

export const EMPTY_SNAPSHOT: Snapshot = {
  cards: [],
  settings: DEFAULT_SETTINGS,
  attempts: [],
  modules: [],
  reports: [],
};
