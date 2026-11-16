import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Attempt, CardState, Module, Report, Settings, Snapshot } from "@/types";
import { appendAttempt, appendReport, loadSnapshot, saveCards, saveModules, saveSettings } from "@/lib/repo";
import { applyAnswer, buildSession, gradeFor, type Answer, type SessionItem, type SessionRequest } from "@/lib/session";
import { buildRegistry } from "@/lib/module";
import { newCard } from "@/lib/fsrs";
import { applyTheme } from "@/lib/theme";
import { configureFeedback } from "@/lib/sound";
import { languageFor } from "@/lib/languages";
import {
  forgetVoice,
  inspectVoice,
  loadAudioIndex,
  openVoiceInstall,
  playBundled,
  speak,
  stopSpeaking,
  type SpeechStatus,
} from "@/lib/speech";
import { LearnView } from "@/components/LearnView";
import { WordsView } from "@/components/WordsView";
import { ProgressView } from "@/components/ProgressView";
import { SettingsView } from "@/components/SettingsView";
import { StoryView } from "@/components/StoryView";
import { Onboarding } from "@/components/Onboarding";
import { SessionView, type SessionSummary } from "@/components/SessionView";
import { Icon, type IconName } from "@/components/icons";
import { Button, Card, Empty, Ring, Stat, Toast } from "@/components/ui";

type Tab = "learn" | "words" | "progress" | "settings";

