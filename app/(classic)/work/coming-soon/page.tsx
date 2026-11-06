import type { Metadata } from "next";
import { Suspense } from "react";
import { BuildSection } from "@/components/agent/swarm";
import { B } from "@/components/agent/b";
import { DraftStatus } from "@/components/agent/draft-status";

export const metadata: Metadata = {
  title: "In progress",
  description: "A project whose write-up or deployment is still in progress.",
};

// Linked as /work/coming-soon/?p=<slug> (write-up pending) or ?p=<slug>&s=live
// (deployment pending). No project currently needs it; it stays ready.
export default function ComingSoon() {
  return (
    <BuildSection id="soon" sec="SEC_SOON" className="ag-center">
      <div className="wrap">
        <B kind="block" label="div.job" className="draft-wrap">
          <Suspense fallback={null}>
            <DraftStatus />
          </Suspense>
        </B>
      </div>
    </BuildSection>
  );
}
