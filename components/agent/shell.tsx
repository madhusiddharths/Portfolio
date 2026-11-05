"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "@/app/agent.css";
import { AnimatePresence, motion } from "motion/react";
import { Swarm, useSwarm, useSwarmState } from "./swarm";
import { ObsWindow } from "./observe";
import { MiniMap } from "./minimap";
import { route } from "@/lib/intent-router";
import { PROFILE, PROJECTS } from "@/lib/projects";

/** A route in the navigator. `href` starting with "#" scrolls to a section on this page. */
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
 * The agentic-browser frame shared by every route: one-row browser chrome,
 * the page, and a side rail of two windows — observability on top, the
 * navigator / ask box below. On the home page the navigator lists its
 * sections (scroll-spied); elsewhere they are pages and `current` marks one.
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
      <Chrome tabs={tabs} current={current} fixedPath={path} onRail={() => setOpen((o) => !o)} railOpen={open} />
      <div className="ag-body">
        <main id="main" className="ag-main">
          {children}
        </main>
        <aside className="rail" data-open={open ? "true" : undefined} aria-label="Swarm tools">
          <button type="button" className="rail-close" onClick={() => setOpen(false)} aria-label="Close panel">
            ✕
          </button>
          <ObsWindow />
          <NavWindow tabs={tabs} current={current} onDone={() => setOpen(false)} />
        </aside>
      </div>
    </Swarm>
  );
}

/* ---------------------------------------------------------------------------
   Browser chrome — one row: lights, history, reload, address, build control
   --------------------------------------------------------------------------- */
function Chrome({
  tabs,
  current,
  fixedPath,
  onRail,
  railOpen,
}: {
  tabs: Tab[];
  current?: string;
  fixedPath?: string;
  onRail: () => void;
  railOpen: boolean;
}) {
  const engine = useSwarm();
  const spied = useSwarmState((s) => s.active);
  const active = current ?? spied;
  const enabled = useSwarmState((s) => s.enabled);
  const done = useSwarmState((s) => s.done);
  const total = useSwarmState((s) => s.total);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const building = enabled && total > 0 && done < total;
  const path = fixedPath ?? tabs.find((t) => t.id === active)?.path ?? "";

  return (
    <header className="chrome">
      <div className="chrome-row">
        <span className="chrome-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
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
                <span className="chrome-ok" /> {enabled ? "built by 6 agents" : "static render"}
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
        <button type="button" className="chrome-pill chrome-rail-toggle" aria-expanded={railOpen} onClick={onRail}>
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
   Navigator — a live minimap of the page (click or drag to scroll), route
   chips, and the ask box. Enter opens a route whose name you typed, or hands
   the text to the deterministic intent router (a tech, a project, "résumé"…).
   --------------------------------------------------------------------------- */
type Row = { id: string; label: string; hint: string; href: string; external?: boolean; local?: boolean };

function NavWindow({ tabs, current, onDone }: { tabs: Tab[]; current?: string; onDone: () => void }) {
  const engine = useSwarm();
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const clearMatch = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows: Row[] = useMemo(() => {
    const base: Row[] = tabs.map((t) => ({
      id: t.id,
      label: t.label,
      hint: t.href.startsWith("#") ? `#${t.id}` : t.href.replace(/\/$/, "") || "/",
      href: t.href,
      local: t.href.startsWith("#"),
    }));
    if (!tabs.some((t) => t.href === "/work/")) base.push({ id: "index", label: "all projects", hint: "/work", href: "/work/" });
    base.push({ id: "resume", label: "résumé", hint: "doc ↗", href: PROFILE.resume, external: true });
    base.push({ id: "github", label: "github", hint: "↗", href: PROFILE.github, external: true });
    return base;
  }, [tabs]);

  const chips = rows.filter((r) => !r.local);

  // "/" or ⌘K focuses the ask box
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(r: Row) {
    engine.log("user", `open ${r.label}`);
    if (r.external) window.open(r.href, "_blank", "noopener,noreferrer");
    else if (r.local) engine.scrollTo(r.href);
    else router.push(r.href);
    setQ("");
    onDone();
  }

  function ask(text: string) {
    const said = text.trim();
    if (!said) return;
    setQ("");
    engine.log("user", said);
    const r = route(said);
    const args = Object.entries(r.args)
      .map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.length}]` : JSON.stringify(v)}`)
      .join(", ");
    engine.log("router", `${r.tool}(${args}) · p=${r.conf.toFixed(2)}`, "accent");

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
    if (r.tool !== "none") onDone();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    // a route typed by name → open it; anything else → the router
    const t = q.trim().toLowerCase();
    const hit = t ? rows.filter((r) => r.label.startsWith(t) || r.id.startsWith(t)) : [];
    if (hit.length === 1) go(hit[0]);
    else ask(q);
  }

  return (
    <section className="win win-nav" aria-label="Navigator">
      <div className="win-head">
        <span className="win-title">
          <NavIcon /> minimap
        </span>
        <span className="win-meta">
          <kbd>⌘K</kbd>
        </span>
      </div>
      <MiniMap onJump={onDone} />
      <ul className="nav-chips">
        {chips.map((r) => (
          <li key={r.id}>
            {r.external ? (
              <a href={r.href} target="_blank" rel="noopener noreferrer" onClick={() => engine.log("user", `open ${r.label}`)}>
                {r.label} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <Link href={r.href} aria-current={current === r.id ? "page" : undefined} onClick={onDone}>
                {r.label} <span aria-hidden="true">→</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
      <form className="nav-ask" onSubmit={submit}>
        <label className="nav-input">
          <span aria-hidden="true">›</span>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="jump, or ask — kafka, pulsetrade…"
            aria-label="Navigate or ask the swarm"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" aria-label="Run">
            ↵
          </button>
        </label>
      </form>
    </section>
  );
}

function NavIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 4.5h12M2 8h12M2 11.5h7" />
    </svg>
  );
}
