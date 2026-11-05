/* =============================================================================
   Swarm engine — the "agentic browser" build.
   A tiny external store + a pipeline of six agents. When a section scrolls
   into view its [data-build] nodes enter the pipeline:

     Planner  create  draws the node's frame (slightly off-size, slightly off-grid)
     Coder    write   types text nodes in            ┐ one or the other,
     Stylist  paint   paints surfaces in             ┘ by node kind
     Sizer    resize  drags the corner to the real size      (large nodes)
     Aligner  place   nudges the node onto the grid          (large nodes)
     Critic   review  walks a finished section and signs it off

   Each agent owns a queue and a cursor; a node is handed agent → agent, so
   several stages run at once. All visual state is CSS keyed off
   `data-state`; this file only sequences it and reports what happened.
   The DOM is always fully rendered — the wireframe look exists only while
   <html> carries `build-on`, so no-JS / reduced-motion / "skip" see the page.
   ========================================================================== */

import { animate, motionValue, type MotionValue } from "motion/react";

export const AGENTS = [
  { id: "planner", name: "Planner", op: "create", role: "draws frames", color: "#c8ff4d" },
  { id: "coder", name: "Coder", op: "write", role: "writes copy", color: "#4de1ff" },
  { id: "stylist", name: "Stylist", op: "paint", role: "paints surfaces", color: "#ff6bd6" },
  { id: "sizer", name: "Sizer", op: "resize", role: "fixes dimensions", color: "#a78bff" },
  { id: "aligner", name: "Aligner", op: "place", role: "snaps to grid", color: "#5dffc4" },
  { id: "critic", name: "Critic", op: "review", role: "signs off sections", color: "#ffb547" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];
export type Op = (typeof AGENTS)[number]["op"];
export type Speaker = AgentId | "user" | "router" | "system";
export type LogLine = { id: number; hash: string; t: string; who: Speaker; text: string; tone?: "ok" | "dim" | "accent" };
export type SectionPhase = "idle" | "building" | "review" | "done";
export type AgentStatus = "idle" | "moving" | "working";
export type AgentState = { status: AgentStatus; op: Op | null; target: string; q: number; n: number };
export type Pulse = { id: number; from: AgentId; to: AgentId };

export type SwarmState = {
  enabled: boolean;
  total: number;
  done: number;
  agents: Record<AgentId, AgentState>;
  sections: Record<string, SectionPhase>;
  active: string;
  log: LogLine[];
  pulses: Pulse[];
  startedAt: number | null;
  elapsed: number | null; // ms from first node to last node, once everything is built
};

type Job = { op: Op; section: HTMLElement; el?: HTMLElement };
type Cursor = { x: MotionValue<number>; y: MotionValue<number>; o: MotionValue<number> };
type Pose = { dx: number; dy: number; sx: number; sy: number };
type Box = { x: number; y: number; w: number; h: number };

const OWNER = Object.fromEntries(AGENTS.map((a) => [a.op, a.id])) as Record<Op, AgentId>;
const COLOR = Object.fromEntries(AGENTS.map((a) => [a.id, a.color])) as Record<AgentId, string>;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const sign = () => (Math.random() < 0.5 ? -1 : 1);
const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
const hex = () => Math.floor(Math.random() * 0xfffffff).toString(16).padStart(7, "0");
/** One curve for the CSS wipe, the WAAPI resize/nudge and the cursor drag. */
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
const EASE_CSS = "cubic-bezier(0.65, 0, 0.35, 1)";
const FLY: [number, number, number, number] = [0.5, 0, 0.2, 1];

let lineId = 0;
let pulseId = 0;

export class SwarmEngine {
  state: SwarmState;
  cursors: Record<AgentId, Cursor>;
  private listeners = new Set<() => void>();
  private root: HTMLElement | null = null;
  private queues = {} as Record<AgentId, Job[]>;
  private waiters = {} as Record<AgentId, (() => void) | null>;
  private plans = new WeakMap<HTMLElement, Op[]>();
  private poses = new WeakMap<HTMLElement, Pose>();
  private gen = 0;
  private remaining = new Map<HTMLElement, number>();
  private sectionStart = new Map<HTMLElement, number>();
  private sections = new Map<HTMLElement, { triggered: boolean }>();
  private visible = new Set<HTMLElement>();
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
      agents[a.id] = { status: "idle", op: null, target: "", q: 0, n: 0 };
      cursors[a.id] = { x: motionValue(120 + i * 70), y: motionValue(-40), o: motionValue(0) };
      this.queues[a.id] = [];
      this.waiters[a.id] = null;
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
      pulses: [],
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
  private setAgent(id: AgentId, patch: Partial<AgentState>) {
    this.set({ agents: { ...this.state.agents, [id]: { ...this.state.agents[id], ...patch, q: this.queues[id].length } } });
  }
  private setSection(id: string, phase: SectionPhase) {
    this.set({ sections: { ...this.state.sections, [id]: phase } });
  }
  log(who: Speaker, text: string, tone?: LogLine["tone"]) {
    const line = { id: ++lineId, hash: hex(), t: stamp(), who, text, tone };
    this.set({ log: [...this.state.log.slice(-120), line] });
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
          if (e.isIntersecting) this.visible.add(e.target as HTMLElement);
          else this.visible.delete(e.target as HTMLElement);
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

    // New nodes (e.g. a filtered list re-rendering) join the pipeline of their
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
      this.log("system", `session opened · ${AGENTS.length} agents online`, "dim");
      this.log("planner", `task received: ${task} · ${this.state.total} nodes`);
      this.startWorkers(this.gen);
    } else {
      this.log("system", "build skipped · rendering final page", "dim");
    }
  }

  detach() {
    this.gen++;
    this.buildIO?.disconnect();
    this.spyIO?.disconnect();
    this.mo?.disconnect();
    this.wakeAll();
  }

  register(section: HTMLElement) {
    if (this.sections.has(section)) return;
    this.sections.set(section, { triggered: false });
    this.state = { ...this.state, sections: { ...this.state.sections, [section.id]: "idle" } };
    this.buildIO?.observe(section);
    this.spyIO?.observe(section);
  }

  private startWorkers(gen: number) {
    AGENTS.forEach((a) => this.work(a.id, gen));
  }

  /* ---- planning ---------------------------------------------------------- */
  /** Which stages a node goes through. `data-ops` on the node overrides. */
  private plan(el: HTMLElement): Op[] {
    const forced = el.dataset.ops;
    if (forced) return forced.split(",").map((s) => s.trim()) as Op[];
    const kind = el.dataset.build ?? "block";
    if (kind === "frame") return ["create"];
    const text = kind === "type" || kind === "para" || kind === "list";
    const r = el.getBoundingClientRect();
    // one-line labels are just typed in — the Planner only frames real blocks
    if (kind === "type" && r.height < 44) return ["write"];
    const ops: Op[] = ["create", text ? "write" : "paint"];
    if (!text && r.width > 150 && r.height > 56) ops.push("resize", "place");
    return ops;
  }

  /* ---- queue ------------------------------------------------------------- */
  private enqueue(section: HTMLElement) {
    const all = Array.from(section.querySelectorAll<HTMLElement>("[data-build]"));
    const nodes = all.filter((n) => n.dataset.state !== "done" && !n.dataset.queued);
    if (!this.state.enabled) {
      nodes.forEach((n) => this.complete(n, false));
      this.finishSection(section);
      return;
    }
    if (nodes.length === 0) {
      // nothing new — only close the section if nothing is still in flight
      if (!all.some((n) => n.dataset.queued)) this.finishSection(section);
      return;
    }
    nodes.forEach((n) => {
      n.dataset.queued = "1";
      this.plans.set(n, this.plan(n));
    });
    this.remaining.set(section, Math.max(0, this.remaining.get(section) ?? 0) + nodes.length);
    this.sectionStart.set(section, performance.now());
    if (this.state.startedAt === null) this.set({ startedAt: performance.now() });
    section.dataset.phase = "building";
    this.setSection(section.id, "building");
    const staged = nodes.filter((n) => this.plans.get(n)!.includes("resize")).length;
    this.log("planner", `plan ${section.dataset.sec ?? section.id} · ${nodes.length} nodes · ${staged} get a layout pass`);
    nodes.forEach((el) => this.push({ op: this.plans.get(el)![0], section, el }));
  }

  private push(job: Job, from?: AgentId) {
    const to = OWNER[job.op];
    this.queues[to].push(job);
    if (from && from !== to) {
      this.set({ pulses: [...this.state.pulses.slice(-10), { id: ++pulseId, from, to }] });
    }
    this.setAgent(to, {});
    const w = this.waiters[to];
    this.waiters[to] = null;
    w?.();
  }

  private wakeAll() {
    AGENTS.forEach((a) => {
      const w = this.waiters[a.id];
      this.waiters[a.id] = null;
      w?.();
    });
  }

  /** Next job, preferring sections on screen — jump ahead and the swarm follows. */
  private take(id: AgentId) {
    const q = this.queues[id];
    const i = q.findIndex((j) => this.visible.has(j.section));
    return i > 0 ? q.splice(i, 1)[0] : q.shift();
  }

  private wait(id: AgentId, ms: number) {
    return Promise.race([new Promise<void>((r) => (this.waiters[id] = r)), sleep(ms)]);
  }

  private async work(id: AgentId, gen: number) {
    const cur = this.cursors[id];
    let idleSince = performance.now();
    while (gen === this.gen) {
      const job = this.take(id);
      if (!job) {
        if (this.state.agents[id].status !== "idle") this.setAgent(id, { status: "idle", op: null, target: "" });
        await this.wait(id, 1600 + Math.random() * 1000);
        if (gen !== this.gen) return;
        if (this.queues[id].length === 0) {
          // Idle: drift a little, then fade so nothing hovers over the reading.
          if (performance.now() - idleSince > 2600) animate(cur.o, 0, { duration: 0.8 });
          else {
            animate(cur.x, cur.x.get() + rand(-30, 30), { duration: 1.8, ease: "easeInOut" });
            animate(cur.y, cur.y.get() + rand(-20, 20), { duration: 1.8, ease: "easeInOut" });
          }
        }
        continue;
      }
      this.setAgent(id, {});
      await this.perform(id, job, gen);
      idleSince = performance.now();
    }
  }

  /* ---- geometry ---------------------------------------------------------- */
  private rel(el: HTMLElement): Box {
    const r = el.getBoundingClientRect();
    const o = this.root!.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  }
  /** The node's box with its build pose (scale + offset) taken out. */
  private natural(el: HTMLElement): Box {
    const r = this.rel(el);
    const p = this.poses.get(el);
    if (!p) return r;
    return { x: r.x - p.dx, y: r.y - p.dy, w: r.w / p.sx, h: r.h / p.sy };
  }
  private applyPose(el: HTMLElement, p: Pose) {
    this.poses.set(el, p);
    el.style.transformOrigin = "0 0";
    el.style.scale = p.sx === 1 && p.sy === 1 ? "" : `${p.sx} ${p.sy}`;
    el.style.translate = p.dx === 0 && p.dy === 0 ? "" : `${p.dx}px ${p.dy}px`;
  }
  private clearPose(el: HTMLElement) {
    this.poses.delete(el);
    el.style.removeProperty("transform-origin");
    el.style.removeProperty("scale");
    el.style.removeProperty("translate");
  }

  private async fly(id: AgentId, x: number, y: number, gen: number) {
    const cur = this.cursors[id];
    if (cur.o.get() < 1) {
      // reappear near the target instead of streaking across the page
      if (cur.o.get() === 0) {
        cur.x.set(x + rand(-90, 90));
        cur.y.set(y + rand(40, 110));
      }
      animate(cur.o, 1, { duration: 0.35 });
    }
    const dist = Math.hypot(x - cur.x.get(), y - cur.y.get());
    const d = clamp(dist / 1100, 0.38, 0.95);
    await Promise.all([animate(cur.x, x, { duration: d, ease: FLY }), animate(cur.y, y, { duration: d, ease: FLY })]);
    return gen === this.gen;
  }

  private async drag(id: AgentId, x: number, y: number, ms: number, ease: typeof EASE | "linear" = EASE) {
    const cur = this.cursors[id];
    await Promise.all([animate(cur.x, x, { duration: ms / 1000, ease }), animate(cur.y, y, { duration: ms / 1000, ease })]);
  }

  /* ---- the six operations ------------------------------------------------ */
  private async perform(id: AgentId, job: Job, gen: number) {
    if (job.op === "review") return this.review(id, job.section, gen);
    const el = job.el!;
    if (!el.isConnected || !this.root) return this.tick(job.section);
    const label = el.dataset.label ?? el.dataset.build ?? "node";
    const color = COLOR[id];
    const t0 = performance.now();
    let detail = "";

    this.setAgent(id, { status: "moving", op: job.op, target: label });
    switch (job.op) {
      case "create": {
        const ops = this.plans.get(el) ?? ["create"];
        const b = this.natural(el);
        const pose: Pose = {
          sx: ops.includes("resize") ? rand(0.84, 0.92) : 1,
          sy: ops.includes("resize") ? rand(0.8, 0.9) : 1,
          dx: ops.includes("place") ? sign() * rand(10, 22) : 0,
          dy: ops.includes("place") ? sign() * rand(6, 14) : 0,
        };
        this.applyPose(el, pose);
        const x0 = b.x + pose.dx;
        const y0 = b.y + pose.dy;
        if (!(await this.fly(id, x0 - 4, y0 - 4, gen))) return;
        const ms = Math.round(clamp(420 + Math.hypot(b.w, b.h) * 0.4, 520, 950));
        el.style.setProperty("--agent", color);
        el.style.setProperty("--dur", `${ms}ms`);
        el.dataset.agent = AGENTS.find((a) => a.id === id)!.name;
        el.dataset.state = "creating";
        this.setAgent(id, { status: "working" });
        await Promise.all([sleep(ms), this.drag(id, x0 + b.w * pose.sx + 2, y0 + b.h * pose.sy + 2, ms)]);
        if (gen !== this.gen) return;
        detail = `${Math.round(b.w * pose.sx)}×${Math.round(b.h * pose.sy)}`;
        el.dataset.state = "framed";
        break;
      }
      case "write":
      case "paint": {
        const b = this.rel(el);
        const kind = el.dataset.build ?? "block";
        const tx = b.x + Math.min(10, b.w * 0.1);
        const ty = b.y + Math.min(b.h * 0.55, 22);
        if (!(await this.fly(id, tx, ty, gen))) return;
        const text = (el.textContent ?? "").trim().length;
        const ms = Math.round(
          kind === "type"
            ? clamp(text * 22, 500, 1300)
            : kind === "para"
              ? clamp(text * 3.2, 800, 1600)
              : kind === "list"
                ? 950
                : 850,
        );
        el.style.setProperty("--agent", color);
        el.style.setProperty("--dur", `${ms}ms`);
        el.style.setProperty("--steps", String(clamp(Math.round(text / 1.4), 8, 48)));
        el.dataset.state = "building";
        this.setAgent(id, { status: "working" });
        const vertical = kind === "para" || kind === "list";
        await Promise.all([
          sleep(ms),
          vertical
            ? this.drag(id, tx + rand(0, Math.min(60, b.w * 0.3)), b.y + b.h - 8, ms, "linear")
            : this.drag(id, b.x + b.w * (kind === "type" ? 1 : 0.85), b.y + (kind === "type" ? Math.min(b.h * 0.55, 22) : b.h * 0.7), ms, kind === "type" ? "linear" : EASE),
        ]);
        if (gen !== this.gen) return;
        detail = kind === "type" || kind === "para" ? `${text} chars` : "";
        break;
      }
      case "resize": {
        const p = this.poses.get(el) ?? { dx: 0, dy: 0, sx: 1, sy: 1 };
        const b = this.natural(el);
        const x0 = b.x + p.dx;
        const y0 = b.y + p.dy;
        if (!(await this.fly(id, x0 + b.w * p.sx, y0 + b.h * p.sy, gen))) return;
        el.style.setProperty("--agent", color);
        el.dataset.state = "resizing";
        this.setAgent(id, { status: "working" });
        await sleep(160); // grab the handle
        const ms = 800;
        const anim = el.animate([{ scale: `${p.sx} ${p.sy}` }, { scale: "1 1" }], { duration: ms, easing: EASE_CSS, fill: "forwards" });
        await Promise.all([anim.finished.catch(() => {}), this.drag(id, x0 + b.w, y0 + b.h, ms)]);
        this.applyPose(el, { ...p, sx: 1, sy: 1 });
        anim.cancel();
        if (gen !== this.gen) return;
        detail = `${Math.round(b.w * p.sx)}×${Math.round(b.h * p.sy)} → ${Math.round(b.w)}×${Math.round(b.h)}`;
        break;
      }
      case "place": {
        const p = this.poses.get(el) ?? { dx: 0, dy: 0, sx: 1, sy: 1 };
        const b = this.natural(el);
        const gx = b.x + p.dx + Math.min(b.w * 0.5, 120);
        const gy = b.y + p.dy + Math.min(b.h * 0.5, 80);
        if (!(await this.fly(id, gx, gy, gen))) return;
        el.style.setProperty("--agent", color);
        el.dataset.state = "placing";
        this.setAgent(id, { status: "working" });
        await sleep(180);
        const ms = 700;
        const anim = el.animate([{ translate: `${p.dx}px ${p.dy}px` }, { translate: "0px 0px" }], { duration: ms, easing: EASE_CSS, fill: "forwards" });
        await Promise.all([anim.finished.catch(() => {}), this.drag(id, gx - p.dx, gy - p.dy, ms)]);
        this.applyPose(el, { ...p, dx: 0, dy: 0 });
        anim.cancel();
        if (gen !== this.gen) return;
        detail = `Δ(${Math.round(p.dx)}, ${Math.round(p.dy)}) → grid`;
        break;
      }
    }

    const ms = Math.round(performance.now() - t0);
    this.log(id, `${job.op} ${label}${detail ? ` · ${detail}` : ""} · ${ms}ms`);
    this.setAgent(id, { n: this.state.agents[id].n + 1 });

    const ops = this.plans.get(el) ?? [];
    const next = ops[ops.indexOf(job.op) + 1];
    if (next) {
      if (next === "resize" || next === "place") el.dataset.state = "filled";
      this.push({ op: next, section: job.section, el }, id);
    } else {
      this.complete(el, true);
      this.tick(job.section, id);
    }
    await sleep(120);
  }

  private async review(id: AgentId, section: HTMLElement, gen: number) {
    if (!section.isConnected || !this.root) return;
    const sec = section.dataset.sec ?? section.id;
    const nodes = Array.from(section.querySelectorAll<HTMLElement>("[data-build]"));
    this.setAgent(id, { status: "moving", op: "review", target: sec });
    if (nodes.length) {
      const first = this.rel(nodes[0]);
      const last = this.rel(nodes[nodes.length - 1]);
      if (!(await this.fly(id, first.x + first.w + 12, first.y + 6, gen))) return;
      this.setAgent(id, { status: "working" });
      section.dataset.phase = "review";
      this.setSection(section.id, "review");
      await this.drag(id, Math.min(first.x + first.w + 12, last.x + last.w - 12), last.y + Math.min(last.h, 40), 900);
      await sleep(250);
    }
    if (gen !== this.gen) return;
    this.finishSection(section);
    const t0 = this.sectionStart.get(section) ?? performance.now();
    this.log("critic", `✓ review passed ${sec} · ${nodes.length} nodes · ${((performance.now() - t0) / 1000).toFixed(1)}s`, "ok");
    this.setAgent(id, { n: this.state.agents[id].n + 1 });
    await sleep(200);
  }

  private complete(el: HTMLElement, count: boolean) {
    if (el.dataset.state === "done") return;
    el.getAnimations().forEach((a) => a.cancel());
    this.clearPose(el);
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
      if (allDone) this.log("system", `page shipped · ${done} nodes · ${(this.state.elapsed! / 1000).toFixed(1)}s`, "ok");
    }
  }

  private tick(section: HTMLElement, from?: AgentId) {
    const left = (this.remaining.get(section) ?? 1) - 1;
    this.remaining.set(section, left);
    if (left <= 0) this.push({ op: "review", section }, from);
  }

  private finishSection(section: HTMLElement) {
    section.dataset.phase = "done";
    this.setSection(section.id, "done");
  }

  /* ---- controls ---------------------------------------------------------- */
  private resetAgents() {
    const agents = { ...this.state.agents };
    AGENTS.forEach((a) => {
      this.queues[a.id] = [];
      animate(this.cursors[a.id].o, 0, { duration: 0.3 });
      agents[a.id] = { status: "idle", op: null, target: "", q: 0, n: 0 };
    });
    return agents;
  }

  skip() {
    this.gen++;
    try {
      localStorage.setItem("swarm-skip", "1");
    } catch {}
    document.documentElement.classList.remove("build-on");
    this.root?.querySelectorAll<HTMLElement>("[data-build]").forEach((n) => this.complete(n, false));
    this.sections.forEach((meta, el) => {
      meta.triggered = true;
      this.finishSection(el);
    });
    this.set({ enabled: false, done: this.state.total, agents: this.resetAgents(), pulses: [] });
    this.log("system", "build skipped · final page rendered", "dim");
    this.wakeAll();
  }

  replay() {
    this.gen++;
    this.wakeAll();
    try {
      localStorage.removeItem("swarm-skip");
    } catch {}
    const html = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.log("system", "reduced motion is on · replay disabled", "dim");
      return;
    }
    this.root?.querySelectorAll<HTMLElement>("[data-build]").forEach((n) => {
      n.getAnimations().forEach((a) => a.cancel());
      this.clearPose(n);
      delete n.dataset.state;
      delete n.dataset.queued;
      n.dispatchEvent(new CustomEvent("swarm:reset"));
    });
    this.remaining.clear();
    html.classList.add("build-on");
    this.set({ enabled: true, done: 0, startedAt: null, elapsed: null, agents: this.resetAgents(), pulses: [] });
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
      this.startWorkers(gen);
    }, 650);
  }
}
