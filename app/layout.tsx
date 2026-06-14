import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0d" },
  ],
};

// Runs before paint: sets the theme (no flash) and enables scroll-reveal only
// when motion is allowed. If JS is off or motion is reduced, content stays
// visible by default — the reveal is purely additive.
const themeScript = `(function(){try{var t=localStorage.getItem("instrument-theme");if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);if(!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("reveal-on");}}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

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
