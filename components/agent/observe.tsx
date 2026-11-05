"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useTransform } from "motion/react";
import { useSwarm, useSwarmState } from "./swarm";
import { AGENTS, type AgentId, type Speaker } from "./engine";

/* ---------------------------------------------------------------------------
   Observability window — what the swarm is doing, two ways:
     graph · a LangGraph-style DAG of the pipeline (hand-offs pulse along the
             edges) plus a live table of every cursor: op, target, x/y, queue
     logs  · a git-log style event stream
   --------------------------------------------------------------------------- */

/* Lanes of the pipeline, top → bottom. Agents in a lane share one queue. */
type Lane = "plan" | "code" | "style" | "subs" | "review";
const LANES: { key: Lane; label: string; y: number }[] = [
  { key: "plan", label: "planners · frame blocks", y: 30 },
  { key: "code", label: "coders · write markup", y: 92 },
  { key: "style", label: "stylists · style + place media", y: 154 },
  { key: "subs", label: "stylist sub-agents · spawned per call", y: 214 },
  { key: "review", label: "critics · review finished segments", y: 276 },
];
const LANE_OF: Record<string, Lane> = { create: "plan", write: "code", style: "style", resize: "subs", place: "subs", review: "review" };
const LANE_Y = Object.fromEntries(LANES.map((l) => [l.key, l.y])) as Record<Lane, number>;
const NW = 88;
const NH = 28;
const VB_H = 300;
const POS = (() => {
  const pos = {} as Record<AgentId, { x: number; y: number }>;
  LANES.forEach((l) => {
    const inLane = AGENTS.filter((a) => LANE_OF[a.op] === l.key);
    inLane.forEach((a, i) => (pos[a.id] = { x: 160 + (i - (inLane.length - 1) / 2) * 100, y: l.y }));
  });
  return pos;
})();
/* lane → lane hand-offs: the main spine down the middle, bypasses on the sides */
const LANE_EDGES: { from: Lane; to: Lane; d: string }[] = [
  { from: "plan", to: "code", d: `M160 ${LANE_Y.plan + 18} V${LANE_Y.code - 18}` },
  { from: "code", to: "style", d: `M160 ${LANE_Y.code + 18} V${LANE_Y.style - 18}` },
  { from: "style", to: "subs", d: `M160 ${LANE_Y.style + 18} V${LANE_Y.subs - 18}` },
  { from: "subs", to: "review", d: `M160 ${LANE_Y.subs + 18} V${LANE_Y.review - 18}` },
  { from: "plan", to: "style", d: `M10 ${LANE_Y.plan} V${LANE_Y.style}` },
  { from: "code", to: "review", d: `M310 ${LANE_Y.code} V${LANE_Y.review}` },
  { from: "style", to: "review", d: `M302 ${LANE_Y.style + 6} V${LANE_Y.review - 6}` },
];
const SUB = new Set<AgentId>(AGENTS.filter((a) => "parent" in a).map((a) => a.id));
const laneOf = (id: AgentId) => LANE_OF[AGENTS.find((a) => a.id === id)!.op];

export const WHO: Record<Speaker, { label: string; color: string }> = {
  ...Object.fromEntries(AGENTS.map((a) => [a.id, { label: a.name, color: a.color }])),
  user: { label: "you", color: "#f2f0ea" },
  router: { label: "router", color: "#ff4b3e" },
  system: { label: "system", color: "#6f6e78" },
} as Record<Speaker, { label: string; color: string }>;

export function ObsWindow() {
  const [tab, setTab] = useState<"graph" | "logs">("graph");
  const done = useSwarmState((s) => s.done);
  const total = useSwarmState((s) => s.total);
  const enabled = useSwarmState((s) => s.enabled);
  const logCount = useSwarmState((s) => s.log.length);
  const pct = total ? (enabled ? done / total : 1) : 0;

  return (
    <section className="win win-obs" aria-label="Swarm observability">
      <div className="win-head" role="tablist">
        {(["graph", "logs"] as const).map((t) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} className="win-tab" onClick={() => setTab(t)}>
            {t === "graph" ? <GraphIcon /> : <LogIcon />}
            {t}
            {t === "logs" && <span className="win-count">{logCount}</span>}
            {tab === t && <motion.span layoutId="obs-tab" className="win-tab-bg" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
          </button>
        ))}
        <span className="win-meta">
          <span className="live-dot" /> {enabled ? done : total}/{total}
        </span>
        <span className="win-progress" style={{ transform: `scaleX(${pct})` }} />
      </div>
      <div className="win-body" data-lenis-prevent>
        {tab === "graph" ? <GraphTab /> : <LogsTab />}
      </div>
    </section>
  );
}

