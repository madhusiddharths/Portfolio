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

const POS: Record<AgentId, { x: number; y: number }> = {
  planner: { x: 160, y: 20 },
  coder: { x: 78, y: 72 },
  coder2: { x: 242, y: 72 },
  stylist: { x: 160, y: 124 },
  sizer: { x: 84, y: 176 },
  aligner: { x: 236, y: 176 },
  critic: { x: 160, y: 232 },
};
const EDGES: [AgentId, AgentId][] = [
  ["planner", "coder"],
  ["planner", "coder2"],
  ["planner", "stylist"],
  ["coder", "stylist"],
  ["coder2", "stylist"],
  ["stylist", "sizer"],
  ["stylist", "aligner"],
  ["sizer", "aligner"],
  ["stylist", "critic"],
  ["aligner", "critic"],
  ["coder", "critic"],
  ["coder2", "critic"],
];
const SUB = new Set<AgentId>(["sizer", "aligner"]);
const NW = 96;
const NH = 30;
const VB_H = 252;

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
  const hot = new Set(pulses.slice(-3).map((p) => `${p.from}>${p.to}`));

  return (
    <div className="obs-graph">
      <svg viewBox={`0 0 320 ${VB_H}`} className="dag" role="img" aria-label="Agent pipeline graph">
        <defs>
          <pattern id="dag-dots" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.07)" />
          </pattern>
        </defs>
        <rect width="320" height={VB_H} fill="url(#dag-dots)" />
        {/* the Stylist's sub-agent pool */}
        <rect x={26} y={150} width={268} height={52} rx={10} className="dag-pool" />
        <text x={34} y={146} className="dag-pool-t">
          stylist · sub-agents (spawned per call)
        </text>
        {EDGES.map(([a, b]) => {
          const A = POS[a];
          const B = POS[b];
          return (
            <line
              key={`${a}>${b}`}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              className="dag-edge"
              data-hot={hot.has(`${a}>${b}`) ? "true" : undefined}
              style={{ ["--c" as string]: AGENTS.find((x) => x.id === b)!.color }}
            />
          );
        })}
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
              <circle cx={11} cy={NH / 2} r={3.2} className="dag-dot" />
              <text x={20} y={12.5} className="dag-name">
                {a.name}
              </text>
              <text x={20} y={23.5} className="dag-op">
                {st.status === "idle" ? (SUB.has(a.id) ? "on call" : "idle") : a.op}
              </text>
              {st.q > 0 && (
                <g transform={`translate(${NW - 20} 8)`}>
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
