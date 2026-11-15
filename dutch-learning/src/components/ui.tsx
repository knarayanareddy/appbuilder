import type { ReactNode } from "react";

export function Button({
  children,
  onClick,
  variant = "default",
  wide = false,
  small = false,
  disabled = false,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost";
  wide?: boolean;
  small?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const classes = ["btn", variant, wide ? "wide" : "", small ? "small" : ""].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function Card({ children, tight = false }: { children: ReactNode; tight?: boolean }) {
  return <section className={tight ? "card tight" : "card"}>{children}</section>;
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}

export function Bar({ value, max }: { value: number; max: number }) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${percent}%` }} />
    </div>
  );
}