function GraphTab() {
  const agents = useSwarmState((s) => s.agents);
  const pulses = useSwarmState((s) => s.pulses);
  const hot = new Set(pulses.slice(-4).map((p) => `${laneOf(p.from)}>${laneOf(p.to)}`));
  const laneBusy = (l: Lane) => AGENTS.some((a) => LANE_OF[a.op] === l && agents[a.id].status !== "idle");

  return (
    <div className="obs-graph">
      <svg viewBox={`0 0 320 ${VB_H}`} className="dag" role="img" aria-label="Agent pipeline graph">
        <defs>
          <pattern id="dag-dots" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.07)" />
          </pattern>
          <marker id="dag-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0L6 3L0 6z" fill="rgba(255,255,255,0.3)" />
          </marker>
        </defs>
        <rect width="320" height={VB_H} fill="url(#dag-dots)" />
        {LANES.map((l) => (
          <g key={l.key} className="dag-lane" data-lane={l.key} data-busy={laneBusy(l.key) ? "true" : undefined}>
            <rect x={20} y={l.y - 19} width={280} height={38} rx={9} />
            <text x={26} y={l.y - 22}>
              {l.label}
            </text>
          </g>
        ))}
        {LANE_EDGES.map((e) => (
          <path
            key={`${e.from}>${e.to}`}
            d={e.d}
            className="dag-edge"
            markerEnd="url(#dag-arrow)"
            data-hot={hot.has(`${e.from}>${e.to}`) ? "true" : undefined}
          />
        ))}
        {pulses.map((p) => {
          const A = POS[p.from];
          const B = POS[p.to];
          if (!A || !B) return null;
          return (
            <motion.circle
              key={p.id}
              r={3}
              fill={AGENTS.find((x) => x.id === p.to)!.color}
              initial={{ cx: A.x, cy: A.y, opacity: 1 }}
              animate={{ cx: B.x, cy: B.y, opacity: [1, 1, 0] }}
              transition={{ duration: 0.7, ease: [0.5, 0, 0.2, 1] }}
            />
          );
        })}
        {AGENTS.map((a) => {
          const st = agents[a.id];
          const p = POS[a.id];
          return (
            <g
              key={a.id}
              className="dag-node"
              data-status={st.status}
              data-sub={SUB.has(a.id) ? "true" : undefined}
              style={{ ["--c" as string]: a.color }}
              transform={`translate(${p.x - NW / 2} ${p.y - NH / 2})`}
            >
              <rect width={NW} height={NH} rx={7} className="dag-box" />
              <circle cx={10} cy={NH / 2} r={3} className="dag-dot" />
              <text x={18} y={11.5} className="dag-name">
                {a.name}
              </text>
              <text x={18} y={22} className="dag-op">
                {st.status === "idle" ? (SUB.has(a.id) ? "on call" : "idle") : st.op === "review" ? st.target.slice(0, 13) : a.op}
              </text>
              {st.q > 0 && (
                <g transform={`translate(${NW - 19} 7)`}>
                  <rect width={15} height={14} rx={4} className="dag-q" />
                  <text x={7.5} y={10.5} className="dag-q-t" textAnchor="middle">
                    {st.q > 9 ? "9+" : st.q}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="obs-table" role="table" aria-label="Agent cursors">
        <div className="obs-row obs-row-h" role="row">
          <span role="columnheader">agent</span>
          <span role="columnheader">op → target</span>
          <span role="columnheader">cursor</span>
          <span role="columnheader">q / ✓</span>
        </div>
        {AGENTS.map((a) => (
          <AgentRow key={a.id} id={a.id} />
        ))}
      </div>
    </div>
  );
}

function AgentRow({ id }: { id: AgentId }) {
  const engine = useSwarm();
  const st = useSwarmState((s) => s.agents[id]);
  const a = AGENTS.find((x) => x.id === id)!;
  const c = engine.cursors[id];
  const x = useTransform(c.x, (v) => Math.round(v));
  const y = useTransform(c.y, (v) => Math.round(v));
  return (
    <div className="obs-row" role="row" data-status={st.status} style={{ ["--c" as string]: a.color }}>
      <span className="obs-agent" role="cell" data-sub={"parent" in a ? "true" : undefined}>
        <i /> {"parent" in a ? `↳ ${a.name}` : a.name}
      </span>
      <span className="obs-task" role="cell">
        {st.status === "idle" ? (
          <em>idle</em>
        ) : (
          <>
            <b>{st.op}</b> {st.target}
          </>
        )}
      </span>
      <span className="obs-xy" role="cell">
        <motion.span>{x}</motion.span>,<motion.span>{y}</motion.span>
      </span>
      <span className="obs-qn" role="cell">
        {st.q}/{st.n}
      </span>
    </div>
  );
}

function LogsTab() {
  const log = useSwarmState((s) => s.log);
  const ref = useRef<HTMLOListElement>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <ol
      className="obs-log"
      ref={ref}
      aria-live="off"
      onScroll={(e) => {
        const el = e.currentTarget;
        pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      }}
    >
      <AnimatePresence initial={false}>
        {log.map((l) => (
          <motion.li
            key={l.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            data-tone={l.tone}
            title={l.t}
          >
            <span className="log-hash">{l.hash}</span>
            <span className="log-who" style={{ color: WHO[l.who].color }}>
              {WHO[l.who].label}
            </span>
            <span className="log-text">{l.text}</span>
          </motion.li>
        ))}
      </AnimatePresence>
      <li className="log-cursor" aria-hidden="true">
        <span className="log-hash">HEAD</span>
        <span className="log-caret" />
      </li>
    </ol>
  );
}

function GraphIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="3" r="2" />
      <circle cx="3" cy="13" r="2" />
      <circle cx="13" cy="13" r="2" />
      <path d="M7 4.8 4 11.2M9 4.8l3 6.4" />
    </svg>
  );
}
function LogIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 4h12M2 8h8M2 12h10" />
    </svg>
  );
}
