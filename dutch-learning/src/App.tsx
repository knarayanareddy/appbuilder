import { useCallback, useEffect, useMemo, useState } from "react";
import type { Attempt, CardState, Module, Report, Settings, Snapshot } from "@/types";
import { appendAttempt, appendReport, loadSnapshot, saveCards, saveModules, saveSettings } from "@/lib/repo";
import {
  applyAnswer,
  buildSession,
  gradeFor,
  type Answer,
  type SessionItem,
  type SessionRequest,
} from "@/lib/session";
import { buildRegistry } from "@/lib/module";
import { languageFor } from "@/lib/languages";
import { inspectVoice, loadAudioIndex, openVoiceInstall, playBundled, speak, stopSpeaking, type SpeechStatus } from "@/lib/speech";
import { LearnView } from "@/components/LearnView";
import { WordsView } from "@/components/WordsView";
import { ProgressView } from "@/components/ProgressView";
import { SettingsView } from "@/components/SettingsView";
import { StoryView } from "@/components/StoryView";
import { SessionView, type SessionSummary } from "@/components/SessionView";
import { Button, Card, Empty, Stat } from "@/components/ui";

type Tab = "learn" | "words" | "progress" | "settings";

function upsertCard(cards: CardState[], card: CardState): CardState[] {
  const index = cards.findIndex((existing) => existing.itemId === card.itemId);
  if (index === -1) return [...cards, card];
  const next = [...cards];
  next[index] = card;
  return next;
}

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [tab, setTab] = useState<Tab>("learn");
  const [queue, setQueue] = useState<SessionItem[] | null>(null);
  const [request, setRequest] = useState<SessionRequest | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [speech, setSpeech] = useState<SpeechStatus | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const registry = useMemo(() => buildRegistry(snapshot?.modules ?? []), [snapshot?.modules]);
  const locale = languageFor(snapshot?.settings.language ?? "nl").ttsLocale;

  useEffect(() => {
    void loadSnapshot().then(setSnapshot);
    void loadAudioIndex();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    void inspectVoice(locale).then((status) => {
      if (alive) setSpeech(status);
    });
    return () => {
      alive = false;
    };
  }, [locale]);

  const play = useCallback(
    async (text: string, speakLocale = locale, key?: string) => {
      const rate = snapshot?.settings.rate ?? 1;
      if (key && (await playBundled(key, rate))) return;
      const result = await speak(text, { locale: speakLocale, rate, voiceUri: snapshot?.settings.voice ?? null });
      if (!result.ok) {
        setSpeech({
          locale: speakLocale,
          supported: false,
          voices: [],
          error: result.error,
        });
      }
    },
    [locale, snapshot?.settings.rate, snapshot?.settings.voice],
  );

  const playItem = useCallback(
    (item: SessionItem) => {
      void play(item.item.text, item.ttsLocale, item.key);
    },
    [play],
  );

  const startSession = (next: SessionRequest) => {
    if (!snapshot) return;
    setSummary(null);
    setStoryId(null);
    setRequest(next);
    setQueue(buildSession(registry, snapshot, Date.now(), next));
  };

  const answer = async (item: SessionItem, result: Answer, typed: string, ms: number) => {
    if (!snapshot) return;

    const at = Date.now();
    const reschedule = request?.mode !== "quiz";
    const card = applyAnswer(item, result, at, snapshot.settings.desiredRetention, { reschedule });
    // A quiz may test a sentence you have not been taught yet; record the answer but
    // do not invent a schedule for it.
    const keepCard = !(request?.mode === "quiz" && item.isNew);
    const cards = keepCard ? upsertCard(snapshot.cards, card) : snapshot.cards;
    const attempt: Attempt = {
      id: `${at}-${item.key}-${item.kind}`,
      itemId: item.key,
      kind: item.kind,
      at,
      grade: gradeFor(result),
      correct: result.correct,
      ms,
      typed,
      mode: request?.mode,
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

  const addModule = async (module: Module) => {
    if (!snapshot) return;
    const others = snapshot.modules.filter((entry) => entry.id !== module.id);
    const modules = [...others, module];
    setSnapshot({ ...snapshot, modules });
    await saveModules(modules);
  };

  const removeModule = async (moduleId: string) => {
    if (!snapshot) return;
    const modules = snapshot.modules.filter((entry) => entry.id !== moduleId);
    setSnapshot({ ...snapshot, modules });
    await saveModules(modules);
  };

  const report = async (item: SessionItem) => {
    if (!snapshot) return;
    const note = window.prompt(`What is wrong with “${item.item.text}”?`, "");
    if (note === null) return;
    const entry: Report = { itemId: item.key, note: note.trim(), at: Date.now() };
    const reports = [...snapshot.reports, entry];
    setSnapshot({ ...snapshot, reports });
    await appendReport(entry);
  };

  const finishSession = (result: SessionSummary) => {
    void stopSpeaking();
    setSummary(result);
    setQueue(null);
    setTab("learn");
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

  const story = storyId ? registry.stories.find((entry) => entry.story.id === storyId)?.story ?? null : null;

  if (queue) {
    return (
      <div className="app">
        <SessionView
          items={queue}
          pool={{
            translations: [...registry.items.values()].map((ref) => ref.item.translation),
            words: [...registry.items.values()].flatMap((ref) => ref.item.text.split(/\s+/)),
          }}
          autoPlay={snapshot.settings.autoPlay}
          onAnswer={answer}
          onFinish={finishSession}
          onReport={(item) => void report(item)}
          play={playItem}
        />
      </div>
    );
  }

  if (story) {
    return (
      <div className="app">
        <StoryView
          story={story}
          onPlay={(text) => void play(text)}
          onClose={() => {
            void stopSpeaking();
            setStoryId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {summary ? (
        <div className="screen">
          <h1>Session done</h1>
          <Card>
            <div className="grid-3">
              <Stat value={summary.done} label="answered" />
              <Stat value={summary.correct} label="correct" />
              <Stat value={summary.done === 0 ? "—" : `${Math.round((summary.correct / summary.done) * 100)}%`} label="accuracy" />
            </div>
            <p className="small" style={{ marginTop: 12 }}>
              {summary.done > 0 && summary.correct / summary.done >= 0.85
                ? "That is the range where the schedule works."
                : "Below 85%? Lower the daily pace in Settings, or spend a few minutes in Practise more."}
            </p>
          </Card>
          <div className="stack">
            <Button wide variant="primary" onClick={() => startSession(request ?? { mode: "practice" })}>
              Keep going
            </Button>
            <Button
              wide
              variant="ghost"
              onClick={() => {
                setSummary(null);
                setTab("learn");
              }}
            >
              Back to Learn
            </Button>
          </div>
        </div>
      ) : null}

      {!summary && tab === "learn" ? (
        <LearnView
          registry={registry}
          snapshot={snapshot}
          now={now}
          onStart={startSession}
          onOpenUnit={(unitKey) => startSession({ mode: "unit", unitKey })}
          onOpenStory={setStoryId}
        />
      ) : null}

      {!summary && tab === "words" ? (
        <WordsView
          registry={registry}
          snapshot={snapshot}
          onPlay={(text, _locale, key) => void play(text, locale, key)}
        />
      ) : null}

      {!summary && tab === "progress" ? <ProgressView registry={registry} snapshot={snapshot} now={now} /> : null}

      {!summary && tab === "settings" ? (
        <SettingsView
          registry={registry}
          snapshot={snapshot}
          speech={speech}
          onSettings={changeSettings}
          onReplace={setSnapshot}
          onAddModule={addModule}
          onRemoveModule={removeModule}
          onTestVoice={() => void play("De fiets staat achter het station.")}
          onCheckVoice={() => void inspectVoice(locale).then(setSpeech)}
          onOpenVoiceInstall={() => void openVoiceInstall()}
        />
      ) : null}

      {summary ? null : (
        <nav className="nav" aria-label="Sections">
          <button type="button" aria-current={tab === "learn" ? "page" : undefined} onClick={() => setTab("learn")}>
            Learn
          </button>
          <button type="button" aria-current={tab === "words" ? "page" : undefined} onClick={() => setTab("words")}>
            Words
          </button>
          <button type="button" aria-current={tab === "progress" ? "page" : undefined} onClick={() => setTab("progress")}>
            Progress
          </button>
          <button type="button" aria-current={tab === "settings" ? "page" : undefined} onClick={() => setTab("settings")}>
            Settings
          </button>
        </nav>
      )}

      {!speech?.supported && speech && !summary && tab !== "settings" ? (
        <div className="screen" style={{ paddingTop: 0 }}>
          <Card tight>
            <p className="tiny">
              No {locale} voice found on this device, so audio will be silent or read with an English accent.{" "}
              <button type="button" className="link" onClick={() => setTab("settings")}>
                Fix the voice in Settings →
              </button>
            </p>
          </Card>
        </div>
      ) : null}

      {registry.items.size === 0 ? <Empty title="No sentences loaded.">Import a module in Settings.</Empty> : null}
    </div>
  );
}
