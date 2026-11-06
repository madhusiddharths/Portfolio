import { Anton, Instrument_Serif, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";

/** Display + script faces for the agent UI (exposed as CSS variables on <html>). */
export const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
export const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], variable: "--font-serif" });

/** Landing console faces — an engineering sans and an IDE mono (scoped to .ag-home). */
export const plex = IBM_Plex_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-plex" });
export const jbmono = JetBrains_Mono({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-jbmono" });
