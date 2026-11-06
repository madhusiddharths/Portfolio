"use client";

import { ide, useIde, type Panel } from "./store";

/**
 * VS Code-style status bar — where you are in the report, how much of the
 * architecture you've revealed, and toggles for the three panels.
 */
export function StatusBar({ index, slug, labels, nodeAt }: { index: string; slug: string; labels: Record<string, string>; nodeAt: string[] }) {
  const panels = useIde((s) => s.panels);
  const active = useIde((s) => s.active);
  const order = useIde((s) => s.order);
  const revealAll = useIde((s) => s.revealAll);
  const at = Math.max(order.indexOf(active), 0);
  const revealed = revealAll ? nodeAt.length : nodeAt.filter((id) => order.indexOf(id) <= at).length;

  const btn = (p: Panel, title: string, keys: string, icon: React.ReactNode) => (
    <button type="button" className="ide-sb-btn" aria-pressed={panels[p]} onClick={() => ide.toggle(p)} title={`${title} (${keys})`} aria-label={`Toggle ${title}`}>
      {icon}
    </button>
  );

  return (
    <footer className="ide-status" aria-label="Status bar">
      <span className="ide-sb-item ide-sb-brand">
        <i aria-hidden="true" /> P.{index}
      </span>
      <span className="ide-sb-item">{slug}</span>
      <span className="ide-sb-item ide-sb-sec">
        § {String(at + 1).padStart(2, "0")} {labels[active] ?? ""}
      </span>
      <span className="ide-sb-spacer" />
      <span className="ide-sb-item">
        arch {revealed}/{nodeAt.length}
      </span>
      <span className="ide-sb-item">utf-8 · md</span>
      <span className="ide-sb-toggles">
        {btn("left", "explorer", "⌘B", <LayoutIcon side="left" />)}
        {btn("bottom", "architecture panel", "⌘J", <LayoutIcon side="bottom" />)}
        {btn("right", "swarm rail", "⌘⌥B", <LayoutIcon side="right" />)}
      </span>
    </footer>
  );
}

function LayoutIcon({ side }: { side: "left" | "right" | "bottom" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.2" />
      {side === "left" && <rect x="1.5" y="2.5" width="4.5" height="11" fill="currentColor" stroke="none" opacity="0.85" />}
      {side === "right" && <rect x="10" y="2.5" width="4.5" height="11" fill="currentColor" stroke="none" opacity="0.85" />}
      {side === "bottom" && <rect x="1.5" y="9.5" width="13" height="4" fill="currentColor" stroke="none" opacity="0.85" />}
    </svg>
  );
}
