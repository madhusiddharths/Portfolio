"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, type LenisRef } from "lenis/react";

/**
 * Smooth (inertial) scrolling — mounted only when motion is allowed.
 *
 * Lenis drives the REAL window scroll position instead of transforming a
 * wrapper, so everything already reading the scroll keeps working untouched:
 * the header's `is-scrolled` flag, the reading-progress bar, every
 * IntersectionObserver (reveal, count-up, TOC spy), and the sticky TOC and
 * metadata rails on case studies.
 *
 * Gated on `reveal-on` — the same pre-paint signal `Reveal` reads, put on
 * <html> only when the visitor hasn't asked for reduced motion. Without it
 * nothing mounts and native scrolling (plus the `scroll-behavior: smooth`
 * fallback in globals.css) takes over. `root` renders no extra DOM, so the
 * markup is identical either way.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const lenisRef = useRef<LenisRef>(null);
  const pathname = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    setEnabled(document.documentElement.classList.contains("reveal-on"));
  }, []);

  // A new route starts at the top, so drop any inertia carried over from the
  // page we just left. Skipped on first paint (the browser owns the initial
  // position) and whenever a hash is present, so `/#skills` still lands on
  // its section instead of being yanked to zero.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (window.location.hash) return;
    lenisRef.current?.lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  if (!enabled) return <>{children}</>;

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: true,
        // Lenis takes over in-page anchors. It already subtracts the root's
        // `scroll-padding-top: 8rem` (globals.css) when resolving a target, so
        // the header clearance needs no offset here — adding one double-counts.
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
