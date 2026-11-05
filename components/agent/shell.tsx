"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "@/app/agent.css";
import { AnimatePresence, motion } from "motion/react";
import { Swarm, useSwarm, useSwarmState } from "./swarm";
import { AGENTS, type Speaker } from "./engine";
import { route, SUGGESTIONS } from "@/lib/intent-router";
import { PROJECTS } from "@/lib/projects";

/** A browser tab. `href` starting with "#" scrolls to a section on this page. */
export type Tab = { id: string; label: string; href: string; path?: string };

export const TABS: Tab[] = [
  { id: "home", label: "home", href: "#home", path: "" },
  { id: "about", label: "about", href: "#about", path: "about" },
  { id: "work", label: "work", href: "#work", path: "work" },
  { id: "stack", label: "stack", href: "#stack", path: "stack" },
  { id: "certs", label: "certs", href: "#certs", path: "certs" },
  { id: "contact", label: "contact", href: "#contact", path: "contact" },
];

/**
 * The agentic-browser frame shared by every route. On the home page the tabs
 * are its sections (scroll-spied); elsewhere they are pages, `current` marks
 * the open one and `path` fills the address bar.
 */
export function AgentShell({
  children,
  tabs = TABS,
  current,
  path,
  task,
}: {
  children: ReactNode;
  tabs?: Tab[];
  current?: string;
  path?: string;
  task?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Swarm className="ag" task={task}>
      <div className="ag-ambient" aria-hidden="true" />
      <Chrome tabs={tabs} current={current} fixedPath={path} onConsole={() => setOpen((o) => !o)} consoleOpen={open} />
      <div className="ag-body">
        <main id="main" className="ag-main">
          {children}
        </main>
        <Console open={open} onClose={() => setOpen(false)} />
      </div>
    </Swarm>
  );
}

/* ---------------------------------------------------------------------------
   Browser chrome — traffic lights, tabs (= sections), address bar, build bar
   --------------------------------------------------------------------------- */
