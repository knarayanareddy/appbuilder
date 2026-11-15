import { useMemo } from "react";
import type { Snapshot } from "@/types";
import type { Registry } from "@/lib/module";
import type { SessionRequest } from "@/lib/session";
import { computeStats } from "@/lib/stats";
import { Bar, Button, Card, Stat, Tag } from "./ui";

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
  const started = snapshot.cards.length;
  const minutes = Math.max(1, Math.round((stats.due + stats.newAvailable) * 0.35));

  return (
    <div className="screen">
      <div className="row spread">
        <h1>Vandaag</h1>
        <span className="tag">
          {new Date(now).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
        </span>
      </div>

      <Card>
        <div className="grid-3">
          <Stat value={stats.due} label="reviews" />
          <Stat value={stats.newAvailable} label="new" />
          <Stat value={stats.streak} label="streak" />
        </div>
        <div style={{ marginTop: 14 }} className="stack">
          <Button wide variant="primary" onClick={() => onStart({ mode: "daily" })} disabled={stats.due + stats.newAvailable === 0}>
            {stats.due + stats.newAvailable === 0 ? "Nothing scheduled — practise instead" : `Continue · ${stats.due + stats.newAvailable} cards · ~${minutes} min`}
          </Button>
          <div className="row">
            <Button onClick={() => onStart({ mode: "practice" })}>Practise more</Button>
            <Button onClick={() => onStart({ mode: "quiz" })}>Quiz me</Button>
            <Button onClick={() => onStart({ mode: "mistakes" })}>Mistakes</Button>
          </div>
        </div>
        <p className="tiny muted" style={{ marginTop: 10 }}>
          Train as long as you like: <b>Practise more</b> and <b>Quiz me</b> never run out, and neither one is capped by
          the daily pace.
        </p>
      </Card>

      <Card tight>
        <div className="row spread small">
          <span className="muted">Known</span>
          <span>
            {stats.known} of {stats.total} sentences
          </span>
        </div>
        <Bar value={stats.known} max={stats.total} />
      </Card>

      {registry.units.map((entry) => {
        const unitStats = stats.units.find((unit) => unit.key === entry.key);
        const progress = unitStats?.known ?? 0;
        const touched = unitStats?.started ?? 0;
        return (
          <Card key={entry.key} tight>
            <button type="button" className="unit" onClick={() => onOpenUnit(entry.key)}>
              <div className="row spread">
                <div>
                  <b>{entry.unit.title}</b>
                  <p className="tiny muted">{entry.unit.blurb}</p>
                </div>
                <Tag>{entry.unit.level}</Tag>
              </div>
              <div className="row spread tiny muted" style={{ marginTop: 8 }}>
                <span>
                  {progress} known · {touched} started · {entry.items.length} sentences
                </span>
                <span>{Math.round((progress / entry.items.length) * 100)}%</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <Bar value={progress} max={entry.items.length} />
              </div>
            </button>
          </Card>
        );
      })}

      {registry.stories.length > 0 ? (
        <Card>
          <h2>Dialogen</h2>
          <div className="stack">
            {registry.stories.map(({ story }) => (
              <button key={story.id} type="button" className="unit" onClick={() => onOpenStory(story.id)}>
                <div className="row spread">
                  <div>
                    <b>{story.title}</b>
                    <p className="tiny muted">{story.situation}</p>
                  </div>
                  <span className="tag">{story.lines.length} lines</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <p className="tiny muted">
        {started === 0
          ? "Nothing on the schedule yet — the first session introduces ten sentences, one rung at a time."
          : `You have opened ${started} of ${stats.total} sentences.`}
      </p>
    </div>
  );
}
