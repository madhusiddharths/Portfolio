"use client";

import { useEffect, useState } from "react";
import { useSwarm, useSwarmState } from "./swarm";

/** Playground run state — "streaming" while the hero is still being built. */
export function RunStatus() {
  const enabled = useSwarmState((s) => s.enabled);
  const phase = useSwarmState((s) => s.sections.home);
  const live = enabled && phase !== "done";
  return (
    <span className="pg-state" data-live={live ? "true" : undefined}>
      {live ? (
        <>
          <span className="pg-spin" /> streaming
        </>
      ) : (
        <>✓ complete</>
      )}
    </span>
  );
}

/** Real numbers from this page's build: nodes, wall time, agents. */
export function RunUsage() {
  const engine = useSwarm();
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
    <dl className="pg-usage">
      <div>
        <dt>nodes</dt>
        <dd>
          {enabled ? done : total}
          <small>/{total}</small>
        </dd>
      </div>
      <div>
        <dt>wall</dt>
        <dd>{enabled ? `${(t / 1000).toFixed(1)}s` : "—"}</dd>
      </div>
      <div>
        <dt>agents</dt>
        <dd>{engine.roster.length}</dd>
      </div>
    </dl>
  );
}

/** Footer credit with the real build time. */
export function BuildCredit() {
  const engine = useSwarm();
  const n = engine.roster.length;
  const elapsed = useSwarmState((s) => s.elapsed);
  const enabled = useSwarmState((s) => s.enabled);
  return (
    <span>
      {enabled && elapsed !== null
        ? `assembled live by a ${n}-agent swarm in ${(elapsed / 1000).toFixed(1)}s`
        : `assembled by a ${n}-agent swarm · hit replay to watch`}
    </span>
  );
}
