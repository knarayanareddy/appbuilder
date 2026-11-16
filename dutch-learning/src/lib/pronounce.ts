/**
 * Comparing what the recogniser heard with what the sentence says.
 *
 * A 39 MB Dutch model has a word error rate around 22–26% on read speech, so exact
 * comparison would fail a learner who said it perfectly. This scores token overlap and
 * splits it into three verdicts: good, almost (accepted), and miss (which the drill
 * treats as "the microphone did not hear it", never as "you are wrong").
 */

/** Filler that a recogniser emits and a speaker cannot avoid saying. */
const FILLERS = new Set(["eh", "ehm", "uh", "um", "hmm", "ehh", "nou", "even"]);

export function normaliseSpeech(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,!?;:"'’`()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function words(text: string): string[] {
  const normalised = normaliseSpeech(text);
  if (!normalised) return [];
  return normalised.split(" ").filter((word) => word.length > 0);
}

function distance(a: string[], b: string[]): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table: number[][] = Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => (row === 0 ? col : col === 0 ? row : 0)));

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      table[row][col] = Math.min(table[row - 1][col] + 1, table[row][col - 1] + 1, table[row - 1][col - 1] + cost);
    }
  }
  return table[rows - 1][cols - 1];
}

export interface SpeechScore {
  /** 0–1, where 1 is the recogniser returning exactly the sentence. */
  score: number;
  verdict: "good" | "almost" | "miss";
  heard: string;
  missing: string[];
  extra: string[];
}

/**
 * Thresholds are deliberately generous on the low side: the model is small, the
 * microphone is a phone, and the point is "did the learner produce these words", not
 * "did an acoustic model agree with every syllable".
 */
export function scoreSpeech(heard: string, target: string): SpeechScore {
  const said = words(heard).filter((word) => !FILLERS.has(word));
  const expected = words(target);

  if (expected.length === 0) {
    return { score: 0, verdict: "miss", heard, missing: [], extra: said };
  }
  if (said.length === 0) {
    return { score: 0, verdict: "miss", heard, missing: expected, extra: [] };
  }

  const edits = distance(said, expected);
  const score = Math.max(0, 1 - edits / Math.max(said.length, expected.length));

  const remaining = [...said];
  const missing: string[] = [];
  for (const word of expected) {
    const hit = remaining.indexOf(word);
    if (hit >= 0) remaining.splice(hit, 1);
    else missing.push(word);
  }

  // "good" means the recogniser returned the sentence. Anything above 0.55 is still
  // accepted by the drill ("almost"), because a 22–26% WER model mishearing one word is
  // not evidence that the learner said it wrongly.
  const verdict: SpeechScore["verdict"] = score >= 0.95 ? "good" : score >= 0.55 ? "almost" : "miss";
  return { score: Number(score.toFixed(2)), verdict, heard, missing, extra: remaining };
}
