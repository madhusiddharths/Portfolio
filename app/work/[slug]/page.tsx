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
import { GithubIcon, ArrowUpRight, ArrowIcon, LockIcon } from "@/components/icons";
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
    <main id="main" className="case-study">
      <ReadingProgress />

      {/* ---- hero ---- */}
      <header className="cs-hero">
        <div className="u-container">
          <Link href="/work/" className="u-link cs-back" data-cursor="back">
            <span className="u-arrow">←</span> Index
          </Link>

          <p className="cs-eyebrow u-mono">
            <span className="cs-eyebrow-index">{project.index}</span>
            <span>Field Report</span>
            <span className="cs-eyebrow-domain">{project.domain}</span>
          </p>

          <h1 className="cs-title">{project.name}</h1>
          <p className="cs-summary">{project.summary}</p>

          <div className="cs-hero-actions">
            {project.repo ? (
              <a href={project.repo} target="_blank" rel="noopener noreferrer" className="btn btn-primary" data-cursor="source">
                <GithubIcon width={17} height={17} /> View source
              </a>
            ) : (
              <span className="btn btn-ghost is-static" aria-disabled="true">
                <LockIcon width={16} height={16} /> Private repository
              </span>
            )}
            {project.paper && (
              <a href={project.paper} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" data-cursor="paper">
                Read the paper <ArrowUpRight width={14} height={14} />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ---- body: TOC · prose · metadata ---- */}
      <div className="u-container cs-layout">
        <aside className="cs-rail cs-rail-left">
          <CaseStudyToc items={data.toc} />
        </aside>

        <article
          className="fieldnotes"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />

        <aside className="cs-rail cs-rail-right">
          <div className="cs-meta">
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
          </div>
        </aside>
      </div>

      {/* ---- next ---- */}
      <nav className="cs-next" aria-label="Next project">
        <Link href={`/work/${next.slug}/`} className="cs-next-link" data-cursor="next">
          <span className="u-mono cs-next-kicker">Next field report — {next.index}</span>
          <span className="cs-next-name">
            {next.name} <ArrowIcon width={26} height={26} />
          </span>
          <span className="cs-next-domain u-mono">{next.domain}</span>
        </Link>
      </nav>
    </main>
  );
}
