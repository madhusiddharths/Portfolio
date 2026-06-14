import Link from "next/link";
import { ArrowIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <main id="main" className="coming-soon">
      <div className="u-container">
        <p className="u-eyebrow">Error — 404</p>
        <h1 className="coming-soon-title">
          Off the <span className="hero-mark">grid.</span>
        </h1>
        <p className="coming-soon-copy">
          This page doesn&apos;t exist — or it moved. Let&apos;s get you back to something real.
        </p>
        <div className="coming-soon-actions">
          <Link href="/" className="btn btn-primary" data-cursor="home">
            Back home <ArrowIcon width={17} height={17} />
          </Link>
          <Link href="/work/" className="btn btn-ghost" data-cursor="work">
            View work
          </Link>
        </div>
      </div>
    </main>
  );
}
