import { useMemo, useState } from "react";
import { MapPin, Package, Pencil, Plus, Search } from "lucide-react";
import { Badge, Button, Chip, EmptyState } from "./ui";
import { SearchField } from "./SearchField";
import { ItemForm } from "./ItemForm";
import { allItemTags, itemPlaceLabelOf, searchItems } from "@/lib/model";
import type { InventorySnapshot, Item } from "@/types";
import type { ItemDraft } from "@/hooks/useInventory";

export interface ItemsViewProps {
  snapshot: InventorySnapshot;
  onSaveItem: (draft: ItemDraft) => Promise<unknown>;
  onDeleteItem: (itemId: string) => Promise<unknown>;
}

/**
 * Everything that is not a bike: laptops, chargers, tyres, spray cans,
 * headphones. Same three things the bike side needs — a name, where it lives,
 * and the words you would use to find it again.
 */
export function ItemsView({ snapshot, onSaveItem, onDeleteItem }: ItemsViewProps) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | "new" | null>(null);

  const tags = useMemo(() => allItemTags(snapshot), [snapshot]);
  const results = useMemo(() => searchItems(snapshot, { text, tag }), [snapshot, text, tag]);
  const filtered = text.trim() !== "" || tag !== null;

  return (
    <div className="relative space-y-3 p-3 pb-24">
      <SearchField
        value={text}
        onChange={setText}
        placeholder="Search items by name, tag or notes…"
        ariaLabel="Search items"
      />

      {filtered ? (
        <p className="px-1 text-[11px] font-semibold text-slate-500">
          {results.length} {results.length === 1 ? "item" : "items"} found
          {text.trim() ? ` for “${text.trim()}”` : ""}
        </p>
      ) : null}

      {tags.length > 0 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {tags.map((value) => (
            <Chip key={value} active={tag === value} onClick={() => setTag(tag === value ? null : value)}>
              #{value}
            </Chip>
          ))}
        </div>
      ) : null}

      {results.length === 0 ? (
        snapshot.items.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="Nothing but bikes yet"
            description="Laptops, chargers, tyres, spray cans, headphones — anything you would otherwise hunt for. A name, where it is, and whatever tags and notes help."
            action={
              <Button onClick={() => setEditing("new")}>
                <Plus size={16} /> Add the first item
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Search size={24} />}
            title="Nothing matches"
            description="Try part of the name, a tag like “laptop”, or a word you wrote in the notes."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setText("");
                  setTag(null);
                }}
              >
                Clear filters
              </Button>
            }
          />
        )
      ) : (
        <ul className="space-y-1.5">
          {results.map((item) => (
            <li key={item.id}>
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="min-w-0 flex-1 text-left active:opacity-70"
                >
                  <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-slate-600">
                    <MapPin size={11} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="line-clamp-2">{itemPlaceLabelOf(item)}</span>
                  </p>
                  {item.notes.trim() ? (
                    <p className="mt-1 line-clamp-1 text-[11px] italic text-slate-500">{item.notes}</p>
                  ) : null}
                  {item.tags.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.tags.map((value) => (
                        <Badge key={value} tone="violet">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  aria-label={`Edit ${item.name}`}
                  className="rounded-lg p-1.5 text-slate-400 active:bg-slate-100"
                >
                  <Pencil size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {snapshot.items.length > 0 ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          aria-label="Add item"
          className="fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg active:bg-slate-800"
        >
          <Plus size={18} /> Add item
        </button>
      ) : null}

      {editing ? (
        <ItemForm
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? undefined : editing}
          snapshot={snapshot}
          onClose={() => setEditing(null)}
          onSave={onSaveItem}
          onDelete={onDeleteItem}
        />
      ) : null}
    </div>
  );
}
