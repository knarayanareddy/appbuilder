import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export function Button({
  children,
  onClick,
  variant = "ghost",
  size = "md",
  wide = false,
  disabled = false,
  ariaLabel,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  wide?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  icon?: IconName;
}) {
  const classes = ["btn", variant, size === "md" ? "" : size, wide ? "wide" : ""].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {icon ? <Icon name={icon} size={size === "sm" ? 16 : 19} /> : null}
      {children}
    </button>
  );
}

export function IconButton({ name, label, onClick }: { name: IconName; label: string; onClick: () => void }) {
  return (
    <button type="button" className="icon-btn" aria-label={label} onClick={onClick}>
      <Icon name={name} size={20} />
    </button>
  );
}

export function Speaker({ onClick, label = "Play audio", big = false }: { onClick: () => void; label?: string; big?: boolean }) {
  return (
    <button type="button" className={big ? "speaker big" : "speaker"} aria-label={label} onClick={onClick}>
      <Icon name="speaker" size={big ? 32 : 24} />
    </button>
  );
}

export function Card({ children, tight = false, className = "" }: { children: ReactNode; tight?: boolean; className?: string }) {
  return <section className={`card${tight ? " tight" : ""}${className ? ` ${className}` : ""}`}>{children}</section>;
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function Pill({ children, tone }: { children: ReactNode; tone?: "primary" | "green" | "violet" | "rose" | "gold" }) {
  return <span className={tone ? `pill ${tone}` : "pill"}>{children}</span>;
}

/** Kept as an alias so older call sites keep working. */
export const Tag = Pill;

export function Bar({ value, max, thin = false, green = false }: { value: number; max: number; thin?: boolean; green?: boolean }) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const classes = ["bar", thin ? "thin" : "", green ? "green" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${percent}%` }} />
    </div>
  );
}

export function Ring({
  value,
  max,
  size = 108,
  label,
  sublabel,
  tone = "green",
}: {
  value: number;
  max: number;
  size?: number;
  label: string;
  sublabel?: string;
  tone?: "green" | "orange" | "violet";
}) {
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = max > 0 ? Math.min(1, value / max) : 0;
  const colors: Record<string, [string, string]> = {
    green: ["#2dd4bf", "#3ddc97"],
    orange: ["#ff9a63", "#ff7a3d"],
    violet: ["#a78bfa", "#8b5cf6"],
  };
  const [from, to] = colors[tone];

  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={`ring-${tone}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--tint-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${tone})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-label">
        <b>{label}</b>
        {sublabel ? <span>{sublabel}</span> : null}
      </div>
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={on ? "switch on" : "switch"}
      onClick={onChange}
    />
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <h2 className="section">
      <span>{children}</span>
      {right}
    </h2>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card>
      <p className="nl small">{title}</p>
      {children ? (
        <p className="small muted" style={{ marginTop: 6 }}>
          {children}
        </p>
      ) : null}
    </Card>
  );
}

/** A tappable word in the word-bank drill. */
export function Chip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="chip" onClick={onClick}>
      {children}
    </button>
  );
}

export function Option({
  children,
  onClick,
  state = "idle",
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  state?: "idle" | "right" | "wrong";
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`option ${state}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
