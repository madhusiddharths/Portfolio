"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./icons";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") ||
      "light";
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#0a0a0d" : "#f6f5f1");
    try {
      localStorage.setItem("instrument-theme", next);
    } catch {}
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title="Toggle theme"
    >
      <span className="theme-toggle-track" aria-hidden="true">
        {mounted && (theme === "dark" ? <MoonIcon /> : <SunIcon />)}
      </span>
    </button>
  );
}
