"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { Project } from "@/lib/projects";
import { usesSkill } from "@/lib/projects";
import { ArrowUpRight, LockIcon, GithubIcon } from "./icons";
import { B } from "./agent/b";

function rowHref(p: Project) {
  return p.hasCaseStudy ? `/work/${p.slug}/` : `/work/coming-soon/?p=${p.slug}`;
}

// Touch press-and-hold → preview tuning.
const HOLD_MS = 250; // how long to hold before the peek appears
const MOVE_CANCEL_PX = 12; // moving more than this before the hold fires = a scroll, not a press

// The peek is a phone-only feature — tablet and laptop views are left untouched.
function mobilePeekActive() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 680px)").matches;
}

function WorkIndexContent({ projects }: { projects: Project[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const skillFilter = searchParams.get("skill");

  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const displayedProjects = projects.filter(
    (p) =>
      (!skillFilter || usesSkill(p.tech, skillFilter)) &&
      (!needle || [p.name, p.domain, ...p.tech].some((t) => t.toLowerCase().includes(needle))),
  );
  const reports = displayedProjects.filter((p) => p.hasCaseStudy).length;

  const [peek, setPeek] = useState<Project | null>(null); // touch press-and-hold preview
  const reduce = useReducedMotion();


  // Long-press bookkeeping (touch only).
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const peekedRef = useRef(false); // a peek fired → suppress the navigation click on release

  useEffect(() => () => clearHold(), []);

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function onTouchStart(e: React.TouchEvent, p: Project) {
    if (!mobilePeekActive()) return; // phones only — don't alter tablet/laptop behavior
    const t = e.touches[0];
    startPt.current = { x: t.clientX, y: t.clientY };
    peekedRef.current = false;
    clearHold();
    holdTimer.current = setTimeout(() => {
      peekedRef.current = true;
      setPeek(p);
    }, HOLD_MS);
  }

  function onTouchMove(e: React.TouchEvent) {
    // Already peeking → let the page scroll freely; the image stays pinned.
    if (peekedRef.current || !startPt.current) return;
    const t = e.touches[0];
    const moved = Math.hypot(t.clientX - startPt.current.x, t.clientY - startPt.current.y);
    if (moved > MOVE_CANCEL_PX) clearHold(); // a scroll began before the hold fired
  }

  function onTouchEnd() {
    clearHold();
    // Lifting the finger dismisses the peek; peekedRef stays true so the
    // synthesized click below is swallowed instead of navigating.
    if (peekedRef.current) setPeek(null);
  }

  function onTouchCancel() {
    clearHold();
    peekedRef.current = false;
    setPeek(null);
  }

  function onRowClick(e: React.MouseEvent) {
    if (peekedRef.current) {
      e.preventDefault(); // this gesture was a peek, not a tap → don't open the project
      peekedRef.current = false;
    }
  }

  return (
    <div className="work-index">
      {/* toolbar — a grep over the registry, plus the ?skill= filter from the rest of the site */}
      <div className="reg-toolbar">
        <label className="reg-search">
          <span aria-hidden="true">grep</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="name, domain or tech — e.g. kafka, llm, vision"
            aria-label="Filter projects"
            spellCheck={false}
            autoComplete="off"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search">
              ×
            </button>
          )}
        </label>
        {skillFilter && (
          <span className="reg-chip">
            skill=<b>{skillFilter}</b>
            <button type="button" onClick={() => router.push(window.location.pathname)} aria-label={`Clear the ${skillFilter} filter`}>
              ×
            </button>
          </span>
        )}
        <span className="reg-count-line">
          {displayedProjects.length}/{projects.length} projects · {reports} reports
        </span>
      </div>

      {displayedProjects.length === 0 ? (
        <div className="reg-empty">
          <p className="reg-empty-cmd">
            $ grep {skillFilter ? `--skill ${skillFilter} ` : ""}
            {needle ? `"${needle}" ` : ""}work/ <span>→ 0 matches</span>
          </p>
          <p>
            {skillFilter ? (
              <>
                <strong>{skillFilter}</strong> is in my stack, but none of these case studies use it yet.
              </>
            ) : (
              "Nothing in the registry matches that — try a tech like kafka, pytorch or langgraph."
            )}
          </p>
          <button
            type="button"
            className="btn btn-line"
            onClick={() => {
              setQ("");
              if (skillFilter) router.push(window.location.pathname);
            }}
          >
            Show all projects
          </button>
        </div>
      ) : (
        <ol className="work-list">
          <li className="work-row work-row-h" aria-hidden="true">
            <span>#</span>
            <span>project</span>
            <span>stack</span>
            <span>status</span>
            <span>source</span>
          </li>
          {displayedProjects.map((p) => {
            const more = p.tech.length - 3;
            return (
              <B as="li" kind="block" label={`row.${p.slug}`} key={p.slug}>
                <Link
                  href={rowHref(p)}
                  className="work-row"
                  data-cursor={p.hasCaseStudy ? "read" : "soon"}
                  onTouchStart={(e) => onTouchStart(e, p)}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onTouchCancel={onTouchCancel}
                  onClick={onRowClick}
                  onContextMenu={(e) => {
                    if (mobilePeekActive()) e.preventDefault(); // suppress long-press callout on phones only
                  }}
                  aria-label={`${p.name} — ${p.domain}`}
                >
                  <span className="work-row-index">{p.index}</span>
                  <span className="work-row-body">
                    <span className="work-row-name">{p.name}</span>
                    <span className="work-row-domain">{p.domain}</span>
                  </span>
                  <span className="work-row-tech">
                    {p.tech.slice(0, 3).map((t) => (
                      <i key={t}>{t}</i>
                    ))}
                    {more > 0 && <i className="more">+{more}</i>}
                  </span>
                  <span className="work-row-status" data-status={p.hasCaseStudy ? "report" : "soon"}>
                    <b aria-hidden="true" /> {p.hasCaseStudy ? "field report" : "drafting"}
                  </span>
                  <span className="work-row-src">
                    {p.repo && !p.privateRepo ? (
                      <GithubIcon width={14} height={14} aria-label="Public repository" />
                    ) : (
                      <LockIcon width={13} height={13} aria-label="Private repository" />
                    )}
                    <ArrowUpRight width={15} height={15} className="work-row-go" aria-hidden="true" />
                  </span>
                </Link>
              </B>
            );
          })}
        </ol>
      )}

      {/* Mobile: press-and-hold a row to peek a quick card (cover, blurb, tech).
          It stays pinned — you can keep scrolling the page — until you lift your
          finger. A quick tap still opens the project (see onRowClick). */}
      <AnimatePresence>
        {peek && (
          <motion.div
            key="peek-scrim"
            className="work-peek-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
        {peek && (
          <motion.div
            key="peek-stage"
            className="work-peek-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="work-peek"
              initial={{ scale: reduce ? 1 : 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: reduce ? 1 : 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="work-peek-media">
                <img src={peek.thumb} alt="" />
              </div>
              <div className="work-peek-info">
                <div className="work-peek-head">
                  <span className="work-peek-index u-mono">{peek.index}</span>
                  <span className="work-peek-name">{peek.name}</span>
                </div>
                <div className="work-peek-domain u-mono">{peek.domain}</div>
                <p className="work-peek-summary">{peek.summary}</p>
                <div className="work-peek-tech">
                  {peek.tech.slice(0, 4).map((t) => (
                    <span key={t} className="work-peek-chip u-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WorkIndex({ projects }: { projects: Project[] }) {
  return (
    <Suspense fallback={<div className="work-list-loading" />}>
      <WorkIndexContent projects={projects} />
    </Suspense>
  );
}
