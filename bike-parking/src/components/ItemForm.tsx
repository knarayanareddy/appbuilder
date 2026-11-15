import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button, Field, Notice, Sheet, TextArea, TextInput } from "./ui";
import { TagInput } from "./TagInput";
import { PhotoStrip } from "./PhotoStrip";
import { allItemTags } from "@/lib/model";
import type { ItemDraft } from "@/hooks/useInventory";
import type { InventorySnapshot, Item } from "@/types";

export const ITEM_PLACE_EXAMPLE =
  "e.g. Top shelf of the metal cupboard, in the grey sleeve — behind the paint tins.";

export function ItemForm({
  snapshot,
  item,
  onClose,
  onSave,
  onDelete,
}: {
  snapshot: InventorySnapshot;
  item?: Item;
  onClose: () => void;
  onSave: (draft: ItemDraft) => Promise<unknown>;
  onDelete: (itemId: string) => Promise<unknown>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [place, setPlace] = useState(item?.place ?? "");
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [photoIds, setPhotoIds] = useState<string[]>(item?.photoIds ?? []);
  const [newPhotos, setNewPhotos] = useState<Blob[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  return (
    <Sheet
      open
      onClose={onClose}
      title={item ? `Edit ${item.name}` : "Add an item"}
      subtitle={item ? "Change anything and save" : "Name, where it is, tags and notes"}
      footer={
        <div className="flex gap-2">
          {item ? (
            <Button
              variant={confirmingDelete ? "danger" : "secondary"}
              onClick={async () => {
                if (!confirmingDelete) {
                  setConfirmingDelete(true);
                  return;
                }
                await onDelete(item.id);
                onClose();
              }}
              aria-label={confirmingDelete ? "Confirm delete item" : "Delete item"}
            >
              <Trash2 size={15} />
              {confirmingDelete ? "Really delete" : ""}
            </Button>
          ) : null}
          <Button
            className="flex-1"
            disabled={!canSave}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({ id: item?.id, name, place, tags, notes, photoIds, newPhotos });
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            <Check size={16} /> {item ? "Save changes" : "Save item"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        <Field label="Item name">
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. MacBook Pro 14, blue charger, headphones"
            aria-label="Item name"
            autoFocus={!item}
          />
        </Field>

        <Field
          label="Where is it?"
          hint="Your own words, as long as you like. Shelf, box, drawer, which corner — whatever helps."
        >
          <TextArea
            value={place}
            onChange={(event) => setPlace(event.target.value)}
            rows={3}
            placeholder={ITEM_PLACE_EXAMPLE}
            aria-label="Where is it"
          />
        </Field>

        <Field label="Pictures" hint="Up to 6. The thing itself, its label, its charger, where it sits.">
          <PhotoStrip
            photoIds={photoIds}
            newPhotos={newPhotos}
            onPick={(blob) => setNewPhotos((prev) => [...prev, blob])}
            onRemoveSaved={(photoId) => setPhotoIds((prev) => prev.filter((id) => id !== photoId))}
            onRemoveNew={(index) => setNewPhotos((prev) => prev.filter((_, i) => i !== index))}
          />
        </Field>

        <Field label="Tags" hint="Type a tag and press enter. Anything you would search by later.">
          <TagInput tags={tags} onChange={setTags} suggestions={allItemTags(snapshot)} />
        </Field>

        <Field label="Notes">
          <TextArea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Charger is in the side pocket, serial number, who borrowed it…"
            aria-label="Notes"
          />
        </Field>

        {confirmingDelete ? (
          <Notice tone="red">Deleting removes this item from the app. Nothing else is affected.</Notice>
        ) : null}
      </div>
    </Sheet>
  );
}
