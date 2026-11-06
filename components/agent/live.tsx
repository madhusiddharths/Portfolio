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
  const agentsOn = useSwarmState((s) => s.roster.length);
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
        <dd>{agentsOn}</dd>
      </div>
    </dl>
  );
}

/** Footer credit with the real build time. */
// "an 11-agent", "an 8-agent", "a 12-agent": the article follows how the number sounds.
const article = (n: number) => (n === 11 || n === 18 || String(n).startsWith("8") ? "an" : "a");

export function BuildCredit() {
  const engine = useSwarm();
  // the most agents on shift at once this run, spawned ones included
  const n = useSwarmState((s) => s.peak);
  const elapsed = useSwarmState((s) => s.elapsed);
  const enabled = useSwarmState((s) => s.enabled);
  // Replay is a no-op under reduced motion, so the phrase stays plain text there.
  const [canReplay, setCanReplay] = useState(false);
  useEffect(() => setCanReplay(!matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  if (enabled && elapsed !== null) {
    return <span>{`assembled live by ${article(n)} ${n}-agent swarm in ${(elapsed / 1000).toFixed(1)}s`}</span>;
  }
  return (
    <span>
      {`assembled by ${article(n)} ${n}-agent swarm · `}
      {canReplay ? (
        <button type="button" className="credit-replay" onClick={() => engine.replay()} title="Rebuild the page from a blank canvas">
          hit replay to watch
        </button>
      ) : (
        "hit replay to watch"
      )}
    </span>
  );
}
