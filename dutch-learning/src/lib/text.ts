/**
 * Answer checking. Dutch typing is unforgiving on a phone keyboard, so the rule is:
 * exact after normalisation passes, a small edit distance passes with a nudge, and
 * anything else fails — with the difference shown so the learner sees the mistake,
 * not just a red cross.
 */
const PUNCTUATION = /[.,!?;:"'’“”()[\]]/g;

export function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFC")
    .replace(/[’‘]/g, "'")
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(value: string): string[] {
  const normalised = normalise(value);
  return normalised.length === 0 ? [] : normalised.split(" ");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

export interface Judgement {
  /** Close enough to accept. */
  ok: boolean;
  /** Accepted, but not exactly right — worth a "mind the spelling" nudge. */
  almost: boolean;
  distance: number;
}

export function judge(typed: string, expected: string): Judgement {
  const a = normalise(typed);
  const b = normalise(expected);
  if (a === b) return { ok: true, almost: false, distance: 0 };

  const distance = levenshtein(a, b);
  const tolerance = Math.max(1, Math.floor(b.length * 0.12));
  const ok = distance <= tolerance;
  return { ok, almost: ok, distance };
}

export type TokenStatus = "ok" | "wrong";

export interface TokenFeedback {
  token: string;
  status: TokenStatus;
}

/**
 * Word-by-word feedback against the expected sentence: a token counts as correct if
 * the learner produced it somewhere, which is enough to point at *which* word is
 * missing without pretending to align grammar.
 */
export function feedback(typed: string, expected: string): TokenFeedback[] {
  const produced = new Map<string, number>();
  for (const token of tokens(typed)) {
    produced.set(token, (produced.get(token) ?? 0) + 1);
  }

  return tokens(expected).map((token) => {
    const available = produced.get(token) ?? 0;
    if (available > 0) {
      produced.set(token, available - 1);
      return { token, status: "ok" as const };
    }
    return { token, status: "wrong" as const };
  });
}

/** Which word to hide in a cloze: the longest word, because it is the one that matters. */
export function clozeIndex(sentence: string): number {
  const words = sentence.split(/\s+/).filter(Boolean);
  let best = 0;
  let bestLength = -1;
  words.forEach((word, index) => {
    const cleaned = normalise(word);
    if (cleaned.length > bestLength && cleaned.length >= 3) {
      best = index;
      bestLength = cleaned.length;
    }
  });
  return best;
}

/** "stations" → "s········" — a hint that says how long the answer is, not what it is. */
export function maskWord(word: string): string {
  const bare = word.replace(PUNCTUATION, "");
  if (bare.length === 0) return word;
  return bare[0] + "·".repeat(Math.max(0, bare.length - 1));
}

export function clozeParts(sentence: string): { before: string; word: string; after: string } {
  const words = sentence.split(/\s+/).filter(Boolean);
  const index = clozeIndex(sentence);
  return {
    before: words.slice(0, index).join(" "),
    word: words[index] ?? "",
    after: words.slice(index + 1).join(" "),
  };
}

/** The words of a sentence, punctuation kept, for the tap-to-build drill. */
export function splitWords(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

export function sameSequence(given: string[], expected: string[]): boolean {
  if (given.length !== expected.length) return false;
  return given.every((word, index) => normalise(word) === normalise(expected[index]));
}

export function shuffle<T>(list: T[], random: () => number = Math.random): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A word bank: the sentence's own words, shuffled, plus a couple of decoys taken from
 * other sentences in the same module so guessing by shape does not pay off.
 */
export function buildBank(expected: string, decoys: string[], random: () => number = Math.random): string[] {
  const words = splitWords(expected);
  const extra = decoys
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !words.some((own) => normalise(own) === normalise(word)))
    .slice(0, 2);
  return shuffle([...words, ...extra], random);
}

/** Four options: the right one and three from other sentences, same order every time. */
export function pickOptions(
  correct: string,
  pool: string[],
  count = 4,
  random: () => number = Math.random,
): string[] {
  const chosen = shuffle(
    pool.filter((option) => normalise(option) !== normalise(correct)),
    random,
  ).slice(0, Math.max(0, count - 1));
  const options = shuffle([correct, ...chosen], random);
  return options;
}
