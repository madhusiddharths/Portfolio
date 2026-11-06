"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useTransform } from "motion/react";
import { useSwarm, useSwarmState } from "./swarm";
import { AGENTS, type AgentId, type RosterAgent, type Speaker } from "./engine";

/* ---------------------------------------------------------------------------
   Observability window — what the swarm is doing, two ways:
     graph · a LangGraph-style DAG of the pipeline (hand-offs pulse along the
             edges) plus a live table of every cursor: op, target, x/y, queue
     logs  · a git-log style event stream
   --------------------------------------------------------------------------- */

/* Lanes of the pipeline, top → bottom. Agents in a lane share one queue.
   The layout is computed from the roster on shift: empty lanes drop out and
   a lane with more than three agents wraps onto extra rows. */
type Lane = "plan" | "code" | "style" | "subs" | "review";
const LANE_DEFS: { key: Lane; label: string; report?: string; page?: string }[] = [
  { key: "plan", label: "planners · frame blocks", report: "planner · frames figures + code" },
  { key: "code", label: "coders · write markup", report: "coders · write the report in parallel" },
  { key: "style", label: "stylists · style + place media", report: "stylist · places media", page: "stylists · style each row" },
  { key: "subs", label: "stylist sub-agents · spawned per call", page: "sizer + aligner · only rows that need it" },
  { key: "review", label: "critics · review finished segments", report: "critic · reviews each section" },
];
const LANE_OF: Record<string, Lane> = { create: "plan", write: "code", style: "style", resize: "subs", place: "subs", review: "review" };
const NW = 88;
const NH = 28;
const PER_ROW = 3;
const ROW_H = 34;

type LaneBox = { key: Lane; label: string; y: number; h: number };
type Layout = { lanes: LaneBox[]; pos: Record<string, { x: number; y: number }>; edges: { from: Lane; to: Lane; d: string }[]; h: number };

function layoutFor(roster: RosterAgent[], mode: string): Layout {
  const lanes: LaneBox[] = [];
  const pos: Layout["pos"] = {};
  let y = 30;
  for (const def of LANE_DEFS) {
    const inLane = roster.filter((a) => LANE_OF[a.op] === def.key);
    if (!inLane.length) continue;
    // four agents read better as two pairs (e.g. Sizer | Aligner × 2) than 3 + 1
    const per = inLane.length === 4 ? 2 : PER_ROW;
    const rows = Math.ceil(inLane.length / per);
    const h = 38 + (rows - 1) * ROW_H;
    inLane.forEach((a, i) => {
      const row = Math.floor(i / per);
      const inRow = Math.min(per, inLane.length - row * per);
      pos[a.id] = { x: 160 + ((i % per) - (inRow - 1) / 2) * 100, y: y + row * ROW_H };
    });
    const label = (mode === "report" ? def.report : mode === "page" ? def.page : undefined) ?? def.label;
    lanes.push({ key: def.key, label, y, h });
    y += h + 24;
  }
  const at = Object.fromEntries(lanes.map((l) => [l.key, l])) as Record<Lane, LaneBox | undefined>;
  const top = (l: LaneBox) => l.y - 19;
  const bot = (l: LaneBox) => l.y - 19 + l.h;
  const edges: Layout["edges"] = [];
  // the spine down the middle
  for (let i = 0; i < lanes.length - 1; i++) {
    edges.push({ from: lanes[i].key, to: lanes[i + 1].key, d: `M160 ${bot(lanes[i]) - 1} V${top(lanes[i + 1]) + 1}` });
  }
  // bypasses on the sides
  const side = (from: Lane, to: Lane, x: number) => {
    const a = at[from];
    const b = at[to];
    if (a && b && lanes.indexOf(b) - lanes.indexOf(a) > 1) edges.push({ from, to, d: `M${x} ${a.y} V${b.y}` });
  };
  side("plan", "style", 10);
  side("code", "review", 310);
  side("style", "review", 302);
  const last = lanes[lanes.length - 1];
  return { lanes, pos, edges, h: last ? bot(last) + 6 : 60 };
}
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
  const engine = useSwarm();
  const { lanes, pos: POS, edges, h: VB_H } = useMemo(() => layoutFor(engine.roster, engine.rosterName), [engine]);
  const agents = useSwarmState((s) => s.agents);
  const pulses = useSwarmState((s) => s.pulses);
  const hot = new Set(pulses.slice(-4).map((p) => `${laneOf(p.from)}>${laneOf(p.to)}`));
  const laneBusy = (l: Lane) => engine.roster.some((a) => LANE_OF[a.op] === l && agents[a.id].status !== "idle");

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
        {lanes.map((l) => (
          <g key={l.key} className="dag-lane" data-lane={l.key} data-busy={laneBusy(l.key) ? "true" : undefined}>
            <rect x={20} y={l.y - 19} width={280} height={l.h} rx={9} />
            <text x={26} y={l.y - 22}>
              {l.label}
            </text>
          </g>
        ))}
        {edges.map((e) => (
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
        {engine.roster.map((a) => {
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
        {engine.roster.map((a) => (
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
