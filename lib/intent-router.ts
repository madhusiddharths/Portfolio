/* =============================================================================
   Intent router for the swarm console — a deterministic, zero-network "tool
   router" (a nod to the Tool Router Ladder project). It maps a free-text ask to
   one tool call with a confidence score, which the console logs and executes.
   ========================================================================== */

import { PROJECTS, PROFILE, SKILLS, TECH, usesSkill } from "@/lib/projects";

export type Route =
  | { tool: "scroll"; args: { section: string }; conf: number; say: string }
  | { tool: "open"; args: { href: string; external: boolean }; conf: number; say: string }
  | { tool: "match_projects"; args: { slugs: string[]; skill?: string }; conf: number; say: string }
  | { tool: "skip_build" | "replay_build"; args: Record<string, never>; conf: number; say: string }
  | { tool: "none"; args: Record<string, never>; conf: number; say: string };

const ALL_TECH = Array.from(new Set([...Object.keys(TECH), ...SKILLS.flatMap((g) => g.items)]));

const has = (q: string, ...words: string[]) => words.some((w) => new RegExp(`\\b${w}`, "i").test(q));

export const SUGGESTIONS = ["agentic projects", "kafka", "pytorch", "résumé", "contact", "replay build"];

export function route(raw: string): Route {
  const q = raw.trim().toLowerCase();
  if (!q) return { tool: "none", args: {}, conf: 0, say: "empty prompt" };

  if (has(q, "skip", "stop", "finish")) return { tool: "skip_build", args: {}, conf: 0.97, say: "skipping the build" };
  if (has(q, "replay", "rebuild", "again", "restart"))
    return { tool: "replay_build", args: {}, conf: 0.97, say: "rebuilding from a blank canvas" };
  if (has(q, "analyst")) return { tool: "open", args: { href: PROFILE.analystResume, external: true }, conf: 0.94, say: "opening the Data Analyst résumé" };
  if (has(q, "resume", "résumé", "cv"))
    return { tool: "open", args: { href: PROFILE.resume, external: true }, conf: 0.95, say: "opening the résumé" };
  if (has(q, "github")) return { tool: "open", args: { href: PROFILE.github, external: true }, conf: 0.95, say: "opening GitHub" };
  if (has(q, "linkedin")) return { tool: "open", args: { href: PROFILE.linkedin, external: true }, conf: 0.95, say: "opening LinkedIn" };
  if (has(q, "discord")) return { tool: "open", args: { href: PROFILE.discord, external: true }, conf: 0.95, say: "opening Discord" };
  if (has(q, "contact", "email", "mail", "hire", "reach", "talk", "collab"))
    return { tool: "scroll", args: { section: "contact" }, conf: 0.92, say: "jumping to contact" };
  if (has(q, "cert", "credential", "badge"))
    return { tool: "scroll", args: { section: "certs" }, conf: 0.9, say: "jumping to certifications" };
  if (has(q, "skill", "stack", "tool", "toolbox", "tech"))
    return { tool: "scroll", args: { section: "stack" }, conf: 0.88, say: "jumping to the toolbox" };
  if (has(q, "about", "who", "bio", "background", "philosophy"))
    return { tool: "scroll", args: { section: "about" }, conf: 0.88, say: "jumping to background" };
  if (has(q, "all projects", "index", "everything"))
    return { tool: "open", args: { href: "/work/", external: false }, conf: 0.9, say: "opening the full project index" };

  // A named project → its field report.
  const proj = PROJECTS.find((p) => q.includes(p.name.toLowerCase()) || q.includes(p.slug.replace(/-/g, " ")));
  if (proj)
    return {
      tool: "open",
      args: { href: proj.hasCaseStudy ? `/work/${proj.slug}/` : `/work/coming-soon/?p=${proj.slug}`, external: false },
      conf: 0.93,
      say: `opening ${proj.name}`,
    };

  // A technology → highlight the projects that use it.
  const tech = ALL_TECH.filter((t) => t.length > 1)
    .sort((a, b) => b.length - a.length)
    .find((t) => {
      const tl = t.toLowerCase();
      return q.includes(tl) || (q.length >= 3 && tl.split(/[\s-]/).some((part) => part.length >= 3 && q.includes(part)));
    });
  if (tech) {
    const slugs = PROJECTS.filter((p) => usesSkill(p.tech, tech)).map((p) => p.slug);
    return {
      tool: "match_projects",
      args: { slugs, skill: tech },
      conf: slugs.length ? 0.86 : 0.4,
      say: slugs.length ? `${slugs.length} project${slugs.length > 1 ? "s" : ""} use ${tech}` : `no projects tagged ${tech} yet`,
    };
  }
  if (has(q, "agent", "llm", "ai"))
    return {
      tool: "match_projects",
      args: { slugs: PROJECTS.filter((p) => p.tech.includes("Agentic AI") || /agent|llm/i.test(p.summary)).map((p) => p.slug), skill: "Agentic AI" },
      conf: 0.84,
      say: "highlighting agentic & LLM work",
    };
  if (has(q, "work", "project", "build", "portfolio"))
    return { tool: "scroll", args: { section: "work" }, conf: 0.8, say: "jumping to flagship work" };

  // Fallback: keyword search over summaries.
  const words = q.split(/\W+/).filter((w) => w.length > 3);
  const slugs = PROJECTS.filter((p) => words.some((w) => p.summary.toLowerCase().includes(w))).map((p) => p.slug);
  if (slugs.length)
    return { tool: "match_projects", args: { slugs }, conf: 0.55, say: `${slugs.length} loose match${slugs.length > 1 ? "es" : ""} in project notes` };
  return { tool: "none", args: {}, conf: 0.2, say: "no confident route — try a tech, a project, or 'contact'" };
}
