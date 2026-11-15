import { newId } from "./id";
import type { Slot, ZoneSpec } from "@/types";

export const DEFAULT_ZONES: ZoneSpec[] = [
  { code: "A", count: 25 },
  { code: "B", count: 25 },
  { code: "C", count: 25 },
  { code: "D", count: 25 },
];

export const MAX_SLOTS = 400;

export function slotCode(zone: string, index: number): string {
  return `${zone}-${String(index).padStart(2, "0")}`;
}

export function totalSlots(zones: ZoneSpec[]): number {
  return zones.reduce((sum, z) => sum + z.count, 0);
}

/**
 * Rebuild the slot list for a zone layout, reusing the ids of slots whose code
 * still exists. Stable ids matter: bikes reference slots by id, so regenerating
 * the whole lot must not silently empty every bike's location.
 */
export function buildSlots(zones: ZoneSpec[], existing: Slot[] = []): Slot[] {
  const byCode = new Map(existing.map((s) => [s.code, s]));
  const out: Slot[] = [];
  for (const zone of zones) {
    for (let i = 1; i <= zone.count; i += 1) {
      const code = slotCode(zone.code, i);
      const prev = byCode.get(code);
      out.push({
        id: prev?.id ?? newId(),
        code,
        zone: zone.code,
        index: i,
        note: prev?.note ?? "",
      });
    }
  }
  return out;
}

export interface ParseResult {
  zones: ZoneSpec[];
  errors: string[];
}

/**
 * Accepts "A=25, B=25" / "A:25" / "A 25" / one per line, plus bare numbers
 * ("A=10, 15" → the 15 becomes zone B). Order is preserved.
 */
export function parseZoneSpecs(input: string): ParseResult {
  const tokens = input
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const zones: ZoneSpec[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const withCode = /^([A-Za-z][A-Za-z0-9_-]{0,7})\s*(?:=|:|x|\*|-|>|\s)\s*(\d{1,3})$/.exec(token);
    const bareCount = /^(\d{1,3})$/.exec(token);

    let code: string | null = null;
    let count = 0;

    if (withCode) {
      code = withCode[1].toUpperCase();
      count = Number(withCode[2]);
    } else if (bareCount) {
      // Assign the next unused single letter.
      let n = 0;
      while (seen.has(String.fromCharCode(65 + n)) && n < 26) n += 1;
      code = n < 26 ? String.fromCharCode(65 + n) : null;
      count = Number(bareCount[1]);
      if (!code) {
        errors.push(`"A-Z" are all used — give "${token}" a name, e.g. "AA=${count}"`);
        continue;
      }
    } else {
      errors.push(`Could not read "${token}". Use ZONE=COUNT, e.g. "A=25".`);
      continue;
    }

    if (count < 1) {
      errors.push(`"${token}": count must be at least 1.`);
      continue;
    }
    if (seen.has(code)) {
      errors.push(`Zone "${code}" appears twice.`);
      continue;
    }
    seen.add(code);
    zones.push({ code, count });
  }

  if (totalSlots(zones) > MAX_SLOTS) {
    errors.push(`That is ${totalSlots(zones)} slots — the limit is ${MAX_SLOTS}.`);
  }
  return { zones, errors };
}

export function formatZoneSpecs(zones: ZoneSpec[]): string {
  return zones.map((z) => `${z.code}=${z.count}`).join(", ");
}
