import { useMemo } from "react";
import type { Snapshot } from "@/types";
import { CONTENT_STATS } from "@/lib/content";
import { computeStats, hardestTags, retention, streakDays } from "@/lib/stats";
import { Bar, Card, Stat, Tag } from "./ui";

export function StatsView({ snapshot, now }: { snapshot: Snapshot; now: number }) {
  const stats = useMemo(() => computeStats(snapshot, now), [snapshot, now]);
  const misses = useMemo(() => hardestTags(snapshot.attempts, now), [snapshot.attempts, now]);
  const recall = retention(snapshot.attempts, now);
  const streak = streakDays(snapshot.attempts, now);

  return (
    <div className="screen">
      <h1>Progress</h1>

      <Card>
        <h2>This week</h2>
        <div className="grid-3">
          <Stat value={recall === null ? "—" : `${Math.round(recall * 100)}%`} label="recall" />
          <Stat value={stats.reviewsLast7} label="reviews" />
          <Stat value={streak} label="day streak" />
        </div>
        <p className="tiny muted" style={{ marginTop: 10 }}>
          Recall is measured on reviews only, not on first presentations — a card you have just been shown cannot be
          failed. Aim for 85% or better; below that, the daily load is too high.
        </p>
      </Card>

      <Card>
        <h2>Sentences</h2>
        <div className="grid-3">
          <Stat value={stats.known} label="known" />
          <Stat value={stats.learning} label="learning" />
          <Stat value={stats.untouched} label="not yet seen" />
        </div>
        <div className="stack" style={{ marginTop: 12 }}>
          {stats.byTheme.map((theme) => (
            <div key={theme.theme}>
              <div className="row spread small">
                <span style={{ textTransform: "capitalize" }}>{theme.theme}</span>
                <span className="muted">
                  {theme.known}/{theme.total}
                </span>
              </div>
              <Bar value={theme.known} max={theme.total} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2>Where you slip</h2>
        {misses.length === 0 ? (
          <p className="small muted">No pattern yet. Miss a few cards and the grammar tags that hurt will appear here.</p>
        ) : (
          <div className="chips">
            {misses.map((entry) => (
              <Tag key={entry.tag}>
                {entry.tag} · {entry.misses}
              </Tag>
            ))}
          </div>
        )}
        <p className="tiny muted" style={{ marginTop: 10 }}>
          This is the app's curriculum bending: keep missing separables and the sentence mix should move towards them.
        </p>
      </Card>

      <Card tight>
        <div className="row spread small">
          <span className="muted">Library</span>
          <span>
            {CONTENT_STATS.total} sentences · {CONTENT_STATS.a1} A1 · {CONTENT_STATS.a2} A2
          </span>
        </div>
      </Card>
    </div>
  );
}
