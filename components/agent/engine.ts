/* =============================================================================
   Swarm engine — the "agentic browser" build.
   A tiny external store + scheduler. Sections hand their [data-build] nodes to
   the queue when they scroll into view; four agents pull nodes off the queue,
   fly their cursor to the node, and flip it pending → building → done. All the
   visual work is CSS keyed off `data-state`; this file only sequences it.
   The DOM is always fully rendered — the wireframe look exists only while
   <html> carries `build-on`, so no-JS / reduced-motion / "skip" see the page.
   ========================================================================== */

import { animate, motionValue, type MotionValue } from "motion/react";

export const AGENTS = [
  { id: "planner", name: "Planner", role: "scaffolds layout", color: "#c8ff4d" },
  { id: "coder", name: "Coder", role: "writes copy & markup", color: "#4de1ff" },
  { id: "stylist", name: "Stylist", role: "paints surfaces", color: "#ff6bd6" },
  { id: "critic", name: "Critic", role: "reviews & ships", color: "#ffb547" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];
export type Speaker = AgentId | "user" | "router" | "system";
export type LogLine = { id: number; t: string; who: Speaker; text: string; tone?: "ok" | "dim" | "accent" };
export type SectionPhase = "idle" | "building" | "done";

export type SwarmState = {
  enabled: boolean;
  total: number;
  done: number;
  agents: Record<AgentId, { status: "idle" | "moving" | "working"; task: string }>;
  sections: Record<string, SectionPhase>;
  active: string;
  log: LogLine[];
  startedAt: number | null;
  elapsed: number | null; // ms from first node to last node, once everything is built
};

type Task = { el: HTMLElement; section: HTMLElement };
type Cursor = { x: MotionValue<number>; y: MotionValue<number>; o: MotionValue<number> };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
const EASE: [number, number, number, number] = [0.6, 0.04, 0.24, 1];

const VERB: Record<string, string> = {
  type: "writing",
  para: "drafting",
  fill: "painting",
  block: "assembling",
  list: "populating",
  media: "rendering",
};

let lineId = 0;

export class SwarmEngine {
  state: SwarmState;
  cursors: Record<AgentId, Cursor>;
  private listeners = new Set<() => void>();
  private root: HTMLElement | null = null;
  private queue: Task[] = [];
  private waiters: (() => void)[] = [];
  private gen = 0;
  private remaining = new Map<HTMLElement, number>();
  private sectionStart = new Map<HTMLElement, number>();
  private sections = new Map<HTMLElement, { triggered: boolean }>();
  private buildIO: IntersectionObserver | null = null;
  private spyIO: IntersectionObserver | null = null;
  private mo: MutationObserver | null = null;
  scrollTo: (target: string | number) => void = (t) => {
    if (typeof t === "number") window.scrollTo({ top: t, behavior: "smooth" });
    else document.querySelector(t)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  constructor() {
    const agents = {} as SwarmState["agents"];
    const cursors = {} as Record<AgentId, Cursor>;
    AGENTS.forEach((a, i) => {
      agents[a.id] = { status: "idle", task: "standing by" };
      cursors[a.id] = { x: motionValue(80 + i * 60), y: motionValue(-40), o: motionValue(0) };
    });
    this.cursors = cursors;
    this.state = {
      enabled: false,
      total: 0,
      done: 0,
      agents,
      sections: {},
      active: "home",
      log: [],
      startedAt: null,
      elapsed: null,
    };
  }

  /* ---- store plumbing ---------------------------------------------------- */
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.state;
  private set(patch: Partial<SwarmState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }
  private setAgent(id: AgentId, status: SwarmState["agents"][AgentId]["status"], task: string) {
    this.set({ agents: { ...this.state.agents, [id]: { status, task } } });
  }
  private setSection(id: string, phase: SectionPhase) {
    this.set({ sections: { ...this.state.sections, [id]: phase } });
  }
  log(who: Speaker, text: string, tone?: LogLine["tone"]) {
    const line = { id: ++lineId, t: stamp(), who, text, tone };
    this.set({ log: [...this.state.log.slice(-90), line] });
  }

  /* ---- lifecycle --------------------------------------------------------- */
  attach(root: HTMLElement, task = "build portfolio for Madhu Siddharth") {
    this.root = root;
    const enabled = document.documentElement.classList.contains("build-on");
    (window as unknown as { __swarmReady?: boolean }).__swarmReady = true;
    this.set({ enabled, total: root.querySelectorAll("[data-build]").length });

    this.buildIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const meta = this.sections.get(e.target as HTMLElement);
          if (e.isIntersecting && meta && !meta.triggered) {
            meta.triggered = true;
            this.enqueue(e.target as HTMLElement);
          }
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    this.spyIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) this.set({ active: (e.target as HTMLElement).id });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    this.sections.forEach((_, el) => {
      this.buildIO!.observe(el);
      this.spyIO!.observe(el);
    });

    // New nodes (e.g. a filtered list re-rendering) join the queue of their
    // already-built section, and the totals follow the DOM.
    this.mo = new MutationObserver((muts) => {
      const touches = (nodes: NodeList) =>
        Array.from(nodes).some((n) => n instanceof HTMLElement && (n.matches("[data-build]") || !!n.querySelector("[data-build]")));
      if (!muts.some((m) => touches(m.addedNodes) || touches(m.removedNodes))) return;
      this.set({
        total: root.querySelectorAll("[data-build]").length,
        done: root.querySelectorAll('[data-build][data-state="done"]').length,
      });
      this.sections.forEach((meta, el) => {
        if (meta.triggered && el.isConnected) this.enqueue(el);
      });
    });
    this.mo.observe(root, { childList: true, subtree: true });

    if (enabled) {
      this.log("system", "session opened · 4 agents online", "dim");
      this.log("planner", `task received: ${task} · ${this.state.total} nodes`);
      AGENTS.forEach((a) => this.work(a.id, this.gen));
    } else {
      this.log("system", "build skipped · rendering final page", "dim");
    }
  }

  detach() {
    this.gen++;
    this.buildIO?.disconnect();
    this.spyIO?.disconnect();
    this.mo?.disconnect();
    this.wake();
  }

  register(section: HTMLElement) {
    if (this.sections.has(section)) return;
    this.sections.set(section, { triggered: false });
    this.state = { ...this.state, sections: { ...this.state.sections, [section.id]: "idle" } };
    this.buildIO?.observe(section);
    this.spyIO?.observe(section);
  }

  /* ---- queue ------------------------------------------------------------- */
  private enqueue(section: HTMLElement) {
    const all = Array.from(section.querySelectorAll<HTMLElement>("[data-build]"));
    const nodes = all.filter((n) => n.dataset.state !== "done" && !n.dataset.queued);
    if (!this.state.enabled) {
      nodes.forEach((n) => this.complete(n, false));
      this.finishSection(section, true);
      return;
    }
    if (nodes.length === 0) {
      // nothing new — only close the section if nothing is still in flight
      if (!all.some((n) => n.dataset.queued)) this.finishSection(section, true);
      return;
    }
    nodes.forEach((n) => (n.dataset.queued = "1"));
    this.remaining.set(section, Math.max(0, this.remaining.get(section) ?? 0) + nodes.length);
    this.sectionStart.set(section, performance.now());
    if (this.state.startedAt === null) this.set({ startedAt: performance.now() });
    section.dataset.phase = "building";
    this.setSection(section.id, "building");
    this.log("planner", `plan ${section.dataset.sec ?? section.id} → ${nodes.length} nodes, split across swarm`);
    nodes.forEach((el) => this.queue.push({ el, section }));
    this.wake();
  }

  private wake() {
    const w = this.waiters;
    this.waiters = [];
    w.forEach((r) => r());
  }
  private next() {
    return new Promise<void>((r) => this.waiters.push(r));
  }

  private async work(id: AgentId, gen: number) {
    const cur = this.cursors[id];
    let idleSince = performance.now();
    while (gen === this.gen) {
      const task = this.queue.shift();
      if (!task) {
        if (this.state.agents[id].status !== "idle") this.setAgent(id, "idle", "standing by");
        await Promise.race([this.next(), sleep(1800 + Math.random() * 1200)]);
        if (gen !== this.gen) return;
        if (this.queue.length === 0) {
          // Idle: drift a little, then fade so nothing hovers over the reading.
          if (performance.now() - idleSince > 3500) {
            animate(cur.o, 0, { duration: 0.6 });
          } else {
            animate(cur.x, cur.x.get() + (Math.random() - 0.5) * 60, { duration: 1.6, ease: "easeInOut" });
            animate(cur.y, cur.y.get() + (Math.random() - 0.5) * 40, { duration: 1.6, ease: "easeInOut" });
          }
        }
        continue;
      }
      await this.perform(id, task, gen);
      idleSince = performance.now();
    }
  }

  private rel(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const o = this.root!.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  }

  private async perform(id: AgentId, { el, section }: Task, gen: number) {
    if (!el.isConnected || !this.root) return this.tick(section);
    const agent = AGENTS.find((a) => a.id === id)!;
    const cur = this.cursors[id];
    const kind = el.dataset.build ?? "block";
    const label = el.dataset.label ?? kind;
    const b = this.rel(el);

    // 1 · fly to the node's leading edge
    const tx = b.x + Math.min(10, b.w * 0.1);
    const ty = b.y + Math.min(b.h * 0.55, 22);
    const dist = Math.hypot(tx - cur.x.get(), ty - cur.y.get());
    const fly = clamp(dist / 1700, 0.28, 0.75);
    this.setAgent(id, "moving", `→ ${label}`);
    if (cur.o.get() < 1) animate(cur.o, 1, { duration: 0.25 });
    await Promise.all([
      animate(cur.x, tx, { duration: fly, ease: EASE }),
      animate(cur.y, ty, { duration: fly, ease: EASE }),
    ]);
    if (gen !== this.gen) return;

    // 2 · build it — the CSS wipe and the cursor sweep share one duration
    const text = (el.textContent ?? "").trim().length;
    const dur =
      kind === "type"
        ? clamp(text * 16, 380, 1100)
        : kind === "para"
          ? clamp(text * 2.2, 650, 1300)
          : kind === "list"
            ? 700
            : kind === "media"
              ? 750
              : 520;
    el.style.setProperty("--agent", agent.color);
    el.style.setProperty("--dur", `${dur}ms`);
    el.style.setProperty("--steps", String(clamp(Math.round(text / 1.6), 6, 40)));
    el.dataset.agent = agent.name;
    el.dataset.state = "building";
    this.setAgent(id, "working", `${VERB[kind] ?? "building"} ${label}`);

    const sweep =
      kind === "para" || kind === "list"
        ? [animate(cur.y, b.y + b.h - 8, { duration: dur / 1000, ease: "linear" })]
        : [
            animate(cur.x, b.x + b.w * (kind === "type" ? 1 : 0.85), {
              duration: dur / 1000,
              ease: kind === "type" ? "linear" : "easeInOut",
            }),
            animate(cur.y, b.y + (kind === "type" ? Math.min(b.h * 0.55, 22) : b.h * 0.7), {
              duration: dur / 1000,
              ease: "easeInOut",
            }),
          ];
    await Promise.all([sleep(dur), ...sweep]);
    if (gen !== this.gen) return;

    this.complete(el, true);
    this.log(id, `${VERB[kind] ?? "built"} ${label} · ${dur}ms`);
    this.tick(section);
    await sleep(50);
  }

  private complete(el: HTMLElement, count: boolean) {
    if (el.dataset.state === "done") return;
    el.dataset.state = "done";
    delete el.dataset.queued;
    el.dispatchEvent(new CustomEvent("swarm:built"));
    if (count) {
      const done = this.state.done + 1;
      const allDone = done >= this.state.total && this.state.startedAt !== null && this.state.elapsed === null;
      this.set({
        done,
        elapsed: allDone ? performance.now() - this.state.startedAt! : this.state.elapsed,
      });
      if (allDone) this.log("critic", `✓ page shipped · ${done} nodes · ${(this.state.elapsed! / 1000).toFixed(1)}s`, "ok");
    }
  }

  private tick(section: HTMLElement) {
    const left = (this.remaining.get(section) ?? 1) - 1;
    this.remaining.set(section, left);
    if (left <= 0) this.finishSection(section, false);
  }

  private finishSection(section: HTMLElement, silent: boolean) {
    section.dataset.phase = "done";
    this.setSection(section.id, "done");
    if (silent) return;
    const t0 = this.sectionStart.get(section) ?? performance.now();
    this.log("critic", `✓ review passed ${section.dataset.sec ?? section.id} · ${((performance.now() - t0) / 1000).toFixed(1)}s`, "ok");
  }

  /* ---- controls ---------------------------------------------------------- */
  skip() {
    this.gen++;
    this.queue = [];
    try {
      localStorage.setItem("swarm-skip", "1");
    } catch {}
    document.documentElement.classList.remove("build-on");
    this.root?.querySelectorAll<HTMLElement>("[data-build]").forEach((n) => this.complete(n, false));
    this.sections.forEach((meta, el) => {
      meta.triggered = true;
      this.finishSection(el, true);
    });
    const agents = { ...this.state.agents };
    AGENTS.forEach((a) => {
      animate(this.cursors[a.id].o, 0, { duration: 0.3 });
      agents[a.id] = { status: "idle", task: "standing by" };
    });
    this.set({ enabled: false, done: this.state.total, agents });
    this.log("system", "build skipped · final page rendered", "dim");
    this.wake();
  }

  replay() {
    this.gen++;
    this.queue = [];
    this.wake();
    try {
      localStorage.removeItem("swarm-skip");
    } catch {}
    const html = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.log("system", "reduced motion is on · replay disabled", "dim");
      return;
    }
    this.root?.querySelectorAll<HTMLElement>("[data-build]").forEach((n) => {
      delete n.dataset.state;
      delete n.dataset.queued;
      n.dispatchEvent(new CustomEvent("swarm:reset"));
    });
    html.classList.add("build-on");
    this.set({ enabled: true, done: 0, startedAt: null, elapsed: null });
    this.log("system", "rebuild requested · wiping canvas", "dim");
    this.scrollTo(0);
    const gen = this.gen;
    // let the scroll settle before the observers re-fire
    setTimeout(() => {
      if (gen !== this.gen) return;
      this.sections.forEach((meta, el) => {
        meta.triggered = false;
        el.dataset.phase = "idle";
        this.setSection(el.id, "idle");
        this.buildIO?.unobserve(el);
        this.buildIO?.observe(el);
      });
      AGENTS.forEach((a) => this.work(a.id, gen));
    }, 650);
  }
}
