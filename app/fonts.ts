import { Anton, Instrument_Serif } from "next/font/google";

/** Display + script faces for the agent UI (exposed as CSS variables on <html>). */
export const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
export const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], variable: "--font-serif" });
