import type { Metadata } from "next";
import { PROJECTS } from "@/lib/projects";
import { WorkIndex } from "@/components/work-index";
import { BuildSection } from "@/components/agent/swarm";
import { SecHead } from "@/components/agent/sec-head";
import { B } from "@/components/agent/b";

export const metadata: Metadata = {
  title: "Work",
  description:
    "The full index of Madhu Siddharth's projects — end-to-end data systems, applied ML, and agentic AI, each documented as a field report.",
};

export default function WorkPage() {
  return (
    <div className="work-page">
      <BuildSection id="index" sec="SEC_INDEX" className="page-top">
        <div className="wrap">
          <SecHead index={`madhu@agent:~$ ls work/  # ${PROJECTS.length} entries`} eyebrow="project registry" title="Selected work, end to end." as="h1">
            <B as="p" kind="para" label="p.lead" className="sec-lead">
              From real-time streaming platforms to medical-imaging models — every entry is a complete system. Grep the registry, or
              open one for its field report.
            </B>
          </SecHead>
        </div>
      </BuildSection>

      <BuildSection id="ledger" sec="SEC_LEDGER" className="ledger">
        <div className="wrap">
          <WorkIndex projects={PROJECTS} />
        </div>
      </BuildSection>
    </div>
  );
}
