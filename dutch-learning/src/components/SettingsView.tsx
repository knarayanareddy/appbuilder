import { useMemo, useRef, useState } from "react";
import type { Module, Settings, Snapshot } from "@/types";
import { backupFileName, readTextFile, saveBackupFile } from "@/lib/backup";
import { exportSnapshot, importSnapshot, resetAll } from "@/lib/repo";
import { countItems, validateModule, type Registry } from "@/lib/module";
import type { SpeechStatus } from "@/lib/speech";
import { LANGUAGES } from "@/lib/languages";
import { Button, Card, Tag } from "./ui";

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
}) {
  const [message, setMessage] = useState<string | null>(null);
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
      setMessage(`Saved ${name} to ${saved.location}${saved.shared ? " and opened the share sheet." : "."}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backup failed.");
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
      setMessage(`Restored ${result.cards} cards, ${result.attempts} attempts and ${result.modules} modules.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Restore failed.");
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
    setMessage(`Added “${result.module.title}” — ${countItems(result.module)} sentences.`);
  }

  async function exportModule(module: Module) {
    const saved = await saveBackupFile(JSON.stringify(module, null, 2), `${module.id}.json`);
    setMessage(`Exported ${module.id}.json to ${saved.location}.`);
  }

  return (
    <div className="screen">
      <h1>Settings</h1>

      <Card>
        <h2>Daily pace</h2>
        <div className="row spread">
          <span className="small">New sentences in the daily session</span>
          <div className="row">
            <Button small onClick={() => update({ dailyNew: Math.max(0, settings.dailyNew - 1) })} ariaLabel="Fewer new sentences">
              −
            </Button>
            <b style={{ minWidth: 26, textAlign: "center" }}>{settings.dailyNew}</b>
            <Button small onClick={() => update({ dailyNew: Math.min(100, settings.dailyNew + 1) })} ariaLabel="More new sentences">
              +
            </Button>
          </div>
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          This only paces the <b>daily</b> session. Practise, Quiz me and the units are unlimited — the app never stops
          you because a number ran out.
        </p>
      </Card>

      <Card>
        <h2>Recall target</h2>
        <input
          type="range"
          min={70}
          max={97}
          value={Math.round(settings.desiredRetention * 100)}
          aria-label="Recall target"
          onChange={(event) => update({ desiredRetention: Number(event.target.value) / 100 })}
        />
        <p className="small">
          Cards come back when you are likely to remember them <b>{Math.round(settings.desiredRetention * 100)}%</b> of
          the time. Higher means more reviews and less forgetting; 90% is the usual trade.
        </p>
      </Card>

      <Card>
        <h2>Voice</h2>
        {speech === null ? (
          <p className="small muted">Checking what this device can speak…</p>
        ) : speech.supported ? (
          <>
            <p className="small">
              Speaking <b>{language.name}</b> in <b>{speech.locale}</b>.{" "}
              {speech.voices.length > 1 ? "Pick the voice that sounds right:" : "One voice found on this device."}
            </p>
            <div className="chips" style={{ marginTop: 8 }}>
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
                  {voice.local ? "" : " (online)"}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="stack">
            <p className="small">
              <b>No {language.name} voice found.</b> Android falls back to an English voice reading{" "}
              {language.name} words — which is exactly how pronunciation gets butchered. Installing the voice data fixes
              it everywhere, not just in this app.
            </p>
            <div className="row">
              <Button onClick={onOpenVoiceInstall}>Install the voice</Button>
              <Button variant="ghost" onClick={onCheckVoice}>
                Check again
              </Button>
            </div>
            <p className="tiny muted">
              Android: Settings → System → Languages &amp; input → Text-to-speech output → Google → Install voice data →{" "}
              {language.name}.
            </p>
          </div>
        )}

        <div className="row spread" style={{ marginTop: 12 }}>
          <span className="small">
            Speed <b>{Math.round(settings.rate * 100)}%</b>
          </span>
          <Button small onClick={onTestVoice}>
            Test voice
          </Button>
        </div>
        <input
          type="range"
          min={50}
          max={150}
          value={Math.round(settings.rate * 100)}
          aria-label="Speech rate"
          onChange={(event) => update({ rate: Number(event.target.value) / 100 })}
        />
        <div className="row spread" style={{ marginTop: 8 }}>
          <span className="small">Play audio automatically on new cards</span>
          <Button small onClick={() => update({ autoPlay: !settings.autoPlay })}>
            {settings.autoPlay ? "On" : "Off"}
          </Button>
        </div>
      </Card>

      <Card>
        <h2>Modules</h2>
        <div className="stack">
          {registry.modules.map((module) => (
            <div key={module.id} className="row spread">
              <div>
                <b className="small">{module.title}</b>
                <p className="tiny muted">
                  {module.units.length} units · {countItems(module)} sentences ·{" "}
                  {LANGUAGES.find((entry) => entry.code === module.language)?.name ?? module.language}
                </p>
              </div>
              <div className="row">
                <Button small variant="ghost" onClick={() => void exportModule(module)}>
                  Export
                </Button>
                {module.id !== "nl-basis" ? (
                  <Button
                    small
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Remove “${module.title}”? Your progress on it stays, but the sentences go.`)) {
                        void onRemoveModule(module.id);
                      }
                    }}
                  >
                    Remove
                  </Button>
                ) : (
                  <Tag>built-in</Tag>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="small muted" style={{ marginTop: 12 }}>
          A module is plain JSON: units of sentences with translations. Paste one below, or import a file — ask an AI
          for a module and drop it in. The format and a ready-made prompt are in <code>docs/MODULE-FORMAT.md</code>.
        </p>
        <textarea
          aria-label="Module JSON"
          rows={5}
          placeholder='{"schemaVersion":1,"id":"nl-werk","language":"nl",…}'
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          style={{ marginTop: 8 }}
        />
        <div className="row" style={{ marginTop: 8 }}>
          <Button onClick={() => void addModule(paste)} disabled={paste.trim().length === 0}>
            Add module
          </Button>
          <Button variant="ghost" onClick={() => moduleInput.current?.click()}>
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
          <div className="feedback bad" style={{ marginTop: 10 }}>
            <p className="small" style={{ fontWeight: 700 }}>
              That module was not added:
            </p>
            {errors.map((error) => (
              <p key={error} className="tiny">
                · {error}
              </p>
            ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <h2>Backup</h2>
        <p className="small muted" style={{ marginBottom: 10 }}>
          One file with every card's schedule, your history and your imported modules. Installing a new APK keeps your
          data; a lost phone does not.
        </p>
        <div className="row">
          <Button wide onClick={() => void backUp()} disabled={busy}>
            {busy ? "Saving…" : "Back up now"}
          </Button>
          <Button wide variant="ghost" onClick={() => fileInput.current?.click()} disabled={busy}>
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
        {message ? (
          <p className="tiny" style={{ marginTop: 10 }}>
            {message}
          </p>
        ) : null}
      </Card>

      <Card>
        <h2>Translation reports</h2>
        <p className="small muted">
          {snapshot.reports.length === 0
            ? "Nothing reported. Use the small “Report” link on a card when a translation looks wrong — it is stored here with the sentence."
            : `${snapshot.reports.length} sentence${snapshot.reports.length === 1 ? "" : "s"} reported. Export them and hand the file over, or fix the module.`}
        </p>
        {snapshot.reports.length > 0 ? (
          <div className="stack" style={{ marginTop: 8 }}>
            {snapshot.reports.slice(-5).map((report) => (
              <p key={`${report.itemId}-${report.at}`} className="tiny muted">
                {report.itemId} — {report.note || "no note"}
              </p>
            ))}
            <Button
              small
              onClick={() =>
                void saveBackupFile(JSON.stringify(snapshot.reports, null, 2), "taal-reports.json").then((saved) =>
                  setMessage(`Reports saved to ${saved.location}.`),
                )
              }
            >
              Export reports
            </Button>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2>Start over</h2>
        {confirmReset ? (
          <div className="stack">
            <p className="small">This deletes every card, attempt, module and report on this phone. Back up first.</p>
            <div className="row">
              <Button wide onClick={() => void resetAll().then(() => window.location.reload())}>
                Yes, delete everything
              </Button>
              <Button wide variant="ghost" onClick={() => setConfirmReset(false)}>
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
    </div>
  );
}
