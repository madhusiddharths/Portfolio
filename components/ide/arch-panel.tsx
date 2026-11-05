"use client";

import { useMemo, useState } from "react";
import { useLenis } from "lenis/react";
import type { Pipeline, PNode } from "@/lib/pipelines";
import type { TocItem } from "@/lib/case-study";
import { ArchGraph, KindIcon } from "./arch-graph";
import { ide, useIde, scrollToSection } from "./store";

type Tab = "schema" | "dataflow" | "explain" | "spec";
const TABS: { id: Tab; label: string }[] = [
  { id: "schema", label: "schema" },
  { id: "dataflow", label: "dataflow" },
  { id: "explain", label: "explain" },
  { id: "spec", label: "spec" },
];

/**
 * Bottom panel — everything about the project's architecture.
 *   schema    the component graph, revealed as the report is read
 *   dataflow  every hop in order, as a trace: payload + where in the report
 *   explain   how the system fits together (the architecture write-up)
 *   spec      the graph's own definition, as data
 * By default the graph follows the scroll; "show all" reveals everything.
 */
export function ArchPanel({ slug, pipe, toc, arch }: { slug: string; pipe: Pipeline; toc: TocItem[]; arch: string | null }) {
  const lenis = useLenis();
  const [tab, setTab] = useState<Tab>("schema");
  const active = useIde((s) => s.active);
  const revealAll = useIde((s) => s.revealAll);

  const idx = useMemo(() => new Map(toc.map((t, i) => [t.id, i])), [toc]);
  const label = useMemo(() => new Map(toc.map((t) => [t.id, t.label])), [toc]);
  const at = idx.get(active) ?? 0;
  const shown = (n: PNode) => revealAll || (idx.get(n.at) ?? 0) <= at;
  const current = (n: PNode) => n.at === active;
  const sectionLabel = (id: string) => label.get(id) ?? id;
  const open = pipe.nodes.filter(shown).length;
  // the camera follows the newest revealed components (or the first column)
  const revealed = pipe.nodes.filter(shown);
  const front = revealed.length ? Math.max(...revealed.map((n) => idx.get(n.at) ?? 0)) : -1;
  const focus = (revealed.some(current) ? revealed.filter(current) : front >= 0 ? revealed.filter((n) => (idx.get(n.at) ?? 0) === front) : pipe.nodes.filter((n) => n.col === 0)).map((n) => n.id);

  function goTo(n: PNode) {
    // unfold the section if its folder is collapsed, then scroll
    const sec = document.getElementById(n.at)?.closest<HTMLElement>(".content-section");
    if (sec?.dataset.folded) (sec.querySelector("h2") as HTMLElement | null)?.click();
    requestAnimationFrame(() => scrollToSection(n.at, lenis));
  }

  return (
    <section className="ide-bottom" aria-label="Architecture">
      <div className="ide-panel-head">
        <div className="ide-tabs" role="tablist" aria-label="Architecture views">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="ide-tab" onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="ide-panel-meta">
          <span className="ide-panel-path">
            arch/{slug}.graph · <b>{open}</b>/{pipe.nodes.length} revealed
          </span>
          <button
            type="button"
            className="ide-chip"
            aria-pressed={revealAll}
            onClick={() => ide.setRevealAll(!revealAll)}
            title={revealAll ? "Reveal components as you read" : "Show every component now"}
          >
            {revealAll ? "show all" : "follow scroll"}
          </button>
          <button type="button" className="ide-icon" onClick={() => ide.toggle("bottom", false)} aria-label="Close panel" title="Close panel (⌘J)">
            ×
          </button>
        </div>
      </div>

      <div className="ide-panel-body" role="tabpanel">
        {tab === "schema" && <ArchGraph pipe={pipe} focus={revealAll ? [] : focus} shown={shown} current={current} sectionLabel={sectionLabel} onOpen={goTo} />}
        {tab === "dataflow" && <Dataflow pipe={pipe} idx={idx} at={at} total={toc.length} shown={shown} sectionLabel={sectionLabel} onOpen={goTo} />}
        {tab === "explain" && <Explain pipe={pipe} arch={arch} slug={slug} />}
        {tab === "spec" && <Spec slug={slug} pipe={pipe} />}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   dataflow — one row per hop, ordered by where the reader meets it. The bar
   spans the stretch of the report between the two components' sections, the
   vertical line is where you are now.
   --------------------------------------------------------------------------- */
function Dataflow({
  pipe,
  idx,
  at,
  total,
  shown,
  sectionLabel,
  onOpen,
}: {
  pipe: Pipeline;
  idx: Map<string, number>;
  at: number;
  total: number;
  shown: (n: PNode) => boolean;
  sectionLabel: (id: string) => string;
  onOpen: (n: PNode) => void;
}) {
  const byId = new Map(pipe.nodes.map((n) => [n.id, n]));
  const hops = pipe.edges
    .map((e) => ({ e, a: byId.get(e.from)!, b: byId.get(e.to)! }))
    .map((h) => ({ ...h, s: idx.get(h.a.at) ?? 0, t: idx.get(h.b.at) ?? 0 }))
    .sort((x, y) => Math.max(x.s, x.t) - Math.max(y.s, y.t) || x.a.col - y.a.col);
  const span = Math.max(total - 1, 1);

  return (
    <div className="ag-flow" data-lenis-prevent>
      <div className="ag-flow-row ag-flow-h" aria-hidden="true">
        <span>#</span>
        <span>hop</span>
        <span>payload</span>
        <span>in the report</span>
      </div>
      <ol>
        {hops.map(({ e, a, b, s, t }, i) => {
          const on = shown(a) && shown(b);
          const lo = Math.min(s, t) / span;
          const hi = Math.max(s, t) / span;
          return (
            <li key={`${e.from}-${e.to}`}>
              <button type="button" className="ag-flow-row" data-on={on ? "true" : undefined} onClick={() => onOpen(t >= s ? b : a)} title={`§ ${sectionLabel(b.at)}`}>
                <span className="ag-flow-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="ag-flow-hop">
                  <span className="ag-flow-node">
                    <KindIcon kind={a.kind} /> {on ? a.label : "·····"}
                  </span>
                  <span className="ag-flow-arrow">→</span>
                  <span className="ag-flow-node">
                    <KindIcon kind={b.kind} /> {on ? b.label : "·····"}
                  </span>
                </span>
                <span className="ag-flow-data">{on ? e.data ?? "—" : "locked"}</span>
                <span className="ag-flow-track">
                  <i className="ag-flow-bar" style={{ left: `${lo * 100}%`, width: `max(4px, ${(hi - lo) * 100}%)` }} />
                  <i className="ag-flow-now" style={{ left: `${(at / span) * 100}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* explain — the summary plus the architecture write-up moved out of the report */
function Explain({ pipe, arch, slug }: { pipe: Pipeline; arch: string | null; slug: string }) {
  return (
    <div className="ag-explain" data-lenis-prevent>
      <div className="ag-explain-cols">
        <div>
          <p className="ag-explain-file">README.md</p>
          <p className="ag-explain-lead">{pipe.summary}</p>
          <p className="ag-explain-file">components</p>
          <ul className="ag-explain-kinds">
            {pipe.nodes.map((n) => (
              <li key={n.id}>
                <KindIcon kind={n.kind} />
                <b>{n.label}</b>
                <span>{n.tech}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="ag-explain-file">architecture.md</p>
          {arch ? (
            <div className="fieldnotes ag-explain-body" dangerouslySetInnerHTML={{ __html: arch }} />
          ) : (
            <p className="ag-explain-none">
              {slug} has no separate architecture write-up — the README and the schema tab are the whole picture.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* spec — the graph definition itself */
function Spec({ slug, pipe }: { slug: string; pipe: Pipeline }) {
  const w = Math.max(...pipe.nodes.map((n) => n.id.length));
  return (
    <pre className="ag-spec" data-lenis-prevent>
      <code>
        <span className="s-k">pipeline</span>: <span className="s-s">{slug}</span>
        {"\n"}
        {pipe.stages && (
          <>
            <span className="s-k">stages</span>: [{pipe.stages.join(", ")}]{"\n"}
          </>
        )}
        <span className="s-k">nodes</span>:{"\n"}
        {pipe.nodes.map((n) => (
          <span key={n.id}>
            {"  - "}
            <span className="s-id">{n.id.padEnd(w)}</span> <span className="s-c">{n.kind.padEnd(9)}</span>{" "}
            <span className="s-s">&quot;{n.label}&quot;</span>
            {n.tech ? <span className="s-c">{`  # ${n.tech}`}</span> : null}
            {"\n"}
            {"    "}
            <span className="s-k">at</span>: §{n.at} <span className="s-k">grid</span>: [{n.col}, {n.row}]{"\n"}
          </span>
        ))}
        <span className="s-k">edges</span>:{"\n"}
        {pipe.edges.map((e) => (
          <span key={`${e.from}-${e.to}`}>
            {"  - "}
            <span className="s-id">{e.from}</span> → <span className="s-id">{e.to}</span>
            {e.data ? <span className="s-s">{`  "${e.data}"`}</span> : null}
            {"\n"}
          </span>
        ))}
      </code>
    </pre>
  );
}
