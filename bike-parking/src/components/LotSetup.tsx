import { useMemo, useState } from "react";
import { Check, Warehouse } from "lucide-react";
import { Badge, Button, Field, Notice, Sheet, TextArea } from "./ui";
import { DEFAULT_ZONES, formatZoneSpecs, parseZoneSpecs, slotCode } from "@/lib/slots";
import type { InventorySnapshot, ZoneSpec } from "@/types";

export interface LotSetupProps {
  snapshot: InventorySnapshot;
  /** First run gets a full page instead of a sheet. */
  firstRun?: boolean;
  saving?: boolean;
  onSave: (zones: ZoneSpec[]) => Promise<unknown>;
  onClose?: () => void;
}

/**
 * Numbered places are optional by design. A bike's place is free text, so a lot
 * with nothing painted on it can be recorded perfectly well — this screen only
 * exists for people who *do* have numbered racks and want a grid.
 */
export function LotSetup({ snapshot, firstRun, saving, onSave, onClose }: LotSetupProps) {
  const initial = snapshot.settings.zones.length > 0 ? snapshot.settings.zones : DEFAULT_ZONES;
  const [text, setText] = useState(formatZoneSpecs(initial));

  const parsed = useMemo(() => parseZoneSpecs(text), [text]);
  const zones = parsed.zones;
  const errors = parsed.errors;
  const total = zones.reduce((sum, zone) => sum + zone.count, 0);

  const orphanCount = useMemo(() => {
    if (snapshot.settings.zones.length === 0) return 0;
    const codes = new Set<string>();
    for (const zone of zones) {
      for (let i = 1; i <= zone.count; i += 1) codes.add(slotCode(zone.code, i));
    }
    return snapshot.bikes.filter((bike) => {
      const slot = snapshot.slots.find((s) => s.id === bike.slotId);
      return Boolean(bike.slotId) && (!slot || !codes.has(slot.code));
    }).length;
  }, [snapshot.bikes, snapshot.slots, snapshot.settings.zones.length, zones]);

  const canSave = zones.length > 0 && errors.length === 0 && !saving;

  const layoutForm = (
    <div className="space-y-3">
      <Field
        label="Zones and places"
        hint="One entry per row: A=25 means row A with 25 places, numbered A-01 to A-25."
      >
        <TextArea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={2}
          spellCheck={false}
          aria-label="Zones and places"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-1.5">
        {zones.map((zone) => (
          <Badge key={zone.code} tone="sky">
            {zone.code} · {zone.count}
          </Badge>
        ))}
        <span className="text-[11px] font-semibold text-slate-500">{total} places in total</span>
      </div>

      {errors.length > 0 ? (
        <Notice tone="red">
          {errors.map((error) => (
            <span key={error} className="block">
              {error}
            </span>
          ))}
        </Notice>
      ) : orphanCount > 0 ? (
        <Notice tone="amber">
          {orphanCount} bike{orphanCount === 1 ? "" : "s"} sit in a place that would disappear and would become
          unassigned. Their written description is kept either way.
        </Notice>
      ) : null}

      <p className="text-[11px] leading-relaxed text-slate-500">
        Only useful if the lot already has numbers painted on it. Every bike also keeps a free-text description, so
        nothing is lost if a number goes away.
      </p>
    </div>
  );

  if (firstRun) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100">
        <div className="safe-top flex flex-col gap-1 bg-slate-900 px-5 pb-5 pt-8 text-white">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
            <Warehouse size={20} />
          </div>
          <h1 className="text-xl font-black">How do you want to record places?</h1>
          <p className="text-xs leading-relaxed text-slate-300">
            Either write where each bike is in your own words — no setup at all — or give every spot a number and see
            the lot as a grid. Both work offline, and you can change this later.
          </p>
        </div>

        <div className="flex-1 space-y-3 p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              Option 1 · describe places in words
            </p>
            <p className="mb-2.5 text-[11px] leading-relaxed text-slate-600">
              Recommended if nothing is painted on your racks. Each bike gets a free-text place you can make as long
              as you like: “behind the blue container, third rack from the wall, top hook”.
            </p>
            <Button className="w-full" onClick={() => void onSave([])} disabled={saving}>
              Skip numbering — describe them instead
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
              Option 2 · numbered places (grid view)
            </p>
            {layoutForm}
            <Button
              variant="secondary"
              className="mt-2.5 w-full"
              disabled={!canSave}
              onClick={() => void onSave(zones)}
            >
              <Check size={16} /> Create {total} places
            </Button>
          </div>

          <p className="pb-6 text-center text-[11px] text-slate-500">
            Everything you enter stays on this phone.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Sheet
      open
      onClose={() => onClose?.()}
      title="Numbered places"
      subtitle="Optional — written descriptions always work"
      footer={
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => onClose?.()}>
              Cancel
            </Button>
            <Button
              className="flex-[2]"
              disabled={!canSave}
              onClick={async () => {
                await onSave(zones);
                onClose?.();
              }}
            >
              <Check size={16} /> Save layout
            </Button>
          </div>
          {snapshot.slots.length > 0 ? (
            <Button
              variant="ghost"
              className="w-full text-[11px]"
              onClick={async () => {
                await onSave([]);
                onClose?.();
              }}
            >
              Remove all numbered places (keep written descriptions)
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="pb-2">{layoutForm}</div>
    </Sheet>
  );
}
