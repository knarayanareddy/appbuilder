import { useMemo, useRef, useState } from "react";
import type { Module, Settings, Snapshot } from "@/types";
import { backupFileName, readTextFile, saveBackupFile } from "@/lib/backup";
import { exportSnapshot, importSnapshot, resetAll } from "@/lib/repo";
import { countItems, validateModule, type Registry } from "@/lib/module";
import type { SpeechStatus } from "@/lib/speech";
import { LANGUAGES } from "@/lib/languages";
import { Icon } from "./icons";
import { Button, Card, Pill, SectionTitle, Toggle } from "./ui";

export function SettingsView({
  registry,
  snapshot,
  speech,
  onSettings,
  onReplace,
  onAddModule,
  onRemoveModule,
  onTestVoice,
  onCheckVoice,
  onOpenVoiceInstall,
  onReplayIntro,
  onToast,
}: {
  registry: Registry;
  snapshot: Snapshot;
  speech: SpeechStatus | null;
  onSettings: (settings: Settings) => Promise<void> | void;
  onReplace: (snapshot: Snapshot) => void;
  onAddModule: (module: Module) => Promise<void> | void;
  onRemoveModule: (moduleId: string) => Promise<void> | void;
  onTestVoice: () => void;
  onCheckVoice: () => void;
  onOpenVoiceInstall: () => void;
  onReplayIntro: () => void;
  onToast: (message: string) => void;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const moduleInput = useRef<HTMLInputElement>(null);

  const settings = snapshot.settings;
  const language = useMemo(
    () => LANGUAGES.find((entry) => entry.code === settings.language) ?? LANGUAGES[0],
    [settings.language],
  );

  const update = (patch: Partial<Settings>) => {
    void onSettings({ ...settings, ...patch });
  };

  async function backUp() {
    setBusy(true);
    try {
      const name = backupFileName();
      const saved = await saveBackupFile(exportSnapshot(snapshot), name);
      onToast(`Saved ${name} to ${saved.location}${saved.shared ? " · share sheet opened" : ""}`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Backup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function restore(file: File) {
    if (!window.confirm("Restoring replaces everything currently in the app. Continue?")) return;
    setBusy(true);
    try {
      const result = await importSnapshot(await readTextFile(file));
      onReplace(result.snapshot);
      onToast(`Restored ${result.cards} cards and ${result.modules} modules`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Restore failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addModule(text: string) {
    setErrors([]);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setErrors(["That is not JSON. Paste the whole file, starting with {"]);
      return;
    }
    const result = validateModule(parsed);
    if (!result.ok || !result.module) {
      setErrors(result.errors.slice(0, 8));
      return;
    }
    await onAddModule(result.module);
    setPaste("");
    onToast(`Added “${result.module.title}” · ${countItems(result.module)} sentences`);
  }

  async function exportModule(module: Module) {
    const saved = await saveBackupFile(JSON.stringify(module, null, 2), `${module.id}.json`);
    onToast(`Exported ${module.id}.json to ${saved.location}`);
  }

  return (
    <div className="screen">
      <div className="hero">
        <div>
          <p className="hero-eyebrow">Jij bepaalt</p>
          <h1 className="hero-title">Settings</h1>
          <p className="hero-sub">Pace, voice, modules and backups</p>
        </div>
      </div>

      <Card>
        <div className="row spread">
          <div>
            <p style={{ fontWeight: 800 }}>New sentences in the daily session</p>
            <p className="tiny dim">Only the daily plan is paced. Everything else is unlimited.</p>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Button
              size="sm"
              ariaLabel="Fewer new sentences"
              onClick={() => update({ dailyNew: Math.max(0, settings.dailyNew - 1) })}
            >
              −
            </Button>
            <b style={{ minWidth: 30, textAlign: "center", fontSize: 20 }}>{settings.dailyNew}</b>
            <Button
              size="sm"
              ariaLabel="More new sentences"
              onClick={() => update({ dailyNew: Math.min(100, settings.dailyNew + 1) })}
            >
              +
            </Button>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="row spread small">
            <span className="muted">Recall target</span>
            <b>{Math.round(settings.desiredRetention * 100)}%</b>
          </div>
          <input
            type="range"
            min={70}
            max={97}
            value={Math.round(settings.desiredRetention * 100)}
            aria-label="Recall target"
            onChange={(event) => update({ desiredRetention: Number(event.target.value) / 100 })}
          />
          <p className="tiny dim">
            Cards come back when you are likely to remember them this often. Higher means more reviews.
          </p>
        </div>
      </Card>

      <SectionTitle right={<Pill tone={speech?.supported ? "green" : "rose"}>{speech?.supported ? "ready" : "missing"}</Pill>}>
        Voice · {language.name}
      </SectionTitle>
      <Card>
        {speech === null ? (
          <p className="small muted">Checking what this device can speak…</p>
        ) : speech.supported ? (
          <>
            <p className="small muted">
              {speech.voices.length > 1 ? "Pick the voice that sounds right:" : "One voice found on this device."}
            </p>
            <div className="chips" style={{ marginTop: 10 }}>
              <button
                type="button"
                className={settings.voice === null ? "pill on" : "pill"}
                onClick={() => update({ voice: null })}
              >
                Best available
              </button>
              {speech.voices.map((voice) => (
                <button
                  key={voice.uri}
                  type="button"
                  className={settings.voice === voice.uri ? "pill on" : "pill"}
                  onClick={() => update({ voice: voice.uri })}
                >
                  {voice.name}
                  {voice.local ? "" : " · online"}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="stack">
            <p className="small">
              <b>No {language.name} voice installed.</b> Android falls back to an English voice reading {language.name} —
              which is exactly how pronunciation gets butchered.
            </p>
            <div className="row">
              <Button size="sm" variant="primary" icon="download" onClick={onOpenVoiceInstall}>
                Install the voice
              </Button>
              <Button size="sm" onClick={onCheckVoice}>
                Check again
              </Button>
            </div>
            <p className="tiny dim">
              Android: Settings → System → Languages &amp; input → Text-to-speech output → Google → Install voice data →{" "}
              {language.name}.
            </p>
          </div>
        )}

        <div className="list-row" style={{ marginTop: 12 }}>
          <span className="list-row-icon">
            <Icon name="speaker" size={18} />
          </span>
          <div className="grow">
            <p className="small" style={{ fontWeight: 800 }}>
              Speed {Math.round(settings.rate * 100)}%
            </p>
            <input
              type="range"
              min={50}
              max={150}
              value={Math.round(settings.rate * 100)}
              aria-label="Speech rate"
              onChange={(event) => update({ rate: Number(event.target.value) / 100 })}
            />
          </div>
          <Button size="sm" onClick={onTestVoice}>
            Test
          </Button>
        </div>

        <div className="list-row">
          <span className="list-row-icon">
            <Icon name="play" size={18} />
          </span>
          <div className="grow">
            <p className="small" style={{ fontWeight: 800 }}>
              Play audio automatically
            </p>
            <p className="tiny dim">New cards and dictation speak without a tap.</p>
          </div>
          <Toggle on={settings.autoPlay} label="Play audio automatically" onChange={() => update({ autoPlay: !settings.autoPlay })} />
        </div>
      </Card>

      <SectionTitle>Look and feel</SectionTitle>
      <Card>
        <div className="list-row">
          <span className="list-row-icon">
            <Icon name="sparkle" size={18} />
          </span>
          <div className="grow">
            <p className="small" style={{ fontWeight: 800 }}>
              Theme
            </p>
            <p className="tiny dim">Follow the system, or force one.</p>
          </div>
        </div>
        <div className="segmented" role="group" aria-label="Theme" style={{ marginTop: 10 }}>
          {(["dark", "light", "system"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={settings.theme === option}
              onClick={() => update({ theme: option })}
            >
              {option === "dark" ? "Dark" : option === "light" ? "Light" : "System"}
            </button>
          ))}
        </div>

        <div className="list-row" style={{ marginTop: 6 }}>
          <span className="list-row-icon">
            <Icon name="speaker" size={18} />
          </span>
          <div className="grow">
            <p className="small" style={{ fontWeight: 800 }}>
              Sound
            </p>
            <p className="tiny dim">A short tone for right and wrong. Synthesised, so no files.</p>
          </div>
          <Toggle on={settings.sound} label="Sound" onChange={() => update({ sound: !settings.sound })} />
        </div>

        <div className="list-row">
          <span className="list-row-icon">
            <Icon name="puzzle" size={18} />
          </span>
          <div className="grow">
            <p className="small" style={{ fontWeight: 800 }}>
              Haptics
            </p>
            <p className="tiny dim">A tap you can feel when an answer lands.</p>
          </div>
          <Toggle on={settings.haptics} label="Haptics" onChange={() => update({ haptics: !settings.haptics })} />
        </div>

        <div className="list-row">
          <span className="list-row-icon">
            <Icon name="refresh" size={18} />
          </span>
          <div className="grow">
            <p className="small" style={{ fontWeight: 800 }}>
              Intro
            </p>
            <p className="tiny dim">Run the welcome screens and the level question again.</p>
          </div>
          <Button size="sm" onClick={onReplayIntro}>
            Show
          </Button>
        </div>
      </Card>

      <SectionTitle right={<Pill>{registry.modules.length}</Pill>}>Modules</SectionTitle>
      <Card>
        <div className="stack">
          {registry.modules.map((module) => (
            <div key={module.id} className="list-row">
              <span className="list-row-icon">
                <Icon name="layers" size={18} />
              </span>
              <div className="grow">
                <p className="small" style={{ fontWeight: 800 }}>
                  {module.title}
                </p>
                <p className="tiny dim">
                  {module.units.length} units · {countItems(module)} sentences ·{" "}
                  {LANGUAGES.find((entry) => entry.code === module.language)?.name ?? module.language}
                </p>
              </div>
              <Button size="sm" onClick={() => void exportModule(module)}>
                Export
              </Button>
              {module.id !== "nl-basis" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(`Remove “${module.title}”? Your progress on it stays, the sentences go.`)) {
                      void onRemoveModule(module.id);
                    }
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        <p className="small muted" style={{ marginTop: 10 }}>
          A module is plain JSON — units of sentences with translations. Paste one below or import a file; the format
          and a ready-made prompt live in <code>docs/</code>.
        </p>
        <textarea
          aria-label="Module JSON"
          rows={4}
          placeholder='{"schemaVersion":1,"id":"nl-werk","language":"nl",…}'
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          style={{ marginTop: 10, minHeight: 96, fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
        />
        <div className="row" style={{ marginTop: 10 }}>
          <Button size="sm" variant="primary" icon="upload" onClick={() => void addModule(paste)} disabled={paste.trim().length === 0}>
            Add module
          </Button>
          <Button size="sm" icon="download" onClick={() => moduleInput.current?.click()}>
            From file
          </Button>
        </div>
        <input
          ref={moduleInput}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          aria-label="Choose a module file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void file.text().then(addModule);
          }}
        />
        {errors.length > 0 ? (
          <div className="feedback bad" style={{ marginTop: 12 }}>
            <p className="verdict">
              <Icon name="close" size={16} /> That module was not added
            </p>
            {errors.map((error) => (
              <p key={error} className="tiny" style={{ marginTop: 4 }}>
                · {error}
              </p>
            ))}
          </div>
        ) : null}
      </Card>

      <SectionTitle>Backup</SectionTitle>
      <Card>
        <p className="small muted">
          One file with every schedule, attempt and imported module. Installing a new APK keeps your data; a lost phone
          does not.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Button wide variant="primary" icon="download" onClick={() => void backUp()} disabled={busy}>
            {busy ? "Saving…" : "Back up now"}
          </Button>
          <Button wide icon="upload" onClick={() => fileInput.current?.click()} disabled={busy}>
            Restore
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          aria-label="Choose a backup file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void restore(file);
          }}
        />
      </Card>

      <SectionTitle right={snapshot.reports.length > 0 ? <Pill tone="rose">{snapshot.reports.length}</Pill> : undefined}>
        Translation reports
      </SectionTitle>
      <Card>
        <p className="small muted">
          {snapshot.reports.length === 0
            ? "Nothing reported. Use “Report” on a card when a translation looks wrong — the sentence and your note are kept here."
            : `${snapshot.reports.length} reported. Export them and hand the file over, or fix the module directly.`}
        </p>
        {snapshot.reports.length > 0 ? (
          <div className="stack" style={{ marginTop: 10, gap: 6 }}>
            {snapshot.reports.slice(-5).map((report) => (
              <p key={`${report.itemId}-${report.at}`} className="tiny dim">
                {report.itemId} — {report.note || "no note"}
              </p>
            ))}
            <Button
              size="sm"
              onClick={() =>
                void saveBackupFile(JSON.stringify(snapshot.reports, null, 2), "taal-reports.json").then((saved) =>
                  onToast(`Reports saved to ${saved.location}`),
                )
              }
            >
              Export reports
            </Button>
          </div>
        ) : null}
      </Card>

      <SectionTitle>Start over</SectionTitle>
      <Card>
        {confirmReset ? (
          <div className="stack">
            <p className="small">This deletes every card, attempt, module and report on this phone. Back up first.</p>
            <div className="row">
              <Button wide variant="danger" onClick={() => void resetAll().then(() => window.location.reload())}>
                Yes, delete everything
              </Button>
              <Button wide onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button wide variant="ghost" onClick={() => setConfirmReset(true)}>
            Reset progress
          </Button>
        )}
      </Card>

      <p className="tiny dim" style={{ textAlign: "center" }}>
        Taal · offline · your data stays on this phone
      </p>
    </div>
  );
}
