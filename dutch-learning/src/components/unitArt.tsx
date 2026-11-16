import type { ReactNode } from "react";

/**
 * Unit illustrations. Not icons — small scenes, drawn with three or four shapes and a
 * single hue per unit, so the path reads as a set of situations rather than a list of
 * buttons. Everything is inline SVG: no image files, no downloads, and it recolours
 * with the theme.
 */
interface Art {
  color: string;
  shapes: ReactNode;
}

const ART: Record<string, Art> = {
  kennismaking: {
    color: "#ff7a3d",
    shapes: (
      <>
        <rect x="9" y="13" width="30" height="20" rx="7" fill="currentColor" opacity="0.45" />
        <path d="M16 33v9l9-9z" fill="currentColor" opacity="0.45" />
        <rect x="31" y="30" width="24" height="17" rx="6" fill="currentColor" />
        <circle cx="39" cy="38.5" r="1.9" fill="var(--art-ink)" />
        <circle cx="45" cy="38.5" r="1.9" fill="var(--art-ink)" />
      </>
    ),
  },
  boodschappen: {
    color: "#2dd4bf",
    shapes: (
      <>
        <path d="M17 24h30l-3.5 24a4 4 0 0 1-4 3.5H24.5a4 4 0 0 1-4-3.5z" fill="currentColor" opacity="0.45" />
        <path d="M25 25v-3a7 7 0 0 1 14 0v3" stroke="currentColor" strokeWidth="3.5" fill="none" />
        <circle cx="26" cy="34" r="2.4" fill="currentColor" />
        <circle cx="38" cy="34" r="2.4" fill="currentColor" />
      </>
    ),
  },
  wonen: {
    color: "#8b5cf6",
    shapes: (
      <>
        <path d="M32 11 53 29v22a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V29z" fill="currentColor" opacity="0.45" />
        <rect x="19" y="34" width="9" height="8" rx="2" fill="currentColor" />
        <rect x="34" y="34" width="9" height="8" rx="2" fill="currentColor" />
        <rect x="27" y="45" width="10" height="8" rx="2" fill="currentColor" />
      </>
    ),
  },
  gemeente: {
    color: "#5b8cff",
    shapes: (
      <>
        <rect x="17" y="9" width="28" height="44" rx="5" fill="currentColor" opacity="0.45" />
        <rect x="23" y="19" width="16" height="3.4" rx="1.7" fill="currentColor" />
        <rect x="23" y="26" width="11" height="3.4" rx="1.7" fill="currentColor" />
        <rect x="23" y="33" width="14" height="3.4" rx="1.7" fill="currentColor" />
        <circle cx="40" cy="44" r="6.5" fill="currentColor" />
      </>
    ),
  },
  gezondheid: {
    color: "#ff5d73",
    shapes: (
      <>
        <path
          d="M32 51s-16-9.6-16-21.2A8.8 8.8 0 0 1 32 24a8.8 8.8 0 0 1 16 5.8C48 41.4 32 51 32 51z"
          fill="currentColor"
          opacity="0.45"
        />
        <path d="M17 33h8l3.5-6.5 4.5 13 3-6.5h11" stroke="currentColor" strokeWidth="3.2" fill="none" />
      </>
    ),
  },
  werk: {
    color: "#ffc64b",
    shapes: (
      <>
        <rect x="13" y="17" width="38" height="24" rx="4" fill="currentColor" opacity="0.45" />
        <rect x="20" y="24" width="15" height="3.2" rx="1.6" fill="currentColor" />
        <rect x="20" y="31" width="10" height="3.2" rx="1.6" fill="currentColor" />
        <path d="M9 43h46a3 3 0 0 1-3 5H12a3 3 0 0 1-3-5z" fill="currentColor" />
      </>
    ),
  },
  vervoer: {
    color: "#3ddc97",
    shapes: (
      <>
        <circle cx="19" cy="42" r="9.5" stroke="currentColor" strokeWidth="3.2" fill="none" />
        <circle cx="45" cy="42" r="9.5" stroke="currentColor" strokeWidth="3.2" fill="none" />
        <path d="M19 42l8-13h10l8 13M27 29h9" stroke="currentColor" strokeWidth="3.2" fill="none" />
        <circle cx="19" cy="42" r="2.5" fill="currentColor" />
        <circle cx="45" cy="42" r="2.5" fill="currentColor" />
      </>
    ),
  },
  familie: {
    color: "#ff8fb1",
    shapes: (
      <>
        <circle cx="32" cy="21" r="7.5" fill="currentColor" />
        <path d="M18 50c0-8 6.2-13.5 14-13.5S46 42 46 50z" fill="currentColor" opacity="0.45" />
        <circle cx="14" cy="30" r="5" fill="currentColor" opacity="0.8" />
        <circle cx="50" cy="30" r="5" fill="currentColor" opacity="0.8" />
      </>
    ),
  },
  eten: {
    color: "#ff9a63",
    shapes: (
      <>
        <path d="M17 26h24v12a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10z" fill="currentColor" opacity="0.45" />
        <path d="M41 29h4a6 6 0 0 1 0 12h-4" stroke="currentColor" strokeWidth="3.2" fill="none" />
        <rect x="13" y="49" width="36" height="4" rx="2" fill="currentColor" />
        <path d="M25 19c2.5-3.5 0-6 0-6M33 19c2.5-3.5 0-6 0-6" stroke="currentColor" strokeWidth="2.8" fill="none" />
      </>
    ),
  },
  tijd: {
    color: "#ffc64b",
    shapes: (
      <>
        <circle cx="32" cy="32" r="20" fill="currentColor" opacity="0.4" />
        <path d="M32 32V20M32 32l9 6.5" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
        <circle cx="32" cy="32" r="3" fill="currentColor" />
      </>
    ),
  },
  taal: {
    color: "#a78bfa",
    shapes: (
      <>
        <path d="M12 20c6-4 13-4 20 0 7-4 14-4 20 0v26c-6-4-13-4-20 0-7-4-14-4-20 0z" fill="currentColor" opacity="0.45" />
        <path d="M32 20v26" stroke="currentColor" strokeWidth="3" />
        <circle cx="32" cy="12" r="4.5" fill="currentColor" />
      </>
    ),
  },
  knm: {
    color: "#2dd4bf",
    shapes: (
      <>
        <path d="M27 54h10l-2-30h-6z" fill="currentColor" opacity="0.5" />
        <path d="M32 24 49 17M32 24 15 17M32 24V7M32 24v17" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="32" cy="24" r="4.5" fill="currentColor" />
      </>
    ),
  },
  bellen: {
    color: "#5b8cff",
    shapes: (
      <>
        <rect x="20" y="8" width="24" height="48" rx="6" fill="currentColor" opacity="0.45" />
        <rect x="27" y="13" width="10" height="2.6" rx="1.3" fill="currentColor" />
        <circle cx="32" cy="49" r="2.6" fill="currentColor" />
        <path d="M47 20a12 12 0 0 1 0 20M51 26a6 6 0 0 1 0 9" stroke="currentColor" strokeWidth="2.6" fill="none" opacity="0.7" />
      </>
    ),
  },
  vrijetijd: {
    color: "#3ddc97",
    shapes: (
      <>
        <circle cx="23" cy="23" r="9" fill="currentColor" />
        <path d="M23 8v4M23 34v4M8 23h4M34 23h4M12 12l3 3M31 31l3 3M34 12l-3 3M15 31l-3 3" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="44" cy="44" r="11" fill="currentColor" opacity="0.5" />
        <circle cx="44" cy="44" r="3.4" fill="currentColor" />
      </>
    ),
  },
  klachten: {
    color: "#ff5d73",
    shapes: (
      <>
        <path d="M32 10 56 51H8z" fill="currentColor" opacity="0.4" />
        <rect x="29.6" y="24" width="4.8" height="15" rx="2.4" fill="currentColor" />
        <circle cx="32" cy="45" r="2.9" fill="currentColor" />
      </>
    ),
  },
};

const FALLBACK: Art = {
  color: "#8b5cf6",
  shapes: (
    <>
      <rect x="12" y="16" width="24" height="24" rx="7" fill="currentColor" opacity="0.4" />
      <rect x="28" y="26" width="24" height="24" rx="7" fill="currentColor" />
    </>
  ),
};

const STORY_ART: Art = {
  color: "#8b5cf6",
  shapes: (
    <>
      <rect x="9" y="14" width="34" height="22" rx="8" fill="currentColor" opacity="0.45" />
      <path d="M18 36v9l9-9z" fill="currentColor" opacity="0.45" />
      <rect x="28" y="32" width="27" height="19" rx="7" fill="currentColor" />
    </>
  ),
};

export function UnitArt({
  unitId,
  size = 48,
  story = false,
}: {
  unitId: string;
  size?: number;
  story?: boolean;
}) {
  const art = story ? STORY_ART : (ART[unitId] ?? FALLBACK);
  return (
    <svg
      className="unit-art"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      style={{ color: art.color }}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="64" height="64" rx="19" fill="currentColor" opacity="0.13" />
      <circle cx="50" cy="14" r="18" fill="currentColor" opacity="0.09" />
      {art.shapes}
    </svg>
  );
}
