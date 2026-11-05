import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "lenis/dist/lenis.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { display, serif, plex, jbmono } from "./fonts";

export const metadata: Metadata = {
  metadataBase: new URL("https://madhusiddharth.dev"),
  title: {
    default: "Madhu Siddharth Suthagar — AI Engineer",
    template: "%s · Madhu Siddharth Suthagar",
  },
  description:
    "Madhu Siddharth is an AI engineer building agentic AI workflows that automate work end to end — agents, tool integration, model fine-tuning, evaluation, and production deployment.",
  authors: [{ name: "Madhu Siddharth Suthagar" }],
  icons: { icon: "/img/letter_m.png", apple: "/img/letter_m.png" },
  openGraph: {
    title: "Madhu Siddharth Suthagar — AI Engineer",
    description: "Agentic AI workflows, end-to-end automation, and production AI systems.",
    type: "website",
  },
};

// Runs before paint, so there is no flash. Every route is the agent UI now:
//  · Theme — always dark (the agent palette is scoped under .ag).
//  · Scroll-reveal — armed only when motion is allowed.
//  · Swarm build — when motion is allowed and the visitor hasn't chosen
//    "skip build", arm `build-on` so every [data-build] node starts as a
//    wireframe. If the swarm engine hasn't booted within 5s (JS error, slow
//    device) the class is dropped and the finished page shows — content is
//    never held hostage by the animation. If the engine then arrives late
//    (a cold dev compile), it re-arms the build itself (engine.attach).
const bootScript = `(function(){var d=document.documentElement;try{d.setAttribute("data-theme","dark");var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m);}m.setAttribute("content","#07070a");var r=matchMedia("(prefers-reduced-motion: reduce)").matches;if(!r){d.classList.add("reveal-on");}if(!r&&localStorage.getItem("swarm-skip")!=="1"){d.classList.add("build-on");setTimeout(function(){if(!window.__swarmReady){d.classList.remove("build-on");window.__swarmLate=true;}},5000);}}catch(e){d.classList.remove("build-on");}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable} ${serif.variable} ${plex.variable} ${jbmono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
