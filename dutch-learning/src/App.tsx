import { useCallback, useEffect, useState } from "react";
import type { Attempt, CardState, Settings, Snapshot } from "@/types";
import { appendAttempt, loadSnapshot, saveCards, saveSettings } from "@/lib/repo";
import { applyAnswer, buildQueue, dueCount, gradeFor, newAvailable, type Answer, type QueueItem } from "@/lib/session";
import { speakDutch, stopSpeaking } from "@/lib/speech";
import { SessionView, type SessionSummary } from "@/components/SessionView";
import { StatsView } from "@/components/StatsView";
import { SettingsView } from "@/components/SettingsView";
import { Button, Card, Stat } from "@/components/ui";

type Tab = "today" | "stats" | "settings";

function upsertCard(cards: CardState[], card: CardState): CardState[] {
  const index = cards.findIndex((existing) => existing.sentenceId === card.sentenceId);
  if (index === -1) return [...cards, card];

  const next = [...cards];
  next[index] = card;
  return next;
}

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    void loadSnapshot().then(setSnapshot);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const speak = useCallback(
    (text: string) => {
      void speakDutch(text, snapshot?.settings.rate ?? 0.9);
    },
    [snapshot?.settings.rate],
  );

  const startSession = () => {
    if (!snapshot) return;
    setSummary(null);
    setQueue(buildQueue(snapshot, Date.now()));
  };

  const answer = async (item: QueueItem, result: Answer, typed: string, ms: number) => {
    if (!snapshot) return;

    const at = Date.now();
    const card = applyAnswer(item, result, at, snapshot.settings.desiredRetention);
    const cards = upsertCard(snapshot.cards, card);
    const attempt: Attempt = {
      id: `${at}-${item.sentence.id}-${item.kind}`,
      sentenceId: item.sentence.id,
      kind: item.kind,
      at,
      grade: gradeFor(result),
      correct: result.correct,
      ms,
      typed,
    };

    // Written immediately, one card at a time: a phone can die mid-session.
    setSnapshot({ ...snapshot, cards, attempts: [...snapshot.attempts, attempt] });
    await saveCards(cards);
    await appendAttempt(attempt);
  };

  const changeSettings = async (settings: Settings) => {
    if (!snapshot) return;
    setSnapshot({ ...snapshot, settings });
    await saveSettings(settings);
  };

  const finishSession = (result: SessionSummary) => {
    void stopSpeaking();
    setSummary(result);
    setQueue(null);
    setTab("today");
    setNow(Date.now());
  };

  if (!snapshot) {
    return (
      <div className="app">
        <div className="screen">
          <Card>
            <p className="muted">Opening your sentences…</p>
          </Card>
        </div>
      </div>
    );
  }

  if (queue) {
    return (
      <div className="app">
        <SessionView items={queue} onAnswer={answer} onFinish={finishSession} speak={speak} />
      </div>
    );
  }

  const due = dueCount(snapshot, now);
  const fresh = newAvailable(snapshot, now);

  return (
    <div className="app">
      {tab === "today" ? (
        <div className="screen">
          <div className="row spread">
            <h1>Vandaag</h1>
            <span className="tag">
              {new Date(now).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>

          {summary ? (
            <Card>
              <h2>Session done</h2>
              <p className="small">
                {summary.correct} of {summary.done} correct.{" "}
                {summary.done > 0 && summary.correct / summary.done >= 0.85
                  ? "That is the range where the schedule works."
                  : "Below 85%? Lower the daily load in Settings before adding more."}
              </p>
            </Card>
          ) : null}

          <Card>
            <div className="grid-3">
              <Stat value={due} label="to review" />
              <Stat value={fresh} label="new today" />
              <Stat value={snapshot.cards.length} label="started" />
            </div>
            <div style={{ marginTop: 14 }}>
              <Button wide variant="primary" onClick={startSession} disabled={due === 0 && fresh === 0}>
                {due + fresh === 0 ? "Nothing due right now" : `Start · ${due + fresh} cards`}
              </Button>
            </div>
          </Card>

          <Card tight>
            <p className="small">
              <b>How it works.</b> Every sentence comes back just before you would forget it (FSRS). New sentences
              start as reading, then become a missing word, then dictation, then saying it in Dutch.
            </p>
          </Card>

          <Card tight>
            <p className="tiny muted">
              Audio uses your phone's own Dutch voice — no downloads, no data. If a card has no sound, install a Dutch
              text-to-speech voice in Android settings.
            </p>
          </Card>
        </div>
      ) : null}

      {tab === "stats" ? <StatsView snapshot={snapshot} now={now} /> : null}

      {tab === "settings" ? (
        <SettingsView
          snapshot={snapshot}
          onChange={changeSettings}
          onReplace={setSnapshot}
          onSpeak={speak}
        />
      ) : null}

      <nav className="nav" aria-label="Sections">
        <button type="button" aria-current={tab === "today" ? "page" : undefined} onClick={() => setTab("today")}>
          Today
        </button>
        <button type="button" aria-current={tab === "stats" ? "page" : undefined} onClick={() => setTab("stats")}>
          Progress
        </button>
        <button type="button" aria-current={tab === "settings" ? "page" : undefined} onClick={() => setTab("settings")}>
          Settings
        </button>
      </nav>
    </div>
  );
}
