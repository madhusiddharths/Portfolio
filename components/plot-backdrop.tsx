"use client";

import { useEffect, useRef } from "react";

/**
 * Signature backdrop: a faint generative scatter plot with a drifting trend
 * line — a nod to the data work, replacing the old particle starfield.
 * Perf-light (~70 points), pauses off-screen, static frame on reduced motion.
 */
export function PlotBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const N = 70;
    type Pt = { x: number; y: number; vx: number; vy: number; r: number };
    let pts: Pt[] = [];
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    let accent = "91,61,245";
    let ink = "17,17,16";
    function sampleTheme() {
      const cs = getComputedStyle(document.documentElement);
      const a = cs.getPropertyValue("--accent-rgb").trim();
      const i = cs.getPropertyValue("--ink-rgb").trim();
      if (a) accent = a;
      if (i) ink = i;
    }

    function seed() {
      pts = Array.from({ length: N }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00018,
        vy: (Math.random() - 0.5) * 0.00018,
        r: Math.random() * 1.6 + 0.6,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(animate: boolean) {
      ctx!.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const par = (mouse.x - 0.5) * 26;
      const parY = (mouse.y - 0.5) * 18;

      // trend line through a smoothed subset
      ctx!.beginPath();
      const line = pts.slice(0, 16);
      line.forEach((p, idx) => {
        const px = p.x * w + par;
        const py = p.y * h + parY;
        if (idx === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      });
      ctx!.strokeStyle = `rgba(${accent},0.05)`;
      ctx!.lineWidth = 1.2;
      ctx!.stroke();

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (animate) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > 1) p.vx *= -1;
          if (p.y < 0 || p.y > 1) p.vy *= -1;
        }
        const px = p.x * w + par;
        const py = p.y * h + parY;

        // nearest-neighbour faint links
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = (p.x - q.x) * w;
          const dy = (p.y - q.y) * h;
          const d2 = dx * dx + dy * dy;
          if (d2 < 12000) {
            const qx = q.x * w + par;
            const qy = q.y * h + parY;
            ctx!.beginPath();
            ctx!.moveTo(px, py);
            ctx!.lineTo(qx, qy);
            ctx!.strokeStyle = `rgba(${ink},${0.05 * (1 - d2 / 12000)})`;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }

        ctx!.beginPath();
        ctx!.arc(px, py, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = i % 9 === 0 ? `rgba(${accent},0.5)` : `rgba(${ink},0.28)`;
        ctx!.fill();
      }
    }

    function loop() {
      draw(true);
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: MouseEvent) {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    }
    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) loop();
    }

    sampleTheme();
    resize();
    seed();

    const themeObserver = new MutationObserver(sampleTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    if (reduce) draw(false);
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="plot-backdrop" aria-hidden="true" />;
}
