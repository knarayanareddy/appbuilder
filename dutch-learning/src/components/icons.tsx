/**
 * One icon set, drawn here rather than downloaded: 24×24, 2px strokes, round caps.
 * A single `Icon` component keeps the whole app consistent and keeps the APK small.
 */
export type IconName =
  | "home"
  | "book"
  | "chart"
  | "settings"
  | "flame"
  | "speaker"
  | "mic"
  | "check"
  | "close"
  | "arrow"
  | "lock"
  | "star"
  | "sparkle"
  | "target"
  | "trophy"
  | "refresh"
  | "globe"
  | "layers"
  | "download"
  | "upload"
  | "pencil"
  | "chevron"
  | "play"
  | "clock"
  | "puzzle";

const PATHS: Record<IconName, string[]> = {
  home: ["M3 10.7 12 3.4l9 7.3V20a1 1 0 0 1-1 1h-5.2v-6H9.2v6H4a1 1 0 0 1-1-1z"],
  book: ["M4.5 5.5A2.5 2.5 0 0 1 7 3h13v14.5H7a2.5 2.5 0 0 0-2.5 2.5z", "M4.5 20V5.5", "M9 7.5h7"],
  chart: ["M4 20V11", "M10 20V5", "M16 20v-6", "M22 20H2"],
  settings: [
    "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z",
    "M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3 15a1.7 1.7 0 0 0-1-1.55 2 2 0 0 1 0-3.66A1.7 1.7 0 0 0 3 8.24a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 7 3.9h.08A1.7 1.7 0 0 0 8.2 2.2V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.66 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20.1 8v.08a1.7 1.7 0 0 0 1.7 1.12H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.66 1z",
  ],
  flame: ["M12 3.2c3.4 3 5.2 5.7 5.2 8.6a5.2 5.2 0 0 1-10.4 0c0-1.6.7-2.9 1.7-4 .3 1.6 1.2 2.4 2 2.6.2-2.6-1-4.9 1.5-7.2z"],
  speaker: ["M4 9.5h3l5-4v13l-5-4H4z", "M16.2 8.6a4.8 4.8 0 0 1 0 6.8", "M19 6a8.6 8.6 0 0 1 0 12"],
  mic: ["M12 3.2a2.8 2.8 0 0 1 2.8 2.8v5.4a2.8 2.8 0 0 1-5.6 0V6a2.8 2.8 0 0 1 2.8-2.8z", "M6 11a6 6 0 0 0 12 0", "M12 17v3.8", "M9 20.8h6"],
  check: ["M4.5 12.5 9.5 17.5 19.5 6.5"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  arrow: ["M4 12h14.5", "M13 6.5 18.5 12 13 17.5"],
  lock: ["M6 10.5h12v9H6z", "M8.6 10.5V8a3.4 3.4 0 0 1 6.8 0v2.5"],
  star: ["M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"],
  sparkle: ["M12 3.5l1.9 4.9 4.9 1.9-4.9 1.9L12 17.1l-1.9-4.9L5.2 10.3l4.9-1.9z", "M18.5 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"],
  target: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 16.4a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8z", "M12 12h.01"],
  trophy: ["M8 4h8v5a4 4 0 0 1-8 0z", "M8 5.5H5.5V7a3 3 0 0 0 3 3", "M16 5.5h2.5V7a3 3 0 0 1-3 3", "M12 13v3.5", "M8.5 20h7", "M9.5 20c0-1.9 1-3 2.5-3s2.5 1.1 2.5 3z"],
  refresh: ["M20 12a8 8 0 1 1-2.6-5.9", "M20 4v4.5h-4.5"],
  globe: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M3.2 12h17.6", "M12 3c2.4 2.4 3.6 5.4 3.6 9S14.4 18.6 12 21c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3z"],
  layers: ["M12 3.5 21 8l-9 4.5L3 8z", "M3 12.5 12 17l9-4.5", "M3 16.5 12 21l9-4.5"],
  download: ["M12 3.5v11", "M7.5 10.5 12 15l4.5-4.5", "M4.5 19.5h15"],
  upload: ["M12 15.5v-11", "M7.5 8.5 12 4l4.5 4.5", "M4.5 19.5h15"],
  pencil: ["M4 20l4.2-1 10-10a2.3 2.3 0 0 0-3.2-3.2l-10 10z", "M14.5 6.5l3 3"],
  chevron: ["M9 5.5 15.5 12 9 18.5"],
  play: ["M8 5.2v13.6L19 12z"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7.5V12l3 2"],
  puzzle: ["M10 4.5a2 2 0 1 1 4 0V6h2.5a1 1 0 0 1 1 1v2.5H19a2 2 0 1 1 0 4h-1.5V17a1 1 0 0 1-1 1H14v1.5a2 2 0 1 1-4 0V18H7.5a1 1 0 0 1-1-1v-3.5H5a2 2 0 1 1 0-4h1.5V7a1 1 0 0 1 1-1H10z"],
};

export function Icon({
  name,
  size = 22,
  filled = false,
  className,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 1 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((path, index) => (
        <path key={index} d={path} />
      ))}
    </svg>
  );
}
