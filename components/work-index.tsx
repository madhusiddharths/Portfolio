"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import type { Project } from "@/lib/projects";
import { ArrowUpRight, LockIcon } from "./icons";

function rowHref(p: Project) {
  return p.hasCaseStudy ? `/work/${p.slug}/` : "/work/coming-soon/";
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

  const displayedProjects = skillFilter
    ? projects.filter((p) => p.tech.includes(skillFilter))
    : projects;

  const [active, setActive] = useState<Project | null>(null); // desktop hover
  const [peek, setPeek] = useState<Project | null>(null); // touch press-and-hold preview
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 350, damping: 30, mass: 0.5 });
  const py = useSpring(my, { stiffness: 350, damping: 30, mass: 0.5 });

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

  function onMove(e: React.MouseEvent) {
    mx.set(e.clientX + 28);
    my.set(e.clientY - 40);
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

  const showPreview = active && !reduce;

  return (
    <div className="work-index" onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
      {skillFilter && displayedProjects.length > 0 && (
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="u-mono" style={{ margin: 0 }}>Filtered by skill: <strong style={{ color: 'var(--accent)' }}>{skillFilter}</strong></p>
          <button onClick={() => router.push(window.location.pathname)} className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }}>Clear filter</button>
        </div>
      )}

      {displayedProjects.length === 0 && skillFilter ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', border: '1px dashed var(--edge)', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Academic / Foundational Skill</h3>
          <p className="page-hero-lead" style={{ margin: '0 auto 2rem', maxWidth: '600px' }}>
            I built a strong foundation in <strong style={{ color: 'var(--accent)' }}>{skillFilter}</strong> during my coursework. While it doesn't feature in these recent case studies, it informs my approach to software engineering.
          </p>
          <button onClick={() => router.push(window.location.pathname)} className="btn btn-primary">View All Projects</button>
        </div>
      ) : (
        <ol className="work-list">
          {displayedProjects.map((p) => (
            <li key={p.slug}>
              <Link
                href={rowHref(p)}
                className="work-row"
                data-cursor={p.hasCaseStudy ? "read" : "soon"}
                onMouseEnter={() => setActive(p)}
                onFocus={() => setActive(p)}
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
                <span className="work-row-rail" aria-hidden="true" />
                <span className="work-row-index u-mono">{p.index}</span>

                <span className="work-row-body">
                  <span className="work-row-headline">
                    <span className="work-row-name">{p.name}</span>
                    {p.privateRepo && (
                      <span className="work-tag work-tag-lock u-mono">
                        <LockIcon width={11} height={11} /> private
                      </span>
                    )}
                    {!p.hasCaseStudy && <span className="work-tag work-tag-soon u-mono">soon</span>}
                  </span>
                  <span className="work-row-domain">{p.domain}</span>
                </span>

                <span className="work-row-tech u-mono">{p.tech.slice(0, 3).join(" / ")}</span>
                <span className="work-row-go" aria-hidden="true">
                  <ArrowUpRight width={18} height={18} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <AnimatePresence>
        {showPreview && (
          <motion.div
            className="work-preview"
            style={{ x: px, y: py }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={active!.thumb} alt="" />
            <span className="work-preview-meta u-mono">
              {active!.index} — {active!.hasCaseStudy ? "view case study" : "coming soon"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
