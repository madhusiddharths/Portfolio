import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getProject,
  CASE_STUDY_SLUGS,
  PROJECTS,
  techIcon,
} from "@/lib/projects";
import { loadCaseStudy } from "@/lib/case-study";
import { getPipeline } from "@/lib/pipelines";
import { IdeRoot } from "@/components/ide/ide-root";
import { Explorer } from "@/components/ide/explorer";
import { ArchPanel } from "@/components/ide/arch-panel";
import { StatusBar } from "@/components/ide/statusbar";
import { RailSkills } from "@/components/ide/rail-skills";
import { Resizers } from "@/components/ide/resizers";
import { IdePortal } from "@/components/ide/ide-portal";
import { ReadingProgress } from "@/components/reading-progress";
import { GithubIcon, ArrowUpRight, ArrowIcon, LockIcon, LiveIcon } from "@/components/icons";
import { BuildSection } from "@/components/agent/swarm";
import { B } from "@/components/agent/b";
import "./fieldnotes.css";
import "@/app/console.css";
import "@/app/ide.css";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams() {
  return CASE_STUDY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.summary,
    openGraph: {
      title: `${project.name} — Field Report`,
      description: project.summary,
      images: [project.thumb],
    },
  };
}

const STUDY_PROJECTS = PROJECTS.filter((p) => p.hasCaseStudy);

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project || !project.hasCaseStudy) notFound();

  const data = loadCaseStudy(slug);
  if (!data) notFound();

  const pos = STUDY_PROJECTS.findIndex((p) => p.slug === slug);
  const next = STUDY_PROJECTS[(pos + 1) % STUDY_PROJECTS.length];
  const pipe = getPipeline(slug);
  const order = data.toc.map((t) => t.id);
  const labels = Object.fromEntries(data.toc.map((t) => [t.id, t.label]));
  const others = STUDY_PROJECTS.filter((p) => p.slug !== slug).map((p) => ({ slug: p.slug, name: p.name, index: p.index }));
  const skills = project.tech.map((t) => ({
    name: t,
    icon: techIcon(t) ?? null,
    uses: PROJECTS.filter((p) => p.tech.includes(t)).length,
  }));

  return (
    <div className="case-study">
      <ReadingProgress />
      <IdeRoot order={order} />
      <IdePortal>
        <Explorer slug={slug} groups={data.groups} others={others} />
        {pipe && <ArchPanel slug={slug} pipe={pipe} toc={data.toc} arch={data.arch} />}
        <StatusBar index={project.index} slug={slug} labels={labels} nodeAt={pipe ? pipe.nodes.map((n) => n.at) : []} />
        <Resizers />
      </IdePortal>
      <RailSkills domain={project.domain} repo={project.repo ?? null} skills={skills} />

      {/* ---- hero ---- */}
      <BuildSection id="report" sec="SEC_REPORT" className="cs-hero">
        <div className="wrap">
          <B kind="type" label="a.back" className="cs-back-wrap">
            <Link href="/work/" className="cs-back">
              <span>←</span> cd ../index
            </Link>
          </B>

          <B as="p" kind="type" label="p.eyebrow" className="cs-eyebrow u-mono">
            <span className="cs-eyebrow-index">P.{project.index}</span>
            <span>Field Report</span>
            <span className="cs-eyebrow-domain">{project.domain}</span>
          </B>

          <B as="h1" kind="type" label="h1.title" className="cs-title">
            {project.name}
          </B>
          <B as="p" kind="para" label="p.summary" className="cs-summary">
            {project.summary}
          </B>

          <B kind="block" label="div.actions" className="cs-hero-actions">
            {project.live && (
              <a href={project.live} target="_blank" rel="noopener noreferrer" className="btn btn-red">
                <LiveIcon width={16} height={16} /> Live app
              </a>
            )}
            {project.repo ? (
              <a href={project.repo} target="_blank" rel="noopener noreferrer" className={`btn ${project.live ? "btn-line" : "btn-red"}`}>
                <GithubIcon width={16} height={16} /> View source
              </a>
            ) : (
              <span className="btn btn-line is-static" aria-disabled="true">
                <LockIcon width={15} height={15} /> Private repository
              </span>
            )}
            {project.paper && (
              <a href={project.paper} target="_blank" rel="noopener noreferrer" className="btn btn-line">
                Read the paper <ArrowUpRight width={14} height={14} />
              </a>
            )}
          </B>
        </div>
      </BuildSection>

      {/* ---- body: the report, in the editor column ---- */}
      <BuildSection id="notes" sec="SEC_NOTES" className="cs-body">
        <div className="wrap cs-layout">
          <article className="fieldnotes" dangerouslySetInnerHTML={{ __html: data.html }} />
        </div>
      </BuildSection>

      {/* ---- next ---- */}
      <BuildSection id="next" sec="SEC_NEXT" className="cs-next-section">
        <div className="wrap">
          <B as="nav" kind="block" label="nav.next" className="cs-next" aria-label="Next project">
            <Link href={`/work/${next.slug}/`} className="cs-next-link">
              <span className="u-mono cs-next-kicker">Next field report — P.{next.index}</span>
              <span className="cs-next-name">
                {next.name} <ArrowIcon width={30} height={30} />
              </span>
              <span className="cs-next-domain u-mono">{next.domain}</span>
            </Link>
          </B>
        </div>
      </BuildSection>
    </div>
  );
}
