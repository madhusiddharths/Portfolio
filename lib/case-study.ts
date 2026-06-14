import { readFileSync } from "node:fs";
import path from "node:path";

export type TocItem = { id: string; label: string };

const decodeEntities = (s: string) =>
  s
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/&rarr;/g, "→")
    .replace(/&minus;/g, "−")
    .replace(/&plusmn;/g, "±")
    .replace(/&sigma;/g, "σ")
    .replace(/&Delta;/g, "Δ")
    .replace(/&times;/g, "×")
    .replace(/&[a-z]+;/gi, "")
    .trim();

const slugify = (s: string) =>
  decodeEntities(s.replace(/<[^>]+>/g, ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Reads a verbatim case-study body fragment at build time, injects stable ids
 * into each <h2> for in-page navigation, and returns the table of contents.
 * Runs in a Server Component during static export — no client cost.
 */
export function loadCaseStudy(slug: string): { html: string; toc: TocItem[] } | null {
  let raw: string;
  try {
    raw = readFileSync(path.join(process.cwd(), "content", `${slug}.html`), "utf8");
  } catch {
    return null;
  }

  const toc: TocItem[] = [];
  const seen = new Set<string>();

  const html = raw.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner: string) => {
    let id = slugify(inner) || `section-${toc.length + 1}`;
    while (seen.has(id)) id = `${id}-${toc.length + 1}`;
    seen.add(id);
    toc.push({ id, label: decodeEntities(inner) });
    return `<h2 id="${id}">${inner}</h2>`;
  });

  return { html, toc };
}
