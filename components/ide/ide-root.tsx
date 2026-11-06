"use client";

import { useEffect } from "react";
import { ide, type Panel } from "./store";

/**
 * Wires a field report into the IDE store: remembered panels, the section the
 * reader is in (scroll spy over the article's <h2>s), and VS Code shortcuts —
 * ⌘B explorer, ⌘J panel, ⌘⌥B secondary side bar. Renders nothing.
 */
export function IdeRoot({ order }: { order: string[] }) {
  useEffect(() => {
    ide.hydrate();
    ide.setOrder(order);
    ide.setActive(order[0] ?? "");
    return () => ide.teardown();
  }, [order]);

  // scroll spy — the last heading above the reading line is the active one
  useEffect(() => {
    const heads = order.map((id) => document.getElementById(id)).filter((h): h is HTMLElement => !!h);
    if (!heads.length) return;
    let raf = 0;
    const spy = () => {
      raf = 0;
      const line = window.innerHeight * 0.3;
      let cur = heads[0].id;
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= line) cur = h.id;
        else break;
      }
      // reached the bottom: the last section is the one being read
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 4) cur = heads[heads.length - 1].id;
      ide.setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(spy);
    };
    spy();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [order]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      // e.code, not e.key: ⌥ changes the character on macOS
      let p: Panel | null = null;
      if (e.code === "KeyB") p = e.altKey ? "right" : "left";
      else if (e.code === "KeyJ" && !e.altKey) p = "bottom";
      if (!p) return;
      e.preventDefault();
      ide.toggle(p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
