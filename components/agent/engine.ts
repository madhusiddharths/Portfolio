/* =============================================================================
   Swarm engine — the "agentic browser" build.
   A tiny external store + a crew of agents. When a section scrolls into
   view its [data-build] nodes go through the crew, in this order:

     Planner    create  scans a segment and hands its components to the Builders
     Builder    build   owns one component end to end:
       ↳ Coder          sub-agent: streams the text in — raw, unstyled markup
       ↳ Styler         sub-agent: styles it a beat behind and places the media
     Critic     review  walks each finished segment and sends the Styler's
                        mistakes (an overlap, low contrast, cramped kerning)
                        back to the Builder that made them

   Each op has one queue; every agent that owns the op pulls from it.

   Every page runs the crew like a real orchestrated job:
     · a section starts only when the reader stops on it (not when a minimap
       jump scrolls through it),
     · nothing is built until a Planner has scanned its segment,
     · every agent takes what is on screen first — even a sliver of a section,
     · when a queue reaches SPAWN_AT jobs per agent, another agent of that kind
       is spawned and the work splits; spawned agents retire when idle. All visual state is CSS keyed off
   `data-state` / `data-raw` / `data-defect`; this file only sequences it.
   The DOM is always fully rendered — the wireframe look exists only while
   <html> carries `build-on`, so no-JS / reduced-motion / "skip" see the page.
   ========================================================================== */

import { animate, motionValue, type MotionValue } from "motion/react";

/**
 * The crew every page starts with — Planner, one Builder (+ its Coder and
 * Styler), Critic — spawning more Builders as the components pile up. A
 * Builder owns one component end to end; its Coder and Styler work on it at
 * the same time.
 */
const AGENTS = [
  { id: "planner", name: "Planner·1", op: "create", role: "frames blocks", color: "#c8ff4d" },
  { id: "builder", name: "Builder·1", op: "build", role: "builds one component end to end", color: "#9fd8ff" },
  { id: "bcoder", name: "Coder·1", op: "write", role: "builder sub-agent · writes", color: "#4de1ff", parent: "builder", driven: true },
  { id: "bstyler", name: "Styler·1", op: "style", role: "builder sub-agent · styles, sizes, aligns", color: "#ff6bd6", parent: "builder", driven: true },
  { id: "critic", name: "Critic·1", op: "review", role: "reviews + fixes", color: "#ffb547" },
] as const;

/** Static agents use their AGENTS id; agents spawned at runtime get a generated one. */
export type AgentId = string;

/** Which page the crew is on: reports only build what the reader can see, and the work index types faster. */
export type RosterName = "home" | "report" | "page";
type Op = (typeof AGENTS)[number]["op"];
/** One agent on shift: a static one from AGENTS, or one spawned to split a backlog. */
/** `driven`: a sub-agent its parent drives directly — it has no queue of its own. */
export type AgentDef = { id: AgentId; name: string; op: Op; role: string; color: string; parent?: AgentId; spawned?: boolean; driven?: boolean };
export type Speaker = AgentId | "user" | "router" | "system";
export type LogLine = { id: number; hash: string; t: string; who: Speaker; text: string; tone?: "ok" | "dim" | "accent" | "warn" };
export type SectionPhase = "idle" | "building" | "review" | "done";
export type AgentStatus = "idle" | "moving" | "working";
export type AgentState = { status: AgentStatus; op: Op | null; target: string; q: number; n: number };
export type Pulse = { id: number; from: AgentId; to: AgentId };
export type Defect = "overlap" | "contrast" | "kerning";

export type SwarmState = {
  enabled: boolean;
  total: number;
  done: number;
  agents: Record<AgentId, AgentState>;
  /** the agents on shift right now, in display order — grows and shrinks as agents spawn and retire */
  roster: AgentDef[];
  /** most agents ever on shift at once this run */
  peak: number;
  sections: Record<string, SectionPhase>;
  active: string;
  log: LogLine[];
  pulses: Pulse[];
  fixes: number;
  startedAt: number | null;
  elapsed: number | null; // ms from first node to last node, once everything is built
};

/** `plan` marks a planning job: a Planner scans `seg` and hands its nodes to the crew. */
/** `chrome`: the non-component parts of the page (a search box, a table header,
 *  a section rule) — revealed by the Planner's sweep, never built */
type Job = { op: Op; section: HTMLElement; el?: HTMLElement; seg?: HTMLElement; plan?: HTMLElement[]; chrome?: HTMLElement[] };
/** a Critic's finding, sent back to the Builder that built the node */
type Fix = { el: HTMLElement; defect: Defect; section: HTMLElement; seg: HTMLElement };
type Cursor = { x: MotionValue<number>; y: MotionValue<number>; o: MotionValue<number> };
type Box = { x: number; y: number; w: number; h: number };

const OPS: Op[] = ["create", "build", "write", "style", "review"];

const DEFECT_NOTE: Record<Defect, [string, string]> = {
  overlap: ["✗ overlaps the line above", "✓ margin restored"],
  contrast: ["✗ contrast 2.1:1 — below AA", "✓ contrast restored"],
  kerning: ["✗ letter-spacing collapsed", "✓ tracking reset"],
};

/* ---- autoscaling (landing page) ---------------------------------------------
   Each op has one queue shared by every agent that owns it. When the backlog
   per agent reaches SPAWN_AT, the orchestrator spawns another agent of that
   kind (up to MAX_EXTRA per op) and the work splits across them; a spawned
   agent retires once its queue has been empty for RETIRE_MS. */
const SPAWN_AT = 5;
const MAX_EXTRA = 4;
const SPAWN_GAP_MS = 900;
const RETIRE_MS = 3200;
const SPAWN_COLORS: Partial<Record<Op, string[]>> = {
  create: ["#8fe36a", "#a8f060", "#d9ff8f", "#6fd35a"],
  build: ["#b9c6ff", "#a6f0e0", "#ffd0a6", "#d6b3ff"],
  review: ["#ffd56b", "#ffc98a", "#f5a623", "#ffe39a"],
};
/** a spawned Builder's sub-agents, per Builder */
const CREW_COLORS = {
  coder: ["#6f9bff", "#3fd0c0", "#8ab4ff", "#5fe3ff"],
  styler: ["#ff8f9f", "#e58cff", "#ffa3c4", "#c77dff"],
};
/** a section has to stay on screen this long (and the page has to have slowed down) before it starts */
const DWELL_MS = 420;
/** px per ms — faster than this, the reader is passing through, not reading */
const PASSING_SPEED = 1.1;
/** how much of a section has to be on screen, below the browser bar, for it to start */
const MIN_SEEN_PX = 80;

