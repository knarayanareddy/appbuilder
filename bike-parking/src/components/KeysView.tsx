import { useState } from "react";
import { KeyRound, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, EmptyState, Field, Notice, Sheet, TextInput } from "./ui";
import { bikesForKey, slotLabelOf } from "@/lib/model";
import type { KeyDraft } from "@/hooks/useInventory";
import type { InventorySnapshot, LotKey } from "@/types";

export interface KeysViewProps {
  snapshot: InventorySnapshot;
  onOpenBike: (bikeId: string) => void;
  onSaveKey: (draft: KeyDraft) => Promise<unknown>;
  onDeleteKey: (keyId: string) => Promise<unknown>;
  onSetKeyOnBike: (bikeId: string, keyId: string, attached: boolean) => Promise<unknown>;
}

export function KeysView({ snapshot, onOpenBike, onSaveKey, onDeleteKey, onSetKeyOnBike }: KeysViewProps) {
  const [editing, setEditing] = useState<LotKey | "new" | null>(null);

  return (
    <div className="relative space-y-3 p-3 pb-24">
      <p className="px-1 text-[11px] leading-relaxed text-slate-500">
        One key can open several bikes. Record where the key itself lives — that is usually the part you forget.
      </p>

      {snapshot.keys.length === 0 ? (
        <EmptyState
          icon={<KeyRound size={28} />}
          title="No keys yet"
          description="Add a key, say where you keep it, and tick the bikes it fits. Then you can look up either direction."
          action={
            <Button onClick={() => setEditing("new")}>
              <Plus size={16} /> Add a key
            </Button>
          }
        />
      ) : (
        <ul className="space-y-1.5">
          {snapshot.keys.map((key) => {
            const bikes = bikesForKey(snapshot, key.id);
            return (
              <li key={key.id} className="rounded-xl border border-slate-200 bg-white p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                      <KeyRound size={14} className="text-slate-400" />
                      {key.label}
                    </p>
                    {key.keptAt ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin size={11} /> kept at {key.keptAt}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-amber-700">Kept somewhere unknown</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(key)}
                    aria-label={`Edit key ${key.label}`}
                    className="rounded-lg p-1.5 text-slate-500 active:bg-slate-100"
                  >
                    <Pencil size={15} />
                  </button>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-1">
                  {bikes.length === 0 ? (
                    <span className="text-[11px] text-slate-400">Fits no bike yet</span>
                  ) : (
                    bikes.map((bike) => (
                      <button key={bike.id} type="button" onClick={() => onOpenBike(bike.id)}>
                        <Badge tone="sky">
                          {bike.name} · {slotLabelOf(snapshot, bike)}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>

                {key.note ? <p className="mt-1.5 text-[11px] text-slate-500">{key.note}</p> : null}
              </li>
            );
          })}
        </ul>
      )}

      {snapshot.keys.length > 0 ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          aria-label="Add key"
          className="fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg active:bg-slate-800"
        >
          <Plus size={18} /> Add key
        </button>
      ) : null}

      {editing ? (
        <KeyForm
          key={editing === "new" ? "new" : editing.id}
          snapshot={snapshot}
          record={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={onSaveKey}
          onDelete={onDeleteKey}
          onToggleBike={onSetKeyOnBike}
        />
      ) : null}
    </div>
  );
}

export function KeyForm({
  snapshot,
  record,
  onClose,
  onSave,
  onDelete,
  onToggleBike,
}: {
  snapshot: InventorySnapshot;
  record?: LotKey;
  onClose: () => void;
  onSave: (draft: KeyDraft) => Promise<unknown>;
  onDelete?: (keyId: string) => Promise<unknown>;
  onToggleBike?: (bikeId: string, keyId: string, attached: boolean) => Promise<unknown>;
}) {
  const [label, setLabel] = useState(record?.label ?? "");
  const [keptAt, setKeptAt] = useState(record?.keptAt ?? "");
  const [note, setNote] = useState(record?.note ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const attached = record ? new Set(bikesForKey(snapshot, record.id).map((b) => b.id)) : new Set<string>();

  return (
    <Sheet
      open
      onClose={onClose}
      title={record ? "Edit key" : "Add a key"}
      subtitle={record ? record.label : "Label it the way you would say it out loud"}
      footer={
        <div className="flex gap-2">
          {record && onDelete ? (
            <Button
              variant={confirmingDelete ? "danger" : "secondary"}
              onClick={async () => {
                if (!confirmingDelete) {
                  setConfirmingDelete(true);
                  return;
                }
                await onDelete(record.id);
                onClose();
              }}
              aria-label={confirmingDelete ? "Confirm delete key" : "Delete key"}
            >
              <Trash2 size={15} />
            </Button>
          ) : null}
          <Button
            className="flex-1"
            disabled={!label.trim()}
            onClick={async () => {
              await onSave({ id: record?.id, label, keptAt, note });
              onClose();
            }}
          >
            {record ? "Save key" : "Add key"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        <Field label="Key label">
          <TextInput
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="e.g. Blue Abus #12"
            aria-label="Key label"
            autoFocus={!record}
          />
        </Field>
        <Field label="Where is it kept?">
          <TextInput
            value={keptAt}
            onChange={(event) => setKeptAt(event.target.value)}
            placeholder="e.g. hook 3, left wall of the shed"
            aria-label="Where is it kept"
          />
        </Field>
        <Field label="Note" hint="Optional.">
          <TextInput
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. stiff lock, needs two turns"
            aria-label="Key note"
          />
        </Field>

        {record && onToggleBike ? (
          <Field label="Bikes this key opens">
            {snapshot.bikes.length === 0 ? (
              <p className="text-xs text-slate-500">No bikes yet.</p>
            ) : (
              <ul className="space-y-1">
                {snapshot.bikes.map((bike) => {
                  const on = attached.has(bike.id);
                  return (
                    <li key={bike.id}>
                      <button
                        type="button"
                        onClick={() => void onToggleBike(bike.id, record.id, !on)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-left text-xs active:bg-slate-50"
                      >
                        <span className="min-w-0 truncate font-semibold text-slate-800">
                          {bike.name}
                          <span className="ml-1 font-normal text-slate-500">{slotLabelOf(snapshot, bike)}</span>
                        </span>
                        <span
                          className={
                            on
                              ? "rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white"
                              : "rounded-md border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                          }
                        >
                          {on ? "fits" : "no"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Field>
        ) : null}

        {confirmingDelete ? <Notice tone="red">This removes the key from every bike that uses it.</Notice> : null}
      </div>
    </Sheet>
  );
}
