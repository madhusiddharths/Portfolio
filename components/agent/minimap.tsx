"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { useLenis } from "lenis/react";
import { useSwarm, useSwarmState } from "./swarm";
import { AGENTS } from "./engine";

/* ---------------------------------------------------------------------------
   Minimap — the page in miniature, IDE style. Every build node is a block
   that fills in as the swarm builds it; agents' cursors move across it as
   coloured dots; the frame is your viewport. Click or drag to scroll.
   --------------------------------------------------------------------------- */

type MNode = { x: number; y: number; w: number; h: number; state: string; agent: string; flag: boolean };
type MSec = { id: string; label: string; y: number; h: number };
type Geo = { mx: number; my: number; sx: number; sy: number; w: number; h: number; docTop: number; nodes: MNode[]; secs: MSec[] };

const MAP_H = 210;

export function MiniMap({ onJump }: { onJump?: () => void }) {
  const engine = useSwarm();
  const lenis = useLenis();
  const sections = useSwarmState((s) => s.sections);
  const enabled = useSwarmState((s) => s.enabled);
  const ref = useRef<HTMLDivElement>(null);
  const geoRef = useRef<Geo | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [vp, setVp] = useState({ y: 0, h: 0 });
  const dragging = useRef(false);

  const measure = useCallback(() => {
    const box = ref.current;
    const main = document.getElementById("main");
    const root = main?.closest<HTMLElement>(".ag");
    if (!box || !main || !root) return;
    const rr = root.getBoundingClientRect();
    const mr = main.getBoundingClientRect();
    const w = box.clientWidth;
    const sx = w / mr.width;
    const sy = MAP_H / Math.max(main.scrollHeight, 1);
    const nodes: MNode[] = Array.from(main.querySelectorAll<HTMLElement>("[data-build]")).map((n) => {
      const r = n.getBoundingClientRect();
      return {
        x: (r.left - mr.left) * sx,
        y: (r.top - mr.top) * sy,
        w: Math.max(2, r.width * sx),
        h: Math.max(1.5, r.height * sy),
        state: n.dataset.state ?? "pending",
        agent: getComputedStyle(n).getPropertyValue("--agent") || "",
        flag: !!n.dataset.review,
      };
    });
    const secs: MSec[] = Array.from(main.querySelectorAll<HTMLElement>(".ag-section")).map((s) => {
      const r = s.getBoundingClientRect();
      return {
        id: s.id,
        label: s.id === "home" ? "hero" : s.id,
        y: (r.top - mr.top) * sy,
        h: r.height * sy,
      };
    });
    const g: Geo = { mx: mr.left - rr.left, my: mr.top - rr.top, sx, sy, w, h: MAP_H, docTop: mr.top + window.scrollY, nodes, secs };
    geoRef.current = g;
    setGeo(g);
  }, []);

  const measureVp = useCallback(() => {
    const g = geoRef.current;
    if (!g) return;
    setVp({ y: Math.max(0, (window.scrollY - g.docTop + 52) * g.sy), h: window.innerHeight * g.sy });
  }, []);

  // re-measure on every swarm change (throttled), on resize and while building
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = () => {
      raf = 0;
      last = performance.now();
      measure();
      measureVp();
    };
    const schedule = () => {
      if (raf) return;
      const wait = Math.max(0, 140 - (performance.now() - last));
      raf = window.setTimeout(() => requestAnimationFrame(tick), wait) as unknown as number;
    };
    const unsub = engine.subscribe(schedule);
    window.addEventListener("resize", schedule);
    schedule();
    const slow = window.setInterval(schedule, 1200);
    return () => {
      unsub();
      window.removeEventListener("resize", schedule);
      window.clearInterval(slow);
    };
  }, [engine, measure, measureVp]);

  useEffect(() => {
    const onScroll = () => requestAnimationFrame(measureVp);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [measureVp]);

  function scrollToMap(clientY: number, immediate: boolean) {
    const g = geoRef.current;
    const box = ref.current;
    if (!g || !box) return;
    const y = clientY - box.getBoundingClientRect().top;
    const target = Math.max(0, g.docTop + y / g.sy - window.innerHeight / 2);
    if (lenis) lenis.scrollTo(target, immediate ? { immediate: true } : { duration: 0.9 });
    else window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
  }

  function down(e: RPointerEvent<HTMLDivElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    scrollToMap(e.clientY, false);
  }
  function move(e: RPointerEvent<HTMLDivElement>) {
    if (dragging.current && e.buttons) scrollToMap(e.clientY, true);
  }
  function up() {
    if (dragging.current) onJump?.();
    dragging.current = false;
  }

  return (
    <div className="mm" data-lenis-prevent>
      <div
        ref={ref}
        className="mm-map"
        style={{ height: MAP_H }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="slider"
        aria-label="Page minimap — click or drag to scroll"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={geo ? Math.round((vp.y / Math.max(1, geo.h - vp.h)) * 100) : 0}
        tabIndex={0}
      >
        {geo?.secs.map((s) => (
          <div key={s.id} className="mm-sec" data-phase={enabled ? (sections[s.id] ?? "idle") : "done"} style={{ top: s.y, height: s.h }} />
        ))}
        {geo?.nodes.map((n, i) => (
          <i
            key={i}
            className="mm-node"
            data-state={enabled ? n.state : "done"}
            data-flag={n.flag ? "true" : undefined}
            style={{ left: n.x, top: n.y, width: n.w, height: n.h, ["--a" as string]: n.agent || undefined }}
          />
        ))}
        <div className="mm-vp" style={{ top: vp.y, height: vp.h }} />
        {engine.roster.map((a) => (
          <MiniCursor key={a.id} id={a.id} color={a.color} geo={geoRef} />
        ))}
      </div>
      <ol className="mm-labels">
        {geo?.secs.map((s) => {
          const phase = enabled ? (sections[s.id] ?? "idle") : "done";
          return (
            <li key={s.id} style={{ top: s.y }}>
              <button
                type="button"
                data-phase={phase}
                onClick={() => {
                  engine.scrollTo(`#${s.id}`);
                  onJump?.();
                }}
              >
                <span className="mm-l">{s.label}</span>
                <span className="mm-p">{phase === "done" ? "✓" : phase === "review" ? "review" : phase === "building" ? "build" : "·"}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MiniCursor({ id, color, geo }: { id: (typeof AGENTS)[number]["id"]; color: string; geo: React.RefObject<Geo | null> }) {
  const engine = useSwarm();
  const c = engine.cursors[id];
  const x = useTransform(c.x, (v) => (geo.current ? (v - geo.current.mx) * geo.current.sx : -10));
  const y = useTransform(c.y, (v) => (geo.current ? (v - geo.current.my) * geo.current.sy : -10));
  return <motion.span className="mm-cur" style={{ x, y, opacity: c.o as MotionValue<number>, background: color, color }} />;
}
