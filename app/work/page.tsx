import type { Metadata } from "next";
import { PROJECTS } from "@/lib/projects";
import { WorkIndex } from "@/components/work-index";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Work",
  description:
    "The full index of Madhu Siddharth's projects — end-to-end data systems, applied ML, and agentic AI, each documented as a field report.",
};

export default function WorkPage() {
  return (
    <main id="main" className="work-page">
      <section className="page-hero">
        <div className="u-container">
          <Reveal>
            <p className="u-eyebrow">Index — {PROJECTS.length} projects</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="page-hero-title">Selected work, end to end.</h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="page-hero-lead">
              From real-time streaming platforms to medical-imaging models — every entry is a complete
              system. Hover a row for a preview, open one for the full field report.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section work-page-index">
        <div className="u-container">
          <WorkIndex projects={PROJECTS} />
        </div>
      </section>
    </main>
  );
}
