import { readFileSync } from "node:fs";
import path from "node:path";

export type TocItem = { id: string; label: string };
export type TocGroup = { id: string; label: string; items: TocItem[] };

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
export function loadCaseStudy(slug: string): { html: string; toc: TocItem[]; groups: TocGroup[]; arch: string | null } | null {
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

  const built = markBuildNodes(html);

  let arch: string | null = null;
  try {
    arch = readFileSync(path.join(process.cwd(), "content", "arch", `${slug}.html`), "utf8");
  } catch {
    /* no architecture write-up for this project */
  }

  return { html: built, toc, groups: groupToc(toc), arch };
}

/* The explorer groups a report's sections into folders, by what each section
   is about. Order inside a folder follows the document. */
const GROUP_RULES: { id: string; label: string; test: RegExp }[] = [
  { id: "context", label: "context", test: /^(overview|problem|inspiration|background|dataset|the-dataset|data-set)/ },
  {
    id: "results",
    label: "results",
    test: /(results|performance|findings|kpis|evaluation|communication|revenue|retention|segmentation|discussion|^why-|limitations|learnings|status|volatility)/,
  },
  { id: "notes", label: "notes", test: /^(engineering-challenges|engineering-decisions|tech-stack|outcomes|conclusion|live-on)/ },
];

export function groupToc(toc: TocItem[]): TocGroup[] {
  const groups: TocGroup[] = [
    { id: "context", label: "context", items: [] },
    { id: "build", label: "build", items: [] },
    { id: "results", label: "results", items: [] },
    { id: "notes", label: "notes", items: [] },
  ];
  for (const it of toc) {
    const g = GROUP_RULES.find((r) => r.test.test(it.id))?.id ?? "build";
    groups.find((x) => x.id === g)!.items.push(it);
  }
  return groups.filter((g) => g.items.length);
}

/* ---------------------------------------------------------------------------
   Swarm build: every top-level block of a .content-section becomes a build
   node (headings and paragraphs are written by the coders, figures and code
   are framed and styled), and each section is one review segment.
   --------------------------------------------------------------------------- */
const VOID = new Set(["img", "br", "hr", "source", "input", "meta", "link", "wbr", "track", "col", "area", "embed", "param"]);

function kindOf(tag: string, attrs: string): [string, string] | null {
  if (tag === "h2" || tag === "h3") return ["type", tag];
  if (tag === "p") return [/subsection-title/.test(attrs) ? "type" : "para", "p"];
  if (tag === "ul" || tag === "ol") return ["list", tag];
  if (tag === "figure" || tag === "img" || tag === "video" || tag === "iframe") return ["media", tag];
  if (tag === "pre") return ["block", "pre.code"];
  if (tag === "table") return ["block", "table"];
  if (tag === "blockquote") return ["para", "blockquote"];
  if (tag === "div") return ["block", /code-container/.test(attrs) ? "div.code" : "div"];
  return null;
}

export function markBuildNodes(html: string): string {
  const tagRe = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/?)>/g;
  let out = "";
  let last = 0;
  let inSection = 0; // depth inside the current .content-section (0 = outside)
  let seg = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html))) {
    const [whole, close, rawTag, attrs, selfClose] = m;
    if (!rawTag) continue; // comment
    const tag = rawTag.toLowerCase();
    const isVoid = VOID.has(tag) || selfClose === "/";
    let replacement = whole;

    if (!close && tag === "section" && /content-section/.test(attrs) && inSection === 0) {
      seg += 1;
      const id = /<h2 id="([^"]+)"/.exec(html.slice(m.index, m.index + 400))?.[1] ?? `part-${seg}`;
      replacement = `<${rawTag}${attrs} data-seg="${id}">`;
      inSection = 1;
    } else if (inSection > 0) {
      if (close) {
        inSection -= 1;
      } else {
        if (inSection === 1) {
          const k = kindOf(tag, attrs);
          if (k && !/data-build=/.test(attrs)) replacement = `<${rawTag}${attrs} data-build="${k[0]}" data-label="${k[1]}"${selfClose ? " /" : ""}>`;
        }
        if (!isVoid) inSection += 1;
      }
    }
    out += html.slice(last, m.index) + replacement;
    last = m.index + whole.length;
  }
  return out + html.slice(last);
}
