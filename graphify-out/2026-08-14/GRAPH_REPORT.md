# Graph Report - version_2  (2026-07-14)

## Corpus Check
- 35 files · ~2,883,332 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 177 nodes · 291 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8983d084`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- package.json
- hero.tsx
- compilerOptions
- icons.tsx
- Madhu Siddharth Suthagar — Portfolio v2 · "Instrument"
- devDependencies
- layout.tsx
- projects.ts
- page.tsx
- next.config.mjs
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Reveal()` - 9 edges
3. `ArrowIcon()` - 7 edges
4. `PROFILE` - 7 edges
5. `ArrowUpRight()` - 6 edges
6. `scripts` - 6 edges
7. `Madhu Siddharth Suthagar — Portfolio v2 · "Instrument"` - 6 edges
8. `CaseStudyPage()` - 5 edges
9. `loadCaseStudy()` - 5 edges
10. `techIcon()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `generateMetadata()` --calls--> `getProject()`  [EXTRACTED]
  app/work/[slug]/page.tsx → lib/projects.ts
- `Skills()` --calls--> `techIcon()`  [EXTRACTED]
  components/sections/skills.tsx → lib/projects.ts
- `CaseStudyPage()` --calls--> `loadCaseStudy()`  [EXTRACTED]
  app/work/[slug]/page.tsx → lib/case-study.ts
- `CaseStudyPage()` --calls--> `getProject()`  [EXTRACTED]
  app/work/[slug]/page.tsx → lib/projects.ts
- `CaseStudyPage()` --calls--> `techIcon()`  [EXTRACTED]
  app/work/[slug]/page.tsx → lib/projects.ts

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.20
Nodes (13): CaseStudyPage(), generateMetadata(), Params, STUDY_PROJECTS, CaseStudyToc(), ReadingProgress(), decodeEntities(), loadCaseStudy() (+5 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (21): framer-motion, geist, next, dependencies, framer-motion, geist, next, react (+13 more)

### Community 2 - "hero.tsx"
Cohesion: 0.13
Nodes (15): CountUp(), CountUpProps, Intro(), Magnetic(), MagneticProps, Certifications(), Contact(), Hero() (+7 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (21): ./*, dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental (+13 more)

### Community 4 - "icons.tsx"
Cohesion: 0.15
Nodes (14): ArrowIcon(), ArrowUpRight(), DiscordIcon(), GithubIcon(), IconProps, LinkedinIcon(), LiveIcon(), MailIcon() (+6 more)

### Community 5 - "Madhu Siddharth Suthagar — Portfolio v2 · "Instrument""
Cohesion: 0.25
Nodes (7): Commands, Content fidelity, Design direction — "Instrument", Madhu Siddharth Suthagar — Portfolio v2 · "Instrument", Notes / future optimizations, Stack, Structure

### Community 6 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript, tailwindcss (+5 more)

### Community 7 - "layout.tsx"
Cohesion: 0.38
Nodes (3): metadata, Cursor(), PlotBackdrop()

### Community 8 - "projects.ts"
Cohesion: 0.14
Nodes (18): metadata, LockIcon(), Reveal(), RevealProps, Props, SectionHeading(), mobilePeekActive(), rowHref() (+10 more)

### Community 9 - "page.tsx"
Cohesion: 0.15
Nodes (10): metadata, .next, next-env.d.ts, .next/types/**/*.ts, node_modules, out, **/*.ts, **/*.tsx (+2 more)

## Knowledge Gaps
- **62 isolated node(s):** `metadata`, `Params`, `metadata`, `metadata`, `CountUpProps` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `.next` connect `page.tsx` to `projects.ts`, `page.tsx`, `layout.tsx`?**
  _High betweenness centrality (0.211) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `page.tsx`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **What connects `metadata`, `Params`, `metadata` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `hero.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `projects.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._