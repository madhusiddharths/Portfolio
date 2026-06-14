"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
};

/**
 * Scroll-reveal that is VISIBLE BY DEFAULT. The hidden→shown transition only
 * applies when <html> has `reveal-on` (added pre-paint only if motion is
 * allowed). So: no-JS → visible, reduced-motion → visible, otherwise → animates.
 * Content is always present in the static HTML.
 */
export function Reveal({ children, delay = 0, className = "", style, id }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!document.documentElement.classList.contains("reveal-on")) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      className={`reveal ${shown ? "is-shown" : ""} ${className}`.trim()}
      style={delay ? { ...style, transitionDelay: `${delay}s` } : style}
    >
      {children}
    </div>
  );
}
