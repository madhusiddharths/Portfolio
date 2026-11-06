"use client";

import { useEffect, useState } from "react";
import { PROFILE } from "@/lib/projects";

// Wall-clock time in Chicago, whatever the visitor's own zone is. The GMT
// offset comes from Intl, so it flips between GMT-6 (CST) and GMT-5 (CDT).
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: PROFILE.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const offsetFmt = new Intl.DateTimeFormat("en-US", { timeZone: PROFILE.timeZone, timeZoneName: "shortOffset" });
const offset = (d: Date) => offsetFmt.formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? "CT";

/** Live local-time readout for the hero status line — a small instrument tell. */
export function StatusClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="status-clock" suppressHydrationWarning>
      {now ? `${offset(now)} ${timeFmt.format(now)}` : "CT --:--:--"}
    </span>
  );
}
