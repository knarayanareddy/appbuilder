import { useMemo } from "react";
import type { Snapshot } from "@/types";
import type { Registry } from "@/lib/module";
import { computeStats } from "@/lib/stats";
import { Icon } from "./icons";
import { Bar, Card, Pill, Ring, SectionTitle, Stat } from "./ui";

export function ProgressView({ registry, snapshot, now }: { registry: Registry; snapshot: Snapshot; now: number }) {
  const stats = useMemo(() => computeStats(registry, snapshot, now), [registry, snapshot, now]);
  const recall = stats.retention === null ? 0 : Math.round(stats.retention * 100);

  return (
    <div className="screen">
      <div className="hero">
        <div>
          <p className="hero-eyebrow">Eerlijk, geen XP</p>
          <h1 className="hero-title">Progress</h1>
          <p className="hero-sub">
            {stats.known} known · {stats.learning} learning · {stats.untouched} untouched
          </p>
        </div>
        <span className="streak">
          <Icon name="flame" size={16} filled />
          {stats.streak}
        </span>
      </div>

      <Card>
        <div className="row" style={{ gap: 18 }}>
          <Ring
            value={stats.known}
            max={stats.total}
            label={`${stats.total === 0 ? 0 : Math.round((stats.known / stats.total) * 100)}%`}
            sublabel="known"
            tone="green"
          />
          <div className="stack" style={{ flex: 1, gap: 8 }}>
            <div className="row spread small">
              <span className="muted">Recall this week</span>
              <b>{stats.retention === null ? "—" : `${recall}%`}</b>
            </div>
            <Bar value={recall} max={100} thin green={recall >= 85} />
            <div className="row spread small">
              <span className="muted">Reviews</span>
              <b>{stats.reviewsLast7}</b>
            </div>
            <div className="row spread small">
              <span className="muted">Due now</span>
              <b>{stats.due}</b>
            </div>
          </div>
        </div>
        <p className="tiny dim" style={{ marginTop: 14 }}>
          Recall counts reviews only — a card you have just been shown cannot be failed. Below 85%, the daily pace is too
          high.
        </p>
      </Card>

      <div className="grid-3">
        <Stat value={stats.known} label="known" />
        <Stat value={stats.learning} label="learning" />
        <Stat value={stats.untouched} label="not seen" />
      </div>

      <SectionTitle>Units</SectionTitle>
      <Card>
        <div className="stack">
          {stats.units.map((unit) => (
            <div key={unit.key}>
              <div className="row spread small">
                <span style={{ fontWeight: 700 }}>{unit.title}</span>
                <span className="dim">
                  {unit.known}/{unit.total}
                </span>
              </div>
              <div style={{ marginTop: 6 }}>
                <Bar value={unit.known} max={unit.total} thin />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>Where you slip</SectionTitle>
      <Card>
        {stats.hardestTags.length === 0 ? (
          <p className="small muted">
            No pattern yet. Miss a few cards and the grammar tags that cost you marks will collect here.
          </p>
        ) : (
          <div className="chips">
            {stats.hardestTags.map((entry) => (
              <Pill key={entry.tag} tone="rose">
                {entry.tag} · {entry.misses}
              </Pill>
            ))}
          </div>
        )}
        <p className="tiny dim" style={{ marginTop: 10 }}>
          This list is the curriculum bending: whatever keeps appearing is what the next sessions should hit.
        </p>
      </Card>

      <p className="tiny dim">
        {registry.items.size} sentences · {registry.units.length} units · {registry.modules.length} module
        {registry.modules.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
