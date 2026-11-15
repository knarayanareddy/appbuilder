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
 * Deciding the place codes is the highest-leverage five minutes in this app:
 * every bike record points at one of these codes, and they only help if they
 * match what is painted on the racks.
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

  const form = (
    <div className="space-y-3">
      <Field
        label="Zones and places"
        hint='One entry per row: A=25 means row A with 25 places, numbered A-01 to A-25.'
      >
        <TextArea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
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
      ) : (
        <Notice tone={orphanCount > 0 ? "amber" : "slate"}>
          {orphanCount > 0
            ? `${orphanCount} bike${orphanCount === 1 ? "" : "s"} sit in a place that would disappear and would become unassigned. Nothing is deleted.`
            : "Existing bikes keep their place as long as the code still exists."}
        </Notice>
      )}

      <p className="text-[11px] leading-relaxed text-slate-500">
        Write these codes on the racks if they are not already labelled. A code you can read on the frame is worth more
        than any search field.
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
          <h1 className="text-xl font-black">Set up your lot</h1>
          <p className="text-xs leading-relaxed text-slate-300">
            How many places do you have, and what are the rows called? This becomes the grid you will see on the main
            screen. You can change it later in Settings.
          </p>
        </div>
        <div className="flex-1 space-y-3 p-4">
          {form}
          <Button
            className="w-full"
            disabled={!canSave}
            onClick={async () => {
              await onSave(zones);
            }}
          >
            <Check size={16} /> Create {total} places
          </Button>
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
      title="Lot layout"
      subtitle="Changes apply straight away"
      footer={
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
      }
    >
      <div className="pb-2">{form}</div>
    </Sheet>
  );
}
