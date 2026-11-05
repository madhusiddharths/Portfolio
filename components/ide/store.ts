"use client";

import { useSyncExternalStore } from "react";

/* ---------------------------------------------------------------------------
   IDE state for the field reports — which panels are open, which section the
   reader is in, and whether the architecture graph follows the scroll or
   shows everything. A tiny external store, so the explorer, the bottom panel,
   the status bar and the rail tabs stay in sync without a provider.
   Panel visibility is mirrored onto <html data-ide-*> so the layout is pure
   CSS, and remembered in localStorage.
   --------------------------------------------------------------------------- */

export type Panel = "left" | "right" | "bottom";
type State = {
  panels: Record<Panel, boolean>;
  active: string; // section id the reader is in
  order: string[]; // section ids in document order
  revealAll: boolean;
};

const KEY = "ide-panels";
const SIZE_KEY = "ide-sizes";

/** panel sizes in px — left/right are widths, bottom is a height */
export const SIZE_DEFAULT: Record<Panel, number> = { left: 252, right: 360, bottom: 300 };
export const SIZE_MIN: Record<Panel, number> = { left: 180, right: 280, bottom: 140 };
const SIZE_VAR: Record<Panel, string> = { left: "--ide-lw", right: "--ide-rw", bottom: "--ide-bh" };
let sizes: Record<Panel, number> = { ...SIZE_DEFAULT };

/** the most a panel may take: leave the report at least ~440px wide / 220px tall */
export function sizeMax(p: Panel) {
  if (typeof window === "undefined") return 600;
  if (p === "bottom") return Math.max(SIZE_MIN.bottom, window.innerHeight - 52 - 24 - 220);
  const other = p === "left" ? sizes.right : sizes.left;
  return Math.max(SIZE_MIN[p], Math.min(640, window.innerWidth - other - 440));
}
function applySize(p: Panel) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(SIZE_VAR[p], `${Math.round(sizes[p])}px`);
}
let state: State = {
  panels: { left: true, right: true, bottom: true },
  active: "",
  order: [],
  revealAll: false,
};
const subs = new Set<() => void>();

function emit() {
  subs.forEach((f) => f());
}
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}
function mirror() {
  if (typeof document === "undefined") return;
  const d = document.documentElement;
  (Object.keys(state.panels) as Panel[]).forEach((p) => d.setAttribute(`data-ide-${p}`, state.panels[p] ? "on" : "off"));
}

export const ide = {
  get: () => state,
  subscribe(f: () => void) {
    subs.add(f);
    return () => subs.delete(f);
  },
  /** resize a panel (clamped); `save` writes it to localStorage */
  resize(p: Panel, px: number, save = false) {
    sizes = { ...sizes, [p]: Math.min(sizeMax(p), Math.max(SIZE_MIN[p], px)) };
    applySize(p);
    if (save) {
      try {
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizes));
      } catch {
        /* ignore */
      }
    }
  },
  size: (p: Panel) => sizes[p],
  /** read remembered panels (call once on mount) */
  hydrate() {
    try {
      const saved = JSON.parse(localStorage.getItem(SIZE_KEY) ?? "null");
      if (saved && typeof saved === "object") sizes = { ...sizes, ...saved };
    } catch {
      /* defaults */
    }
    (Object.keys(sizes) as Panel[]).forEach(applySize);
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (saved && typeof saved === "object") set({ panels: { ...state.panels, ...saved } });
    } catch {
      /* private mode — defaults */
    }
    mirror();
  },
  toggle(p: Panel, open?: boolean) {
    set({ panels: { ...state.panels, [p]: open ?? !state.panels[p] } });
    mirror();
    try {
      localStorage.setItem(KEY, JSON.stringify(state.panels));
    } catch {
      /* ignore */
    }
  },
  setActive(id: string) {
    if (id !== state.active) set({ active: id });
  },
  setOrder(order: string[]) {
    set({ order });
  },
  setRevealAll(v: boolean) {
    set({ revealAll: v });
  },
  /** clear the html attributes when leaving a report */
  teardown() {
    const d = document.documentElement;
    (["left", "right", "bottom"] as Panel[]).forEach((p) => {
      d.removeAttribute(`data-ide-${p}`);
      d.style.removeProperty(SIZE_VAR[p]);
    });
  },
};

export function useIde<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(ide.subscribe, () => pick(state), () => pick(state));
}

type LenisLike = { scrollTo: (t: HTMLElement, o?: { offset?: number }) => void } | undefined;

/** smooth-scroll the window to a section, clearing the fixed chrome */
export function scrollToSection(id: string, lenis?: LenisLike) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = -76;
  // Lenis already subtracts the root's scroll-padding-top (the chrome)
  if (lenis) lenis.scrollTo(el);
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
}
