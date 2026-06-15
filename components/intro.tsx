import { PROFILE } from "@/lib/projects";

/**
 * Landing intro — "instrument calibration".
 *
 * A brief (~1.5s), once-per-session boot emblem: the monogram settles, a trend
 * line plots itself onto the graph-paper field, a data point lands with a ring
 * pulse, then the panel lifts to reveal the page. Pure CSS — the animation is
 * driven entirely by keyframes and gated pre-paint by the theme script, which
 * adds `intro-on` to <html> only on the home route, when motion is allowed and
 * it hasn't played this session. Hidden by default, so no-JS and reduced-motion
 * visitors never see it; the page underneath is always present.
 */
export function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-emblem">
        <span className="intro-mark">{PROFILE.monogram}</span>
        <svg className="intro-plot" viewBox="0 0 220 60" fill="none">
          <line className="intro-axis" x1="0" y1="52" x2="220" y2="52" />
          <path className="intro-trace" d="M0 46 L36 32 L72 40 L108 22 L150 30 L186 12 L214 20" />
          <circle className="intro-ring" cx="214" cy="20" r="4" />
          <circle className="intro-dot" cx="214" cy="20" r="4" />
        </svg>
        <span className="intro-caption u-mono">{PROFILE.name}</span>
      </div>
    </div>
  );
}
