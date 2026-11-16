/* Hand-drawn doodles for /work/claude-code. Plain SVG, strokes in currentColor,
   red accents via .cc-red; the shared #cc-wobble filter gives the sketch edge. */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  filter: "url(#cc-wobble)",
} as const;

/** Defines the wobble filter once per page. */
export function WobbleDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="cc-wobble">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="2.2" />
      </filter>
    </svg>
  );
}

/** The mascot: a small original agent bot. */
export function Mascot({ wave = false }: { wave?: boolean }) {
  return (
    <svg viewBox="0 0 160 170" {...S} className="cc-mascot" aria-hidden="true">
      <path d="M80 30 V14" />
      <circle cx="80" cy="10" r="5" className="cc-red cc-fill" />
      <rect x="38" y="30" width="84" height="66" rx="18" />
      <g className="cc-eyes">
        <rect x="58" y="52" width="9" height="14" rx="4" className="cc-fill" />
        <rect x="93" y="52" width="9" height="14" rx="4" className="cc-fill" />
      </g>
      <path d="M66 78 Q80 88 94 78" />
      <path d="M30 60 h8 M122 60 h8" />
      <rect x="52" y="102" width="56" height="44" rx="10" />
      <path d="M70 118 h20 M70 128 h12" className="cc-red" />
      <path d="M52 112 Q36 118 34 134" />
      <g className={wave ? "cc-wave" : undefined}>
        <path d="M108 112 Q126 100 132 82" />
        <path d="M128 76 l4 6 l6 -3" />
      </g>
      <path d="M64 146 v14 M96 146 v14 M56 160 h16 M88 160 h16" />
    </svg>
  );
}

export function Notebook() {
  return (
    <svg viewBox="0 0 150 130" {...S} aria-hidden="true">
      <rect x="22" y="12" width="104" height="108" rx="6" />
      <path d="M22 30 h-8 M22 52 h-8 M22 74 h-8 M22 96 h-8" />
      <path d="M42 36 h62 M42 52 h70 M42 68 h50 M42 84 h66 M42 100 h40" />
      <path d="M104 12 v34 l8 -7 l8 7 v-34" className="cc-red" />
    </svg>
  );
}

export function Memory() {
  return (
    <svg viewBox="0 0 160 130" {...S} aria-hidden="true">
      <rect x="18" y="20" width="96" height="92" rx="6" />
      <path d="M18 42 h96" />
      <path d="M40 12 v16 M92 12 v16" />
      <path d="M36 62 h16 M60 62 h16 M84 62 h16 M36 82 h16 M60 82 h16" />
      <circle cx="92" cy="84" r="9" className="cc-red" />
      <path d="M124 52 q18 -4 22 12 q-14 2 -22 -12 z" />
      <path d="M128 70 l14 32" />
      <path d="M134 104 l14 -4" className="cc-red" />
    </svg>
  );
}

export function LaptopPhone() {
  return (
    <svg viewBox="0 0 260 120" {...S} aria-hidden="true">
      <rect x="14" y="30" width="78" height="52" rx="5" />
      <path d="M4 92 h98 l-8 -10 h-82 z" />
      <path d="M30 48 h30 M30 60 h44" />
      <path d="M118 46 q-2 -16 16 -16 q8 -12 22 -2 q16 -2 16 14 q10 4 4 14 h-54 q-8 -2 -4 -10" />
      <rect x="208" y="24" width="38" height="70" rx="8" />
      <path d="M222 84 h10" />
      <path d="M92 60 C 120 80, 160 82, 206 58" className="cc-red cc-flow" />
    </svg>
  );
}

export function Resume() {
  return (
    <svg viewBox="0 0 150 150" {...S} aria-hidden="true">
      <rect x="24" y="10" width="86" height="118" rx="4" />
      <path d="M38 28 h40 M38 42 h58 M38 54 h50 M38 70 h58 M38 82 h44 M38 98 h58 M38 110 h36" />
      <rect x="118" y="10" width="16" height="118" rx="3" />
      <path d="M118 22 h7 M118 34 h5 M118 46 h7 M118 58 h5 M118 70 h7 M118 82 h5 M118 94 h7 M118 106 h5 M118 118 h7" />
      <circle cx="96" cy="120" r="20" className="cc-red" />
      <text x="96" y="125" textAnchor="middle" className="cc-stamp" filter="none" stroke="none">1/1</text>
    </svg>
  );
}

export function Ferry() {
  return (
    <svg viewBox="0 0 260 120" {...S} aria-hidden="true">
      <rect x="10" y="40" width="44" height="30" rx="3" />
      <path d="M4 76 h56" />
      <rect x="214" y="30" width="26" height="46" rx="6" />
      <path d="M96 70 h70 l-10 18 h-50 z" />
      <path d="M118 70 v-30 l26 22" className="cc-red" />
      <path d="M70 100 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0" />
      <path d="M58 58 C 90 40, 170 40, 210 52" className="cc-flow" />
    </svg>
  );
}

export function Critic() {
  return (
    <svg viewBox="0 0 140 140" {...S} aria-hidden="true">
      <circle cx="58" cy="58" r="38" />
      <path d="M86 86 l34 34" strokeWidth={6} />
      <path d="M40 58 l12 12 l24 -26" className="cc-red" />
    </svg>
  );
}

export function Plug() {
  return (
    <svg viewBox="0 0 120 120" {...S} aria-hidden="true">
      <rect x="34" y="40" width="40" height="34" rx="8" />
      <path d="M44 40 v-16 M64 40 v-16" className="cc-red" />
      <path d="M54 74 v10 q0 20 -20 24 q-18 4 -24 -8" />
    </svg>
  );
}

export function Sparkle() {
  return (
    <svg viewBox="0 0 40 40" {...S} aria-hidden="true">
      <path d="M20 4 Q22 18 36 20 Q22 22 20 36 Q18 22 4 20 Q18 18 20 4 z" />
    </svg>
  );
}

/** Planner → Builder → Critic, the crew from the site's build. */
export function Crew() {
  return (
    <svg viewBox="0 0 120 240" {...S} aria-hidden="true">
      {[
        ["P", 20],
        ["B", 100],
        ["C", 180],
      ].map(([l, y]) => (
        <g key={l as string}>
          <rect x="30" y={y as number} width="60" height="40" rx="8" />
          <text x="60" y={(y as number) + 26} textAnchor="middle" className="cc-node-t" filter="none" stroke="none">
            {l}
          </text>
        </g>
      ))}
      <path d="M60 60 v40 M60 140 v40" className="cc-flow" />
      <path d="M90 200 q24 -60 0 -120" className="cc-red cc-flow" />
    </svg>
  );
}
