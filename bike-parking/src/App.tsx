import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Warehouse } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BikesView } from "@/components/BikesView";
import { BikeDetail } from "@/components/BikeDetail";
import { BikeForm } from "@/components/BikeForm";
import { ItemsView } from "@/components/ItemsView";
import { KeysView } from "@/components/KeysView";
import { LotSetup } from "@/components/LotSetup";
import { LotView } from "@/components/LotView";
import { SettingsView } from "@/components/SettingsView";
import { Notice } from "@/components/ui";
import { useInventory } from "@/hooks/useInventory";
import { countPhotos } from "@/lib/repo";
import { formatAgo } from "@/lib/format";
import type { Tab } from "@/types";

const BACKUP_NAG_MS = 7 * 86_400_000;

export default function App() {
  const inventory = useInventory();
  const { snapshot } = inventory;

  const [tab, setTab] = useState<Tab>("lot");
  const [form, setForm] = useState<{ bikeId?: string; slotId?: string | null } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [photoCount, setPhotoCount] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const detailBike = useMemo(
    () => (detailId ? snapshot.bikes.find((bike) => bike.id === detailId) ?? null : null),
    [detailId, snapshot.bikes]
  );
  const editingBike = useMemo(
    () => (form?.bikeId ? snapshot.bikes.find((bike) => bike.id === form.bikeId) : undefined),
    [form?.bikeId, snapshot.bikes]
  );

  useEffect(() => {
    let alive = true;
    void countPhotos().then((count) => {
      if (alive) setPhotoCount(count);
    });
    return () => {
      alive = false;
    };
  }, [snapshot]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast]);

  if (inventory.loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-100">
        <Loader2 size={22} className="animate-spin text-slate-400" />
        <p className="text-xs font-semibold text-slate-500">Opening the local inventory…</p>
      </div>
    );
  }

  if (!snapshot.settings.lotConfiguredAt) {
    return (
      <div className="mx-auto max-w-[480px]">
        <LotSetup
          firstRun
          snapshot={snapshot}
          saving={inventory.saving}
          onSave={async (zones) => {
            const result = await inventory.configureLot(zones);
            setToast(`${result.slots} places created.`);
          }}
        />
        {inventory.error ? (
          <div className="fixed inset-x-0 bottom-2 z-50 mx-auto max-w-[460px] px-3">
            <Notice tone="red">{inventory.error}</Notice>
          </div>
        ) : null}
      </div>
    );
  }

  const needsBackup =
    snapshot.bikes.length > 0 &&
    (!snapshot.settings.lastBackupAt || Date.now() - snapshot.settings.lastBackupAt > BACKUP_NAG_MS);

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col bg-slate-100">
      <header className="safe-top sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Warehouse size={16} />
            </span>
            <div>
              <h1 className="text-sm font-black leading-tight text-slate-900">Bike Lot</h1>
              <p className="text-[10px] leading-tight text-slate-500">
                {snapshot.bikes.length} bike{snapshot.bikes.length === 1 ? "" : "s"} ·{" "}
                {snapshot.items.length} item{snapshot.items.length === 1 ? "" : "s"} · on this phone
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            backup {formatAgo(snapshot.settings.lastBackupAt).replace(" ago", "")}
          </p>
        </div>
        {needsBackup ? (
          <button
            type="button"
            onClick={() => setTab("settings")}
            className="flex w-full items-center gap-1.5 border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-left text-[11px] font-semibold text-amber-800"
          >
            <AlertTriangle size={12} /> Not backed up recently — tap to save a copy
          </button>
        ) : null}
      </header>

      <main className="flex-1 overflow-y-auto">
        {inventory.error ? (
          <div className="p-3 pb-0">
            <Notice tone="red">{inventory.error}</Notice>
          </div>
        ) : null}

        <ErrorBoundary resetKey={tab} onReset={() => setTab("lot")}>
        {tab === "lot" ? (
          <LotView
            snapshot={snapshot}
            onOpenBike={(bikeId) => setDetailId(bikeId)}
            onAddBikeAtSlot={(slotId) => setForm({ slotId })}
            onAddBike={() => setForm({})}
          />
        ) : null}

        {tab === "bikes" ? (
          <BikesView
            snapshot={snapshot}
            onOpenBike={(bikeId) => setDetailId(bikeId)}
            onAddBike={() => setForm({})}
          />
        ) : null}

        {tab === "keys" ? (
          <KeysView
            snapshot={snapshot}
            onOpenBike={(bikeId) => setDetailId(bikeId)}
            onSaveKey={inventory.saveKey}
            onDeleteKey={inventory.deleteKey}
            onSetKeyOnBike={inventory.setKeyOnBike}
          />
        ) : null}

        {tab === "items" ? (
          <ItemsView
            snapshot={snapshot}
            onSaveItem={async (draft) => {
              const saved = await inventory.saveItem(draft);
              setToast(draft.id ? "Saved." : `${saved.name} added.`);
              return saved;
            }}
            onDeleteItem={async (itemId) => {
              await inventory.deleteItem(itemId);
              setToast("Item removed.");
            }}
          />
        ) : null}

        {tab === "settings" ? (
          <SettingsView
            snapshot={snapshot}
            photoCount={photoCount}
            onEditLayout={() => setLayoutOpen(true)}
            onBackup={async () => {
              const result = await inventory.createBackup();
              setToast(`Backup saved to ${result.location}`);
              return result;
            }}
            onRestore={async (file) => {
              const result = await inventory.restoreBackup(file);
              setToast(`Restored ${result.bikes} bikes.`);
              setTab("lot");
              return result;
            }}
          />
        ) : null}
        </ErrorBoundary>
      </main>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-[460px] px-3">
          <div className="rounded-xl bg-slate-900 px-3 py-2 text-center text-[11px] font-semibold text-white shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}

      <BottomNav tab={tab} onChange={setTab} />

      {form ? (
        <BikeForm
          key={form.bikeId ?? `new-${form.slotId ?? "free"}`}
          snapshot={snapshot}
          bike={editingBike}
          presetSlotId={form.slotId ?? null}
          saving={inventory.saving}
          onClose={() => setForm(null)}
          onSave={async (draft) => {
            const saved = await inventory.saveBike(draft);
            setToast(draft.id ? "Saved." : `${saved.name} added.`);
            return saved;
          }}
          onCreateKey={async (label) => {
            const key = await inventory.saveKey({ label, keptAt: "", note: "" });
            return key.id;
          }}
        />
      ) : null}

      {detailBike ? (
        <BikeDetail
          snapshot={snapshot}
          bike={detailBike}
          onClose={() => setDetailId(null)}
          onEdit={(bike) => {
            setDetailId(null);
            setForm({ bikeId: bike.id });
          }}
          onDelete={async (bikeId) => {
            await inventory.deleteBike(bikeId);
            setToast("Bike removed.");
          }}
          onSetStatus={inventory.setStatus}
        />
      ) : null}

      {layoutOpen ? (
        <LotSetup
          snapshot={snapshot}
          saving={inventory.saving}
          onClose={() => setLayoutOpen(false)}
          onSave={async (zones) => {
            const result = await inventory.configureLot(zones);
            setToast(
              result.orphaned > 0
                ? `Layout saved. ${result.orphaned} bikes are now unassigned.`
                : "Layout saved."
            );
          }}
        />
      ) : null}
    </div>
  );
}
