# Madhu Siddharth Suthagar — Portfolio v2 · "Instrument"

A ground-up redesign of the portfolio with a completely original visual identity
and a modern, component-driven stack. Every word of the original content (project
descriptions, bio, skills, certifications) is preserved verbatim — only the
design system, information architecture, and engineering are new.

## Design direction — "Instrument"

A **light-first, editorial engineering aesthetic** — the portfolio reads like a
precision instrument / lab notebook rather than a dark SaaS landing page. It takes
the Vercel / Linear / Stripe lineage and routes it through a *data-scientist*
identity (plots, telemetry, monospace readouts).

Deliberate breaks from the previous versions (which shared a dark theme,
Satoshi/General Sans type, a cyan/teal gradient, an image-card grid, a scrolling
skills marquee, and a particle starfield):

| Layer | New in "Instrument" |
| --- | --- |
| Base | Light **paper & ink** — bone `#F6F5F1` / ink `#111110` (dark mode as a secondary toggle) |
| Type | **Geist + Geist Mono** — monospace used as functional UI chrome (indices, tags, readouts) |
| Accent | A single **ultraviolet** signal `#5B3DF5` (lightens to `#8B74FF` in dark) — no gradients |
| Backdrop | A faint generative **scatter plot + trend line** on graph paper, not particles |
| Projects | A numbered **work index / ledger** with a cursor-following preview, not a card grid |
| Skills | A static **capability matrix**, not infinite marquees |
| Hero | An editorial statement + a live **monospace status line** |
| Case studies | **Field Reports** — sticky numbered TOC, `§` section counters, a metadata rail, reading progress |

Microinteractions: instrument cursor (trailing crosshair + coordinate readout),
magnetic CTAs, scroll-linked count-ups on real metrics (557M+ stars, 20M+ events,
~20K tweets), and hover-reveal index rows. All motion respects
`prefers-reduced-motion`, and **all content is visible without JavaScript**.

## Stack

- **Next.js 15** (App Router, TypeScript) — **statically exported** (`output: "export"`),
  so it deploys to GitHub Pages / Vercel / any static host with zero server.
- **Tailwind CSS v4** — base/reset + a custom token-driven design system.
- **Framer Motion** — magnetic + preview microinteractions.
- **Geist** (`geist/font`) — self-hosted Geist Sans + Geist Mono via `next/font`.

## Structure

```
app/
  layout.tsx              global chrome: header, footer, plot backdrop, cursor
  page.tsx                home (hero · work · skills · certs · contact)
  globals.css             design tokens + base + primitives
  instrument.css          component styles
  work/
    page.tsx              full project index
    [slug]/page.tsx       Field Report template (generateStaticParams)
    [slug]/fieldnotes.css case-study reading experience
    coming-soon/page.tsx  placeholder for projects without a write-up yet
components/               header, footer, work-index, sections, cursor, reveal, …
lib/
  projects.ts             typed content registry (single source of truth)
  case-study.ts           build-time loader: injects <h2> ids, derives the TOC
content/*.html            12 case-study bodies, extracted VERBATIM from the source
public/img, public/videos all original media
```

### Content fidelity

The 12 case-study write-ups were **extracted verbatim** from the original HTML
into `content/*.html` (paths rewritten, nothing reworded) and are rendered at
build time inside the redesigned shell. This guarantees zero content drift while
collapsing 13 duplicated HTML shells into one reusable template. Project metadata,
skills, and certifications live in `lib/projects.ts`.

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out
npm run serve    # preview the exported ./out
```

## Notes / future optimizations

- `public/videos/saturdae_recording.mov` (~39 MB) is the one heavy asset, carried
  over unchanged to preserve content. Re-encoding to a compressed MP4/WebM would
  cut it dramatically.
- `SymptoScan`, `Hotspot`, and `Image Classifier` route to a "write-up in progress"
  page (they had no detailed case study in the source); their cards/links are live.
```
