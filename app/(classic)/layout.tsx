import { AgentFrame } from "@/components/agent/frame";

/** Inner pages (/work index, field reports) share the agentic-browser frame. */
export default function InnerLayout({ children }: { children: React.ReactNode }) {
  return <AgentFrame>{children}</AgentFrame>;
}
