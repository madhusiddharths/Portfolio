/* =============================================================================
   Swarm engine — the "agentic browser" build.
   A tiny external store + a pipeline of agents. When a section scrolls into
   view its [data-build] nodes enter the pipeline, in this order:

     Planner    create  frames a block (deliberately a little off-size / off-grid)
     Coder ×2   write   types the text in — raw, unstyled markup
     Stylist    style   applies the styles and places images / icons
       ↳ Sizer  resize  sub-agent: drags the corner to the real size
       ↳ Aligner place  sub-agent: nudges the block onto the grid
     Critic     review  walks the finished section and fixes the Stylist's
                        mistakes (an overlap, low contrast, cramped kerning)

   Each op has one queue; every agent that owns the op pulls from it, so the
   two Coders share the writing.

   On the landing page the run behaves like a real orchestrated job:
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

export const AGENTS = [
  { id: "planner", name: "Planner·1", op: "create", role: "frames blocks", color: "#c8ff4d" },
  { id: "planner2", name: "Planner·2", op: "create", role: "frames blocks", color: "#8fe36a" },
  { id: "coder", name: "Coder·1", op: "write", role: "writes markup", color: "#4de1ff" },
  { id: "coder2", name: "Coder·2", op: "write", role: "writes markup", color: "#6f9bff" },
  { id: "coder3", name: "Coder·3", op: "write", role: "writes markup", color: "#3fd0c0" },
  { id: "coder4", name: "Coder·4", op: "write", role: "writes markup", color: "#8ab4ff" },
  { id: "coder5", name: "Coder·5", op: "write", role: "writes markup", color: "#5fe3ff" },
  { id: "coder6", name: "Coder·6", op: "write", role: "writes markup", color: "#4fb8a8" },
  { id: "stylist", name: "Stylist·1", op: "style", role: "styles + places media", color: "#ff6bd6" },
  { id: "stylist2", name: "Stylist·2", op: "style", role: "styles + places media", color: "#ff8f9f" },
  { id: "stylist3", name: "Stylist·3", op: "style", role: "styles + places media", color: "#e58cff" },
  { id: "sizer", name: "Sizer", op: "resize", role: "stylist sub-agent", color: "#a78bff", parent: "stylist" },
  { id: "aligner", name: "Aligner", op: "place", role: "stylist sub-agent", color: "#5dffc4", parent: "stylist" },
  { id: "sizer2", name: "Sizer·2", op: "resize", role: "stylist sub-agent", color: "#c4b0ff", parent: "stylist2" },
  { id: "aligner2", name: "Aligner·2", op: "place", role: "stylist sub-agent", color: "#9dffd9", parent: "stylist2" },
  { id: "critic", name: "Critic·1", op: "review", role: "reviews + fixes", color: "#ffb547" },
  { id: "critic2", name: "Critic·2", op: "review", role: "reviews + fixes", color: "#ffd56b" },
] as const;

type StaticId = (typeof AGENTS)[number]["id"];
/** Static agents use their AGENTS id; agents spawned at runtime get a generated one. */
export type AgentId = string;

/**
 * Who is on shift. The landing page is a design job (planners, stylists and
 * their sub-agents, critics); a field report is mostly text, so it gets a
 * planner for the figures, six coders writing in parallel, one stylist for
 * media and one critic. The other pages (the work index) are rows of short
 * labels, so they get a styling crew: three stylists and two Sizer / Aligner
 * pairs, so the last rows are fixed side by side rather than one after another.
 */
