import type { Item, Level, Module, Story, Unit } from "@/types";
import { NL_BASIS } from "@/content/nl-basis";

export interface ItemRef {
  key: string;
  item: Item;
  unit: Unit;
  module: Module;
}

export interface UnitRef {
  key: string;
  unit: Unit;
  module: Module;
  items: ItemRef[];
}

export interface Registry {
  modules: Module[];
  items: Map<string, ItemRef>;
  units: UnitRef[];
  stories: Array<{ story: Story; module: Module }>;
  /**
   * Cards written before modules existed refer to a bare id ("s001"). This map lets
   * them keep their schedule instead of being thrown away on upgrade.
   */
  legacy: Map<string, string>;
}

export function itemKey(moduleId: string, unitId: string, itemId: string): string {
  return `${moduleId}/${unitId}/${itemId}`;
}

export function unitKey(moduleId: string, unitId: string): string {
  return `${moduleId}/${unitId}`;
}

export function buildRegistry(userModules: Module[] = []): Registry {
  const modules = [NL_BASIS, ...userModules.filter((module) => module.id !== NL_BASIS.id)];
  const items = new Map<string, ItemRef>();
  const units: UnitRef[] = [];
  const legacy = new Map<string, string>();

  for (const module of modules) {
    for (const unit of module.units) {
      const refs: ItemRef[] = unit.items.map((item) => {
        const key = itemKey(module.id, unit.id, item.id);
        const ref: ItemRef = { key, item, unit, module };
        items.set(key, ref);
        if (!legacy.has(item.id)) legacy.set(item.id, key);
        return ref;
      });
      units.push({ key: unitKey(module.id, unit.id), unit, module, items: refs });
    }
  }

  const stories = modules.flatMap((module) => (module.stories ?? []).map((story) => ({ story, module })));

  return { modules, items, units, stories, legacy };
}

/** Resolve a stored card id, including ids written by the pre-module build. */
export function resolveKey(registry: Registry, id: string): string | undefined {
  if (registry.items.has(id)) return id;
  return registry.legacy.get(id);
}

export function itemFor(registry: Registry, key: string): ItemRef | undefined {
  return registry.items.get(key);
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  module?: Module;
}

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,39}$/;
const LEVELS: Level[] = ["A1", "A2", "B1"];

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * A module arrives as JSON from an AI, a friend or a half-finished experiment.
 * Everything is checked before it can reach the scheduler, and the errors say which
 * sentence is broken rather than "invalid input".
 */
export function validateModule(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const value = raw as Record<string, unknown>;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, errors: ["The file is not a JSON object."] };
  }
  if (value.schemaVersion !== undefined && value.schemaVersion !== 1) {
    errors.push(`schemaVersion ${String(value.schemaVersion)} is not supported (this build reads 1).`);
  }

  const id = text(value.id);
  if (!ID_PATTERN.test(id)) errors.push('"id" must be lowercase letters, digits, dots or dashes (e.g. "nl-werk").');
  if (!text(value.language)) errors.push('"language" is required (e.g. "nl").');
  if (!text(value.title)) errors.push('"title" is required.');
  if (!text(value.description)) errors.push('"description" is required.');

  const rawUnits = Array.isArray(value.units) ? value.units : [];
  if (rawUnits.length === 0) errors.push('"units" must be a non-empty array.');

  const unitIds = new Set<string>();
  const itemIds = new Set<string>();
  const units: Unit[] = [];

  rawUnits.forEach((rawUnit, unitIndex) => {
    const unit = rawUnit as Record<string, unknown>;
    const label = `unit ${unitIndex + 1}`;
    const unitId = text(unit.id);
    if (!ID_PATTERN.test(unitId)) errors.push(`${label}: "id" must be lowercase letters, digits, dots or dashes.`);
    if (unitIds.has(unitId)) errors.push(`${label}: duplicate unit id "${unitId}".`);
    unitIds.add(unitId);

    const title = text(unit.title);
    if (!title) errors.push(`${label}: "title" is required.`);

    const level = text(unit.level) as Level;
    if (!LEVELS.includes(level)) errors.push(`${label}: "level" must be A1, A2 or B1.`);

    const rawItems = Array.isArray(unit.items) ? unit.items : [];
    if (rawItems.length === 0) errors.push(`${label}: needs at least one item.`);

    const items: Item[] = [];
    rawItems.forEach((rawItem, itemIndex) => {
      const item = rawItem as Record<string, unknown>;
      const itemLabel = `${label} "${title || unitId}", item ${itemIndex + 1}`;
      const itemId = text(item.id);
      if (!itemId) errors.push(`${itemLabel}: "id" is required.`);
      if (itemIds.has(itemId)) errors.push(`${itemLabel}: duplicate item id "${itemId}".`);
      itemIds.add(itemId);

      const source = text(item.text);
      const translation = text(item.translation);
      if (!source) errors.push(`${itemLabel}: "text" is required.`);
      if (!translation) errors.push(`${itemLabel}: "translation" is required.`);

      items.push({
        id: itemId,
        text: source,
        translation,
        literal: text(item.literal) || undefined,
        tags: Array.isArray(item.tags) ? item.tags.map(text).filter(Boolean) : [],
        tip: text(item.tip) || undefined,
      });
    });

    units.push({
      id: unitId,
      title: title || unitId,
      blurb: text(unit.blurb),
      level: LEVELS.includes(level) ? level : "A2",
      tip: text(unit.tip) || undefined,
      items,
    });
  });

  const stories: Story[] = Array.isArray(value.stories)
    ? value.stories.map((rawStory, index) => {
        const story = rawStory as Record<string, unknown>;
        const lines = Array.isArray(story.lines) ? story.lines : [];
        if (lines.length === 0) errors.push(`story ${index + 1}: needs at least one line.`);
        return {
          id: text(story.id) || `story-${index + 1}`,
          title: text(story.title) || `Story ${index + 1}`,
          situation: text(story.situation),
          lines: lines.map((rawLine) => {
            const line = rawLine as Record<string, unknown>;
            return { speaker: text(line.speaker) || "—", text: text(line.text), translation: text(line.translation) };
          }),
        };
      })
    : [];

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    module: {
      schemaVersion: 1,
      id,
      language: text(value.language),
      title: text(value.title),
      description: text(value.description),
      author: text(value.author) || undefined,
      units,
      stories,
    },
  };
}

export function countItems(module: Module): number {
  return module.units.reduce((total, unit) => total + unit.items.length, 0);
}
