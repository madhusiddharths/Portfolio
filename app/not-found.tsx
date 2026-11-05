import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { AgentFrame } from "@/components/agent/frame";
import { BuildSection } from "@/components/agent/swarm";
import { SecHead } from "@/components/agent/sec-head";
import { B } from "@/components/agent/b";

export default function NotFound() {
  return (
    <AgentFrame>
      <BuildSection id="lost" sec="SEC_404" className="ag-center">
        <div className="wrap">
          <SecHead index="//404 ROUTE_NOT_FOUND" eyebrow="Error — 404" title="Off the grid." as="h1">
            <B as="p" kind="para" label="p.copy" className="sec-lead">
              This page doesn&apos;t exist — or it moved. Let&apos;s get you back to something real.
            </B>
            <B kind="block" label="div.actions" className="center-actions">
              <Link href="/" className="btn btn-red">
                Back home <ArrowIcon width={16} height={16} />
              </Link>
              <Link href="/work/" className="btn btn-line">
                View work
              </Link>
            </B>
          </SecHead>
        </div>
      </BuildSection>
    </AgentFrame>
  );
}
