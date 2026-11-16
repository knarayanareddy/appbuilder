import { useEffect, useMemo, useRef, useState } from "react";
import type { Answer, SessionItem } from "@/lib/session";
import type { CardKind } from "@/types";
import {
  buildBank,
  clozeParts,
  feedback,
  judge,
  maskWord,
  normalise,
  pickOptions,
  sameSequence,
  splitWords,
} from "@/lib/text";
import { feedbackComplete, feedbackCorrect, feedbackWrong } from "@/lib/sound";
import { Icon, type IconName } from "./icons";
import { Button, Card, Chip, Empty, IconButton, Option, Speaker } from "./ui";

const KIND_LABEL: Record<CardKind, string> = {
  study: "Read and listen",
  cloze: "Fill the gap",
  choice: "What does it mean?",
  bank: "Build the sentence",
  listen: "Dictation",
  produce: "Say it in Dutch",
};

const KIND_ICON: Record<CardKind, IconName> = {
  study: "book",
  cloze: "pencil",
  choice: "target",
  bank: "puzzle",
  listen: "speaker",
  produce: "sparkle",
};

const KIND_HINT: Record<CardKind, string> = {
  study: "Listen twice, then check what it means.",
  cloze: "Which word is missing?",
  choice: "Pick the translation that matches.",
  bank: "Tap the words in the right order.",
  listen: "Type what you hear.",
  produce: "Type it in Dutch, then say it out loud.",
};

export interface SessionSummary {
  done: number;
  correct: number;
}

export interface SessionPool {
  translations: string[];
  words: string[];
}

