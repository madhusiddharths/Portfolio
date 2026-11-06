"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import type { TocGroup } from "@/lib/case-study";
import { ide, useIde, scrollToSection } from "./store";

type Other = { slug: string; name: string; index: string };

/**
 * Left side bar — the report as a file tree. Sections are grouped into
 * folders (context / build / results / notes). Collapsing a folder folds its
 * sections in the article too, so only the open part of the report is shown —
 * code folding for prose. All folders start open.
 */
export function Explorer({ slug, groups, others }: { slug: string; groups: TocGroup[]; others: Other[] }) {
  const lenis = useLenis();
  const active = useIde((s) => s.active);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [othersOpen, setOthersOpen] = useState(false);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  // mirror folded folders onto the article sections
  useEffect(() => {
    for (const g of groups) {
      for (const it of g.items) {
        const sec = document.getElementById(it.id)?.closest<HTMLElement>(".content-section");
        if (!sec) continue;
        if (closed[g.id]) {
          sec.dataset.folded = g.id;
        } else {
          delete sec.dataset.folded;
        }
      }
    }
  }, [closed, groups]);

  // clicking a folded heading in the article unfolds its folder
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const h = (e.target as HTMLElement).closest<HTMLElement>(".content-section[data-folded] > h2");
      if (!h) return;
      const g = h.parentElement!.dataset.folded!;
      setClosed((c) => ({ ...c, [g]: false }));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function open(id: string, group: string) {
    if (closed[group]) setClosed((c) => ({ ...c, [group]: false }));
    // let the unfold land before measuring
    requestAnimationFrame(() => scrollToSection(id, lenis));
  }

  const num = new Map(groups.flatMap((g) => g.items).map((it, i) => [it.id, String(i + 1).padStart(2, "0")]));
  return (
    <aside className="ide-left" aria-label="Explorer">
      <div className="ide-pane-head">
        <span>explorer</span>
        <span className="ide-pane-meta">
          {total} files
          <button type="button" className="ide-icon" title="Fold all" aria-label="Fold all sections" onClick={() => setClosed(Object.fromEntries(groups.map((g) => [g.id, true])))}>
            <FoldIcon />
          </button>
          <button type="button" className="ide-icon" title="Unfold all" aria-label="Unfold all sections" onClick={() => setClosed({})}>
            <UnfoldIcon />
          </button>
        </span>
      </div>
      <div className="ide-tree" data-lenis-prevent>
        <p className="ide-root">
          <Chevron open /> {slug}/
        </p>
        {groups.map((g) => {
          const isOpen = !closed[g.id];
          const hasActive = g.items.some((it) => it.id === active);
          return (
            <div key={g.id} className="ide-folder" data-open={isOpen ? "true" : undefined}>
              <button
                type="button"
                className="ide-folder-row"
                aria-expanded={isOpen}
                onClick={() => setClosed((c) => ({ ...c, [g.id]: isOpen }))}
                data-active={!isOpen && hasActive ? "true" : undefined}
              >
                <Chevron open={isOpen} />
                <FolderIcon open={isOpen} />
                <span>{g.label}</span>
                <span className="ide-count">{g.items.length}</span>
              </button>
              {isOpen && (
                <ul>
                  {g.items.map((it) => {
                    return (
                      <li key={it.id}>
                        <a
                          href={`#${it.id}`}
                          className="ide-file"
                          aria-current={active === it.id ? "location" : undefined}
                          title={it.label}
                          onClick={(e) => {
                            e.preventDefault();
                            open(it.id, g.id);
                          }}
                        >
                          <span className="ide-file-n">{num.get(it.id)}</span>
                          <FileIcon />
                          <span className="ide-file-name">{it.label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}

        <div className="ide-folder ide-folder-others" data-open={othersOpen ? "true" : undefined}>
          <button type="button" className="ide-folder-row" aria-expanded={othersOpen} onClick={() => setOthersOpen((o) => !o)}>
            <Chevron open={othersOpen} />
            <FolderIcon open={othersOpen} />
            <span>other reports</span>
            <span className="ide-count">{others.length}</span>
          </button>
          {othersOpen && (
            <ul>
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/work/${o.slug}/`} className="ide-file" title={o.name}>
                    <span className="ide-file-n">{o.index}</span>
                    <FileIcon />
                    <span className="ide-file-name">{o.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <button type="button" className="ide-pane-close" onClick={() => ide.toggle("left", false)} aria-label="Close explorer" title="Close explorer (⌘B)">
        ×
      </button>
    </aside>
  );
}

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg className="ide-chev" data-open={open ? "true" : undefined} width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5L10.5 8 6 12.5" />
    </svg>
  );
}
function FolderIcon({ open }: { open?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
      {open ? <path d="M1.8 4.2h4l1.3 1.4h6.9v1.6H4.2L2.4 12.6H1.8zM4.2 7.2H15l-2 5.4H2.4" /> : <path d="M1.8 3.6h4.2l1.4 1.6h6.8v7.4H1.8z" />}
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 1.8h6l3 3v9.4h-9z M9.5 1.8v3h3 M5.5 8.5h5 M5.5 11h3.5" />
    </svg>
  );
}
function FoldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 2.5L8 6l3.5-3.5M4.5 13.5L8 10l3.5 3.5" />
    </svg>
  );
}
function UnfoldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 6L8 2.5 11.5 6M4.5 10L8 13.5l3.5-3.5" />
    </svg>
  );
}
