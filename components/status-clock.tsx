"use client";

import { useEffect, useState } from "react";

/** Live local-time readout for the hero status line — a small instrument tell. */
export function StatusClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="status-clock" suppressHydrationWarning>
      {time ?? "--:--:--"}
    </span>
  );
}
