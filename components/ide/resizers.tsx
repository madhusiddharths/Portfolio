"use client";

import { useRef, type PointerEvent as RPointerEvent } from "react";
import { ide, SIZE_DEFAULT, type Panel } from "./store";

/**
 * Drag handles on the inner edges of the three panels — VS Code sashes.
 * Left/right change a width, bottom changes the panel height. Double-click
 * resets a panel; arrow keys nudge it when the handle has focus.
 */
export function Resizers() {
  return (
    <>
      <Sash panel="left" />
      <Sash panel="right" />
      <Sash panel="bottom" />
    </>
  );
}

function Sash({ panel }: { panel: Panel }) {
  const drag = useRef<{ start: number; size: number } | null>(null);
  const vertical = panel !== "bottom";

  function down(e: RPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    drag.current = { start: vertical ? e.clientX : e.clientY, size: ide.size(panel) };
    e.currentTarget.setPointerCapture(e.pointerId);
    document.documentElement.classList.add("ide-resizing", vertical ? "ide-resizing-x" : "ide-resizing-y");
  }
  function move(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const delta = (vertical ? e.clientX : e.clientY) - d.start;
    // left grows rightwards; right and bottom grow away from the edge
    ide.resize(panel, panel === "left" ? d.size + delta : d.size - delta);
  }
  function up() {
    if (!drag.current) return;
    drag.current = null;
    ide.resize(panel, ide.size(panel), true);
    document.documentElement.classList.remove("ide-resizing", "ide-resizing-x", "ide-resizing-y");
  }

  const label = panel === "bottom" ? "Resize the architecture panel" : panel === "left" ? "Resize the explorer" : "Resize the swarm rail";
  return (
    <div
      className={`ide-sash ide-sash-${panel}`}
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-label={label}
      title={`${label} · double-click to reset`}
      tabIndex={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onDoubleClick={() => ide.resize(panel, SIZE_DEFAULT[panel], true)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 40 : 12;
        const grow = panel === "left" ? "ArrowRight" : panel === "right" ? "ArrowLeft" : "ArrowUp";
        const shrink = panel === "left" ? "ArrowLeft" : panel === "right" ? "ArrowRight" : "ArrowDown";
        if (e.key === grow) ide.resize(panel, ide.size(panel) + step, true);
        else if (e.key === shrink) ide.resize(panel, ide.size(panel) - step, true);
        else return;
        e.preventDefault();
      }}
    />
  );
}
