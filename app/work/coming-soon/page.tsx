import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Field report in progress",
  description: "This project is shipped — its full write-up is on the way.",
};

export default function ComingSoon() {
  return (
    <main id="main" className="coming-soon">
      <div className="u-container">
        <Reveal>
          <p className="u-eyebrow">Field report</p>
          <h1 className="coming-soon-title">
            Write-up <span className="hero-mark">in progress.</span>
          </h1>
          <p className="coming-soon-copy">
            This project is built and shipped — its full case study is being written up with the same
            depth as the others. In the meantime, the source is on GitHub, and the rest of the index is
            ready to explore.
          </p>
          <div className="coming-soon-actions">
            <Link href="/work/" className="btn btn-primary" data-cursor="index">
              Back to the index <ArrowIcon width={17} height={17} />
            </Link>
            <Link href="/" className="btn btn-ghost" data-cursor="home">
              Home
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