const TABS: Array<{ id: Tab; label: string; icon: IconName }> = [
  { id: "learn", label: "Learn", icon: "home" },
  { id: "words", label: "Words", icon: "book" },
  { id: "progress", label: "Progress", icon: "chart" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const CONFETTI = ["#ff7a3d", "#3ddc97", "#8b5cf6", "#ffc64b", "#2dd4bf"];

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
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const toastTimer = useRef<number | null>(null);

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

  useEffect(() => applyTheme(snapshot?.settings.theme ?? "system"), [snapshot?.settings.theme]);

  useEffect(() => {
    configureFeedback({ sound: snapshot?.settings.sound ?? true, haptics: snapshot?.settings.haptics ?? true });
  }, [snapshot?.settings.sound, snapshot?.settings.haptics]);

  useEffect(() => {
    let alive = true;
    void inspectVoice(locale).then((status) => {
      if (alive) setSpeech(status);
    });
    return () => {
      alive = false;
    };
  }, [locale]);

  const voiceHinted = useRef(false);

  const checkVoice = useCallback(
    async () => {
      forgetVoice();
      const status = await inspectVoice(locale, { refresh: true });
      setSpeech(status);
      return status;
    },
    [locale],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const play = useCallback(
    async (text: string, speakLocale = locale, key?: string) => {
      const rate = snapshot?.settings.rate ?? 1;
      if (key && (await playBundled(key, rate))) return;
      const result = await speak(text, { locale: speakLocale, rate, voiceUri: snapshot?.settings.voice ?? null });
      if (!result.ok) {
        setSpeech({ locale: speakLocale, supported: false, voices: [], error: result.error });
        // Say it once per session instead of leaving a silent tap unexplained.
        if (!voiceHinted.current) {
          voiceHinted.current = true;
          showToast("No Dutch voice on this phone — Settings → Voice → Install");
        }
      }
    },
    [locale, snapshot?.settings.rate, snapshot?.settings.voice, showToast],
  );

  const playItem = useCallback((item: SessionItem) => void play(item.item.text, item.ttsLocale, item.key), [play]);

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
    // In a placement check a correct answer means "you already know this": schedule it
    // as review at rung 3 instead of teaching it again.
    const seed = Boolean(request?.seed) && item.isNew && result.correct;
    const card = seed
      ? { ...newCard(item.key, 3, at, snapshot.settings.desiredRetention), stage: 3 }
      : applyAnswer(item, result, at, snapshot.settings.desiredRetention, { reschedule });
    // A quiz may test a sentence nobody has taught yet; record the answer without
    // inventing a schedule for it.
    const keepCard = seed || !(request?.mode === "quiz" && item.isNew);
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
    const modules = [...snapshot.modules.filter((entry) => entry.id !== module.id), module];
    setSnapshot({ ...snapshot, modules });
    await saveModules(modules);
  };

  const removeModule = async (moduleId: string) => {
    if (!snapshot) return;
    const modules = snapshot.modules.filter((entry) => entry.id !== moduleId);
    setSnapshot({ ...snapshot, modules });
    await saveModules(modules);
    showToast("Module removed");
  };

  const report = async (item: SessionItem) => {
    if (!snapshot) return;
    const note = window.prompt(`What is wrong with “${item.item.text}”?`, "");
    if (note === null) return;
    const entry: Report = { itemId: item.key, note: note.trim(), at: Date.now() };
    setSnapshot({ ...snapshot, reports: [...snapshot.reports, entry] });
    await appendReport(entry);
    showToast("Reported — it is in Settings → Translation reports");
  };

  const finishIntro = async (patch: Partial<Settings>) => {
    if (!snapshot) return;
    await changeSettings({ ...snapshot.settings, ...patch, onboarded: true });
    showToast("Welkom — je eerste sessie staat klaar");
  };

  const startPlacement = async (patch: Partial<Settings>) => {
    if (!snapshot) return;
    await changeSettings({ ...snapshot.settings, ...patch, onboarded: true });
    startSession({ mode: "quiz", seed: true });
  };

  const replayIntro = async () => {
    if (!snapshot) return;
    await changeSettings({ ...snapshot.settings, onboarded: false });
    setSummary(null);
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

  if (!snapshot.settings.onboarded && !queue && !story) {
    return (
      <div className="app">
        <Onboarding
          speech={speech}
          onFinish={(patch) => void finishIntro(patch)}
          onPlacement={(patch) => void startPlacement(patch)}
          onInstallVoice={() => void openVoiceInstall()}
          onCheckVoice={() => void checkVoice()}
        />
      </div>
    );
  }

  if (queue) {
    return (
      <div className="app flush">
        <SessionView
          items={queue}
          pool={{
            translations: [...registry.items.values()].map((ref) => ref.item.translation),
            words: [...registry.items.values()].flatMap((ref) => ref.item.text.split(/\s+/)),
          }}
          autoPlay={snapshot.settings.autoPlay}
          onAnswer={answer}
          onFinish={finishSession}
          onQuit={finishSession}
          onReport={(item) => void report(item)}
          play={playItem}
        />
      </div>
    );
  }

  if (story) {
    return (
      <div className="app flush">
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

  const accuracy = summary && summary.done > 0 ? Math.round((summary.correct / summary.done) * 100) : 0;

  return (
    <div className="app">
      {summary ? (
        <div className="screen">
          <Card className="summary-card">
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 18 }, (_, index) => (
                <i
                  key={index}
                  style={{
                    left: `${(index * 37) % 100}%`,
                    background: CONFETTI[index % CONFETTI.length],
                    animationDelay: `${(index % 6) * 90}ms`,
                  }}
                />
              ))}
            </div>
            <p className="hero-eyebrow">Sessie klaar</p>
            <div style={{ display: "grid", placeItems: "center", margin: "14px 0" }}>
              <Ring value={summary.correct} max={Math.max(1, summary.done)} label={`${accuracy}%`} sublabel="accuracy" />
            </div>
            <p className="small muted">
              {summary.correct} of {summary.done} correct.{" "}
              {accuracy >= 85
                ? "That is the range where the schedule works."
                : "Below 85%? Lower the daily pace, or spend a few minutes in Practise more."}
            </p>
          </Card>
          <div className="grid-3">
            <Stat value={summary.done} label="answered" />
            <Stat value={summary.correct} label="correct" />
            <Stat value={summary.done - summary.correct} label="to fix" />
          </div>
          <div className="stack">
            <Button wide size="lg" variant="primary" onClick={() => startSession(request ?? { mode: "practice" })}>
              Keep going
            </Button>
            <Button
              wide
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
        <WordsView registry={registry} snapshot={snapshot} onPlay={(text, _locale, key) => void play(text, locale, key)} />
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
          onCheckVoice={() => void checkVoice()}
          onOpenVoiceInstall={() => void openVoiceInstall().then(() => checkVoice())}
          onReplayIntro={() => void replayIntro()}
          onToast={showToast}
        />
      ) : null}

      {!speech?.supported && speech && !summary && tab === "learn" ? (
        <Card tight>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <span style={{ color: "var(--gold)" }}>
              <Icon name="speaker" size={18} />
            </span>
            <p className="tiny grow">
              No {locale} voice installed — audio would read {locale} with an English accent.{" "}
              <button type="button" className="link" onClick={() => setTab("settings")}>
                Fix it in Settings
              </button>
            </p>
          </div>
        </Card>
      ) : null}

      {summary ? null : (
        <nav className="nav" aria-label="Sections">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-current={tab === entry.id ? "page" : undefined}
              onClick={() => setTab(entry.id)}
            >
              <Icon name={entry.icon} size={20} />
              {entry.label}
            </button>
          ))}
        </nav>
      )}

      {registry.items.size === 0 ? <Empty title="No sentences loaded.">Import a module in Settings.</Empty> : null}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
