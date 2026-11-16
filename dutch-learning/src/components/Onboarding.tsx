import { useState } from "react";
import type { Settings } from "@/types";
import type { SpeechStatus } from "@/lib/speech";
import { Icon } from "./icons";
import { UnitArt } from "./unitArt";
import { Button, Card } from "./ui";

const LEVELS: Array<{ id: string; label: string; sub: string; dailyNew: number }> = [
  { id: "a0", label: "Vanaf nul", sub: "Start at the very first sentences", dailyNew: 8 },
  { id: "a1", label: "Survival Dutch", sub: "You can order, greet and apologise", dailyNew: 10 },
  { id: "a2", label: "Ik red me", sub: "Everyday life works, the exam does not", dailyNew: 12 },
  { id: "b1", label: "Bijna B1", sub: "Polishing, and exam task formats", dailyNew: 14 },
];

/**
 * First run. Three screens and nothing else: what this is, how much Dutch you have
 * (which sets the pace), and whether the phone can actually speak Dutch. The last
 * button can start a placement check, which is the honest way to skip what you know.
 */
export function Onboarding({
  speech,
  onFinish,
  onPlacement,
  onInstallVoice,
  onCheckVoice,
}: {
  speech: SpeechStatus | null;
  onFinish: (patch: Partial<Settings>) => void;
  onPlacement: (patch: Partial<Settings>) => void;
  onInstallVoice: () => void;
  onCheckVoice: () => void;
}) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(LEVELS[1]);

  const patch = { dailyNew: level.dailyNew };

  return (
    <div className="screen">
      <div className="row spread">
        <div className="row" style={{ gap: 6 }} aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              style={{
                width: dot === step ? 22 : 8,
                height: 8,
                borderRadius: 999,
                background: dot === step ? "var(--primary)" : "var(--line-2)",
                transition: "width .25s ease, background .25s ease",
              }}
            />
          ))}
        </div>
        <button type="button" className="link" onClick={() => onFinish({ ...patch, onboarded: true })}>
          Skip
        </button>
      </div>

      {step === 0 ? (
        <>
          <div style={{ display: "grid", placeItems: "center", marginTop: 10 }}>
            <UnitArt unitId="taal" size={116} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p className="hero-eyebrow">Nederlands · offline</p>
            <h1 className="hero-title" style={{ fontSize: 34 }}>
              Taal
            </h1>
            <p className="hero-sub">Sentences you will actually hear in Delft — and a schedule that makes them stick.</p>
          </div>
          <Card>
            <div className="stack" style={{ gap: 14 }}>
              {[
                ["layers", "Six drills per sentence", "Read it, fill the gap, choose, build it, type it, produce it."],
                ["flame", "Brought back before you forget", "A spaced-repetition scheduler, not a streak counter."],
                ["speaker", "A real Dutch voice, offline", "Recorded audio where it exists, your phone's voice elsewhere."],
              ].map(([icon, title, sub]) => (
                <div key={title} className="row" style={{ alignItems: "flex-start" }}>
                  <span className="list-row-icon">
                    <Icon name={icon as "layers"} size={18} />
                  </span>
                  <div>
                    <p className="small" style={{ fontWeight: 800 }}>
                      {title}
                    </p>
                    <p className="tiny dim">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <div className="action-bar">
            <Button wide size="lg" variant="primary" onClick={() => setStep(1)}>
              Get started
            </Button>
          </div>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <div>
            <p className="hero-eyebrow">Stap 2 van 3</p>
            <h1 className="hero-title">Hoeveel Nederlands heb je al?</h1>
            <p className="hero-sub">This sets your daily pace — you can change it any time.</p>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {LEVELS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="option"
                aria-pressed={level.id === entry.id}
                style={{
                  borderColor: level.id === entry.id ? "var(--primary)" : undefined,
                  boxShadow: level.id === entry.id ? "0 0 0 2px rgba(255,122,61,.35)" : undefined,
                }}
                onClick={() => setLevel(entry)}
              >
                <span className="row spread">
                  <span>
                    <span style={{ display: "block", fontWeight: 800 }}>{entry.label}</span>
                    <span className="tiny dim">{entry.sub}</span>
                  </span>
                  {level.id === entry.id ? <Icon name="check" size={20} /> : null}
                </span>
              </button>
            ))}
          </div>
          <p className="tiny dim">
            {level.dailyNew} new sentences a day, about {Math.round(level.dailyNew * 2.2)} minutes once reviews pile up.
          </p>
          <div className="action-bar">
            <Button wide size="lg" variant="primary" onClick={() => setStep(2)}>
              Continue
            </Button>
            <Button wide variant="ghost" onClick={() => setStep(0)}>
              Back
            </Button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div>
            <p className="hero-eyebrow">Stap 3 van 3</p>
            <h1 className="hero-title">Kan deze telefoon Nederlands praten?</h1>
            <p className="hero-sub">Without the Dutch voice, Android reads Dutch with an English accent.</p>
          </div>
          <Card>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <span className="list-row-icon" style={{ color: speech?.supported ? "var(--green)" : "var(--gold)" }}>
                <Icon name="speaker" size={18} />
              </span>
              <div className="grow">
                <p className="small" style={{ fontWeight: 800 }}>
                  {speech === null ? "Checking…" : speech.supported ? "Dutch voice ready" : "No Dutch voice found"}
                </p>
                <p className="tiny dim">
                  {speech === null
                    ? "One moment."
                    : speech.supported
                      ? `${speech.voices.length} voice${speech.voices.length === 1 ? "" : "s"} available · ${speech.locale}`
                      : "Install it once and every Dutch app sounds right, not just this one."}
                </p>
              </div>
            </div>
            {!speech?.supported ? (
              <div className="row" style={{ marginTop: 12 }}>
                <Button size="sm" variant="primary" icon="download" onClick={onInstallVoice}>
                  Install the voice
                </Button>
                <Button size="sm" onClick={onCheckVoice}>
                  Check again
                </Button>
              </div>
            ) : null}
          </Card>

          <Card>
            <p className="small" style={{ fontWeight: 800 }}>
              Already know some of this?
            </p>
            <p className="tiny dim">
              A twelve-question check skips the sentences you answer correctly — they go straight to review instead of
              being taught again.
            </p>
            <div className="row" style={{ marginTop: 12 }}>
              <Button variant="primary" onClick={() => onPlacement({ ...patch, onboarded: true })}>
                Quick check · 12
              </Button>
              <Button onClick={() => onFinish({ ...patch, onboarded: true })}>Start from the beginning</Button>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
