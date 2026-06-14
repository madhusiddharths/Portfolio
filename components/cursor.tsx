"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Instrument cursor: a trailing ring + monospace coordinate readout that
 * snaps to a label when hovering interactive elements (data-cursor attr).
 * Keeps the native cursor for precision. Fine-pointer + motion-safe only.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);

    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;
    let tx = rx;
    let ty = ry;
    let raf = 0;
    let active = false;

    function onMove(e: MouseEvent) {
      tx = e.clientX;
      ty = e.clientY;
      const el = (e.target as HTMLElement)?.closest<HTMLElement>(
        "a,button,[data-cursor],input,textarea",
      );
      const label = labelRef.current;
      const ring = ringRef.current;
      if (!label || !ring) return;
      if (el) {
        active = true;
        ring.dataset.active = "true";
        label.textContent =
          el.getAttribute("data-cursor") ||
          (el.tagName === "A" ? "open" : "select");
      } else {
        active = false;
        ring.dataset.active = "false";
        label.textContent = `${String(Math.round(e.clientX)).padStart(4, "0")} · ${String(
          Math.round(e.clientY),
        ).padStart(4, "0")}`;
      }
    }

    function tick() {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      const ring = ringRef.current;
      const label = labelRef.current;
      if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      if (label) label.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    tick();
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className="cursor-ring" data-active="false" aria-hidden="true" />
      <div ref={labelRef} className="cursor-label u-mono" aria-hidden="true" />
    </>
  );
}
