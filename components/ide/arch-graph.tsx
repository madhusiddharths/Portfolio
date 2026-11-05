"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import type { Pipeline, PNode, NodeKind } from "@/lib/pipelines";

/* ---------------------------------------------------------------------------
   Architecture graph — an n8n-style node graph of the whole project.
   Nodes sit on a column/row grid; a node is "revealed" once the reader has
   reached the section that explains it (`shown`), and drawn as a wireframe
   until then. Revealed edges draw themselves in and carry data packets.
   Drag to pan, ⌘/ctrl + wheel to zoom, "fit" to frame everything.
   --------------------------------------------------------------------------- */

export const NW = 188;
export const NH = 54;
const CX = 236;
const RY = 76;
const PAD = 26;

export function nodePos(n: PNode) {
  return { x: PAD + n.col * CX, y: PAD + n.row * RY };
}

function edgePath(a: PNode, b: PNode) {
  const p = nodePos(a);
  const q = nodePos(b);
  if (q.x > p.x + 1) {
    const x1 = p.x + NW;
    const y1 = p.y + NH / 2;
    const x2 = q.x;
    const y2 = q.y + NH / 2;
    const dx = Math.max(36, (x2 - x1) / 2);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  }
  if (Math.abs(q.x - p.x) <= 1) {
    // same column: bottom → top (or top → bottom)
    const down = q.y > p.y;
    const x = p.x + NW / 2;
    const y1 = down ? p.y + NH : p.y;
    const y2 = down ? q.y : q.y + NH;
    const d = (y2 - y1) / 2;
    return `M${x},${y1} C${x},${y1 + d} ${x},${y2 - d} ${x},${y2}`;
  }
  // back edge: leave right, loop under, enter left
  const x1 = p.x + NW;
  const y1 = p.y + NH / 2;
  const x2 = q.x;
  const y2 = q.y + NH / 2;
  const low = Math.max(p.y, q.y) + NH + 34;
  return `M${x1},${y1} C${x1 + 70},${y1} ${x1 + 70},${low} ${(x1 + x2) / 2},${low} S${x2 - 70},${y2} ${x2},${y2}`;
}