export const ROSTERS = {
  // the landing page starts lean — one of each — and spawns more as the work piles up
  home: ["planner", "coder", "stylist", "sizer", "aligner", "critic"],
  report: ["planner", "coder", "coder2", "coder3", "coder4", "coder5", "coder6", "stylist", "critic"],
  // the work index, coming-soon, 404: short labels, lots of layout — a styling crew
  page: ["planner", "planner2", "coder", "coder2", "coder3", "stylist", "stylist2", "stylist3", "sizer", "sizer2", "aligner", "aligner2", "critic"],
} as const satisfies Record<string, readonly StaticId[]>;
export type RosterName = keyof typeof ROSTERS;
export type Op = (typeof AGENTS)[number]["op"];
/** One agent on shift: a static one from AGENTS, or one spawned to split a backlog. */
export type AgentDef = { id: AgentId; name: string; op: Op; role: string; color: string; parent?: AgentId; spawned?: boolean };
export type RosterAgent = AgentDef;
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
type Job = { op: Op; section: HTMLElement; el?: HTMLElement; seg?: HTMLElement; plan?: HTMLElement[] };
type Cursor = { x: MotionValue<number>; y: MotionValue<number>; o: MotionValue<number> };
type Pose = { dx: number; dy: number; sx: number; sy: number };
type Box = { x: number; y: number; w: number; h: number };

