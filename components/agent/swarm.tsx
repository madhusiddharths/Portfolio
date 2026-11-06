"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import { useLenis } from "lenis/react";
import { SwarmEngine, type SwarmState, type RosterName } from "./engine";

const Ctx = createContext<SwarmEngine | null>(null);

export function useSwarm() {
  const e = useContext(Ctx);
  if (!e) throw new Error("useSwarm outside <Swarm>");
  return e;
}

export function useSwarmState<T>(select: (s: SwarmState) => T): T {
  const e = useSwarm();
  return useSyncExternalStore(
    e.subscribe,
    () => select(e.getSnapshot()),
    () => select(e.getSnapshot()),
  );
}

/** Root of the agentic page: owns the engine, the cursor layer, and Lenis wiring. */
export function Swarm({ children, className, task, roster = "home" }: { children: ReactNode; className?: string; task?: string; roster?: RosterName }) {
  const [engine] = useState(() => new SwarmEngine(roster));
  const root = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    engine.attach(root.current!, task);
    return () => engine.detach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  useEffect(() => {
    if (!lenis) return;
    engine.scrollTo = (t) => lenis.scrollTo(t, { duration: 1.2 });
  }, [lenis, engine]);

  return (
    <Ctx.Provider value={engine}>
      <div ref={root} className={className}>
        {children}
        <CursorLayer engine={engine} />
      </div>
    </Ctx.Provider>
  );
}

function CursorLayer({ engine }: { engine: SwarmEngine }) {
  const agents = useSyncExternalStore(engine.subscribe, () => engine.state.agents, () => engine.state.agents);
  return (
    <div className="swarm-layer" aria-hidden="true">
      {engine.roster.map((a) => {
        const c = engine.cursors[a.id];
        const st = agents[a.id];
        return (
          <motion.div
            key={a.id}
            className="swarm-cursor"
            data-status={st.status}
            data-op={st.status === "working" ? (st.op ?? undefined) : undefined}
            style={{ x: c.x, y: c.y, opacity: c.o, color: a.color, ["--c" as string]: a.color }}
          >
            <svg width="18" height="20" viewBox="0 0 18 20" className="swarm-arrow">
              <path d="M1.5 1.5 L16 9.2 L9.4 10.9 L6.2 17.6 Z" fill="currentColor" stroke="#050507" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <span className="swarm-tag">
              {"parent" in a ? `↳ ${a.name}` : a.name}
              {st.status === "working" && st.op && <span className="swarm-op">{st.op}</span>}
              {st.status === "working" && st.op === "write" && (
                <i className="swarm-typing">
                  <b />
                  <b />
                  <b />
                </i>
              )}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/** A section the swarm builds when it scrolls into view. */
export function BuildSection({
  id,
  sec,
  className,
  children,
  ...rest
}: { id: string; sec: string } & ComponentPropsWithoutRef<"section">) {
  const engine = useSwarm();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    engine.register(ref.current!);
  }, [engine]);
  return (
    <section ref={ref} id={id} data-sec={sec} data-phase="idle" className={`ag-section ${className ?? ""}`} {...rest}>
      {children}
    </section>
  );
}

/** Counts up once its build node is done (or on view when the build is off). */
export function SwarmCount({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(value);

  useEffect(() => {
    const el = ref.current!;
    const host = el.closest<HTMLElement>("[data-build]");
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 1400);
        // the ease never quite reaches 1, so land on the exact value at the end
        setN(t >= 1 ? value : (1 - Math.pow(2, -10 * t)) * value);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const reset = () => setN(0);
    if (!document.documentElement.classList.contains("build-on")) return;
    setN(0);
    if (host?.dataset.state === "done") run();
    host?.addEventListener("swarm:built", run);
    host?.addEventListener("swarm:reset", reset);
    return () => {
      cancelAnimationFrame(raf);
      host?.removeEventListener("swarm:built", run);
      host?.removeEventListener("swarm:reset", reset);
    };
  }, [value]);

  return (
    <span ref={ref} aria-label={`${prefix}${value}${suffix}`}>
      {prefix}
      {n.toFixed(decimals)}
      {suffix}
    </span>
  );
}
