import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlotBackdrop } from "@/components/plot-backdrop";
import { Cursor } from "@/components/cursor";

export const metadata: Metadata = {
  metadataBase: new URL("https://madhusiddharth.dev"),
  title: {
    default: "Madhu Siddharth Suthagar — Data Scientist",
    template: "%s · Madhu Siddharth Suthagar",
  },
  description:
    "Madhu Siddharth is a data scientist specializing in machine learning and data-driven solutions — building end-to-end data systems, applied ML, and agentic AI.",
  authors: [{ name: "Madhu Siddharth Suthagar" }],
  icons: { icon: "/img/letter_m.png", apple: "/img/letter_m.png" },
  openGraph: {
    title: "Madhu Siddharth Suthagar — Data Scientist",
    description: "End-to-end data systems, applied machine learning, and agentic AI.",
    type: "website",
  },
};

// Runs before paint, so there is no flash. Responsibilities:
//  · Theme — defaults to LIGHT; only an explicit prior choice flips it to dark.
//    Also syncs the mobile browser-chrome color to the resolved theme.
//  · Scroll-reveal — armed only when motion is allowed.
//  · Landing intro — armed once per session, on the home route only, motion
//    permitting; the class is auto-removed after it plays so SPA re-visits
//    don't replay it. If JS is off or motion is reduced, none of this runs and
//    all content stays visible by default — every enhancement is additive.
const themeScript = `(function(){try{var t=localStorage.getItem("instrument-theme")||"light";var d=document.documentElement;d.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m);}m.setAttribute("content",t==="dark"?"#0a0a0d":"#f6f5f1");var r=matchMedia("(prefers-reduced-motion: reduce)").matches;if(!r){d.classList.add("reveal-on");}var p=location.pathname;if(!r&&(p==="/"||p.slice(-11)==="/index.html")&&!sessionStorage.getItem("intro-played")){d.classList.add("intro-on");sessionStorage.setItem("intro-played","1");setTimeout(function(){d.classList.remove("intro-on");},1650);}}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <PlotBackdrop />
        <Cursor />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
