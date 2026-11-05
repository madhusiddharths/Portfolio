import type { ComponentPropsWithoutRef, ElementType } from "react";

export type BuildKind = "type" | "para" | "fill" | "block" | "list" | "media" | "frame";

/**
 * One node of the swarm build. Renders `as` (default div) with the wireframe
 * hooks attached; the engine flips `data-state` and the CSS does the rest.
 * Server-safe (no hooks), so server sections can pass any `as`, Link included.
 */
export function B<T extends ElementType = "div">({
  as,
  kind = "block",
  label,
  className,
  ...rest
}: { as?: T; kind?: BuildKind; label: string } & Omit<ComponentPropsWithoutRef<T>, "as">) {
  const Tag = (as ?? "div") as ElementType;
  return <Tag data-build={kind} data-label={label} className={className ? `bn ${className}` : "bn"} {...rest} />;
}
