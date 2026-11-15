import { useMemo, useState } from "react";
import { Bike as BikeIcon, KeyRound, Plus, Search, X } from "lucide-react";
import { Badge, Button, Chip, EmptyState } from "./ui";
import { PhotoThumb } from "./PhotoThumb";
import { cn } from "@/lib/cn";
import { allTags, keysForBike, searchBikes, slotLabelOf } from "@/lib/model";
import { BIKE_STATUSES, STATUS_LABEL, type BikeStatus, type InventorySnapshot } from "@/types";

export interface BikesViewProps {
  snapshot: InventorySnapshot;
  onOpenBike: (bikeId: string) => void;
  onAddBike: () => void;
}

export function BikesView({ snapshot, onOpenBike, onAddBike }: BikesViewProps) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [status, setStatus] = useState<BikeStatus | "all">("all");

  const tags = useMemo(() => allTags(snapshot), [snapshot]);
  const results = useMemo(
    () => searchBikes(snapshot, { text, tag, status }),
    [snapshot, text, tag, status]
  );

  const filtered = text.trim() !== "" || tag !== null || status !== "all";

  return (
    <div className="relative space-y-3 p-3 pb-24">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Name, place, key, tag, note…"
          aria-label="Search bikes"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-slate-400 focus:border-slate-900"
        />
        {text ? (
          <button
            type="button"
            onClick={() => setText("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 active:bg-slate-100"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {tags.length > 0 || status !== "all" ? (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <Chip active={status === "all"} onClick={() => setStatus("all")}>
            Any status
          </Chip>
          {BIKE_STATUSES.map((value) => (
            <Chip key={value} active={status === value} onClick={() => setStatus(value)}>
              {STATUS_LABEL[value]}
            </Chip>
          ))}
          {tags.map((value) => (
            <Chip key={value} active={tag === value} onClick={() => setTag(tag === value ? null : value)}>
              #{value}
            </Chip>
          ))}
        </div>
      ) : null}

      {results.length === 0 ? (
        snapshot.bikes.length === 0 ? (
          <EmptyState
            icon={<BikeIcon size={28} />}
            title="No bikes yet"
            description="Add a bike with its name, the place it lives in, the key that fits it and a photo of each."
            action={
              <Button onClick={onAddBike}>
                <Plus size={16} /> Add the first bike
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Search size={24} />}
            title="Nothing matches"
            description="Try part of a name, a place code like B-07, a key label, or clear the filters."
            action={
              filtered ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setText("");
                    setTag(null);
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <ul className="space-y-1.5">
          {results.map((bike) => {
            const keys = keysForBike(snapshot, bike);
            const slotLabel = slotLabelOf(snapshot, bike);
            return (
              <li key={bike.id}>
                <button
                  type="button"
                  onClick={() => onOpenBike(bike.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 text-left active:bg-slate-50"
                >
                  <PhotoThumb
                    photoId={bike.bikePhotoId}
                    alt={`${bike.name} photo`}
                    className="h-14 w-14 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{bike.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      <Badge tone={bike.slotId ? "sky" : "amber"}>{slotLabel}</Badge>
                      {bike.status !== "stored" ? (
                        <Badge tone={bike.status === "sold" ? "slate" : "amber"}>{STATUS_LABEL[bike.status]}</Badge>
                      ) : null}
                      {keys.length > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-500">
                          <KeyRound size={11} /> {keys.map((k) => k.label).join(", ")}
                        </span>
                      ) : null}
                    </div>
                    {bike.tags.length > 0 ? (
                      <p className={cn("mt-0.5 truncate text-[11px] text-violet-600")}>
                        {bike.tags.map((t) => `#${t}`).join(" ")}
                      </p>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {snapshot.bikes.length > 0 ? (
        <button
          type="button"
          onClick={onAddBike}
          aria-label="Add bike"
          className="fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg active:bg-slate-800"
        >
          <Plus size={18} /> Add bike
        </button>
      ) : null}
    </div>
  );
}
