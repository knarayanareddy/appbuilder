import { useEffect, useMemo, useRef, useState } from "react";
import type { Answer, QueueItem } from "@/lib/session";
import { clozeParts, feedback, judge, maskWord, normalise } from "@/lib/text";
import { Button, Card, Tag } from "./ui";

const KIND_LABEL: Record<string, string> = {
  study: "Read and listen",
  cloze: "Fill the gap",
  listen: "Dictation",
  produce: "Say it in Dutch",
};

export interface SessionSummary {
  done: number;
  correct: number;
}

export function SessionView({
  items,
  onAnswer,
  onFinish,
  speak,
}: {
  items: QueueItem[];
  onAnswer: (item: QueueItem, answer: Answer, typed: string, ms: number) => Promise<void> | void;
  onFinish: (summary: SessionSummary) => void;
  speak: (text: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"ask" | "feedback">("ask");
  const [revealed, setRevealed] = useState(false);
  const [judged, setJudged] = useState<{ correct: boolean; almost: boolean } | null>(null);
  const [pending, setPending] = useState<Answer | null>(null);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const startedAt = useRef(Date.now());

  const item = items[index];
  const sentence = item?.sentence;

  useEffect(() => {
    startedAt.current = Date.now();
    setTyped("");
    setPhase("ask");
    setRevealed(false);
    setJudged(null);
    setPending(null);
  }, [index]);

  useEffect(() => {
    if (item?.kind !== "listen" || !sentence) return;
    const timer = setTimeout(() => speak(sentence.nl), 300);
    return () => clearTimeout(timer);
  }, [item?.kind, sentence, speak]);

  const expected = useMemo(() => {
    if (!sentence || !item) return "";
    if (item.kind === "cloze") return clozeParts(sentence.nl).word.replace(/[.,!?;:]+$/, "");
    return sentence.nl;
  }, [item, sentence]);

  if (!item || !sentence) {
    return (
      <div className="screen">
        <Card>
          <p>Nothing due — come back later, or add new sentences in Settings.</p>
          <div style={{ marginTop: 12 }}>
            <Button wide onClick={() => onFinish({ done, correct })}>
              Done
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const cloze = item.kind === "cloze" ? clozeParts(sentence.nl) : null;

  function check() {
    const result = judge(typed, expected);
    setJudged({ correct: result.ok, almost: result.almost });
    setPending({ correct: result.ok, almost: result.almost });
    setPhase("feedback");
  }

  async function next() {
    const answer = pending ?? { correct: true, almost: false };
    const countedDone = done + 1;
    const countedCorrect = correct + (answer.correct ? 1 : 0);

    setDone(countedDone);
    setCorrect(countedCorrect);
    await onAnswer(item, answer, typed, Date.now() - startedAt.current);

    if (index + 1 >= items.length) {
      onFinish({ done: countedDone, correct: countedCorrect });
      return;
    }
    setIndex(index + 1);
  }

  const feedbackTokens = judged && !judged.correct ? feedback(typed, expected) : null;

  return (
    <div className="screen">
      <div className="progress">
        <span>
          {index + 1}/{items.length}
        </span>
        <div className="bar">
          <i style={{ width: `${Math.round((index / items.length) * 100)}%` }} />
        </div>
      </div>

      <Card>
        <div className="row spread" style={{ marginBottom: 10 }}>
          <Tag>{KIND_LABEL[item.kind]}</Tag>
          <Tag>
            {sentence.level} · {sentence.theme}
          </Tag>
        </div>

        {item.kind === "study" ? (
          <div className="stack">
            <div className="row">
              <button
                type="button"
                className="speaker"
                aria-label="Play audio"
                onClick={() => speak(sentence.nl)}
              >
                🔊
              </button>
              <p className="nl">{sentence.nl}</p>
            </div>
            {revealed ? (
              <div className="stack">
                <p className="en">{sentence.en}</p>
                <p className="lit">{sentence.lit}</p>
                {sentence.tags.length > 0 ? (
                  <div className="chips">
                    {sentence.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="muted small">Listen twice, then check what it means.</p>
            )}
          </div>
        ) : null}

        {item.kind === "cloze" && cloze ? (
          <div className="stack">
            <div className="row">
              <button type="button" className="speaker" aria-label="Play audio" onClick={() => speak(sentence.nl)}>
                🔊
              </button>
              <p className="nl small cloze">
                <span>{cloze.before}</span>
                <span className="blank">{maskWord(cloze.word)}</span>
                <span>{cloze.after}</span>
              </p>
            </div>
            <p className="muted small">Which word is missing?</p>
          </div>
        ) : null}

        {item.kind === "listen" ? (
          <div className="stack">
            <div className="row">
              <button type="button" className="speaker" aria-label="Play audio" onClick={() => speak(sentence.nl)}>
                🔊
              </button>
              <div>
                <p className="nl small">Type what you hear</p>
                <p className="muted small">Dutch, no headphones needed — it is the phone's own voice.</p>
              </div>
            </div>
            {revealed ? <p className="en small">Meaning: {sentence.en}</p> : null}
          </div>
        ) : null}

        {item.kind === "produce" ? (
          <div className="stack">
            <p className="nl small">{sentence.en}</p>
            <p className="muted small">Now say it in Dutch — type it first.</p>
            {revealed ? <p className="lit">Literally: {sentence.lit}</p> : null}
          </div>
        ) : null}
      </Card>

      {item.kind !== "study" ? (
        <Card tight>
          <input
            type="text"
            aria-label="Answer"
            value={typed}
            placeholder="Typ je antwoord…"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && phase === "ask") check();
            }}
            disabled={phase === "feedback"}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <Button small variant="ghost" onClick={() => setRevealed(true)} disabled={revealed}>
              Hint
            </Button>
            <span className="tiny muted">{expected.length} letters expected</span>
          </div>
        </Card>
      ) : null}

      {phase === "feedback" && judged ? (
        <div className={judged.correct ? "feedback good" : "feedback bad"}>
          <p className="small" style={{ fontWeight: 700 }}>
            {judged.correct ? (judged.almost ? "Almost — that counts." : "Goed zo.") : "Not quite."}
          </p>
          <p className="small" style={{ marginTop: 4 }}>
            {judged.correct && !judged.almost ? sentence.nl : `Answer: ${expected}`}
          </p>
          {judged.almost && !judged.correct ? null : null}
          {feedbackTokens ? (
            <p className="small" style={{ marginTop: 6 }}>
              {feedbackTokens.map((token, position) => (
                <span key={`${token.token}-${position}`} className={`tok ${token.status}`}>
                  {token.token}
                </span>
              ))}
            </p>
          ) : null}
          {!judged.correct && typed.trim().length > 0 ? (
            <p className="tiny muted" style={{ marginTop: 6 }}>
              You typed: {normalise(typed)}
            </p>
          ) : null}
          {judged.almost ? <p className="tiny muted" style={{ marginTop: 6 }}>Spelling slip — the card still counted as hard.</p> : null}
        </div>
      ) : null}

      <div className="stack" style={{ marginTop: "auto" }}>
        {phase === "ask" ? (
          item.kind === "study" ? (
            <>
              {!revealed ? (
                <Button wide onClick={() => setRevealed(true)}>
                  Show meaning
                </Button>
              ) : null}
              <Button wide variant={revealed ? "primary" : "default"} onClick={() => void next()}>
                Next
              </Button>
            </>
          ) : (
            <Button wide variant="primary" onClick={check} disabled={typed.trim().length === 0}>
              Check
            </Button>
          )
        ) : (
          <>
            {judged && !judged.correct ? (
              <Button
                wide
                variant="ghost"
                onClick={() => {
                  setJudged({ correct: true, almost: true });
                  setPending({ correct: true, almost: true });
                }}
              >
                I was right (typo)
              </Button>
            ) : null}
            <Button wide variant="primary" onClick={() => void next()}>
              Next
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
