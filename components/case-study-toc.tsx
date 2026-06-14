"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/case-study";

export function CaseStudyToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 },
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className="cs-toc" aria-label="On this page">
      <p className="cs-toc-title u-mono">Contents</p>
      <ol>
        {items.map((it, i) => (
          <li key={it.id} className={active === it.id ? "is-active" : ""}>
            <a href={`#${it.id}`}>
              <span className="cs-toc-index u-mono">{String(i + 1).padStart(2, "0")}</span>
              <span className="cs-toc-label">{it.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
