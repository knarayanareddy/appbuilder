import { useEffect, useMemo, useState } from "react";
import { Check, KeyRound, Plus } from "lucide-react";
import { Badge, Button, Chip, Field, Notice, Select, Sheet, TextArea, TextInput } from "./ui";
import { PhotoPicker } from "./PhotoPicker";
import { TagInput } from "./TagInput";
import { cn } from "@/lib/cn";
import { allTags, freeSlots, keysForBike } from "@/lib/model";
import type { BikeDraft } from "@/hooks/useInventory";
import { BIKE_STATUSES, STATUS_LABEL, type Bike, type BikeStatus, type InventorySnapshot } from "@/types";

export interface BikeFormProps {
  snapshot: InventorySnapshot;
  /** Existing bike to edit, or undefined for a new one. */
  bike?: Bike;
  presetSlotId?: string | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (draft: BikeDraft) => Promise<unknown>;
  onCreateKey?: (label: string) => Promise<string>;
}

export function BikeForm({
  snapshot,
  bike,
  presetSlotId,
  saving,
  onClose,
  onSave,
  onCreateKey,
}: BikeFormProps) {
  const [name, setName] = useState(bike?.name ?? "");
  const [slotId, setSlotId] = useState<string | null>(bike?.slotId ?? presetSlotId ?? null);
  const [keyIds, setKeyIds] = useState<string[]>(bike?.keyIds ?? []);
  const [tags, setTags] = useState<string[]>(bike?.tags ?? []);
  const [status, setStatus] = useState<BikeStatus>(bike?.status ?? "stored");
  const [notes, setNotes] = useState(bike?.notes ?? "");
  const [bikePhoto, setBikePhoto] = useState<Blob | null>(null);
  const [slotPhoto, setSlotPhoto] = useState<Blob | null>(null);
  const [clearBikePhoto, setClearBikePhoto] = useState(false);
  const [clearSlotPhoto, setClearSlotPhoto] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");

  const bikePreview = useObjectUrl(bikePhoto);
  const slotPreview = useObjectUrl(slotPhoto);

  const selectableSlots = useMemo(
    () => freeSlots(snapshot, bike?.slotId ?? null),
    [snapshot, bike?.slotId]
  );
  const suggestions = useMemo(() => allTags(snapshot), [snapshot]);
  const currentKeys = bike ? keysForBike(snapshot, bike) : [];

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    await onSave({
      id: bike?.id,
      name,
      slotId,
      keyIds,
      tags,
      status,
      notes,
      bikePhoto,
      slotPhoto,
      clearBikePhoto,
      clearSlotPhoto,
    });
    onClose();
  };

  const addNewKey = async () => {
    const label = newKeyLabel.trim();
    if (!label || !onCreateKey) return;
    const id = await onCreateKey(label);
    setKeyIds((prev) => Array.from(new Set([...prev, id])));
    setNewKeyLabel("");
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={bike ? `Edit ${bike.name}` : "Add a bike"}
      subtitle={bike ? "Change anything and save" : "Name, place, key and photos"}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-[2]" onClick={handleSave} disabled={!canSave}>
            <Check size={16} /> {bike ? "Save changes" : "Save bike"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        <Field label="Bike name">
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Blue Gazelle, Kid's BMX"
            aria-label="Bike name"
            autoFocus={!bike}
          />
        </Field>

        <Field
          label="Place in the lot"
          hint={
            selectableSlots.length === 0
              ? "No free places left — free one up or add zones in Settings."
              : "Only places that are still free are listed."
          }
        >
          <Select
            aria-label="Place in the lot"
            value={slotId ?? ""}
            onChange={(event) => setSlotId(event.target.value || null)}
          >
            <option value="">Not assigned yet</option>
            {selectableSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.code} · zone {slot.zone}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Photos</p>
          <div className="grid grid-cols-2 gap-2">
            <PhotoPicker
              label="The bike"
              photoId={clearBikePhoto ? null : bike?.bikePhotoId ?? null}
              previewUrl={bikePreview}
              onPick={(blob) => {
                setBikePhoto(blob);
                setClearBikePhoto(false);
              }}
              onRemove={() => {
                setBikePhoto(null);
                setClearBikePhoto(true);
              }}
            />
            <PhotoPicker
              label="The place"
              photoId={clearSlotPhoto ? null : bike?.slotPhotoId ?? null}
              previewUrl={slotPreview}
              onPick={(blob) => {
                setSlotPhoto(blob);
                setClearSlotPhoto(false);
              }}
              onRemove={() => {
                setSlotPhoto(null);
                setClearSlotPhoto(true);
              }}
            />
          </div>
        </div>

        <Field label="Key">
          {snapshot.keys.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {snapshot.keys.map((key) => {
                const active = keyIds.includes(key.id);
                return (
                  <Chip
                    key={key.id}
                    active={active}
                    onClick={() =>
                      setKeyIds((prev) =>
                        active ? prev.filter((id) => id !== key.id) : [...prev, key.id]
                      )
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      <KeyRound size={11} /> {key.label}
                    </span>
                  </Chip>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No keys recorded yet — add one below.</p>
          )}
          {currentKeys.length > 1 ? (
            <Notice tone="amber">
              This bike is on more than one key. Fine if both fit — just checking.
            </Notice>
          ) : null}
        </Field>

        {onCreateKey ? (
          <div className="flex gap-1.5">
            <TextInput
              value={newKeyLabel}
              onChange={(event) => setNewKeyLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void addNewKey();
                }
              }}
              placeholder="New key label, e.g. Blue Abus #12"
              aria-label="New key label"
            />
            <Button
              variant="secondary"
              onClick={() => void addNewKey()}
              disabled={!newKeyLabel.trim()}
              aria-label="Create key"
            >
              <Plus size={16} />
            </Button>
          </div>
        ) : null}

        <Field label="Status">
          <div className="flex flex-wrap gap-1.5">
            {BIKE_STATUSES.map((value) => (
              <Chip key={value} active={status === value} onClick={() => setStatus(value)}>
                {STATUS_LABEL[value]}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Tags" hint="Anything you would want to filter by later.">
          <TagInput tags={tags} onChange={setTags} suggestions={suggestions} />
        </Field>

        <Field label="Notes">
          <TextArea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Frame number, repairs, who borrowed it…"
            aria-label="Notes"
          />
        </Field>

        {bike ? (
          <p className={cn("text-[11px]", "text-slate-400")}>
            Added {new Date(bike.createdAt).toLocaleDateString()}
          </p>
        ) : (
          <Badge tone="emerald">Saved on this phone only — nothing is uploaded</Badge>
        )}
      </div>
    </Sheet>
  );
}

function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  return url;
}
