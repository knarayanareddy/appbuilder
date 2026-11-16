import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NL_BASIS } from "@/content/nl-basis";
import { buildRegistry, countItems, isSafeImage, itemKey, resolveKey, validateModule } from "./module";

function validModule() {
  return {
    schemaVersion: 1,
    id: "es-basis",
    language: "es",
    title: "Español básico",
    description: "A tiny Spanish module",
    units: [
      {
        id: "hola",
        title: "Hola",
        blurb: "Greetings",
        level: "A1",
        items: [
          { id: "s1", text: "Hola, ¿qué tal?", translation: "Hi, how's it going?" },
          { id: "s2", text: "Me llamo Ana.", translation: "My name is Ana.", literal: "Myself I-call Ana." },
        ],
      },
    ],
  };
}

describe("the built-in module", () => {
  it("passes its own validator", () => {
    const result = validateModule(NL_BASIS);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("carries enough sentences for a real curriculum", () => {
    expect(countItems(NL_BASIS)).toBeGreaterThanOrEqual(120);
    expect(NL_BASIS.units.length).toBeGreaterThanOrEqual(12);
    expect((NL_BASIS.stories ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("gives every unit a grammar tip and every item a unique id", () => {
    const ids = new Set<string>();
    for (const unit of NL_BASIS.units) {
      expect(unit.tip && unit.tip.length > 20).toBe(true);
      for (const item of unit.items) {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
        expect(item.text.length).toBeGreaterThan(3);
        expect(item.translation.length).toBeGreaterThan(3);
        expect(item.text.trim().slice(-1)).toMatch(/[.?!]/);
      }
    }
  });
});

describe("validateModule", () => {
  it("accepts a well-formed module", () => {
    const result = validateModule(validModule());
    expect(result.ok).toBe(true);
    expect(result.module?.units[0].items).toHaveLength(2);
    expect(result.module?.units[0].level).toBe("A1");
  });

  it("explains what is missing instead of failing silently", () => {
    const result = validateModule({ id: "Bad Id!", units: [] });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/lowercase/i);
    expect(result.errors.join(" ")).toMatch(/units/i);
    expect(result.errors.join(" ")).toMatch(/title/i);
  });

  it("names the unit and item that is broken", () => {
    const module = validModule();
    // deliberately incomplete on purpose
    module.units[0].items[1].translation = "";
    const result = validateModule(module);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("Hola");
    expect(result.errors[0]).toContain("item 2");
  });

  it("rejects duplicate item ids and bad levels", () => {
    const module = validModule();
    module.units[0].items.push({ id: "s1", text: "Otra vez.", translation: "Again." });
    module.units[0].level = "C9";
    const result = validateModule(module);
    expect(result.errors.join(" ")).toMatch(/duplicate item id/i);
    expect(result.errors.join(" ")).toMatch(/level/i);
  });

  it("refuses anything that is not an object", () => {
    expect(validateModule("hello").ok).toBe(false);
    expect(validateModule(null).ok).toBe(false);
    expect(validateModule([1, 2, 3]).ok).toBe(false);
  });
});

describe("registry", () => {
  it("keys items by module and unit so two modules can share ids", () => {
    const registry = buildRegistry([validateModule(validModule()).module!]);
    expect(registry.items.has(itemKey("nl-basis", "kennismaking", "s001"))).toBe(true);
    expect(registry.items.has(itemKey("es-basis", "hola", "s1"))).toBe(true);
    expect(registry.units).toHaveLength(NL_BASIS.units.length + 1);
  });

  it("resolves ids written before modules existed", () => {
    const registry = buildRegistry([]);
    expect(resolveKey(registry, "s001")).toBe(itemKey("nl-basis", "kennismaking", "s001"));
    expect(resolveKey(registry, "nonsense")).toBeUndefined();
  });

  it("never lets an imported module shadow the built-in one", () => {
    const impostor = validateModule({ ...validModule(), id: "nl-basis" }).module!;
    const registry = buildRegistry([impostor]);
    expect(registry.modules).toHaveLength(1);
    expect(registry.modules[0].title).toBe(NL_BASIS.title);
  });
});

describe("bundled audio", () => {
  it("maps every recording in the index to a real sentence", () => {
    const index: string[] = JSON.parse(readFileSync(join(process.cwd(), "public/audio/index.json"), "utf8"));
    const registry = buildRegistry([]);
    for (const key of index) {
      expect(registry.items.has(key)).toBe(true);
    }
  });
});

describe("picture cues", () => {
  it("accepts bundled paths, https URLs and inline images", () => {
    expect(isSafeImage("img/s011.jpg")).toBe(true);
    expect(isSafeImage("img/units/boodschappen.webp")).toBe(true);
    expect(isSafeImage("/img/s011.jpg")).toBe(true);
    expect(isSafeImage("https://example.com/apple.png")).toBe(true);
    expect(isSafeImage("data:image/png;base64,AAAA")).toBe(true);
  });

  it("refuses anything that could execute or leak", () => {
    expect(isSafeImage("javascript:alert(1)")).toBe(false);
    expect(isSafeImage("file:///etc/passwd")).toBe(false);
    expect(isSafeImage("http://example.com/a.png")).toBe(false);
    expect(isSafeImage("img/a b.png")).toBe(false);
    expect(isSafeImage("img/../../secret.png")).toBe(false);
    expect(isSafeImage("")).toBe(false);
  });

  it("drops a bad picture from a module and says why", () => {
    const raw = {
      schemaVersion: 1,
      id: "demo",
      language: "nl",
      title: "Demo",
      description: "With a dodgy image",
      units: [
        {
          id: "u1",
          title: "Unit",
          blurb: "",
          level: "A1",
          items: [{ id: "a", text: "Hallo.", translation: "Hello.", image: "javascript:alert(1)" }],
        },
      ],
    };
    const result = validateModule(raw);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => /image/.test(error))).toBe(true);
    expect(result.module?.units?.[0]?.items?.[0]?.image).toBeUndefined();
  });
});
