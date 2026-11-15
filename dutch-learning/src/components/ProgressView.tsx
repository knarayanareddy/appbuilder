import { useMemo } from "react";
import type { Snapshot } from "@/types";
import type { Registry } from "@/lib/module";
import { computeStats } from "@/lib/stats";
import { Bar, Card, Stat, Tag } from "./ui";

export function ProgressView({ registry, snapshot, now }: { registry: Registry; snapshot: Snapshot; now: number }) {
  const stats = useMemo(() => computeStats(registry, snapshot, now), [registry, snapshot, now]);

  return (
    <div className="screen">
      <h1>Progress</h1>

      <Card>
        <h2>This week</h2>
        <div className="grid-3">
          <Stat value={stats.retention === null ? "—" : `${Math.round(stats.retention * 100)}%`} label="recall" />
          <Stat value={stats.reviewsLast7} label="reviews" />
          <Stat value={stats.streak} label="day streak" />
        </div>
        <p className="tiny muted" style={{ marginTop: 10 }}>
          Recall counts reviews only — a card you have just been shown cannot be failed. Aim for 85% or better; below
          that, the daily pace is too high.
        </p>
      </Card>

      <Card>
        <h2>Sentences</h2>
        <div className="grid-3">
          <Stat value={stats.known} label="known" />
          <Stat value={stats.learning} label="learning" />
          <Stat value={stats.untouched} label="not seen" />
        </div>
        <div className="stack" style={{ marginTop: 12 }}>
          {stats.units.map((unit) => (
            <div key={unit.key}>
              <div className="row spread small">
                <span>{unit.title}</span>
                <span className="muted">
                  {unit.known}/{unit.total}
                </span>
              </div>
              <Bar value={unit.known} max={unit.total} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2>Where you slip</h2>
        {stats.hardestTags.length === 0 ? (
          <p className="small muted">No pattern yet. Miss a few cards and the grammar tags that hurt will appear here.</p>
        ) : (
          <div className="chips">
            {stats.hardestTags.map((entry) => (
              <Tag key={entry.tag}>
                {entry.tag} · {entry.misses}
              </Tag>
            ))}
          </div>
        )}
        <p className="tiny muted" style={{ marginTop: 10 }}>
          Watch this list bend the sentence mix: whatever keeps appearing here is what the next sessions should hit.
        </p>
      </Card>

      <Card tight>
        <div className="row spread small">
          <span className="muted">Library</span>
          <span>
            {registry.items.size} sentences · {registry.units.length} units · {registry.modules.length} module
            {registry.modules.length === 1 ? "" : "s"}
          </span>
        </div>
      </Card>
    </div>
  );
}