/** the bounding box (viewport coordinates) around a set of elements */
function boundsOf(els: HTMLElement[]) {
  let top = Infinity;
  let left = Infinity;
  let bottom = -Infinity;
  let right = -Infinity;
  for (const el of els) {
    if (!el.isConnected) continue;
    const r = el.getBoundingClientRect();
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    bottom = Math.max(bottom, r.bottom);
    right = Math.max(right, r.right);
  }
  if (top === Infinity) return new DOMRect(0, 0, 0, 0);
  return new DOMRect(left, top, right - left, bottom - top);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* ---------------------------------------------------------------------------
   Token streaming for the Coders. Text is never rewritten: the part not yet
   "generated" is painted transparent through the CSS Custom Highlight API,
   so layout, React-owned text and screen readers are untouched. Browsers
   without the API keep the wipe reveal.
   --------------------------------------------------------------------------- */
const STREAM_HL = "agent-stream";
type Boundary = { node: Text; off: number };
let streamHL: Highlight | null = null;
function streamHighlight(): Highlight | null {
  if (streamHL) return streamHL;
  if (typeof CSS === "undefined" || !("highlights" in CSS) || typeof Highlight === "undefined") return null;
  streamHL = new Highlight();
  CSS.highlights.set(STREAM_HL, streamHL);
  return streamHL;
}
/** end of every word (with its trailing space) inside el, in document order */
function wordBoundaries(el: HTMLElement): Boundary[] {
  const out: Boundary[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest("svg, style, script") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walk.nextNode() as Text | null; n; n = walk.nextNode() as Text | null) {
    const re = /\S+\s*/g;
    for (let m = re.exec(n.data); m; m = re.exec(n.data)) out.push({ node: n, off: m.index + m[0].length });
  }
  return out;
}
/** group words like a model streams tokens: mostly one or two, now and then a burst */
function chunkEnds(words: number): number[] {
  const ends: number[] = [];
  for (let i = 0; i < words; ) {
    const r = Math.random();
    i = Math.min(words, i + (r < 0.45 ? 1 : r < 0.75 ? 2 : r < 0.9 ? 3 : 4 + Math.floor(Math.random() * 3)));
    ends.push(i);
  }
  return ends;
}
const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
const hex = () => Math.floor(Math.random() * 0xfffffff).toString(16).padStart(7, "0");
/** One curve for the CSS wipe and the cursor drag. */
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
const FLY: [number, number, number, number] = [0.5, 0, 0.2, 1];

let lineId = 0;
let pulseId = 0;

export class SwarmEngine {
  state: SwarmState;
  cursors: Record<AgentId, Cursor>;
  readonly rosterName: RosterName;
  /** the agents on shift, in display order (also in state, for React) */
  get roster() {
    return this.state.roster;
  }
  private defs = new Map<AgentId, AgentDef>();
  private owners = {} as Record<Op, AgentId[]>;
  private lastSpawn: Partial<Record<Op, number>> = {};
  private baseRoster: AgentDef[];
  private armed = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  private scrollSpeed = 0;
  private lastScrollAt = 0;
  private lastScrollY = 0;
  /** a programmatic scroll (minimap / nav jump) is running until this time */
  private jumpUntil = 0;
  /** who built each node — the Critic sends fixes back to them */
  private builtBy = new WeakMap<HTMLElement, AgentId>();
  /** fixes waiting for each Builder, and fixes still open per segment */
  private fixQ = new Map<AgentId, Fix[]>();
  private segFixes = new Map<HTMLElement, number>();
  /** page chrome already handed to a Planner */
  private chromeQueued = new WeakSet<HTMLElement>();
  private listeners = new Set<() => void>();
  private root: HTMLElement | null = null;
  private queues = {} as Record<Op, Job[]>;
  private waiters = {} as Record<Op, (() => void)[]>;
  private defects = new WeakMap<HTMLElement, Defect>();
  private gen = 0;
  /** text nodes a Coder is streaming right now: the hidden range and its caret */
  private streams = new Map<HTMLElement, { range: Range; caret: HTMLElement }>();
  /** nodes still in flight per segment, and segments not yet reviewed per section */
  private remaining = new Map<HTMLElement, number>();
  private openSegs = new Map<HTMLElement, Set<HTMLElement>>();
  private spawnFrom = {} as Partial<Record<AgentId, AgentId>>;
  private sectionStart = new Map<HTMLElement, number>();
  private sections = new Map<HTMLElement, { triggered: boolean }>();
  private visible = new Set<HTMLElement>();
  private buildIO: IntersectionObserver | null = null;
  private spyIO: IntersectionObserver | null = null;
  private mo: MutationObserver | null = null;
  private onScroll: (() => void) | null = null;
  scrollTo: (target: string | number) => void = (t) => {
    this.jumping(1300);
    if (typeof t === "number") window.scrollTo({ top: t, behavior: "smooth" });
    else document.querySelector(t)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  constructor(roster: RosterName = "home") {
    this.rosterName = roster;
    AGENTS.forEach((a) => this.defs.set(a.id, { ...a } as AgentDef));
    // a sub-agent's display order follows its parent
    this.baseRoster = AGENTS.map((a) => this.defs.get(a.id)!);
    const agents = {} as SwarmState["agents"];
    const cursors = {} as Record<AgentId, Cursor>;
    AGENTS.forEach((a, i) => {
      agents[a.id] = { status: "idle", op: null, target: "", q: 0, n: 0 };
      cursors[a.id] = { x: motionValue(120 + i * 70), y: motionValue(-40), o: motionValue(0) };
    });
    OPS.forEach((op) => {
      this.queues[op] = [];
      this.waiters[op] = [];
    });
    this.cursors = cursors;
    this.syncOwners(this.baseRoster);
    this.state = {
      enabled: false,
      total: 0,
      done: 0,
      agents,
      roster: this.baseRoster,
      peak: this.baseRoster.length,
      sections: {},
      active: "home",
      log: [],
      pulses: [],
      fixes: 0,
      startedAt: null,
      elapsed: null,
    };
  }

  /** an agent's definition — kept after a spawned agent retires, so its log lines still resolve */
  def(id: AgentId): AgentDef {
    return this.defs.get(id) ?? { id, name: id, op: "write", role: "", color: "#888" };
  }
  private syncOwners(roster: AgentDef[]) {
    this.owners = Object.fromEntries(OPS.map((op) => [op, roster.filter((a) => a.op === op && !a.driven).map((a) => a.id)])) as Record<Op, AgentId[]>;
  }
  /** each agent's share of its op's backlog — what the graph shows on the badge */
  private share(op: Op) {
    const n = this.owners[op]?.length || 1;
    return Math.ceil(this.queues[op].length / n);
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
    this.set({ agents: { ...this.state.agents, [id]: { ...this.state.agents[id], ...patch, q: this.share(this.def(id).op) } } });
  }
  /** Refresh queue depth on every agent that owns `op`. */
  private syncQueue(op: Op) {
    const agents = { ...this.state.agents };
    const q = this.share(op);
    this.owners[op].forEach((id) => (agents[id] = { ...agents[id], q }));
    this.set({ agents });
  }
  private setSection(id: string, phase: SectionPhase) {
    this.set({ sections: { ...this.state.sections, [id]: phase } });
  }
  log(who: Speaker, text: string, tone?: LogLine["tone"]) {
    const line = { id: ++lineId, hash: hex(), t: stamp(), who, text, tone };
    this.set({ log: [...this.state.log.slice(-140), line] });
  }

  /* ---- lifecycle --------------------------------------------------------- */
  attach(root: HTMLElement, task = "build portfolio for Madhu Siddharth") {
    this.root = root;
    const w = window as unknown as { __swarmReady?: boolean; __swarmLate?: boolean };
    w.__swarmReady = true;
    // The boot script drops `build-on` if the engine is not up within 5s (a JS
    // error, a slow device — or a cold dev-server compile). If we did arrive,
    // the visitor did not opt out, and motion is allowed, re-arm the build.
    if (w.__swarmLate && !document.documentElement.classList.contains("build-on")) {
      let skip = false;
      try {
        skip = localStorage.getItem("swarm-skip") === "1";
      } catch {
        /* storage blocked */
      }
      if (!skip && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("build-on");
      w.__swarmLate = false;
    }
    const enabled = document.documentElement.classList.contains("build-on");
    this.set({ enabled, total: root.querySelectorAll("[data-build]").length });

    this.buildIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          const meta = this.sections.get(el);
          if (e.isIntersecting) this.visible.add(el);
          else this.visible.delete(el);
          if (e.isIntersecting && meta && !meta.triggered) {
            // only start a section the reader actually stops at
            this.arm(el);
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

    // Agents work on what is visible first — a scroll may hand them new work.
    // Scroll speed is tracked too, so a section the reader only flies past (a
    // jump from the minimap) never starts building.
    {
      let t: ReturnType<typeof setTimeout> | null = null;
      this.lastScrollY = window.scrollY;
      this.onScroll = () => {
        const now = performance.now();
        const y = window.scrollY;
        const dt = Math.max(1, now - this.lastScrollAt);
        const v = Math.abs(y - this.lastScrollY) / dt;
        // smooth it: one fast frame shouldn't flip the state
        this.scrollSpeed = dt > 200 ? v : this.scrollSpeed * 0.6 + v * 0.4;
        this.lastScrollAt = now;
        this.lastScrollY = y;
        if (t) return;
        t = setTimeout(() => {
          t = null;
          this.wakeAll();
        }, 180);
      };
      window.addEventListener("scroll", this.onScroll, { passive: true });
      window.addEventListener("resize", this.onScroll);
    }

    if (this.state.log.length > 0) {
      // re-attached (React strict mode / fast refresh): the session is already open
      if (enabled) this.startWorkers(this.gen);
    } else if (enabled) {
      const subs = this.roster.filter((a) => "parent" in a).length;
      this.log("system", `session opened · ${this.roster.length - subs} agents online${subs ? ` · ${subs} sub-agents on call` : ""}`, "dim");
      this.log("planner", `task received: ${task} · ${this.state.total} nodes`);
      this.startWorkers(this.gen);
    } else {
      this.log("system", "build skipped · rendering final page", "dim");
    }
  }

  detach() {
    this.gen++;
    this.armed.forEach((t) => clearTimeout(t));
    this.armed.clear();
    if (this.onScroll) {
      window.removeEventListener("scroll", this.onScroll);
      window.removeEventListener("resize", this.onScroll);
      this.onScroll = null;
    }
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
    // driven sub-agents have no loop of their own: their Builder moves them
    this.roster.filter((a) => !a.driven).forEach((a) => this.work(a.id, gen));
  }
  /** a Builder's Coder and Styler */
  private crewOf(id: AgentId) {
    const subs = this.roster.filter((a) => a.parent === id && a.driven);
    return { coder: subs.find((a) => a.op === "write")?.id, styler: subs.find((a) => a.op === "style")?.id };
  }

  /* ---- arrival ----------------------------------------------------------- */
  /**
   * A jump (minimap, nav chip, ask box) is scrolling the page for up to `ms`.
   * Nothing it scrolls through starts building; `ms = 0` ends it early.
   */
  jumping(ms: number) {
    this.jumpUntil = ms > 0 ? performance.now() + ms : 0;
  }
  /** the page is flying past — a jump in progress, or the reader scrolling fast */
  private passing() {
    const now = performance.now();
    return now < this.jumpUntil || (now - this.lastScrollAt < 250 && this.scrollSpeed > PASSING_SPEED);
  }
  /**
   * A section starts only once the reader stops on it: it has to stay in view
   * for DWELL_MS while the page is no longer flying past. Jumping from the
   * minimap scrolls through the sections in between without starting them.
   */
  private arm(section: HTMLElement) {
    if (this.armed.has(section)) return;
    const gen = this.gen;
    const check = () => {
      this.armed.delete(section);
      const meta = this.sections.get(section);
      if (gen !== this.gen || !meta || meta.triggered || !this.visible.has(section)) return;
      if (this.passing()) {
        this.armed.set(section, setTimeout(check, 140));
        return;
      }
      // a sliver peeking out under the browser bar after a jump doesn't count
      const r = section.getBoundingClientRect();
      const band = this.visibleBand();
      const seen = Math.min(r.bottom, band.bottom) - Math.max(r.top, band.top);
      if (seen < Math.min(MIN_SEEN_PX, r.height * 0.5)) {
        this.armed.set(section, setTimeout(check, 300));
        return;
      }
      meta.triggered = true;
      this.enqueue(section);
    };
    this.armed.set(section, setTimeout(check, DWELL_MS));
  }

  /* ---- autoscaling ------------------------------------------------------- */
  /** Spawn another agent for `op` when each one has SPAWN_AT or more jobs waiting. */
  private maybeSpawn(op: Op) {
    if (!this.state.enabled) return;
    const pool = SPAWN_COLORS[op];
    const owners = this.owners[op];
    if (!pool || !owners.length) return;
    // on a report only the work on screen can be taken, so only that counts
    const backlog = this.rosterName === "report" ? this.onScreenCount(op) : this.queues[op].length;
    if (backlog / owners.length < SPAWN_AT) return;
    const extra = this.roster.filter((a) => a.op === op && a.spawned).length;
    if (extra >= MAX_EXTRA) return;
    const now = performance.now();
    if (now - (this.lastSpawn[op] ?? -Infinity) < SPAWN_GAP_MS) return;
    this.lastSpawn[op] = now;

    const base = this.def(owners[0]);
    const kind = base.name.split("·")[0];
    const taken = new Set(this.roster.filter((a) => a.op === op).map((a) => a.name));
    let n = 1;
    while (taken.has(`${kind}·${n}`)) n++;
    const id = `${base.id.replace(/\d+$/, "")}+${n}`;
    const def: AgentDef = { id, name: `${kind}·${n}`, op, role: base.role, color: pool[extra % pool.length], spawned: true };
    this.defs.set(id, def);
    // forked from the busiest-looking agent of its kind that is on screen
    const from = owners.find((o) => this.cursors[o].o.get() > 0) ?? owners[0];
    this.spawnFrom[id] = from;
    const c = this.cursors[from];
    this.cursors[id] = { x: motionValue(c.x.get()), y: motionValue(c.y.get()), o: motionValue(0) };

    // a Builder comes with its own Coder and Styler
    const crew: AgentDef[] = [];
    if (op === "build") {
      const sub = (kind: "coder" | "styler", subOp: Op, label: string, role: string) => {
        const sid = `${id}.${kind}`;
        const d: AgentDef = { id: sid, name: `${label}·${n}`, op: subOp, role, color: CREW_COLORS[kind][extra % 4], parent: id, driven: true, spawned: true };
        this.defs.set(sid, d);
        this.cursors[sid] = { x: motionValue(c.x.get()), y: motionValue(c.y.get()), o: motionValue(0) };
        return d;
      };
      crew.push(sub("coder", "write", "Coder", "builder sub-agent · writes"), sub("styler", "style", "Styler", "builder sub-agent · styles, sizes, aligns"));
    }

    // join the roster right after the last agent of the same kind (and its crew)
    const roster = [...this.roster];
    let at = -1;
    roster.forEach((a, i) => (a.op === op || (a.parent && this.def(a.parent).op === op)) && (at = i));
    roster.splice(at + 1, 0, def, ...crew);
    this.syncOwners(roster);
    this.set({
      roster,
      peak: Math.max(this.state.peak, roster.length),
      agents: {
        ...this.state.agents,
        [id]: { status: "idle", op: null, target: "", q: this.share(op), n: 0 },
        ...Object.fromEntries(crew.map((d) => [d.id, { status: "idle" as const, op: null, target: "", q: 0, n: 0 }])),
      },
      pulses: [...this.state.pulses.slice(-12), { id: ++pulseId, from, to: id }],
    });
    this.syncQueue(op);
    this.log("system", `spawn ${def.name}${crew.length ? ` + ${crew.map((d) => d.name).join(", ")}` : ""} · ${op} backlog ${backlog} → split ${owners.length + 1} ways`, "accent");
    this.work(id, this.gen);
  }

  /** jobs in `op`'s queue that are on screen right now */
  private onScreenCount(op: Op) {
    const band = this.visibleBand();
    return this.queues[op].filter((j) => {
      const r = j.plan ? boundsOf([...j.plan, ...(j.chrome ?? [])]) : (j.el ?? j.seg ?? j.section).getBoundingClientRect();
      return r.bottom > band.top + 8 && r.top < band.bottom - 8;
    }).length;
  }

  /** a spawned agent leaves once its kind has had nothing to do for a while */
  private retire(id: AgentId) {
    const def = this.def(id);
    const leaving = this.roster.filter((a) => a.id === id || a.parent === id).map((a) => a.id);
    const roster = this.roster.filter((a) => !leaving.includes(a.id));
    this.syncOwners(roster);
    const agents = { ...this.state.agents };
    leaving.forEach((x) => {
      animate(this.cursors[x].o, 0, { duration: 0.5 });
      delete agents[x];
    });
    this.fixQ.delete(id);
    this.set({ roster, agents });
    this.syncQueue(def.op);
    this.log("system", `retire ${def.name} · ${def.op} queue drained`, "dim");
  }

  /**
   * The page chrome of a section: the largest pieces that are not components
   * and hold none (a search box, a table header row, a rule). CSS hides them
   * until a Planner's sweep reveals them, like the components.
   */
  private chromeOf(section: HTMLElement) {
    const out: HTMLElement[] = [];
    const walk = (el: Element) => {
      for (const c of Array.from(el.children) as HTMLElement[]) {
        if (c.hasAttribute("data-build")) continue;
        if (c.querySelector("[data-build]")) walk(c);
        else out.push(c);
      }
    };
    walk(section);
    return out;
  }

  /* ---- segments ---------------------------------------------------------- */
  /**
   * A section reviews in segments — `[data-seg]` blocks and the section head,
   * with whatever is left over as the section's own segment — so a Critic can
   * start on a finished block while the builders move on to the next one.
   */
  private segOf(el: HTMLElement, section: HTMLElement) {
    const seg = el.closest<HTMLElement>("[data-seg], .sec-head");
    return seg && section.contains(seg) ? seg : section;
  }
  private segName(seg: HTMLElement, section: HTMLElement) {
    const sec = (section.dataset.sec ?? section.id).replace("SEC_", "").toLowerCase();
    if (seg === section) return `${sec}.body`;
    return `${sec}.${seg.dataset.seg ?? (seg.classList.contains("sec-head") ? "head" : "block")}`;
  }
  private segNodes(seg: HTMLElement, section: HTMLElement) {
    return Array.from(seg.querySelectorAll<HTMLElement>("[data-build]")).filter((n) => this.segOf(n, section) === seg);
  }

  /* ---- planning ---------------------------------------------------------- */
  /** The Stylist's mistakes for this section — the Critic will catch them. */
  private planDefects(section: HTMLElement, nodes: HTMLElement[]) {
    let n = 0;
    for (const el of nodes) {
      const d = el.dataset.defect as Defect | undefined;
      if (d) {
        this.defects.set(el, d);
        el.removeAttribute("data-defect");
        n++;
      }
    }
    const pool = nodes.filter((el) => {
      const kind = el.dataset.build;
      return !this.defects.has(el) && (kind === "type" || kind === "para") && (el.textContent ?? "").trim().length > 12;
    });
    const want = 1 + (section.id !== "home" && Math.random() < 0.35 ? 1 : 0);
    while (n < want && pool.length) {
      const el = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      this.defects.set(el, Math.random() < 0.5 ? "contrast" : "kerning");
      n++;
    }
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
    nodes.forEach((n) => (n.dataset.queued = "1"));
    if (!section.dataset.defectsPlanned) {
      section.dataset.defectsPlanned = "1";
      this.planDefects(section, nodes);
    }
    const open = this.openSegs.get(section) ?? new Set<HTMLElement>();
    this.openSegs.set(section, open);
    nodes.forEach((n) => {
      const seg = this.segOf(n, section);
      open.add(seg);
      this.remaining.set(seg, Math.max(0, this.remaining.get(seg) ?? 0) + 1);
    });
    this.sectionStart.set(section, performance.now());
    if (this.state.startedAt === null) this.set({ startedAt: performance.now() });
    section.dataset.phase = "building";
    this.setSection(section.id, "building");
    // Nothing is handed out until a Planner has scanned it: one planning job
    // per segment, so the part on screen can be planned (and built) first.
    // The page chrome around the components (search box, table header,
    // section rules) is hidden too, and revealed by the same sweep.
    const bySeg = new Map<HTMLElement, { plan: HTMLElement[]; chrome: HTMLElement[] }>();
    const slot = (seg: HTMLElement) => bySeg.get(seg) ?? (bySeg.set(seg, { plan: [], chrome: [] }), bySeg.get(seg)!);
    nodes.forEach((n) => slot(this.segOf(n, section)).plan.push(n));
    this.chromeOf(section)
      .filter((c) => !this.chromeQueued.has(c))
      .forEach((c) => {
        this.chromeQueued.add(c);
        slot(this.segOf(c, section)).chrome.push(c);
      });
    this.log("system", `task ${section.dataset.sec ?? section.id} · ${nodes.length} nodes in ${bySeg.size} segment${bySeg.size > 1 ? "s" : ""} → planners`, "dim");
    bySeg.forEach(({ plan, chrome }, seg) => this.push({ op: "create", section, seg, plan, chrome }));
  }

  private push(job: Job, from?: AgentId) {
    this.queues[job.op].push(job);
    const owners = this.owners[job.op];
    const to = owners.find((id) => this.state.agents[id].status === "idle") ?? owners[0];
    if (from && from !== to) this.set({ pulses: [...this.state.pulses.slice(-12), { id: ++pulseId, from, to }] });
    this.syncQueue(job.op);
    const w = this.waiters[job.op].shift();
    w?.();
    this.maybeSpawn(job.op);
  }

  private wakeAll() {
    OPS.forEach((op) => this.wakeOp(op));
  }

  /**
   * Next job: whatever is on screen right now comes first — even a sliver
   * of a section — top-down; then the rest, nearest to the viewport first.
   * For Planners, planning a segment beats framing a block in the same band,
   * since a plan unblocks everyone else.
   */
  private take(op: Op) {
    const q = this.queues[op];
    if (q.length === 0) return undefined;
    const band = this.visibleBand();
    // a report is read inside IDE chrome: its agents only take what is on screen
    const onlyVisible = this.rosterName === "report";
    let best = -1;
    let bestKey = Infinity;
    for (let i = 0; i < q.length; i++) {
      const j = q[i];
      // a planning job sits where its components are, not where its segment box starts
      const r = j.plan ? boundsOf([...j.plan, ...(j.chrome ?? [])]) : (j.el ?? j.seg ?? j.section).getBoundingClientRect();
      const onScreen = r.bottom > band.top + 8 && r.top < band.bottom - 8;
      const dist = onScreen ? Math.max(0, r.top - band.top) : r.top >= band.bottom ? r.top - band.bottom : band.top - r.bottom;
      if (onlyVisible && !onScreen) continue;
      const key = (onScreen ? 0 : 2e6) + (j.plan ? 0 : 1e6) + Math.min(dist, 9e5);
      if (key < bestKey) {
        bestKey = key;
        best = i;
      }
    }
    if (best < 0) return undefined;
    const job = q.splice(best, 1)[0];
    this.syncQueue(op);
    return job;
  }

  /** the part of the viewport the reader can see: below the chrome, above the bottom panel */
  private visibleBand() {
    const top = (document.querySelector<HTMLElement>(".chrome")?.getBoundingClientRect().bottom ?? 0) | 0;
    let bottom = window.innerHeight;
    for (const sel of [".ide-bottom", ".ide-status"]) {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.top < bottom) bottom = r.top;
    }
    return { top, bottom };
  }

  private wait(op: Op, ms: number) {
    return Promise.race([new Promise<void>((r) => this.waiters[op].push(r)), sleep(ms)]);
  }

  private async work(id: AgentId, gen: number) {
    const op = this.def(id).op;
    const cur = this.cursors[id];
    let idleSince = performance.now();
    while (gen === this.gen) {
      // a Builder handles the Critic's findings on its own work before new work
      const fix = this.fixQ.get(id)?.shift();
      if (fix) {
        await this.fixNode(id, fix, gen);
        idleSince = performance.now();
        continue;
      }
      const job = this.take(op);
      if (!job) {
        if (!this.roster.some((a) => a.id === id)) return; // retired
        if (this.state.agents[id].status !== "idle") this.setAgent(id, { status: "idle", op: null, target: "" });
        await this.wait(op, 1500 + Math.random() * 900);
        if (gen !== this.gen) return;
        if (this.fixQ.get(id)?.length) continue;
        // on a report, work below the fold doesn't keep a spawned agent on shift
        const waiting = this.rosterName === "report" ? this.onScreenCount(op) : this.queues[op].length;
        if (this.def(id).spawned && waiting === 0 && performance.now() - idleSince > RETIRE_MS) {
          this.retire(id);
          return;
        }
        // nothing left — or, on a report, nothing *visible* left: either way the cursor leaves
        if (this.queues[op].length === 0 || this.rosterName === "report") {
          // Idle: drift a little, then fade so nothing hovers over the reading.
          // Sub-agents leave as soon as their call is done.
          const linger = this.def(id).parent ? 500 : 2400;
          if (performance.now() - idleSince > linger) {
            animate(cur.o, 0, { duration: 0.8 });
            // a Builder's crew leaves with it
            const crew = this.crewOf(id);
            [crew.coder, crew.styler].forEach((c) => c && animate(this.cursors[c].o, 0, { duration: 0.8 }));
          }
          else {
            animate(cur.x, cur.x.get() + rand(-30, 30), { duration: 1.8, ease: "easeInOut" });
            animate(cur.y, cur.y.get() + rand(-20, 20), { duration: 1.8, ease: "easeInOut" });
          }
        }
        continue;
      }
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
  /** on a report, keep a cursor target inside the visible band (root coordinates) */
  private clampY(y: number) {
    if (this.rosterName !== "report" || !this.root) return y;
    const band = this.visibleBand();
    const o = this.root.getBoundingClientRect().top;
    return clamp(y, band.top - o + 6, band.bottom - o - 26);
  }

  private async fly(id: AgentId, x: number, rawY: number, gen: number) {
    const y = this.clampY(rawY);
    const cur = this.cursors[id];
    if (cur.o.get() < 1) {
      // reappear near the target instead of streaking across the page;
      // sub-agents spawn out of the Stylist's cursor
      if (cur.o.get() === 0) {
        const parent = this.spawnFrom[id] ?? this.def(id).parent;
        const from = parent ? this.cursors[parent] : null;
        cur.x.set(from && from.o.get() > 0 ? from.x.get() : x + rand(-90, 90));
        cur.y.set(from && from.o.get() > 0 ? from.y.get() : y + rand(40, 110));
      }
      animate(cur.o, 1, { duration: 0.35 });
    }
    const dist = Math.hypot(x - cur.x.get(), y - cur.y.get());
    const d = clamp(dist / 1100, 0.38, 0.95);
    await Promise.all([animate(cur.x, x, { duration: d, ease: FLY }), animate(cur.y, y, { duration: d, ease: FLY })]);
    return gen === this.gen;
  }

  private async drag(id: AgentId, x: number, rawY: number, ms: number, ease: typeof EASE | "linear" = EASE) {
    const y = this.clampY(rawY);
    const cur = this.cursors[id];
    await Promise.all([animate(cur.x, x, { duration: ms / 1000, ease }), animate(cur.y, y, { duration: ms / 1000, ease })]);
  }

  /* ---- the operations ---------------------------------------------------- */
  private async perform(id: AgentId, job: Job, gen: number) {
    if (job.op === "review") return this.review(id, job.section, job.seg ?? job.section, gen);
    if (job.plan) return this.planSeg(id, job, gen);
    return this.buildNode(id, job, gen);
  }

  /**
   * A Planner scans one segment — the part of it on screen — then hands every
   * node to the Builders. Until this runs nobody touches it.
   */
  private async planSeg(id: AgentId, job: Job, gen: number) {
    const { section } = job;
    const seg = job.seg ?? section;
    const all = job.plan!.filter((n) => n.isConnected);
    job.plan!.filter((n) => !n.isConnected).forEach((n) => this.tick(section, n));
    const allChrome = (job.chrome ?? []).filter((c) => c.isConnected);
    if ((!all.length && !allChrome.length) || !this.root) return;
    // Plan only what is on screen; the rest of the segment waits for its own
    // planning job, so nothing below the fold shows up as an empty box early.
    const band0 = this.visibleBand();
    const seen = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.bottom > band0.top + 8 && r.top < band0.bottom - 8;
    };
    let nodes = all;
    let chrome = allChrome;
    let rest: Job | null = null;
    if (all.some(seen) || allChrome.some(seen)) {
      nodes = all.filter(seen);
      chrome = allChrome.filter(seen);
      const restPlan = all.filter((n) => !nodes.includes(n));
      const restChrome = allChrome.filter((c) => !chrome.includes(c));
      if (restPlan.length || restChrome.length) rest = { op: "create", section, seg, plan: restPlan, chrome: restChrome };
    }
    const name = this.segName(seg, section);
    this.setAgent(id, { status: "moving", op: "create", target: `plan ${name}` });

    // sweep only the area of the components being planned — a segment that is
    // "the rest of the section" (e.g. one status line) must not sweep the whole section
    const o = this.root.getBoundingClientRect();
    const u = boundsOf([...nodes, ...chrome]);
    const b = { x: u.left - o.left, y: u.top - o.top, w: u.right - u.left, h: u.bottom - u.top };
    const band = this.visibleBand();
    const vTop = band.top - o.top;
    const vBot = band.bottom - o.top;
    let top = Math.max(b.y, vTop);
    let bot = Math.min(b.y + b.h, vBot);
    if (bot - top < 24) {
      top = b.y;
      bot = b.y + Math.min(b.h, 220);
    }
    if (!(await this.fly(id, b.x + 10, top + 8, gen))) return;
    this.setAgent(id, { status: "working" });
    // the scan outline marks a real part of the section; leftovers get only the per-node flash
    const outline = seg !== section;
    seg.style.setProperty("--agent", this.def(id).color);
    if (outline) seg.dataset.planning = "1";
    const ms = Math.round(clamp(380 + nodes.length * 45, 480, 950));
    // each node's empty box (and the chrome around it) appears as the sweep reaches it (top → bottom)
    const reveal = (n: HTMLElement) => (n.dataset.planned = "1");
    const shown = [...nodes, ...chrome];
    const timers = shown.map((n) => {
      const y = this.rel(n).y;
      const at = clamp((y - top) / Math.max(1, bot - top), 0, 1);
      return setTimeout(() => reveal(n), at * ms * 0.9);
    });
    await this.drag(id, b.x + Math.max(40, b.w * 0.82), bot - 10, ms);
    timers.forEach(clearTimeout);
    shown.forEach(reveal);
    delete seg.dataset.planning;
    if (gen !== this.gen) return;
    if (rest) this.push(rest);

    this.log(id, nodes.length ? `plan ${name} · ${nodes.length} component${nodes.length > 1 ? "s" : ""} → builders${rest ? " · rest when in view" : ""}` : `plan ${name} · layout`);
    this.setAgent(id, { n: this.state.agents[id].n + 1 });
    // one hand-off pulse to the Builders, not one per node
    nodes.forEach((el, i) => this.push({ op: "build", section, el }, i ? undefined : id));
    await sleep(100);
  }

  /** Walk one finished segment, then fix each of the Stylist's mistakes in it. */
  private async review(id: AgentId, section: HTMLElement, seg: HTMLElement, gen: number) {
    if (!section.isConnected || !this.root) return;
    const name = this.segName(seg, section);
    const nodes = this.segNodes(seg, section);
    const broken = nodes.filter((n) => n.dataset.defect);
    this.setAgent(id, { status: "moving", op: "review", target: name });
    if (this.state.sections[section.id] !== "done") {
      section.dataset.phase = "review";
      this.setSection(section.id, "review");
    }

    if (nodes.length) {
      const first = this.rel(nodes[0]);
      const last = this.rel(nodes[nodes.length - 1]);
      if (!(await this.fly(id, first.x + first.w + 12, first.y + 6, gen))) return;
      this.setAgent(id, { status: "working" });
      await this.drag(id, Math.min(first.x + first.w + 12, last.x + last.w - 12), last.y + Math.min(last.h, 40), clamp(300 + nodes.length * 90, 450, 900));
    }

    for (const el of broken) {
      if (gen !== this.gen || !el.isConnected) return;
      const defect = el.dataset.defect as Defect;
      const label = el.dataset.label ?? "node";
      const b = this.rel(el);
      const px = b.x + Math.min(b.w - 10, 40);
      const py = b.y + Math.min(b.h * 0.5, 24);
      this.setAgent(id, { status: "moving", target: label });
      if (!(await this.fly(id, px, py, gen))) return;
      this.setAgent(id, { status: "working" });
      el.dataset.review = "flag";
      el.dataset.reviewNote = DEFECT_NOTE[defect][0];
      this.log(id, `flag ${label} · ${DEFECT_NOTE[defect][0].slice(2)}`, "warn");
      await sleep(900);
      if (gen !== this.gen) return;
      // send it back to whoever built it: their Styler owns size, alignment, colour and type
      const builder = this.fixerFor(el);
      const { styler } = this.crewOf(builder);
      this.fixQ.set(builder, [...(this.fixQ.get(builder) ?? []), { el, defect, section, seg }]);
      this.segFixes.set(seg, (this.segFixes.get(seg) ?? 0) + 1);
      this.log(id, `→ ${this.def(builder).name} · ${styler ? this.def(styler).name : "styler"} to fix ${label}`, "dim");
      this.set({ pulses: [...this.state.pulses.slice(-12), { id: ++pulseId, from: id, to: styler ?? builder }] });
      this.wakeOp("build");
    }
    if (gen !== this.gen) return;

    const sentBack = broken.length > 0;
    const fixed = broken.length ? ` · ${broken.length} fix${broken.length > 1 ? "es" : ""}${sentBack ? " sent back" : ""}` : "";
    this.log(id, `${sentBack ? "◐" : "✓"} ${name} · ${nodes.length} nodes${fixed}`, sentBack ? "dim" : "ok");
    this.setAgent(id, { n: this.state.agents[id].n + 1 });
    // a segment with fixes out closes when the last one lands (fixNode)
    if (!sentBack) this.closeSeg(section, seg, id);
    await sleep(150);
  }

  private closeSeg(section: HTMLElement, seg: HTMLElement, by: AgentId) {
    const open = this.openSegs.get(section);
    open?.delete(seg);
    if (!open || open.size === 0) {
      this.finishSection(section);
      const t0 = this.sectionStart.get(section) ?? performance.now();
      this.log(by, `✓ review passed ${section.dataset.sec ?? section.id} · ${((performance.now() - t0) / 1000).toFixed(1)}s`, "ok");
    }
  }

  /** the Builder that built `el` — or, if it has since retired, whichever Builder is on shift */
  private fixerFor(el: HTMLElement): AgentId {
    const b = this.builtBy.get(el);
    if (b && this.roster.some((a) => a.id === b)) return b;
    return this.owners.build[0];
  }

  private wakeOp(op: Op) {
    const w = this.waiters[op];
    this.waiters[op] = [];
    w.forEach((r) => r());
  }

  /* ---- the Builder ------------------------------------------------------- */
  /**
   * One Builder, one component, one pass: its Coder streams the text in while
   * its Styler follows a beat behind, styling what has landed and placing the
   * media. Size and alignment are the Styler's job too, so nothing is handed on.
   */
  private async buildNode(id: AgentId, job: Job, gen: number) {
    const el = job.el!;
    if (!el.isConnected || !this.root) return this.tick(job.section, el);
    const { coder, styler } = this.crewOf(id);
    if (!coder || !styler) return this.tick(job.section, el);
    const label = el.dataset.label ?? el.dataset.build ?? "node";
    const kind = el.dataset.build ?? "block";
    const text = (el.textContent ?? "").trim().length;
    const t0 = performance.now();
    this.builtBy.set(el, id);
    this.setAgent(id, { status: "working", op: "build", target: label });
    this.set({ pulses: [...this.state.pulses.slice(-12), { id: ++pulseId, from: id, to: text ? coder : styler }] });
    let detail = "";

    if (kind === "frame" || text === 0) {
      // nothing to write: the Styler draws the frame / paints the surface
      el.style.setProperty("--agent", this.def(styler).color);
      const b = this.rel(el);
      this.setAgent(styler, { status: "moving", op: "style", target: label });
      if (!(await this.fly(styler, b.x - 4, b.y - 4, gen))) return;
      this.setAgent(styler, { status: "working" });
      const ms = Math.round(clamp(420 + Math.hypot(b.w, b.h) * 0.35, 520, 950));
      el.style.setProperty("--dur", `${ms}ms`);
      if (kind === "frame") el.dataset.state = "creating";
      else {
        el.dataset.mode = "paint";
        el.dataset.state = "building";
      }
      await Promise.all([sleep(ms), this.drag(styler, b.x + b.w * 0.9, b.y + b.h * 0.8, ms)]);
      if (gen !== this.gen) return;
      detail = kind === "frame" ? `frame ${Math.round(b.w)}×${Math.round(b.h)}` : "surface";
    } else {
      const b = this.rel(el);
      // index rows are short labels — they type in faster than prose
      const ms = Math.round(this.rosterName === "page" ? clamp(text * 6, 450, 850) : kind === "type" ? clamp(text * 22, 600, 1300) : clamp(text * 3.2, 850, 1700));
      el.style.setProperty("--agent", this.def(coder).color);
      el.style.setProperty("--dur", `${ms}ms`);
      el.style.setProperty("--steps", String(clamp(Math.round(text / 1.4), 8, 48)));
      const tx = b.x + Math.min(10, b.w * 0.1);
      const ty = b.y + Math.min(b.h * 0.55, 22);
      // the Styler heads over while the Coder starts — no waiting for a hand-off
      this.setAgent(coder, { status: "moving", op: "write", target: label });
      this.setAgent(styler, { status: "moving", op: "style", target: label });
      const stylerIn = this.fly(styler, b.x + Math.min(14, b.w * 0.1), b.y + Math.min(b.h * 0.5, 26), gen);
      if (!(await this.fly(coder, tx, ty, gen))) return;
      el.dataset.raw = "1";
      const words = this.streamStart(el, coder);
      el.dataset.mode = words ? "stream" : "write";
      el.dataset.state = "building";
      this.setAgent(coder, { status: "working" });

      const writing = Promise.all([
        words ? this.streamRun(el, words, ms, gen) : sleep(ms),
        kind === "type" ? this.drag(coder, b.x + b.w, ty, ms, "linear") : this.drag(coder, tx + rand(0, Math.min(60, b.w * 0.3)), b.y + b.h - 8, ms, "linear"),
      ]);
      const styling = (async () => {
        if (!(await stylerIn)) return;
        // streamed text can be styled as it lands; a wipe has to finish first
        await (words ? sleep(ms * 0.3) : writing);
        if (gen !== this.gen) return;
        const sms = Math.round(words ? Math.max(600, ms * 0.75) : clamp(520 + b.h * 0.6, 600, 1000));
        el.style.setProperty("--agent", this.def(styler).color);
        el.style.setProperty("--dur", `${sms}ms`);
        delete el.dataset.raw;
        el.dataset.state = "styling";
        this.setAgent(styler, { status: "working" });
        await Promise.all([sleep(sms), this.drag(styler, b.x + b.w * 0.88, b.y + b.h * 0.72, sms)]);
      })();
      await Promise.all([writing, styling]);
      if (gen !== this.gen) return;
      const media = el.querySelectorAll("img, svg").length;
      detail = `${words ? `${words.length} words` : `${text} chars`} + styled${media ? ` · ${media} icon${media > 1 ? "s" : ""} placed` : ""}`;
      this.setAgent(coder, { status: "idle", op: null, target: "", n: this.state.agents[coder].n + 1 });
    }

    this.setAgent(styler, { status: "idle", op: null, target: "", n: this.state.agents[styler].n + 1 });
    const defect = this.defects.get(el);
    this.complete(el, true);
    if (defect) el.dataset.defect = defect; // a slip the Styler doesn't notice — the Critic will
    this.log(id, `build ${label} · ${detail} · ${Math.round(performance.now() - t0)}ms`);
    this.setAgent(id, { n: this.state.agents[id].n + 1 });
    this.tick(job.section, el, id);
    await sleep(100);
  }

  /** the Builder's Styler fixes what the Critic flagged on this Builder's work */
  private async fixNode(id: AgentId, fix: Fix, gen: number) {
    const { el, defect, section, seg } = fix;
    const { styler } = this.crewOf(id);
    const label = el.dataset.label ?? "node";
    const done = () => {
      const left = (this.segFixes.get(seg) ?? 1) - 1;
      this.segFixes.set(seg, left);
      if (left <= 0) {
        this.segFixes.delete(seg);
        this.log(id, `✓ ${this.segName(seg, section)} · fixes landed`, "ok");
        this.closeSeg(section, seg, id);
      }
    };
    if (!el.isConnected || !styler || !this.root) {
      delete el.dataset.defect;
      return done();
    }
    this.setAgent(id, { status: "working", op: "build", target: `fix ${label}` });
    this.setAgent(styler, { status: "moving", op: "style", target: `fix ${label}` });
    const b = this.rel(el);
    const px = b.x + Math.min(b.w - 10, 40);
    const py = b.y + Math.min(b.h * 0.5, 24);
    if (!(await this.fly(styler, px, py, gen))) return;
    this.setAgent(styler, { status: "working" });
    el.dataset.fixing = "1";
    delete el.dataset.defect;
    await Promise.all([sleep(700), this.drag(styler, px + 18, py + 10, 700)]);
    if (gen !== this.gen) return;
    el.dataset.review = "fixed";
    el.dataset.reviewNote = DEFECT_NOTE[defect][1];
    this.log(styler, `fix ${label} · ${DEFECT_NOTE[defect][1].slice(2)}`, "ok");
    this.set({ fixes: this.state.fixes + 1 });
    await sleep(650);
    delete el.dataset.review;
    delete el.dataset.reviewNote;
    delete el.dataset.fixing;
    this.setAgent(styler, { status: "idle", op: null, target: "", n: this.state.agents[styler].n + 1 });
    done();
  }

  private complete(el: HTMLElement, count: boolean) {
    if (el.dataset.state === "done") return;
    el.getAnimations().forEach((a) => a.cancel());
    delete el.dataset.raw;
    delete el.dataset.mode;
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

  private tick(section: HTMLElement, el: HTMLElement, from?: AgentId) {
    const seg = this.segOf(el, section);
    const left = (this.remaining.get(seg) ?? 1) - 1;
    this.remaining.set(seg, left);
    if (left <= 0) this.push({ op: "review", section, seg }, from);
  }

  private finishSection(section: HTMLElement) {
    section.dataset.phase = "done";
    this.setSection(section.id, "done");
  }

  /* ---- controls ---------------------------------------------------------- */
  /** empty every queue, send spawned agents home, and put the base roster back */
  private resetAgents() {
    const agents = {} as SwarmState["agents"];
    OPS.forEach((op) => (this.queues[op] = []));
    Object.entries(this.cursors).forEach(([id, c]) => {
      animate(c.o, 0, { duration: 0.3 });
      if (this.defs.has(id) && !this.def(id).spawned) agents[id] = { status: "idle", op: null, target: "", q: 0, n: 0 };
    });
    this.syncOwners(this.baseRoster);
    this.lastSpawn = {};
    this.fixQ.clear();
    this.segFixes.clear();
    this.builtBy = new WeakMap();
    this.armed.forEach((t) => clearTimeout(t));
    this.armed.clear();
    this.state = { ...this.state, roster: this.baseRoster, peak: this.baseRoster.length };
    return agents;
  }

  /* ---- token streaming ---------------------------------------------------- */
  /** hide el's text and place a caret; null when streaming isn't possible here */
  private streamStart(el: HTMLElement, id: AgentId): Boundary[] | null {
    const hl = streamHighlight();
    if (!hl || this.streams.has(el)) return null;
    const words = wordBoundaries(el);
    if (words.length < 2) return null;
    const range = document.createRange();
    range.selectNodeContents(el);
    hl.add(range);
    const caret = document.createElement("span");
    caret.className = "stream-caret";
    caret.setAttribute("aria-hidden", "true");
    caret.style.setProperty("--agent", this.def(id).color);
    document.body.appendChild(caret);
    this.streams.set(el, { range, caret });
    this.placeCaret(caret, el, null);
    return words;
  }

  /** reveal words in token-like chunks across `ms`, the same budget the wipe used */
  private async streamRun(el: HTMLElement, words: Boundary[], ms: number, gen: number) {
    const s = this.streams.get(el);
    if (!s) return sleep(ms);
    const ends = chunkEnds(words.length);
    const weights = ends.map(() => rand(0.55, 1.45));
    const total = weights.reduce((a, b) => a + b, 0);
    const budget = ms * 0.94;
    const t0 = performance.now();
    let acc = 0;
    for (let k = 0; k < ends.length; k++) {
      acc += weights[k];
      const wait = t0 + (budget * acc) / total - performance.now();
      if (wait > 0) await sleep(wait);
      if (gen !== this.gen || !el.isConnected || this.streams.get(el) !== s) return this.streamEnd(el);
      const b = words[ends[k] - 1];
      try {
        s.range.setStart(b.node, Math.min(b.off, b.node.length));
      } catch {
        break; // the text changed under us (live React text): just finish
      }
      this.placeCaret(s.caret, el, b);
    }
    const rest = t0 + ms - performance.now();
    if (rest > 0) await sleep(rest);
    this.streamEnd(el);
  }

  private placeCaret(caret: HTMLElement, el: HTMLElement, b: Boundary | null) {
    const r = document.createRange();
    if (b) r.setStart(b.node, Math.min(b.off, b.node.length));
    else r.setStart(el, 0);
    r.collapse(true);
    let rect: DOMRect | undefined = r.getClientRects()[0];
    if (!rect || (!rect.height && !rect.width)) {
      const box = el.getBoundingClientRect();
      rect = new DOMRect(box.left, box.top, 0, 0);
    }
    const h = rect.height || parseFloat(getComputedStyle(el).fontSize) * 1.2 || 16;
    caret.style.transform = `translate(${rect.left + window.scrollX}px, ${rect.top + window.scrollY}px)`;
    caret.style.height = `${h}px`;
  }

  private streamEnd(el: HTMLElement) {
    const s = this.streams.get(el);
    if (!s) return;
    streamHL?.delete(s.range);
    s.caret.remove();
    this.streams.delete(el);
  }

  private clearStreams() {
    [...this.streams.keys()].forEach((el) => this.streamEnd(el));
  }

  private clearMarks(n: HTMLElement) {
    n.getAnimations().forEach((a) => a.cancel());
    ["raw", "mode", "defect", "review", "reviewNote", "fixing", "planned"].forEach((k) => delete n.dataset[k]);
  }

  skip() {
    this.gen++;
    this.clearStreams();
    try {
      localStorage.setItem("swarm-skip", "1");
    } catch {}
    document.documentElement.classList.remove("build-on");
    this.root?.querySelectorAll<HTMLElement>("[data-build]").forEach((n) => {
      this.clearMarks(n);
      this.complete(n, false);
    });
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
    this.clearStreams();
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
      // planned mistakes are re-planned per run
      this.clearMarks(n);
      const d = this.defects.get(n);
      if (d && n.closest("#home")) n.dataset.defect = d;
      this.defects.delete(n);
      delete n.dataset.state;
      delete n.dataset.queued;
      n.dispatchEvent(new CustomEvent("swarm:reset"));
    });
    this.root?.querySelectorAll<HTMLElement>("[data-defects-planned]").forEach((s) => delete s.dataset.defectsPlanned);
    this.root?.querySelectorAll<HTMLElement>("[data-planned]").forEach((el) => delete el.dataset.planned);
    this.chromeQueued = new WeakSet();
    this.remaining.clear();
    this.openSegs.clear();
    html.classList.add("build-on");
    this.set({ enabled: true, done: 0, fixes: 0, startedAt: null, elapsed: null, agents: this.resetAgents(), pulses: [] });
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
