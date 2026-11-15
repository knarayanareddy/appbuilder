import { useEffect, useRef, useState } from "react";
import { Download, HardDrive, Info, ShieldCheck, Upload, Warehouse } from "lucide-react";
import { Badge, Button, Notice } from "./ui";
import { formatAgo, formatBytes } from "@/lib/format";
import { isNative, storageInfo } from "@/lib/native";
import type { BackupResult, RestoreResult } from "@/hooks/useInventory";
import type { InventorySnapshot } from "@/types";

export interface SettingsViewProps {
  snapshot: InventorySnapshot;
  onEditLayout: () => void;
  onBackup: () => Promise<BackupResult>;
  onRestore: (file: File) => Promise<RestoreResult>;
  photoCount: number | null;
}

type Message = { tone: "emerald" | "red" | "slate"; text: string } | null;

export function SettingsView({ snapshot, onEditLayout, onBackup, onRestore, photoCount }: SettingsViewProps) {
  const [busy, setBusy] = useState<"backup" | "restore" | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void storageInfo().then((info) => {
      if (alive) setStorage(info);
    });
    void (async () => {
      try {
        const value = await navigator.storage?.persisted?.();
        if (alive) setPersisted(typeof value === "boolean" ? value : null);
      } catch {
        if (alive) setPersisted(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [snapshot.settings.lastBackupAt]);

  const runBackup = async () => {
    setBusy("backup");
    setMessage(null);
    try {
      const result = await onBackup();
      setMessage({
        tone: "emerald",
        text: result.shared
          ? `Saved to ${result.location} and opened the share sheet.`
          : `Saved to ${result.location}.`,
      });
    } catch (error) {
      setMessage({ tone: "red", text: error instanceof Error ? error.message : "Backup failed." });
    } finally {
      setBusy(null);
    }
  };

  const runRestore = async (file: File) => {
    setBusy("restore");
    setMessage(null);
    try {
      const result = await onRestore(file);
      setMessage({
        tone: "emerald",
        text: `Restored ${result.bikes} bikes, ${result.slots} places and ${result.photos} photos.`,
      });
    } catch (error) {
      setMessage({ tone: "red", text: error instanceof Error ? error.message : "Restore failed." });
    } finally {
      setBusy(null);
    }
  };

  const zoneSummary = snapshot.settings.zones.map((zone) => `${zone.code}·${zone.count}`).join("  ");

  return (
    <div className="space-y-3 p-3 pb-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-3">
        <header className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <ShieldCheck size={16} className="text-emerald-600" /> Backup
          </h2>
          <Badge tone={snapshot.settings.lastBackupAt ? "emerald" : "amber"}>
            last: {formatAgo(snapshot.settings.lastBackupAt)}
          </Badge>
        </header>
        <p className="mb-2.5 text-[11px] leading-relaxed text-slate-600">
          One file with every bike, place, key and photo. It is written on this phone (and offered to Drive or email),
          so re-installing the app or losing the phone does not lose the inventory.
        </p>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={runBackup} disabled={busy !== null}>
            <Download size={15} /> {busy === "backup" ? "Saving…" : "Back up now"}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => fileInput.current?.click()}
            disabled={busy !== null}
          >
            <Upload size={15} /> {busy === "restore" ? "Restoring…" : "Restore"}
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Choose a backup file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void runRestore(file);
          }}
        />
        <p className="mt-2 text-[11px] text-slate-500">
          Restoring replaces everything currently in the app. Back up first if you are unsure.
        </p>
        {message ? (
          <div className="mt-2">
            <Notice tone={message.tone}>{message.text}</Notice>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3">
        <header className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Warehouse size={16} className="text-sky-600" /> Lot layout
          </h2>
          <Badge tone="sky">{snapshot.slots.length} places</Badge>
        </header>
        <p className="mb-2 text-[11px] text-slate-600">
          {zoneSummary || "No zones yet"}
        </p>
        <Button variant="secondary" className="w-full" onClick={onEditLayout}>
          Edit zones and places
        </Button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <HardDrive size={16} className="text-slate-500" /> On this device
        </h2>
        <dl className="space-y-1 text-[11px] text-slate-600">
          <div className="flex justify-between">
            <dt>Photos stored</dt>
            <dd className="font-semibold text-slate-800">{photoCount === null ? "…" : photoCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt>App storage used</dt>
            <dd className="font-semibold text-slate-800">
              {storage ? `${formatBytes(storage.usage)} of ${formatBytes(storage.quota)}` : "unknown"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Storage protected from cleanup</dt>
            <dd className="font-semibold text-slate-800">
              {persisted === null ? "unknown" : persisted ? "yes" : "not granted"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Running as</dt>
            <dd className="font-semibold text-slate-800">{isNative() ? "Android app" : "browser preview"}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Photos are shrunk to 1280 px before they are stored, which keeps a full lot around 25–30 MB.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3">
        <h2 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <Info size={16} className="text-slate-400" /> About
        </h2>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Bike Lot records live entirely on this device. There is no account, no sync and no network call — the app
          works in a basement with no signal, which is the only place a bike shed ever is.
        </p>
        <p className="mt-2 text-[11px] text-slate-400">Version 0.1.0 · offline only</p>
      </section>
    </div>
  );
}
