import { useMemo, useState } from "react";
import { Bike as BikeIcon, KeyRound, MapPin, Plus, Search } from "lucide-react";
import { Badge, Button, Chip, EmptyState } from "./ui";
import { PhotoThumb } from "./PhotoThumb";
import { SearchField } from "./SearchField";
import { allTags, keysForBike, searchBikes, shortPlaceOf } from "@/lib/model";
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
      <SearchField value={text} onChange={setText} placeholder="Search name, tag or notes…" />

      {filtered ? (
        <p className="px-1 text-[11px] font-semibold text-slate-500">
          {results.length} {results.length === 1 ? "bike" : "bikes"} found
          {text.trim() ? ` for “${text.trim()}”` : ""}
        </p>
      ) : null}

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
            description="Add a bike with its name, where it stands in your own words, the key that fits it, and a photo of each."
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
            description="Try part of the name, a tag like “kids”, or a word you wrote in the notes."
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
            return (
              <li key={bike.id}>
                <button
                  type="button"
                  onClick={() => onOpenBike(bike.id)}
                  className="flex w-full items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2 text-left active:bg-slate-50"
                >
                  <PhotoThumb
                    photoId={bike.bikePhotoId}
                    alt={`${bike.name} photo`}
                    className="h-14 w-14 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{bike.name}</p>
                    <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-slate-600">
                      <MapPin size={11} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-2">{shortPlaceOf(snapshot, bike)}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {bike.status !== "stored" ? (
                        <Badge tone={bike.status === "sold" ? "slate" : "amber"}>
                          {STATUS_LABEL[bike.status]}
                        </Badge>
                      ) : null}
                      {bike.tags.map((value) => (
                        <Badge key={value} tone="violet">
                          {value}
                        </Badge>
                      ))}
                      {keys.length > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-500">
                          <KeyRound size={11} /> {keys.map((k) => k.label).join(", ")}
                        </span>
                      ) : null}
                    </div>
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
