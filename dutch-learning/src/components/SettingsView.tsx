import { useRef, useState } from "react";
import type { Settings, Snapshot } from "@/types";
import { backupFileName, readTextFile, saveBackupFile } from "@/lib/backup";
import { exportSnapshot, importSnapshot, resetAll } from "@/lib/repo";
import { CONTENT_STATS } from "@/lib/content";
import { lastSpeechError } from "@/lib/speech";
import { Button, Card } from "./ui";

export function SettingsView({
  snapshot,
  onChange,
  onReplace,
  onSpeak,
}: {
  snapshot: Snapshot;
  onChange: (settings: Settings) => Promise<void> | void;
  onReplace: (snapshot: Snapshot) => void;
  onSpeak: (text: string) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const settings = snapshot.settings;

  const update = (patch: Partial<Settings>) => {
    void onChange({ ...settings, ...patch });
if (patch.rate !== undefined) onSpeak("Dit is een test.");
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
      setMessage(`Restored ${result.cards} cards and ${result.attempts} attempts.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Restore failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <h1>Settings</h1>

      <Card>
        <h2>Daily load</h2>
        <div className="row spread">
          <span className="small">New sentences per day</span>
          <div className="row">
            <Button small onClick={() => update({ dailyNew: Math.max(0, settings.dailyNew - 1) })} ariaLabel="Fewer new sentences">
              −
            </Button>
            <b style={{ minWidth: 24, textAlign: "center" }}>{settings.dailyNew}</b>
            <Button small onClick={() => update({ dailyNew: Math.min(40, settings.dailyNew + 1) })} ariaLabel="More new sentences">
              +
            </Button>
          </div>
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Six is about twenty minutes once reviews pile up. Raising this raises the review debt four to six weeks from
          now, which is where most people quit.
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
          Bring cards back when you are likely to remember them <b>{Math.round(settings.desiredRetention * 100)}%</b> of
          the time. Higher means more reviews and better retention; 90% is the usual trade.
        </p>
      </Card>

      <Card>
        <h2>Voice</h2>
        <input
          type="range"
          min={50}
          max={150}
          value={Math.round(settings.rate * 100)}
          aria-label="Speech rate"
          onChange={(event) => update({ rate: Number(event.target.value) / 100 })}
        />
        <div className="row spread">
          <span className="small">
            Speed <b>{Math.round(settings.rate * 100)}%</b>
          </span>
          <Button small onClick={() => onSpeak("De fiets staat achter het station.")}>
            Test voice
          </Button>
        </div>
        {lastSpeechError() ? <p className="tiny muted">Voice problem: {lastSpeechError()}</p> : null}
      </Card>

      <Card>
        <h2>Backup</h2>
        <p className="small muted" style={{ marginBottom: 10 }}>
          One file with every card's schedule and your history. Installing a new APK keeps your data, but a lost phone
          does not — and this is the only copy that survives it.
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
          className="hidden"
          aria-label="Choose a backup file"
          style={{ display: "none" }}
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
        <h2>Library</h2>
        <p className="small muted">
          {CONTENT_STATS.total} sentences · {CONTENT_STATS.themes} themes · {CONTENT_STATS.a1} A1 · {CONTENT_STATS.a2} A2.
          M1 seed; the pipeline extends it without touching the scheduler.
        </p>
      </Card>

      <Card>
        <h2>Start over</h2>
        {confirmReset ? (
          <div className="stack">
            <p className="small">This deletes every card and attempt on this phone. Back up first.</p>
            <div className="row">
              <Button
                wide
                onClick={() => {
                  void resetAll().then(() => window.location.reload());
                }}
              >
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
