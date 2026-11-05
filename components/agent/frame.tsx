"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AgentShell, type Tab } from "./shell";
import { getProject } from "@/lib/projects";

/**
 * Agent shell for the inner pages (/work, field reports, coming-soon, 404).
 * Keyed by pathname, so every navigation is a fresh swarm session that
 * builds the new page.
 */
export function AgentFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const parts = pathname.split("/").filter(Boolean);
  const isWork = parts[0] === "work";
  const slug = isWork ? parts[1] : undefined;
  const project = slug ? getProject(slug) : null;

  let current = "404";
  let task = "recover from a missing page";
  const tabs: Tab[] = [
    { id: "home", label: "home", href: "/" },
    { id: "work", label: "work", href: "/work/" },
  ];
  if (project) {
    current = project.slug;
    task = `open field report: ${project.name}`;
    tabs.push({ id: project.slug, label: project.slug, href: pathname });
  } else if (slug === "coming-soon") {
    current = "coming-soon";
    task = "stage an upcoming field report";
    tabs.push({ id: "coming-soon", label: "coming-soon", href: pathname });
  } else if (isWork) {
    current = "work";
    task = "index every project";
  } else {
    tabs.push({ id: "404", label: "404", href: pathname });
  }
  tabs.push({ id: "contact", label: "contact", href: "/#contact" });

  return (
    <AgentShell
      key={pathname}
      tabs={tabs}
      current={current}
      path={parts.join("/")}
      task={task}
      className={project ? "ag-skin ag-ide" : undefined}
      railTabs={!!project}
      roster={project ? "report" : "home"}
    >
      {children}
    </AgentShell>
  );
}
