"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Mounts the IDE chrome (explorer, architecture panel, status bar, sashes) on
 * the agent root instead of inside <main>. <main> is its own stacking layer
 * (z-index 1) under the swarm's cursor layer (z-index 40), so panels inside it
 * were drawn *under* the agents' cursors. As children of the root, the panels
 * (z 43–47) cover the cursors like real IDE chrome.
 */
export function IdePortal({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => setRoot(document.querySelector<HTMLElement>(".ag.ag-ide")), []);
  return root ? createPortal(children, root) : null;
}
