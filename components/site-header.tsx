"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { PROFILE } from "@/lib/projects";
import { ThemeToggle } from "./theme-toggle";
import { ArrowUpRight } from "./icons";

const NAV = [
  { label: "Work", href: "/work/" },
  { label: "Skills", href: "/#skills" },
  { label: "Certifications", href: "/#certifications" },
  { label: "Contact", href: "/#contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // undefined when smooth scrolling isn't mounted (reduced motion) — the
  // optional calls below then no-op and the body lock alone does the work.
  const lenis = useLenis();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the open menu panel: the body lock stops native
  // scrolling, and stopping Lenis stops it consuming wheel/touch on top.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) lenis?.stop();
    else lenis?.start();
    return () => {
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [open, lenis]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="u-container site-header-inner">
        <Link href="/" className="brand" aria-label={`${PROFILE.name} — home`} onClick={() => setOpen(false)}>
          <span className="brand-mark">{PROFILE.monogram}</span>
          <span className="brand-text">
            <span className="brand-name">{PROFILE.shortName}</span>
            <span className="brand-role u-mono">{PROFILE.role}</span>
          </span>
        </Link>

        {/* data-lenis-prevent: the mobile panel scrolls on its own (overflow-y:
            auto), so Lenis must leave gestures inside it alone. */}
        <nav className={`site-nav ${open ? "is-open" : ""}`} aria-label="Primary" data-lenis-prevent>
          <ul>
            {NAV.map((item, i) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)}>
                  <span className="nav-index u-mono">{String(i + 1).padStart(2, "0")}</span>
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="nav-resume">
              <a href={PROFILE.resume} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                Résumé <ArrowUpRight width={13} height={13} />
              </a>
            </li>
          </ul>
        </nav>

        <div className="site-header-actions">
          <ThemeToggle />
          <button
            type="button"
            className={`hamburger ${open ? "is-open" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      {open && <button className="nav-scrim" aria-hidden="true" tabIndex={-1} onClick={() => setOpen(false)} />}
    </header>
  );
}
