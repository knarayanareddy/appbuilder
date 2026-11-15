import { useMemo, useState } from "react";
import { Bike as BikeIcon, KeyRound, MapPin, Plus, Search } from "lucide-react";
import { Badge, Button, Chip, EmptyState, Sheet } from "./ui";
import { PhotoThumb } from "./PhotoThumb";
import { SearchField } from "./SearchField";
import { cn } from "@/lib/cn";
import {
  bikeForSlot,
  bikesGroupedByPlace,
  keysForBike,
  lotStats,
  occupancy,
  placeLabelOf,
  zonesOf,
} from "@/lib/model";
import { STATUS_LABEL, type InventorySnapshot, type Slot } from "@/types";

export interface LotViewProps {
  snapshot: InventorySnapshot;
  onOpenBike: (bikeId: string) => void;
  onAddBikeAtSlot: (slotId: string) => void;
  onAddBike: () => void;
}

export function LotView(props: LotViewProps) {
  // Two ways to answer "where is it?": numbered places, or plain words.
  return props.snapshot.slots.length > 0 ? <NumberedLot {...props} /> : <PlacesList {...props} />;
}

/* ------------------------------------------------------------------ */
/* Mode 1 — numbered places                                            */
/* ------------------------------------------------------------------ */

function NumberedLot({ snapshot, onOpenBike, onAddBikeAtSlot, onAddBike }: LotViewProps) {
  const [zone, setZone] = useState<string>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [text, setText] = useState("");

  const stats = lotStats(snapshot);
  const taken = useMemo(() => occupancy(snapshot), [snapshot]);
  const zones = useMemo(() => zonesOf(snapshot), [snapshot]);

  const query = text.trim().toLowerCase();
  const visibleSlots = snapshot.slots.filter((slot) => {
    if (zone !== "all" && slot.zone !== zone) return false;
    if (freeOnly && taken.has(slot.id)) return false;
    if (!query) return true;
    const bike = taken.get(slot.id);
    return (
      slot.code.toLowerCase().includes(query) ||
      (bike ? `${bike.name} ${bike.place} ${bike.tags.join(" ")}`.toLowerCase().includes(query) : false)
    );
  });

  const activeSlot = activeSlotId ? snapshot.slots.find((s) => s.id === activeSlotId) ?? null : null;
  const percent = stats.totalSlots ? Math.round((stats.used / stats.totalSlots) * 100) : 0;

  return (
    <div className="space-y-3 p-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-bold text-slate-900">
            {stats.used} of {stats.totalSlots} places taken
          </p>
          <p className="text-xs font-semibold text-emerald-600">{stats.free} free</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          {stats.bikes} bike{stats.bikes === 1 ? "" : "s"} on file
          {stats.byStatus.out > 0 ? ` · ${stats.byStatus.out} out riding` : ""}
          {stats.byStatus.service > 0 ? ` · ${stats.byStatus.service} in service` : ""}
        </p>
      </section>

      <SearchField
        value={text}
        onChange={setText}
        placeholder="Find a bike or a place number…"
      />

      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        <Chip active={zone === "all"} onClick={() => setZone("all")}>
          All
        </Chip>
        {zones.map((value) => (
          <Chip key={value} active={zone === value} onClick={() => setZone(value)}>
            {value}
          </Chip>
        ))}
        <Chip active={freeOnly} onClick={() => setFreeOnly((v) => !v)} className="ml-auto">
          Free only
        </Chip>
      </div>

      {visibleSlots.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="Nothing to show"
          description={
            text.trim()
              ? "No place or bike matches that. Clear the search to see the whole grid."
              : freeOnly
                ? "Every place in this zone is taken."
                : "No places in this zone."
          }
        />
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {visibleSlots.map((slot) => {
            const bike = taken.get(slot.id);
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setActiveSlotId(slot.id)}
                aria-label={`${slot.code}${bike ? `, ${bike.name}` : ", free"}`}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg border px-0.5 text-center transition-colors",
                  bike
                    ? "border-emerald-500 bg-emerald-500 text-white active:bg-emerald-600"
                    : "border-dashed border-slate-300 bg-white text-slate-400 active:bg-slate-50"
                )}
              >
                <span className="text-[10px] font-bold leading-none">{slot.code}</span>
                {bike ? (
                  <span className="mt-0.5 line-clamp-2 text-[8px] font-medium leading-tight opacity-90">
                    {bike.name}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 px-1 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> bike inside
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-400 bg-white" /> free
        </span>
        <button
          type="button"
          onClick={onAddBike}
          className="ml-auto text-[10px] font-semibold text-slate-600 underline"
        >
          Add bike without a place
        </button>
      </div>

      <SlotSheet
        slot={activeSlot}
        snapshot={snapshot}
        onClose={() => setActiveSlotId(null)}
        onOpenBike={(id) => {
          setActiveSlotId(null);
          onOpenBike(id);
        }}
        onAddBike={(slotId) => {
          setActiveSlotId(null);
          onAddBikeAtSlot(slotId);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mode 2 — places written in your own words                           */
/* ------------------------------------------------------------------ */

function PlacesList({ snapshot, onOpenBike, onAddBike }: LotViewProps) {
  const [text, setText] = useState("");
  const groups = useMemo(() => bikesGroupedByPlace(snapshot, { text }), [snapshot, text]);
  const total = snapshot.bikes.length;
  const placed = snapshot.bikes.filter((bike) => bike.place.trim()).length;

  if (total === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<BikeIcon size={28} />}
          title="No bikes yet"
          description="Add a bike and describe where it stands in your own words — “behind the blue container, third rack from the wall”. However much detail you need."
          action={
            <Button onClick={onAddBike}>
              <Plus size={16} /> Add the first bike
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 pb-24">
      <SearchField
        value={text}
        onChange={setText}
        placeholder="Search name, tag, notes or the place itself…"
      />

      <p className="px-1 text-[11px] font-semibold text-slate-500">
        {total} bike{total === 1 ? "" : "s"}
        {placed < total ? ` · ${total - placed} still without a place` : ""}
        {text.trim() ? ` · ${groups.reduce((n, g) => n + g.bikes.length, 0)} matching` : ""}
      </p>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="Nothing matches"
          description="Try part of the name, a tag like “kids”, a word from the notes, or a word from the place description."
          action={
            <Button variant="secondary" onClick={() => setText("")}>
              Clear the search
            </Button>
          }
        />
      ) : (
        groups.map((group) => (
          <section key={group.place} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <header className="flex items-start gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
              <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
              <p className="whitespace-pre-wrap break-words text-[11px] font-semibold leading-relaxed text-slate-700">
                {group.place}
              </p>
              <span className="ml-auto shrink-0 text-[10px] font-semibold text-slate-400">
                {group.bikes.length}
              </span>
            </header>
            <ul className="divide-y divide-slate-100">
              {group.bikes.map((bike) => (
                <li key={bike.id}>
                  <button
                    type="button"
                    onClick={() => onOpenBike(bike.id)}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left active:bg-slate-50"
                  >
                    <PhotoThumb
                      photoId={bike.bikePhotoId}
                      alt={`${bike.name} photo`}
                      className="h-11 w-11 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{bike.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {bike.status !== "stored" ? (
                          <Badge tone={bike.status === "sold" ? "slate" : "amber"}>
                            {STATUS_LABEL[bike.status]}
                          </Badge>
                        ) : null}
                        {bike.tags.map((tag) => (
                          <Badge key={tag} tone="violet">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <button
        type="button"
        onClick={onAddBike}
        aria-label="Add bike"
        className="fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg active:bg-slate-800"
      >
        <Plus size={18} /> Add bike
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Place card for numbered mode                                        */
/* ------------------------------------------------------------------ */

function SlotSheet({
  slot,
  snapshot,
  onClose,
  onOpenBike,
  onAddBike,
}: {
  slot: Slot | null;
  snapshot: InventorySnapshot;
  onClose: () => void;
  onOpenBike: (bikeId: string) => void;
  onAddBike: (slotId: string) => void;
}) {
  const bike = slot ? bikeForSlot(snapshot, slot.id) : null;
  const keys = bike ? keysForBike(snapshot, bike) : [];

  return (
    <Sheet
      open={Boolean(slot)}
      onClose={onClose}
      title={slot ? slot.code : ""}
      subtitle={slot ? `Zone ${slot.zone}` : undefined}
      footer={
        slot ? (
          bike ? (
            <Button className="w-full" onClick={() => onOpenBike(bike.id)}>
              <BikeIcon size={16} /> Open {bike.name}
            </Button>
          ) : (
            <Button className="w-full" onClick={() => onAddBike(slot.id)}>
              <Plus size={16} /> Add a bike to {slot.code}
            </Button>
          )
        ) : null
      }
    >
      {!slot ? null : bike ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <figure className="space-y-1">
              <PhotoThumb photoId={bike.bikePhotoId} alt={`${bike.name} bike`} className="h-32 w-full rounded-xl" />
              <figcaption className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                The bike
              </figcaption>
            </figure>
            <figure className="space-y-1">
              <PhotoThumb photoId={bike.slotPhotoId} alt={`${slot.code} place`} className="h-32 w-full rounded-xl" />
              <figcaption className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                This place
              </figcaption>
            </figure>
          </div>

          <div>
            <p className="text-base font-bold text-slate-900">{bike.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge tone={bike.status === "stored" ? "emerald" : bike.status === "sold" ? "slate" : "amber"}>
                {STATUS_LABEL[bike.status]}
              </Badge>
              {bike.tags.map((tag) => (
                <Badge key={tag} tone="violet">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {bike.place.trim() ? (
            <div className="rounded-xl border border-slate-200 p-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Where exactly
              </p>
              <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">
                {placeLabelOf(snapshot, bike)}
              </p>
            </div>
          ) : null}

          {keys.length > 0 ? (
            <div className="rounded-xl border border-slate-200 p-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Key</p>
              {keys.map((key) => (
                <p key={key.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                  <KeyRound size={13} className="text-slate-400" />
                  <span className="font-semibold">{key.label}</span>
                  {key.keptAt ? <span className="text-slate-500">· kept at {key.keptAt}</span> : null}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-700">No key recorded for this bike yet.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">This place is empty.</p>
          <p className="text-xs leading-relaxed text-slate-500">
            It is free for the next bike. Add one here and it is remembered in this exact place.
          </p>
        </div>
      )}
    </Sheet>
  );
}

