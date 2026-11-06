"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { skillHref } from "@/lib/projects";

export type SkillRow = { name: string; icon: string | null; uses: number };

/**
 * The right rail's "skills" tab for a field report — the project's stack,
 * each tool linking to every other project that uses it. Rendered into the
 * slot the shell's navigator keeps for it.
 */
export function RailSkills({ domain, repo, skills }: { domain: string; repo: string | null; skills: SkillRow[] }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById("ide-skills-slot")), []);
  if (!slot) return null;
  const max = Math.max(...skills.map((s) => s.uses), 1);

  return createPortal(
    <div className="rs">
      <dl className="rs-meta">
        <div>
          <dt>domain</dt>
          <dd>{domain}</dd>
        </div>
        <div>
          <dt>source</dt>
          <dd>
            {repo ? (
              <a href={repo} target="_blank" rel="noopener noreferrer">
                github ↗
              </a>
            ) : (
              "private"
            )}
          </dd>
        </div>
      </dl>
      <p className="rs-h">
        <span>stack · {skills.length}</span>
        <span>used in</span>
      </p>
      <ul className="rs-list" data-lenis-prevent>
        {skills.map((s) => (
          <li key={s.name}>
            <Link href={skillHref(s.name)} title={`Projects using ${s.name}`}>
              {s.icon ? <img src={s.icon} alt="" width={14} height={14} loading="lazy" /> : <i className="rs-dot" />}
              <span className="rs-name">{s.name}</span>
              <span className="rs-uses">
                <span className="rs-bar" style={{ ["--w" as string]: s.uses / max }} />
                {s.uses}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>,
    slot,
  );
}
