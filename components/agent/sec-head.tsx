import type { ReactNode } from "react";
import { B } from "./b";

/** Section header: mono index line, red eyebrow, big title — each a build node. */
export function SecHead({
  index,
  eyebrow,
  title,
  as = "h2",
  children,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  as?: "h1" | "h2";
  children?: ReactNode;
}) {
  return (
    <header className="sec-head">
      <B as="p" kind="type" label="span.index" className="sec-index">
        {index}
      </B>
      <B as="p" kind="type" label="span.eyebrow" className="sec-eyebrow">
        {eyebrow}
      </B>
      <B as={as} kind="type" label={`${as}.title`} className="sec-title">
        {title}
      </B>
      {children}
    </header>
  );
}
