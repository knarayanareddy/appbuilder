import { useMemo, useState } from "react";
import { Bike as BikeIcon, KeyRound, MapPin, Plus } from "lucide-react";
import { Badge, Button, Chip, EmptyState, Sheet } from "./ui";
import { PhotoThumb } from "./PhotoThumb";
import { cn } from "@/lib/cn";
import { bikeForSlot, keysForBike, lotStats, occupancy, zonesOf } from "@/lib/model";
import type { InventorySnapshot, Slot } from "@/types";
import { STATUS_LABEL } from "@/types";

export interface LotViewProps {
  snapshot: InventorySnapshot;
  onOpenBike: (bikeId: string) => void;
  onAddBikeAtSlot: (slotId: string) => void;
}

export function LotView({ snapshot, onOpenBike, onAddBikeAtSlot }: LotViewProps) {
  const [zone, setZone] = useState<string>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  const stats = lotStats(snapshot);
  const taken = useMemo(() => occupancy(snapshot), [snapshot]);
  const zones = useMemo(() => zonesOf(snapshot), [snapshot]);

  const visibleSlots = snapshot.slots.filter(
    (slot) => (zone === "all" || slot.zone === zone) && (!freeOnly || !taken.has(slot.id))
  );

  const activeSlot = activeSlotId ? snapshot.slots.find((s) => s.id === activeSlotId) ?? null : null;

  if (snapshot.slots.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<MapPin size={28} />}
          title="No places defined yet"
          description="Set up how your lot is laid out in Settings, then each rack place gets a code you can look up here."
        />
      </div>
    );
  }

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
          {stats.bikes} bikes on file
          {stats.byStatus.out > 0 ? ` · ${stats.byStatus.out} out riding` : ""}
          {stats.byStatus.service > 0 ? ` · ${stats.byStatus.service} in service` : ""}
        </p>
      </section>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        <Chip active={zone === "all"} onClick={() => setZone("all")}>
          All
        </Chip>
        {zones.map((z) => (
          <Chip key={z} active={zone === z} onClick={() => setZone(z)}>
            {z}
          </Chip>
        ))}
        <Chip active={freeOnly} onClick={() => setFreeOnly((v) => !v)} className="ml-auto">
          Free only
        </Chip>
      </div>

      {visibleSlots.length === 0 ? (
        <EmptyState
          icon={<MapPin size={24} />}
          title="Nothing to show"
          description={
            freeOnly
              ? "Every place in this zone is taken. Add a zone or a row in Settings if you have more space."
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
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">The bike</p>
              <PhotoThumb photoId={bike.bikePhotoId} alt={`${bike.name} bike`} className="h-32 w-full rounded-xl" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">This place</p>
              <PhotoThumb photoId={bike.slotPhotoId} alt={`${slot.code} place`} className="h-32 w-full rounded-xl" />
            </div>
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
