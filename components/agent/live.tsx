"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useSwarmState } from "./swarm";
import { TABS } from "./shell";

/** Hero task card — a live checklist of the swarm's progress per section. */
export function TaskCard() {
  const sections = useSwarmState((s) => s.sections);
  const enabled = useSwarmState((s) => s.enabled);
  const done = useSwarmState((s) => s.done);
  const total = useSwarmState((s) => s.total);
  const elapsed = useSwarmState((s) => s.elapsed);
  const startedAt = useSwarmState((s) => s.startedAt);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!enabled || elapsed !== null) return;
    const id = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(id);
  }, [enabled, elapsed]);

  const t = elapsed ?? (startedAt && now ? now - startedAt : 0);

  return (
    <>
      <div className="task-head">
        <span className="task-id">TASK #001</span>
        <span className="task-state" data-done={!enabled || done >= total ? "true" : undefined}>
          {!enabled ? "rendered" : done >= total ? "shipped" : "in progress"}
        </span>
      </div>
      <p className="task-prompt">
        <span className="task-caret">›</span> build a portfolio for Madhu Siddharth — AI engineer, agentic systems.
      </p>
      <ol className="task-list">
        {TABS.map((tab, i) => {
          const phase = enabled ? (sections[tab.id] ?? "idle") : "done";
          return (
            <li key={tab.id} data-phase={phase}>
              <span className="task-check" aria-hidden="true">
                {phase === "done" && (
                  <motion.svg viewBox="0 0 16 16" width="12" height="12">
                    <motion.path
                      d="M3 8.5l3.2 3L13 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.35 }}
                    />
                  </motion.svg>
                )}
              </span>
              <span className="task-step">0{i + 1}</span>
              <span className="task-name">{tab.label === "home" ? "hero & identity" : tab.label}</span>
              <span className="task-phase">{phase === "idle" ? "queued" : phase}</span>
            </li>
          );
        })}
      </ol>
      <div className="task-foot">
        <span>{enabled ? `${done}/${total} nodes` : `${total} nodes`}</span>
        <span>{enabled ? `${(t / 1000).toFixed(1)}s` : "—"}</span>
      </div>
    </>
  );
}

/** Footer credit with the real build time. */
export function BuildCredit() {
  const elapsed = useSwarmState((s) => s.elapsed);
  const enabled = useSwarmState((s) => s.enabled);
  return (
    <span>
      {enabled && elapsed !== null
        ? `assembled live by a 4-agent swarm in ${(elapsed / 1000).toFixed(1)}s`
        : "assembled by a 4-agent swarm · hit replay to watch"}
    </span>
  );
}
