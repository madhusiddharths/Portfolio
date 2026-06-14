"use client";

import { useState } from "react";
import Link from "next/link";
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

export function WorkIndex({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<Project | null>(null);
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 350, damping: 30, mass: 0.5 });
  const py = useSpring(my, { stiffness: 350, damping: 30, mass: 0.5 });

  function onMove(e: React.MouseEvent) {
    mx.set(e.clientX + 28);
    my.set(e.clientY - 40);
  }

  const showPreview = active && !reduce;

  return (
    <div className="work-index" onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
      <ol className="work-list">
        {projects.map((p) => (
          <li key={p.slug}>
            <Link
              href={rowHref(p)}
              className="work-row"
              data-cursor={p.hasCaseStudy ? "read" : "soon"}
              onMouseEnter={() => setActive(p)}
              onFocus={() => setActive(p)}
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
                {/* mobile-only inline thumbnail */}
                <span className="work-row-thumb" aria-hidden="true">
                  <img src={p.thumb} alt="" loading="lazy" />
                </span>
              </span>

              <span className="work-row-tech u-mono">{p.tech.slice(0, 3).join(" / ")}</span>
              <span className="work-row-go" aria-hidden="true">
                <ArrowUpRight width={18} height={18} />
              </span>
            </Link>
          </li>
        ))}
      </ol>

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
    </div>
  );
}
