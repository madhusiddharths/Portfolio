import type { Metadata } from "next";
import Link from "next/link";
import { BuildSection } from "@/components/agent/swarm";
import { SecHead } from "@/components/agent/sec-head";
import { B } from "@/components/agent/b";
import { ArrowIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Field report in progress",
  description: "This project is shipped — its full write-up is on the way.",
};

export default function ComingSoon() {
  return (
    <BuildSection id="soon" sec="SEC_SOON" className="ag-center">
      <div className="wrap">
        <SecHead index="//00.00 FIELD_REPORT · STATUS: DRAFTING" eyebrow="Field report" title="Write-up in progress." as="h1">
          <B as="p" kind="para" label="p.copy" className="sec-lead">
            This project is built and shipped — its full case study is being written up with the same depth as the others. In the
            meantime, the source is on GitHub, and the rest of the index is ready to explore.
          </B>
          <B kind="block" label="div.actions" className="center-actions">
            <Link href="/work/" className="btn btn-red">
              Back to the index <ArrowIcon width={16} height={16} />
            </Link>
            <Link href="/" className="btn btn-line">
              Home
            </Link>
          </B>
        </SecHead>
      </div>
    </BuildSection>
  );
}
