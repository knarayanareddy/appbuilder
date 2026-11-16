import { useMemo } from "react";
import type { Snapshot } from "@/types";
import type { Registry } from "@/lib/module";
import type { SessionRequest } from "@/lib/session";
import { computeStats } from "@/lib/stats";
import { Icon } from "./icons";
import { UnitArt } from "./unitArt";
import { Bar, Card, SectionTitle } from "./ui";

function greeting(hour: number): string {
  if (hour < 6) return "Late avond";
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export function LearnView({
  registry,
  snapshot,
  now,
  onStart,
  onOpenStory,
  onOpenUnit,
}: {
  registry: Registry;
  snapshot: Snapshot;
  now: number;
  onStart: (request: SessionRequest) => void;
  onOpenUnit: (unitKey: string) => void;
  onOpenStory: (storyId: string) => void;
}) {
  const stats = useMemo(() => computeStats(registry, snapshot, now), [registry, snapshot, now]);
  const queueSize = stats.due + stats.newAvailable;
  const minutes = Math.max(1, Math.round(queueSize * 0.35));
  const hour = new Date(now).getHours();
  const today = new Date(now).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  const percent = stats.total === 0 ? 0 : Math.round((stats.known / stats.total) * 100);

  return (
    <div className="screen">
      <div className="hero">
        <div>
          <p className="hero-eyebrow">{greeting(hour)}</p>
          <h1 className="hero-title">Nederlands</h1>
          <p className="hero-sub">
            {today} · {percent}% known
          </p>
        </div>
        <span className="streak">
          <Icon name="flame" size={16} filled />
          {stats.streak}
        </span>
      </div>

      <button
        type="button"
        className="cta-card"
        style={{ textAlign: "left", border: 0, cursor: "pointer", width: "100%" }}
        onClick={() => onStart({ mode: "daily" })}
      >
        <div className="row spread" style={{ alignItems: "flex-start" }}>
          <div>
            <p className="cta-title">
              {queueSize === 0 ? "Alles bij — ga oefenen" : `Continue · ${queueSize} cards · ~${minutes} min`}
            </p>
            <p className="cta-sub">
              {queueSize === 0
                ? "Nothing scheduled. Practise keeps going as long as you do."
                : `${stats.due} reviews · ${stats.newAvailable} new sentences`}
            </p>
          </div>
          <span className="cta-go">
            <Icon name="arrow" size={20} />
          </span>
        </div>
      </button>

      <div className="modes">
        <button type="button" className="mode" aria-label="Practise more" onClick={() => onStart({ mode: "practice" })}>
          <span className="mode-icon violet">
            <Icon name="sparkle" size={18} />
          </span>
          Practise more
          <small>no limit</small>
        </button>
        <button type="button" className="mode" aria-label="Quiz me" onClick={() => onStart({ mode: "quiz" })}>
          <span className="mode-icon teal">
            <Icon name="target" size={18} />
          </span>
          Quiz me
          <small>12 questions</small>
        </button>
        <button type="button" className="mode" aria-label="Mistakes" onClick={() => onStart({ mode: "mistakes" })}>
          <span className="mode-icon rose">
            <Icon name="refresh" size={18} />
          </span>
          Mistakes
          <small>fix what slipped</small>
        </button>
        <button type="button" className="mode" aria-label="Flashcards" onClick={() => onStart({ mode: "cards" })}>
          <span className="mode-icon">
            <Icon name="layers" size={18} />
          </span>
          Flashcards
          <small>reveal &amp; grade</small>
        </button>
      </div>

      <Card tight>
        <div className="row spread small">
          <span className="muted">Known sentences</span>
          <span style={{ fontWeight: 800 }}>
            {stats.known} / {stats.total}
          </span>
        </div>
        <div style={{ marginTop: 9 }}>
          <Bar value={stats.known} max={stats.total} green />
        </div>
      </Card>

      <SectionTitle right={<span className="pill">{registry.units.length} units</span>}>Units</SectionTitle>

      <div className="path">
        {registry.units.map((entry) => {
          const unitStats = stats.units.find((unit) => unit.key === entry.key);
          const known = unitStats?.known ?? 0;
          const started = unitStats?.started ?? 0;
          const done = known === entry.items.length;
          return (
            <button key={entry.key} type="button" className="node" onClick={() => onOpenUnit(entry.key)}>
              <span className="art-wrap" data-state={done ? "done" : started === 0 ? "new" : "active"}>
                <UnitArt unitId={entry.unit.id} />
                {done ? (
                  <span className="art-check">
                    <Icon name="check" size={12} />
                  </span>
                ) : null}
              </span>
              <span className="node-body">
                <span className="row spread">
                  <span className="node-title">{entry.unit.title}</span>
                  <span className="pill">{entry.unit.level}</span>
                </span>
                <span className="node-sub">{entry.unit.blurb}</span>
                <span style={{ display: "block", marginTop: 7 }}>
                  <Bar value={known} max={entry.items.length} thin />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {registry.stories.length > 0 ? (
        <>
          <SectionTitle>Dialogen</SectionTitle>
          <div className="stack">
            {registry.stories.map(({ story }) => (
              <button key={story.id} type="button" className="node" onClick={() => onOpenStory(story.id)}>
                <UnitArt unitId={story.id} story />
                <span className="node-body">
                  <span className="row spread">
                    <span className="node-title">{story.title}</span>
                    <span className="pill violet">{story.lines.length} lines</span>
                  </span>
                  <span className="node-sub">{story.situation}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      <p className="tiny dim">
        {snapshot.cards.length === 0
          ? "Your first session introduces ten sentences — reading first, then a missing word, then a choice, until you can produce them."
          : `${snapshot.cards.length} of ${stats.total} sentences started · ${stats.reviewsLast7} reviews in the last 7 days`}
      </p>
    </div>
  );
}