function Chrome({
  tabs,
  current,
  fixedPath,
  onConsole,
  consoleOpen,
}: {
  tabs: Tab[];
  current?: string;
  fixedPath?: string;
  onConsole: () => void;
  consoleOpen: boolean;
}) {
  const engine = useSwarm();
  const spied = useSwarmState((s) => s.active);
  const active = current ?? spied;
  const sections = useSwarmState((s) => s.sections);
  const enabled = useSwarmState((s) => s.enabled);
  const done = useSwarmState((s) => s.done);
  const total = useSwarmState((s) => s.total);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const building = enabled && total > 0 && done < total;
  const path = fixedPath ?? tabs.find((t) => t.id === active)?.path ?? "";

  return (
    <header className="chrome">
      <div className="chrome-row chrome-tabs-row">
        <span className="chrome-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <nav className="chrome-tabs" aria-label="Sections">
          {tabs.map((t) => {
            const local = t.href.startsWith("#");
            const phase = local
              ? (sections[t.id] ?? "idle")
              : t.id === active
                ? building
                  ? "building"
                  : "done"
                : "idle";
            const inner = (
              <>
                <span className="chrome-tab-icon" data-phase={phase} aria-hidden="true" />
                <span>{t.label}</span>
                {active === t.id && <motion.span layoutId="tab-active" className="chrome-tab-bg" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
              </>
            );
            return local ? (
              <a
                key={t.id}
                href={t.href}
                className="chrome-tab"
                aria-current={active === t.id ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  engine.scrollTo(t.href);
                }}
              >
                {inner}
              </a>
            ) : (
              <Link key={t.id} href={t.href} className="chrome-tab" aria-current={active === t.id ? "page" : undefined}>
                {inner}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="chrome-row chrome-address-row">
        <div className="chrome-nav" aria-hidden="true">
          <button tabIndex={-1} type="button" className="chrome-btn" disabled>
            <Chev d="left" />
          </button>
          <button tabIndex={-1} type="button" className="chrome-btn" disabled>
            <Chev d="right" />
          </button>
        </div>
        <button type="button" className="chrome-btn" title="Rebuild the page" aria-label="Rebuild the page" onClick={() => engine.replay()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
          </svg>
        </button>

        <div className="chrome-address" data-building={building ? "true" : undefined}>
          <span className="chrome-scheme">agent://</span>
          <span className="chrome-host">madhusiddharth.dev/</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={path}
              className="chrome-path"
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.22 }}
            >
              {path}
            </motion.span>
          </AnimatePresence>
          <span className="chrome-status">
            {building ? (
              <>
                <span className="chrome-spin" /> swarm building · {pct}%
              </>
            ) : (
              <>
                <span className="chrome-ok" /> {enabled ? "built by 4 agents" : "static render"}
              </>
            )}
          </span>
          <span className="chrome-progress" style={{ transform: `scaleX(${enabled ? pct / 100 : 1})`, opacity: building ? 1 : 0 }} />
        </div>

        {building ? (
          <button type="button" className="chrome-pill" onClick={() => engine.skip()}>
            Skip build <kbd>⏭</kbd>
          </button>
        ) : (
          <button type="button" className="chrome-pill" onClick={() => engine.replay()}>
            Replay build
          </button>
        )}
        <button type="button" className="chrome-pill chrome-console-toggle" aria-expanded={consoleOpen} onClick={onConsole}>
          <span className="live-dot" /> Swarm
        </button>
      </div>
    </header>
  );
}

function Chev({ d }: { d: "left" | "right" }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d={d === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Swarm console — agents, build progress, live log, and an ask box that runs
   the deterministic intent router.
   --------------------------------------------------------------------------- */
const WHO: Record<Speaker, { label: string; color: string }> = {
  ...Object.fromEntries(AGENTS.map((a) => [a.id, { label: a.name, color: a.color }])),
  user: { label: "You", color: "#f2f0ea" },
  router: { label: "Router", color: "#ff4b3e" },
  system: { label: "System", color: "#6f6e78" },
} as Record<Speaker, { label: string; color: string }>;

function Console({ open, onClose }: { open: boolean; onClose: () => void }) {
  const engine = useSwarm();
  const router = useRouter();
  const agents = useSwarmState((s) => s.agents);
  const log = useSwarmState((s) => s.log);
  const done = useSwarmState((s) => s.done);
  const total = useSwarmState((s) => s.total);
  const enabled = useSwarmState((s) => s.enabled);
  const logRef = useRef<HTMLOListElement>(null);
  const [q, setQ] = useState("");
  const clearMatch = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [log.length]);

  function run(text: string) {
    const ask = text.trim();
    if (!ask) return;
    setQ("");
    engine.log("user", ask);
    const r = route(ask);
    const args = Object.entries(r.args)
      .map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.length}]` : JSON.stringify(v)}`)
      .join(", ");
    engine.log("router", `${r.tool}(${args}) · p=${r.conf.toFixed(2)}`, "accent");

    const narrow = window.matchMedia("(max-width: 1279px)").matches;
    switch (r.tool) {
      case "scroll":
        engine.log("planner", r.say);
        if (document.getElementById(r.args.section)) engine.scrollTo(`#${r.args.section}`);
        else router.push(`/#${r.args.section}`);
        break;
      case "open":
        engine.log("planner", r.say);
        if (r.args.external) window.open(r.args.href, "_blank", "noopener,noreferrer");
        else router.push(r.args.href);
        break;
      case "match_projects": {
        engine.log("critic", r.say, r.args.slugs.length ? "ok" : "dim");
        const grid = document.querySelector<HTMLElement>("[data-project-grid]");
        const featured = PROJECTS.filter((p) => p.featured && r.args.slugs.includes(p.slug));
        if ((!grid || !featured.length) && r.args.skill && r.args.slugs.length) {
          router.push(`/work/?skill=${encodeURIComponent(r.args.skill)}`);
          break;
        }
        if (grid && featured.length) {
          document.querySelectorAll<HTMLElement>("[data-project]").forEach((c) => {
            c.toggleAttribute("data-match", r.args.slugs.includes(c.dataset.project!));
          });
          grid.dataset.filtering = "true";
          engine.scrollTo("#work");
          if (clearMatch.current) clearTimeout(clearMatch.current);
          clearMatch.current = setTimeout(() => {
            delete grid.dataset.filtering;
            document.querySelectorAll("[data-match]").forEach((c) => c.removeAttribute("data-match"));
          }, 6000);
        }
        break;
      }
      case "skip_build":
        engine.skip();
        break;
      case "replay_build":
        engine.replay();
        break;
      default:
        engine.log("system", r.say, "dim");
    }
    if (narrow && r.tool !== "none") onClose();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    run(q);
  }

  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <aside className="console" data-open={open ? "true" : undefined} aria-label="Swarm console">
      <div className="console-head">
        <span className="console-title">
          <span className="live-dot" /> swarm console
        </span>
        <span className="console-sid">sid 0x4d53</span>
        <button type="button" className="console-close" onClick={onClose} aria-label="Close console">
          ✕
        </button>
      </div>

      <ul className="console-agents">
        {AGENTS.map((a) => {
          const st = agents[a.id];
          return (
            <li key={a.id} data-status={st.status} style={{ ["--c" as string]: a.color }}>
              <span className="console-agent-swatch" />
              <span className="console-agent-name">{a.name}</span>
              <span className="console-agent-task">{st.task}</span>
              <span className="console-agent-eq" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </li>
          );
        })}
      </ul>

      <div className="console-progress">
        <div className="console-progress-meta">
          <span>{enabled ? "build" : "render"}</span>
          <span>
            {enabled ? done : total}/{total} nodes
          </span>
        </div>
        <div className="console-progress-bar">
          <span style={{ transform: `scaleX(${enabled ? pct / 100 : 1})` }} />
        </div>
      </div>

      <ol className="console-log" ref={logRef} data-lenis-prevent aria-live="off">
        <AnimatePresence initial={false}>
          {log.map((l) => (
            <motion.li
              key={l.id}
              layout="position"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              data-tone={l.tone}
            >
              <span className="log-t">{l.t}</span>
              <span className="log-who" style={{ color: WHO[l.who].color }}>
                {WHO[l.who].label}
              </span>
              <span className="log-text">{l.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      <form className="console-ask" onSubmit={submit}>
        <div className="console-suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => run(s)}>
              {s}
            </button>
          ))}
        </div>
        <label className="console-input">
          <span aria-hidden="true">›</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask the swarm — a tech, a project, ‘contact’…"
            aria-label="Ask the swarm"
            autoComplete="off"
          />
          <button type="submit" aria-label="Send">
            ↵
          </button>
        </label>
      </form>
    </aside>
  );
}