export function SessionView({
  items,
  pool,
  autoPlay,
  onAnswer,
  onFinish,
  onReport,
  onQuit,
  play,
}: {
  items: SessionItem[];
  pool: SessionPool;
  autoPlay: boolean;
  onAnswer: (item: SessionItem, answer: Answer, typed: string, ms: number) => Promise<void> | void;
  onFinish: (summary: SessionSummary) => void;
  onReport: (item: SessionItem) => void;
  onQuit: (summary: SessionSummary) => void;
  play: (item: SessionItem) => void;
}) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<"ask" | "feedback">("ask");
  const [revealed, setRevealed] = useState(false);
  const [judged, setJudged] = useState<{ correct: boolean; almost: boolean } | null>(null);
  const [pending, setPending] = useState<Answer | null>(null);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const startedAt = useRef(Date.now());

  const item = items[index];

  useEffect(() => {
    startedAt.current = Date.now();
    setTyped("");
    setPicked([]);
    setSelected(null);
    setPhase("ask");
    setRevealed(false);
    setJudged(null);
    setPending(null);
  }, [index]);

  useEffect(() => {
    if (!item || !autoPlay) return;
    if (item.kind !== "listen" && item.kind !== "study") return;
    const timer = setTimeout(() => play(item), 320);
    return () => clearTimeout(timer);
  }, [item, autoPlay, play]);

  const bank = useMemo(
    () => (item && item.kind === "bank" ? buildBank(item.item.text, pool.words) : []),
    [item, pool.words],
  );

  const options = useMemo(
    () => (item && item.kind === "choice" ? pickOptions(item.item.translation, pool.translations, 4) : []),
    [item, pool.translations],
  );

  if (!item) {
    return (
      <div className="screen">
        <Empty title="Nothing queued.">
          Everything in this mode is done. Pick another way in from Learn — Practise never runs out.
        </Empty>
        <Button wide variant="primary" onClick={() => onFinish({ done, correct })}>
          Done
        </Button>
      </div>
    );
  }

  const cloze = item.kind === "cloze" ? clozeParts(item.item.text) : null;
  const expected =
    item.kind === "cloze"
      ? (cloze?.word ?? "").replace(/[.,!?;:]+$/, "")
      : item.kind === "choice"
        ? item.item.translation
        : item.item.text;

  function settle(answer: Answer, typedAnswer: string) {
    setJudged({ correct: answer.correct, almost: answer.almost });
    setPending(answer);
    setPhase("feedback");
    setTyped(typedAnswer);
    if (answer.correct) feedbackCorrect();
    else feedbackWrong();
  }

  function checkTyped() {
    if (!item) return;
    const result = judge(typed, expected);
    settle({ correct: result.ok, almost: result.almost }, typed);
  }

  function checkBank() {
    if (!item) return;
    settle({ correct: sameSequence(picked, splitWords(item.item.text)), almost: false }, picked.join(" "));
  }

  function chooseOption(option: string) {
    if (!item) return;
    setSelected(option);
    settle({ correct: normalise(option) === normalise(item.item.translation), almost: false }, option);
  }

  async function next() {
    if (!item) return;
    const answer = pending ?? { correct: true, almost: false };
    const typedAnswer = item.kind === "choice" ? (selected ?? "") : item.kind === "bank" ? picked.join(" ") : typed;
    const countedDone = done + 1;
    const countedCorrect = correct + (answer.correct ? 1 : 0);

    setDone(countedDone);
    setCorrect(countedCorrect);
    await onAnswer(item, answer, typedAnswer, Date.now() - startedAt.current);

    if (index + 1 >= items.length) {
      feedbackComplete();
      onFinish({ done: countedDone, correct: countedCorrect });
      return;
    }
    setIndex(index + 1);
  }

  const tokens =
    judged && !judged.correct && (item.kind === "listen" || item.kind === "produce" || item.kind === "cloze")
      ? feedback(typed, expected)
      : null;

  const percent = Math.round((index / items.length) * 100);

  return (
    <div className="screen">
      <div className="session-top">
        <IconButton name="close" label="Leave the session" onClick={() => onQuit({ done, correct })} />
        <div className="bar">
          <i style={{ width: `${percent}%` }} />
        </div>
        <span className="pill" aria-label="Progress">
          {index + 1}/{items.length}
        </span>
      </div>

      <div className="session-meta">
        <span className="kind-chip">
          <Icon name={KIND_ICON[item.kind]} size={13} />
          {KIND_LABEL[item.kind]}
        </span>
        <button type="button" className="link" onClick={() => onReport(item)}>
          Report
        </button>
      </div>

      <Card>
        {item.kind === "study" ? (
          <div className="stack">
            <div className="row" style={{ alignItems: "center", gap: 14 }}>
              <Speaker big onClick={() => play(item)} />
              <p className="display">{item.item.text}</p>
            </div>
            {revealed ? (
              <div className="stack">
                <p className="en">{item.item.translation}</p>
                {item.item.literal ? <p className="lit">{item.item.literal}</p> : null}
                {item.item.tip ? <p className="tiny dim">{item.item.tip}</p> : null}
                {item.unit.tip ? <p className="tiny dim">Tip: {item.unit.tip}</p> : null}
              </div>
            ) : (
              <p className="small muted">{KIND_HINT.study}</p>
            )}
          </div>
        ) : null}

        {item.kind === "cloze" && cloze ? (
          <div className="stack">
            <div className="row" style={{ alignItems: "center", gap: 14 }}>
              <Speaker onClick={() => play(item)} />
              <p className="display small cloze">
                <span>{cloze.before}</span>
                <span className="blank">{maskWord(cloze.word)}</span>
                <span>{cloze.after}</span>
              </p>
            </div>
            <p className="small muted">{KIND_HINT.cloze}</p>
            {revealed ? <p className="en small">{item.item.translation}</p> : null}
          </div>
        ) : null}

        {item.kind === "choice" ? (
          <div className="stack">
            <div className="row" style={{ alignItems: "center", gap: 14 }}>
              <Speaker onClick={() => play(item)} />
              <p className="display small">{item.item.text}</p>
            </div>
            <div className="stack">
              {options.map((option) => (
                <Option
                  key={option}
                  onClick={() => chooseOption(option)}
                  disabled={phase === "feedback"}
                  state={
                    phase === "feedback" && normalise(option) === normalise(item.item.translation)
                      ? "right"
                      : phase === "feedback" && option === selected
                        ? "wrong"
                        : "idle"
                  }
                >
                  {option}
                </Option>
              ))}
            </div>
          </div>
        ) : null}

        {item.kind === "bank" ? (
          <div className="stack">
            <p className="display small">{item.item.translation}</p>
            <p className="small muted">{KIND_HINT.bank}</p>
            <div className="bank built" aria-label="Your sentence">
              {picked.length === 0 ? <span className="tiny dim">Tap the words below…</span> : null}
              {picked.map((word, position) => (
                <Chip key={`${word}-${position}`} onClick={() => setPicked(picked.filter((_, i) => i !== position))}>
                  {word}
                </Chip>
              ))}
            </div>
            <div className="bank">
              {bank.map((word, position) => {
                const used = picked.filter((entry) => entry === word).length;
                const available = bank.filter((entry) => entry === word).length;
                if (used >= available) return null;
                return (
                  <Chip
                    key={`${word}-${position}`}
                    onClick={() => {
                      if (phase === "feedback") return;
                      setPicked([...picked, word]);
                    }}
                  >
                    {word}
                  </Chip>
                );
              })}
            </div>
          </div>
        ) : null}

        {item.kind === "listen" ? (
          <div className="stack">
            <div className="row" style={{ alignItems: "center", gap: 14 }}>
              <Speaker big onClick={() => play(item)} />
              <div>
                <p className="display small">{KIND_HINT.listen}</p>
                <p className="small muted">Dutch, in the voice you picked.</p>
              </div>
            </div>
            {revealed ? <p className="en small">{item.item.translation}</p> : null}
          </div>
        ) : null}

        {item.kind === "produce" ? (
          <div className="stack">
            <p className="display small">{item.item.translation}</p>
            <p className="small muted">{KIND_HINT.produce}</p>
            {revealed ? <p className="lit">{item.item.literal}</p> : null}
          </div>
        ) : null}
      </Card>

      {item.kind === "cloze" || item.kind === "listen" || item.kind === "produce" ? (
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
              if (event.key === "Enter" && phase === "ask") checkTyped();
            }}
            disabled={phase === "feedback"}
          />
          <div className="row spread" style={{ marginTop: 9 }}>
            <Button size="sm" variant="ghost" onClick={() => setRevealed(true)} disabled={revealed}>
              Hint
            </Button>
            <span className="tiny dim">{expected.length} letters</span>
          </div>
        </Card>
      ) : null}

      {phase === "feedback" && judged ? (
        <div className={judged.correct ? "feedback good" : "feedback bad"}>
          <p className="verdict">
            <Icon name={judged.correct ? "check" : "close"} size={18} />
            {judged.correct ? (judged.almost ? "Almost — that counts." : "Goed zo.") : "Not quite."}
          </p>
          <p className="small" style={{ marginTop: 6 }}>
            {item.kind === "choice" && judged.correct
              ? `${item.item.text} — ${item.item.translation}`
              : judged.correct && !judged.almost
                ? item.item.text
                : `Answer: ${expected}`}
          </p>
          {tokens ? (
            <p className="small" style={{ marginTop: 6 }}>
              {tokens.map((token, position) => (
                <span key={`${token.token}-${position}`} className={`tok ${token.status}`}>
                  {token.token}
                </span>
              ))}
            </p>
          ) : null}
          {item.kind !== "choice" && judged.correct ? (
            <p className="tiny dim" style={{ marginTop: 6 }}>
              {item.item.literal ?? item.item.translation}
            </p>
          ) : null}
          {!judged.correct && item.item.tip ? <p className="tiny dim" style={{ marginTop: 6 }}>{item.item.tip}</p> : null}
        </div>
      ) : null}

      <div className="action-bar">
        {phase === "ask" ? (
          item.kind === "study" ? (
            <>
              {!revealed ? (
                <Button wide size="lg" onClick={() => setRevealed(true)}>
                  Show meaning
                </Button>
              ) : null}
              <Button wide size="lg" variant={revealed ? "primary" : "ghost"} onClick={() => void next()}>
                Next
              </Button>
            </>
          ) : item.kind === "choice" ? (
            <p className="tiny dim" style={{ textAlign: "center" }}>
              Tap an answer.
            </p>
          ) : item.kind === "bank" ? (
            <Button wide size="lg" variant="primary" onClick={checkBank} disabled={picked.length === 0}>
              Check
            </Button>
          ) : (
            <Button wide size="lg" variant="primary" onClick={checkTyped} disabled={typed.trim().length === 0}>
              Check
            </Button>
          )
        ) : (
          <>
            {judged && !judged.correct && item.kind !== "choice" ? (
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
            <Button wide size="lg" variant="primary" onClick={() => void next()}>
              Next
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
