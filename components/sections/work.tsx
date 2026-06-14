import Link from "next/link";
import { FEATURED, PROJECTS } from "@/lib/projects";
import { SectionHeading } from "@/components/section-heading";
import { WorkIndex } from "@/components/work-index";
import { Reveal } from "@/components/reveal";
import { ArrowIcon } from "@/components/icons";

export function Work() {
  return (
    <section className="section work-section" id="work">
      <div className="u-container">
        <SectionHeading
          index="01"
          eyebrow="Selected work"
          title="Things I've built"
          description="End-to-end systems spanning data engineering, applied machine learning, and agentic AI. Hover a row for a preview — open it for the full field report."
          action={
            <Link href="/work/" className="u-link section-heading-link" data-cursor="all">
              All {PROJECTS.length} projects <span className="u-arrow">→</span>
            </Link>
          }
        />

        <WorkIndex projects={FEATURED} />

        <Reveal className="work-section-cta">
          <Link href="/work/" className="btn btn-ghost" data-cursor="browse">
            View the full index <ArrowIcon width={17} height={17} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