export function ArchGraph({
  pipe,
  shown,
  current,
  sectionLabel,
  onOpen,
  focus,
}: {
  pipe: Pipeline;
  /** ids of the nodes the camera should keep in view (the reading frontier) */
  focus: string[];
  shown: (n: PNode) => boolean;
  current: (n: PNode) => boolean;
  sectionLabel: (id: string) => string;
  onOpen: (n: PNode) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [panning, setPanning] = useState(false);
  const [hover, setHover] = useState<PNode | null>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const userMoved = useRef(false);

  const size = useMemo(() => {
    const maxC = Math.max(...pipe.nodes.map((n) => n.col));
    const maxR = Math.max(...pipe.nodes.map((n) => n.row));
    const back = pipe.edges.some((e) => {
      const a = pipe.nodes.find((n) => n.id === e.from)!;
      const b = pipe.nodes.find((n) => n.id === e.to)!;
      return b.col < a.col;
    });
    return { w: PAD * 2 + maxC * CX + NW, h: PAD * 2 + maxR * RY + NH + (back ? 40 : 0) };
  }, [pipe]);

  const focusKey = focus.join(",");

  /* camera: fit the graph's height, and when it is wider than the panel,
     pan so the reading frontier sits in the middle */
  const fit = useCallback(
    (all = false) => {
      const el = box.current;
      if (!el) return;
      const W = el.clientWidth;
      const H = el.clientHeight;
      const kH = Math.min(1, (H - 8) / size.h);
      const kAll = Math.min(1, (W - 8) / size.w, kH);
      const k = all ? kAll : Math.max(kAll, Math.min(kH, 0.92));
      const y = (H - size.h * k) / 2;
      if (size.w * k <= W - 8) {
        setView({ k, x: (W - size.w * k) / 2, y });
        return;
      }
      const ids = new Set(focusKey.split(","));
      const pts = pipe.nodes.filter((n) => ids.has(n.id)).map((n) => nodePos(n).x + NW / 2);
      const cx = pts.length ? (Math.min(...pts) + Math.max(...pts)) / 2 : NW / 2;
      const x = Math.min(4, Math.max(W - size.w * k - 4, W / 2 - cx * k));
      setView({ k, x, y });
    },
    [size, pipe, focusKey],
  );

  useEffect(() => {
    if (!userMoved.current) fit();
  }, [fit]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!userMoved.current) fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  // wheel: pan, or zoom around the pointer with ⌘/ctrl
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let wheelEnd: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      userMoved.current = true;
      setPanning(true);
      clearTimeout(wheelEnd);
      wheelEnd = setTimeout(() => setPanning(false), 160);
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        setView((v) => {
          const k = Math.min(2, Math.max(0.35, v.k * Math.exp(-e.deltaY * 0.004)));
          return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
        });
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX - (e.shiftKey ? e.deltaY : 0), y: v.y - (e.shiftKey ? 0 : e.deltaY) }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function down(e: RPointerEvent) {
    if ((e.target as HTMLElement).closest(".ag-node")) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
    setPanning(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: RPointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = userMoved.current = true;
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  }
  function up() {
    drag.current = null;
    setPanning(false);
  }

  const byId = useMemo(() => new Map(pipe.nodes.map((n) => [n.id, n])), [pipe]);
  const total = pipe.nodes.length;
  const open = pipe.nodes.filter(shown).length;

  return (
    <div className="ag-graph">
      <div
        ref={box}
        className="ag-graph-view"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        data-lenis-prevent
      >
        <div className="ag-graph-canvas" data-panning={panning ? "true" : undefined} style={{ width: size.w, height: size.h, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          <svg className="ag-edges" width={size.w} height={size.h} aria-hidden="true">
            {pipe.edges.map((e) => {
              const a = byId.get(e.from)!;
              const b = byId.get(e.to)!;
              const d = edgePath(a, b);
              const on = shown(a) && shown(b);
              const hot = on && (current(a) || current(b));
              const hov = hover && (hover.id === a.id || hover.id === b.id);
              return (
                <g key={`${e.from}-${e.to}`} className="ag-edge" data-on={on ? "true" : undefined} data-hot={hot || hov ? "true" : undefined}>
                  <path d={d} className="ag-edge-ghost" />
                  <path d={d} className="ag-edge-line" pathLength={1} />
                  {on && (
                    <circle r={hot ? 3 : 2.2} className="ag-packet">
                      <animateMotion dur={hot ? "1.6s" : "3.2s"} repeatCount="indefinite" path={d} />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
          {pipe.nodes.map((n, i) => {
            const p = nodePos(n);
            const on = shown(n);
            return (
              <button
                key={n.id}
                type="button"
                className="ag-node"
                data-on={on ? "true" : undefined}
                data-current={on && current(n) ? "true" : undefined}
                data-kind={n.kind}
                style={{ left: p.x, top: p.y, width: NW, height: NH, ["--i" as string]: i }}
                onClick={() => onOpen(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover((h) => (h?.id === n.id ? null : h))}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(null)}
                aria-label={on ? `${n.label} — ${n.tech ?? n.kind}. Jump to ${sectionLabel(n.at)}` : `Not reached yet — jump to ${sectionLabel(n.at)}`}
              >
                <span className="ag-port ag-port-in" aria-hidden="true" />
                <span className="ag-node-icon" aria-hidden="true">
                  <KindIcon kind={n.kind} />
                </span>
                <span className="ag-node-text">
                  <span className="ag-node-label">{on ? n.label : ""}</span>
                  <span className="ag-node-tech">{on ? n.tech ?? n.kind : ""}</span>
                </span>
                <span className="ag-port ag-port-out" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="ag-graph-foot">
        <span className="ag-graph-hover">
          {hover ? (
            shown(hover) ? (
              <>
                <b>{hover.label}</b> <span>{hover.kind}</span> <span>· {hover.tech}</span> <span>· § {sectionLabel(hover.at)}</span>
              </>
            ) : (
              <>
                <b>locked</b> <span>· explained in § {sectionLabel(hover.at)} — click to jump</span>
              </>
            )
          ) : (
            <span>
              {open}/{total} components · drag to pan · ⌘ + scroll to zoom
            </span>
          )}
        </span>
        <span className="ag-graph-tools">
          <button type="button" onClick={() => setView((v) => ({ ...v, k: Math.max(0.35, v.k / 1.2) }))} aria-label="Zoom out">
            −
          </button>
          <button type="button" onClick={() => setView((v) => ({ ...v, k: Math.min(2, v.k * 1.2) }))} aria-label="Zoom in">
            +
          </button>
          <button
            type="button"
            title="Follow the section you are reading"
            onClick={() => {
              userMoved.current = false;
              fit();
            }}
          >
            follow
          </button>
          <button
            type="button"
            title="Frame the whole graph"
            onClick={() => {
              userMoved.current = true;
              fit(true);
            }}
          >
            fit all
          </button>
        </span>
      </div>
    </div>
  );
}

/* one small glyph per node kind */
export function KindIcon({ kind }: { kind: NodeKind }) {
  const common = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "source":
      return (
        <svg {...common}>
          <ellipse cx="8" cy="3.8" rx="5" ry="1.8" />
          <path d="M3 3.8v8.4c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V3.8M3 8c0 1 2.2 1.8 5 1.8S13 9 13 8" />
        </svg>
      );
    case "ingest":
      return (
        <svg {...common}>
          <path d="M2 8h8M7 4.5L10.5 8 7 11.5M13 2.5v11" />
        </svg>
      );
    case "stream":
      return (
        <svg {...common}>
          <path d="M1.5 5c2 0 2-2 4-2s2 2 4 2 2-2 4-2M1.5 9c2 0 2-2 4-2s2 2 4 2 2-2 4-2M1.5 13c2 0 2-2 4-2s2 2 4 2 2-2 4-2" />
        </svg>
      );
    case "store":
      return (
        <svg {...common}>
          <rect x="2.5" y="2.5" width="11" height="4" rx="1" />
          <rect x="2.5" y="9.5" width="11" height="4" rx="1" />
          <path d="M5 4.5h.01M5 11.5h.01" />
        </svg>
      );
    case "transform":
      return (
        <svg {...common}>
          <path d="M2.5 4.5h8l-2-2M13.5 11.5h-8l2 2" />
        </svg>
      );
    case "model":
      return (
        <svg {...common}>
          <circle cx="3.5" cy="4" r="1.5" />
          <circle cx="3.5" cy="12" r="1.5" />
          <circle cx="12.5" cy="8" r="1.5" />
          <path d="M5 4.5l6 3M5 11.5l6-3M3.5 5.5v5" />
        </svg>
      );
    case "agent":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="10" height="8" rx="2" />
          <path d="M8 2.5V5M6 9h.01M10 9h.01M1.5 9v2M14.5 9v2" />
        </svg>
      );
    case "eval":
      return (
        <svg {...common}>
          <path d="M2 13.5h12M4 11V8M8 11V4M12 11V6.5" />
        </svg>
      );
    case "serve":
      return (
        <svg {...common}>
          <rect x="2" y="3" width="12" height="4" rx="1" />
          <rect x="2" y="9" width="12" height="4" rx="1" />
          <path d="M11 5h.01M11 11h.01" />
        </svg>
      );
    case "ui":
      return (
        <svg {...common}>
          <rect x="1.8" y="2.5" width="12.4" height="9" rx="1" />
          <path d="M5.5 14h5M8 11.5V14" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.2" />
          <path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6L5 5M11 11l1.4 1.4M3.6 12.4L5 11M11 5l1.4-1.4" />
        </svg>
      );
  }
}
