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
import { CaseStudyToc } from "@/components/case-study-toc";
import { ReadingProgress } from "@/components/reading-progress";
import { GithubIcon, ArrowUpRight, ArrowIcon, LockIcon, LiveIcon } from "@/components/icons";
import { BuildSection } from "@/components/agent/swarm";
import { B } from "@/components/agent/b";
import "./fieldnotes.css";

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

  return (
    <div className="case-study">
      <ReadingProgress />

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

      {/* ---- body: TOC · prose · metadata ---- */}
      <BuildSection id="notes" sec="SEC_NOTES" className="cs-body">
        <div className="wrap cs-layout">
          {/* sticky wrappers sit outside the build nodes (which are position:relative) */}
          <aside className="cs-rail cs-rail-left">
            <div className="cs-sticky">
              <B kind="list" label="nav.toc">
                <CaseStudyToc items={data.toc} />
              </B>
            </div>
          </aside>

          <article className="fieldnotes" dangerouslySetInnerHTML={{ __html: data.html }} />

          <aside className="cs-rail cs-rail-right">
            <div className="cs-sticky">
            <B kind="list" label="aside.metadata" className="cs-meta">
              <p className="cs-meta-title u-mono">Metadata</p>
              <dl>
                <div>
                  <dt className="u-mono">Domain</dt>
                  <dd>{project.domain}</dd>
                </div>
                <div>
                  <dt className="u-mono">Source</dt>
                  <dd>
                    {project.repo ? (
                      <a href={project.repo} target="_blank" rel="noopener noreferrer" className="u-link">
                        GitHub <ArrowUpRight width={12} height={12} />
                      </a>
                    ) : (
                      <span className="cs-meta-private">
                        <LockIcon width={12} height={12} /> Private
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              <p className="cs-meta-title u-mono cs-meta-stack-title">Stack</p>
              <ul className="cs-meta-stack">
                {project.tech.map((t) => {
                  const icon = techIcon(t);
                  return (
                    <li key={t}>
                      {icon && <img src={icon} alt="" width={16} height={16} loading="lazy" />}
                      <span>{t}</span>
                    </li>
                  );
                })}
              </ul>
            </B>
            </div>
          </aside>
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
