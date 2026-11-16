import { useMemo, useState } from "react";
import type { Snapshot } from "@/types";
import type { Registry } from "@/lib/module";
import { isKnown } from "@/lib/fsrs";
import { Icon } from "./icons";
import { Card, ItemImage, Pill, Speaker } from "./ui";

type Filter = "all" | "learning" | "known" | "new";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Everything" },
  { id: "learning", label: "Learning" },
  { id: "known", label: "Known" },
  { id: "new", label: "New" },
];

export function WordsView({
  registry,
  snapshot,
  onPlay,
}: {
  registry: Registry;
  snapshot: Snapshot;
  onPlay: (text: string, locale: string, key: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const cards = useMemo(() => new Map(snapshot.cards.map((card) => [card.itemId, card])), [snapshot.cards]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return registry.units.flatMap((unit) =>
      unit.items
        .filter((ref) => {
          const card = cards.get(ref.key);
          const state = !card ? "new" : isKnown(card) ? "known" : "learning";
          if (filter !== "all" && state !== filter) return false;
          if (!needle) return true;
          return ref.item.text.toLowerCase().includes(needle) || ref.item.translation.toLowerCase().includes(needle);
        })
        .map((ref) => ({ ref, unit: unit.unit, card: cards.get(ref.key) })),
    );
  }, [registry.units, cards, filter, query]);

  return (
    <div className="screen">
      <div className="hero">
        <div>
          <p className="hero-eyebrow">Alles wat je hebt</p>
          <h1 className="hero-title">Woorden</h1>
          <p className="hero-sub">{rows.length} sentences · every row speaks</p>
        </div>
      </div>

      <input
        type="text"
        aria-label="Search sentences"
        placeholder="Search Dutch or English…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="segmented" role="group" aria-label="Filter sentences">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={filter === entry.id}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {rows.map(({ ref, unit, card }) => {
          const open = openKey === ref.key;
          const state = !card ? "new" : isKnown(card) ? "known" : `rung ${card.stage}`;
          return (
            <Card key={ref.key} tight>
              <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                <Speaker onClick={() => onPlay(ref.item.text, "", ref.key)} />
                <button
                  type="button"
                  className="grow"
                  onClick={() => setOpenKey(open ? null : ref.key)}
                  style={{ textAlign: "left", background: "none", border: 0, color: "inherit", font: "inherit", padding: 0 }}
                >
                  <p className="nl small">{ref.item.text}</p>
                  <p className="small muted">{ref.item.translation}</p>
                  {open ? (
                    <div className="stack" style={{ marginTop: 10, gap: 8 }}>
                      {ref.item.image ? <ItemImage src={ref.item.image} /> : null}
                      {ref.item.literal ? <p className="lit">{ref.item.literal}</p> : null}
                      <div className="chips">
                        <Pill tone="violet">{unit.title}</Pill>
                        {ref.item.tags.map((tag) => (
                          <Pill key={tag}>{tag}</Pill>
                        ))}
                        <Pill tone={state === "known" ? "green" : undefined}>{state}</Pill>
                      </div>
                      {ref.item.tip ? <p className="tiny dim">{ref.item.tip}</p> : null}
                    </div>
                  ) : null}
                </button>
                <span style={{ color: "var(--label-3)", transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }}>
                  <Icon name="chevron" size={18} />
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
