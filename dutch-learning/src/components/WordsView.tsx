import { useMemo, useState } from "react";
import type { Snapshot } from "@/types";
import type { Registry } from "@/lib/module";
import { isKnown } from "@/lib/fsrs";
import { Card, Speaker, Tag } from "./ui";

type Filter = "all" | "learning" | "known" | "new";

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
          return (
            ref.item.text.toLowerCase().includes(needle) ||
            ref.item.translation.toLowerCase().includes(needle)
          );
        })
        .map((ref) => ({ ref, unit: unit.unit, card: cards.get(ref.key) })),
    );
  }, [registry.units, cards, filter, query]);

  return (
    <div className="screen">
      <h1>Woorden</h1>
      <input
        type="text"
        aria-label="Search sentences"
        placeholder="Search Dutch or English…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="chips">
        {(["all", "learning", "known", "new"] as Filter[]).map((option) => (
          <button
            key={option}
            type="button"
            className={filter === option ? "pill on" : "pill"}
            onClick={() => setFilter(option)}
          >
            {option === "all" ? "Everything" : option}
          </button>
        ))}
      </div>

      <p className="tiny muted">
        {rows.length} sentence{rows.length === 1 ? "" : "s"} — every row speaks. Tap a row to see the literal gloss and
        the grammar tags.
      </p>

      {rows.map(({ ref, unit, card }) => (
        <Card key={ref.key} tight>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <Speaker onClick={() => onPlay(ref.item.text, "", ref.key)} />
            <button
              type="button"
              className="grow"
              onClick={() => setOpenKey(openKey === ref.key ? null : ref.key)}
              style={{ textAlign: "left" }}
            >
              <p className="nl small">{ref.item.text}</p>
              <p className="small muted">{ref.item.translation}</p>
              {openKey === ref.key ? (
                <div className="stack" style={{ marginTop: 8 }}>
                  {ref.item.literal ? <p className="lit">{ref.item.literal}</p> : null}
                  <div className="chips">
                    <Tag>{unit.title}</Tag>
                    {ref.item.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    <Tag>{!card ? "new" : isKnown(card) ? "known" : `rung ${card.stage}`}</Tag>
                  </div>
                  {ref.item.tip ? <p className="tiny muted">{ref.item.tip}</p> : null}
                </div>
              ) : null}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