const OPS: Op[] = ["create", "write", "style", "resize", "place", "review"];

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
  write: ["#6f9bff", "#3fd0c0", "#8ab4ff", "#5fe3ff"],
  style: ["#ff8f9f", "#e58cff", "#ffa3c4", "#c77dff"],
  review: ["#ffd56b", "#ffc98a", "#f5a623", "#ffe39a"],
};
/** a section has to stay on screen this long (and the page has to have slowed down) before it starts */
const DWELL_MS = 420;
/** px per ms — faster than this, the reader is passing through, not reading */
const PASSING_SPEED = 1.1;
/** how much of a section has to be on screen, below the browser bar, for it to start */
const MIN_SEEN_PX = 80;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const sign = () => (Math.random() < 0.5 ? -1 : 1);

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
/** One curve for the CSS wipe, the WAAPI resize/nudge and the cursor drag. */
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
const EASE_CSS = "cubic-bezier(0.65, 0, 0.35, 1)";
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
  private listeners = new Set<() => void>();
  private root: HTMLElement | null = null;
  private queues = {} as Record<Op, Job[]>;
  private waiters = {} as Record<Op, (() => void)[]>;
  private plans = new WeakMap<HTMLElement, Op[]>();
  private poses = new WeakMap<HTMLElement, Pose>();
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
    const ids = new Set<string>(ROSTERS[roster]);
    AGENTS.forEach((a) => this.defs.set(a.id, { ...a } as AgentDef));
    this.baseRoster = AGENTS.filter((a) => ids.has(a.id)).map((a) => this.defs.get(a.id)!);
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
    this.owners = Object.fromEntries(OPS.map((op) => [op, roster.filter((a) => a.op === op).map((a) => a.id)])) as Record<Op, AgentId[]>;
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
            // the landing page only starts a section the reader actually stops at
            if (this.rosterName === "home") this.arm(el);
            else {
              meta.triggered = true;
              this.enqueue(el);
            }
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

    // Report and landing agents work on what is visible first — a scroll may hand
    // them new work. The landing page also tracks scroll speed, so a section the
    // reader only flies past (a jump from the minimap) never starts building.
    if (this.rosterName === "report" || this.rosterName === "home") {
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
    this.roster.forEach((a) => this.work(a.id, gen));
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
    if (this.rosterName !== "home" || !this.state.enabled) return;
    const pool = SPAWN_COLORS[op];
    const owners = this.owners[op];
    if (!pool || !owners.length) return;
    if (this.queues[op].length / owners.length < SPAWN_AT) return;
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

    // join the roster right after the last agent of the same kind
    const roster = [...this.roster];
    let at = -1;
    roster.forEach((a, i) => a.op === op && (at = i));
    roster.splice(at + 1, 0, def);
    this.syncOwners(roster);
    const backlog = this.queues[op].length;
    this.set({
      roster,
      peak: Math.max(this.state.peak, roster.length),
      agents: { ...this.state.agents, [id]: { status: "idle", op: null, target: "", q: this.share(op), n: 0 } },
      pulses: [...this.state.pulses.slice(-12), { id: ++pulseId, from, to: id }],
    });
    this.syncQueue(op);
    this.log("system", `spawn ${def.name} · ${op} backlog ${backlog} → split ${owners.length + 1} ways`, "accent");
    this.work(id, this.gen);
  }

  /** a spawned agent leaves once its kind has had nothing to do for a while */
  private retire(id: AgentId) {
    const def = this.def(id);
    const roster = this.roster.filter((a) => a.id !== id);
    this.syncOwners(roster);
    animate(this.cursors[id].o, 0, { duration: 0.5 });
    const agents = { ...this.state.agents };
    delete agents[id];
    this.set({ roster, agents });
    this.syncQueue(def.op);
    this.log("system", `retire ${def.name} · ${def.op} queue drained`, "dim");
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
  /**
   * Which stages a node goes through. `data-ops` on the node overrides.
   * Text is always written first (Coder), then styled (Stylist); one-line
   * labels are written straight into their final style.
   */
  private plan(el: HTMLElement): Op[] {
    const staffed = (ops: Op[]) => ops.filter((o) => this.owners[o].length > 0);
    const forced = el.dataset.ops;
    if (forced) return staffed(forced.split(",").map((s) => s.trim() as Op).filter((o) => OPS.includes(o)));
    if (this.rosterName === "report") {
      // prose is written straight into its final style; figures and code are framed and styled
      const kind = el.dataset.build ?? "block";
      const hasText = (el.textContent ?? "").trim().length > 0;
      if (kind === "type" || kind === "para" || kind === "list") return ["write"];
      if (kind === "frame") return ["create"];
      return staffed(hasText && kind !== "media" ? ["create", "write", "style"] : ["create", "style"]);
    }
    const ops = staffed(this.basePlan(el));
    if (this.rosterName === "page" && ops.includes("resize")) {
      // On the index most rows land right the first time: only about a third are
      // framed off-size / off-grid. The rest skip the Planner, Sizer and Aligner.
      if (Math.random() > 0.35) return ops.filter((o) => o !== "create" && o !== "resize" && o !== "place");
      // The ones that need fixing get sized and aligned straight after framing,
      // while the coders and stylists work on other rows — layout runs in
      // parallel with colour instead of queueing up behind it, so the Critic
      // can follow the last stylist almost immediately.
      return ["create", "resize", "place", ...ops.filter((o) => o !== "create" && o !== "resize" && o !== "place")];
    }
    return ops;
  }

  private basePlan(el: HTMLElement): Op[] {
    const kind = el.dataset.build ?? "block";
    if (kind === "frame") return ["create"];
    const r = el.getBoundingClientRect();
    const hasText = (el.textContent ?? "").trim().length > 0;
    if (kind === "type" && r.height < 34) return ["write"];
    const ops: Op[] = [];
    if (kind !== "type" || r.height > 60) ops.push("create");
    if (hasText) ops.push("write");
    ops.push("style");
    if ((kind === "block" || kind === "media" || kind === "fill") && r.width > 150 && r.height > 56) ops.push("resize", "place");
    return ops;
  }

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
      const ops = this.plans.get(el)!;
      const kind = el.dataset.build;
      return ops.includes("style") && !this.defects.has(el) && (kind === "type" || kind === "para") && (el.textContent ?? "").trim().length > 12;
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
    nodes.forEach((n) => {
      n.dataset.queued = "1";
      this.plans.set(n, this.plan(n));
    });
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
    if (this.rosterName === "home") {
      // Nothing is handed out until a Planner has scanned it: one planning job
      // per segment, so the part on screen can be planned (and built) first.
      const bySeg = new Map<HTMLElement, HTMLElement[]>();
      nodes.forEach((n) => {
        const seg = this.segOf(n, section);
        bySeg.set(seg, [...(bySeg.get(seg) ?? []), n]);
      });
      this.log("system", `task ${section.dataset.sec ?? section.id} · ${nodes.length} nodes in ${bySeg.size} segment${bySeg.size > 1 ? "s" : ""} → planners`, "dim");
      bySeg.forEach((plan, seg) => this.push({ op: "create", section, seg, plan }));
      return;
    }
    const framed = nodes.filter((n) => this.plans.get(n)![0] === "create").length;
    this.log("planner", `plan ${section.dataset.sec ?? section.id} · ${nodes.length} nodes · ${framed} frames, rest straight to coders`);
    nodes.forEach((el) => this.push({ op: this.plans.get(el)![0], section, el }));
  }

  private push(job: Job, from?: AgentId) {
    this.queues[job.op].push(job);
    const owners = this.owners[job.op];
    const to = owners.find((id) => this.state.agents[id].status === "idle") ?? owners[0];
    if (from && from !== to) {
      this.set({ pulses: [...this.state.pulses.slice(-12), { id: ++pulseId, from, to }] });
      if (this.def(to).parent && this.def(from).op === "style") {
        this.spawnFrom[to] = from;
        this.log(from, `spawn ${this.def(to).name.toLowerCase()} → ${job.el?.dataset.label ?? ""}`, "dim");
      }
    }
    this.syncQueue(job.op);
    const w = this.waiters[job.op].shift();
    w?.();
    this.maybeSpawn(job.op);
  }

  private wakeAll() {
    OPS.forEach((op) => {
      const w = this.waiters[op];
      this.waiters[op] = [];
      w.forEach((r) => r());
    });
  }

  /**
   * Next job: on-screen sections first (jump ahead and the swarm follows),
   * then the earliest node in the page — so a block is finished top-down and
   * handed to a Critic while the builders move on to the next one.
   */
  private take(op: Op) {
    if (this.rosterName === "home") return this.takeVisibleFirst(op);
    const q = this.queues[op];
    if (q.length === 0) return undefined;
    const onScreen = q.some((j) => this.visible.has(j.section));
    // A report is one long section, read inside IDE chrome: agents only take
    // work that is actually visible — between the browser bar and the bottom
    // panel — and wait for the reader to scroll to the rest.
    const report = this.rosterName === "report";
    const band = report ? this.visibleBand() : null;
    const inBand = (j: Job) => {
      if (!band) return true;
      const r = (j.el ?? j.seg ?? j.section).getBoundingClientRect();
      return r.bottom > band.top + 8 && r.top < band.bottom - 16;
    };
    if (report && !q.some(inBand)) return undefined;
    let best = -1;
    for (let i = 0; i < q.length; i++) {
      const j = q[i];
      if (onScreen && !this.visible.has(j.section)) continue;
      if (!inBand(j)) continue;
      if (best < 0) {
        best = i;
        continue;
      }
      const a = q[best].el ?? q[best].seg ?? q[best].section;
      const b = j.el ?? j.seg ?? j.section;
      if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) best = i;
    }
    const job = q.splice(Math.max(0, best), 1)[0];
    this.syncQueue(op);
    return job;
  }

  /**
   * Landing page: whatever is on screen right now comes first — even a sliver
   * of a section — top-down; then the rest, nearest to the viewport first.
   * For Planners, planning a segment beats framing a block in the same band,
   * since a plan unblocks everyone else.
   */
  private takeVisibleFirst(op: Op) {
    const q = this.queues[op];
    if (q.length === 0) return undefined;
    const band = this.visibleBand();
    let best = 0;
    let bestKey = Infinity;
    for (let i = 0; i < q.length; i++) {
      const j = q[i];
      const r = (j.el ?? j.seg ?? j.section).getBoundingClientRect();
      const onScreen = r.bottom > band.top + 8 && r.top < band.bottom - 8;
      const dist = onScreen ? Math.max(0, r.top - band.top) : r.top >= band.bottom ? r.top - band.bottom : band.top - r.bottom;
      const key = (onScreen ? 0 : 2e6) + (j.plan ? 0 : 1e6) + Math.min(dist, 9e5);
      if (key < bestKey) {
        bestKey = key;
        best = i;
      }
    }
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
      const job = this.take(op);
      if (!job) {
        if (!this.roster.some((a) => a.id === id)) return; // retired
        if (this.state.agents[id].status !== "idle") this.setAgent(id, { status: "idle", op: null, target: "" });
        await this.wait(op, 1500 + Math.random() * 900);
        if (gen !== this.gen) return;
        if (this.def(id).spawned && this.queues[op].length === 0 && performance.now() - idleSince > RETIRE_MS) {
          this.retire(id);
          return;
        }
        // nothing left — or, on a report, nothing *visible* left: either way the cursor leaves
        if (this.queues[op].length === 0 || this.rosterName === "report") {
          // Idle: drift a little, then fade so nothing hovers over the reading.
          // Sub-agents leave as soon as their call is done.
          const linger = this.def(id).parent ? 500 : 2400;
          if (performance.now() - idleSince > linger) animate(cur.o, 0, { duration: 0.8 });
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
    const el = job.el!;
    if (!el.isConnected || !this.root) return this.tick(job.section, el);
    const label = el.dataset.label ?? el.dataset.build ?? "node";
    const ops = this.plans.get(el) ?? [];
    const t0 = performance.now();
    let detail = "";

    this.setAgent(id, { status: "moving", op: job.op, target: label });
    el.style.setProperty("--agent", this.def(id).color);
    switch (job.op) {
      case "create": {
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
        el.style.setProperty("--dur", `${ms}ms`);
        el.dataset.state = "creating";
        this.setAgent(id, { status: "working" });
        await Promise.all([sleep(ms), this.drag(id, x0 + b.w * pose.sx + 2, y0 + b.h * pose.sy + 2, ms)]);
        if (gen !== this.gen) return;
        detail = `${Math.round(b.w * pose.sx)}×${Math.round(b.h * pose.sy)}`;
        el.dataset.state = "framed";
        break;
      }
      case "write": {
        const b = this.rel(el);
        const kind = el.dataset.build ?? "block";
        const tx = b.x + Math.min(10, b.w * 0.1);
        const ty = b.y + Math.min(b.h * 0.55, 22);
        if (!(await this.fly(id, tx, ty, gen))) return;
        const text = (el.textContent ?? "").trim().length;
        // index rows are short labels — they type in faster than prose
        const ms = this.rosterName === "page" ? Math.round(clamp(text * 6, 450, 850)) : Math.round(kind === "type" ? clamp(text * 22, 500, 1300) : clamp(text * 3.2, 800, 1600));
        el.style.setProperty("--dur", `${ms}ms`);
        el.style.setProperty("--steps", String(clamp(Math.round(text / 1.4), 8, 48)));
        // text lands unstyled when a Stylist pass follows
        if (ops.includes("style")) el.dataset.raw = "1";
        // prose, headings and lists stream in word by word; other nodes keep the wipe
        const words = kind === "type" || kind === "para" || kind === "list" ? this.streamStart(el, id) : null;
        el.dataset.mode = words ? "stream" : "write";
        el.dataset.state = "building";
        this.setAgent(id, { status: "working" });
        await Promise.all([
          words ? this.streamRun(el, words, ms, gen) : sleep(ms),
          kind === "type"
            ? this.drag(id, b.x + b.w, ty, ms, "linear")
            : this.drag(id, tx + rand(0, Math.min(60, b.w * 0.3)), b.y + b.h - 8, ms, "linear"),
        ]);
        if (gen !== this.gen) return;
        detail = words ? `${words.length} words streamed` : `${text} chars`;
        if (ops.includes("style")) el.dataset.state = "raw";
        break;
      }
      case "style": {
        const b = this.rel(el);
        const raw = el.dataset.raw === "1";
        if (!(await this.fly(id, b.x + Math.min(14, b.w * 0.1), b.y + Math.min(b.h * 0.5, 26), gen))) return;
        const media = el.querySelectorAll("img, svg").length;
        const ms = raw ? Math.round(clamp(520 + b.h * 0.6, 600, 1000)) : 900;
        el.style.setProperty("--dur", `${ms}ms`);
        this.setAgent(id, { status: "working" });
        if (raw) {
          // styles transition in while the brush crosses the node
          el.dataset.state = "styling";
          delete el.dataset.raw;
        } else {
          // nothing written here (pure media) — paint it in
          el.dataset.mode = "paint";
          el.dataset.state = "building";
        }
        await Promise.all([sleep(ms), this.drag(id, b.x + b.w * 0.88, b.y + b.h * 0.72, ms)]);
        if (gen !== this.gen) return;
        detail = media ? `placed ${media} icon${media > 1 ? "s" : ""}` : raw ? "type · color · surface" : "surface";
        const defect = this.defects.get(el);
        if (defect) el.dataset.defect = defect; // a mistake the Stylist doesn't notice
        break;
      }
      case "resize": {
        const p = this.poses.get(el) ?? { dx: 0, dy: 0, sx: 1, sy: 1 };
        const b = this.natural(el);
        const x0 = b.x + p.dx;
        const y0 = b.y + p.dy;
        if (!(await this.fly(id, x0 + b.w * p.sx, y0 + b.h * p.sy, gen))) return;
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

    const next = ops[ops.indexOf(job.op) + 1];
    if (next) {
      if (next === "resize" || next === "place") el.dataset.state = "filled";
      this.push({ op: next, section: job.section, el }, id);
    } else {
      this.complete(el, true);
      this.tick(job.section, el, id);
    }
    await sleep(120);
  }

  /**
   * A Planner scans one segment — the part of it on screen — then hands every
   * node to the first agent in its plan. Until this runs nobody touches it.
   */
  private async planSeg(id: AgentId, job: Job, gen: number) {
    const { section } = job;
    const seg = job.seg ?? section;
    const nodes = job.plan!.filter((n) => n.isConnected);
    job.plan!.filter((n) => !n.isConnected).forEach((n) => this.tick(section, n));
    if (!nodes.length || !this.root) return;
    const name = this.segName(seg, section);
    this.setAgent(id, { status: "moving", op: "create", target: `plan ${name}` });

    const b = this.rel(seg);
    const o = this.root.getBoundingClientRect();
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
    seg.style.setProperty("--agent", this.def(id).color);
    seg.dataset.planning = "1";
    const ms = Math.round(clamp(380 + nodes.length * 45, 480, 950));
    await this.drag(id, b.x + Math.max(40, b.w * 0.82), bot - 10, ms);
    delete seg.dataset.planning;
    if (gen !== this.gen) return;

    const framed = nodes.filter((n) => this.plans.get(n)![0] === "create").length;
    this.log(id, `plan ${name} · ${nodes.length} node${nodes.length > 1 ? "s" : ""} · ${framed ? `${framed} to frame, ` : ""}${nodes.length - framed} to coders`);
    this.setAgent(id, { n: this.state.agents[id].n + 1 });
    // one hand-off pulse per receiving lane, not one per node
    const pulsed = new Set<Op>();
    nodes.forEach((el) => {
      const op = this.plans.get(el)![0];
      this.push({ op, section, el }, pulsed.has(op) ? undefined : id);
      pulsed.add(op);
    });
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
      el.dataset.fixing = "1";
      delete el.dataset.defect;
      await Promise.all([sleep(700), this.drag(id, px + 18, py + 10, 700)]);
      el.dataset.review = "fixed";
      el.dataset.reviewNote = DEFECT_NOTE[defect][1];
      this.log(id, `fix ${label} · ${DEFECT_NOTE[defect][1].slice(2)}`, "ok");
      this.set({ fixes: this.state.fixes + 1 });
      await sleep(650);
      delete el.dataset.review;
      delete el.dataset.reviewNote;
      delete el.dataset.fixing;
    }
    if (gen !== this.gen) return;

    const fixed = broken.length ? ` · ${broken.length} fix${broken.length > 1 ? "es" : ""}` : "";
    this.log(id, `✓ ${name} · ${nodes.length} nodes${fixed}`, "ok");
    this.setAgent(id, { n: this.state.agents[id].n + 1 });

    const open = this.openSegs.get(section);
    open?.delete(seg);
    if (!open || open.size === 0) {
      this.finishSection(section);
      const t0 = this.sectionStart.get(section) ?? performance.now();
      this.log(id, `✓ review passed ${section.dataset.sec ?? section.id} · ${((performance.now() - t0) / 1000).toFixed(1)}s`, "ok");
    }
    await sleep(150);
  }

  private complete(el: HTMLElement, count: boolean) {
    if (el.dataset.state === "done") return;
    el.getAnimations().forEach((a) => a.cancel());
    this.clearPose(el);
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
    this.clearPose(n);
    ["raw", "mode", "defect", "review", "reviewNote", "fixing"].forEach((k) => delete n.dataset[k]);
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
