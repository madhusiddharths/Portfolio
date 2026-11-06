"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProject } from "@/lib/projects";
import { ArrowUpRight } from "@/components/icons";

/**
 * The "in progress" page as a job readout. `?p=<slug>` names the project;
 * `&s=live` means its deployment is pending (the write-up already exists),
 * otherwise its write-up is. With no project it falls back to a generic job.
 */
export function DraftStatus() {
  const params = useSearchParams();
  const project = getProject(params.get("p") ?? "");
  const live = params.get("s") === "live";
  const slug = project?.slug ?? "report";
  const job = live ? `deploy(${slug})` : `write_report(${slug})`;

  return (
    <div className="draft">
      <p className="draft-cmd">
        madhu@agent:~$ <b>{job}</b> <span># status: {live ? "deploying" : "drafting"}</span>
      </p>
      <p className="draft-eyebrow">{live ? "live deployment" : "field report"}</p>
      <h1 className="draft-title">
        {project ? project.name : "This field report"} <span>{live ? "is deploying." : "is being written."}</span>
      </h1>
      <p className="draft-lead">
        {live
          ? "The system is built and its field report is published. The public deployment isn't up yet; until it is, the report and the source show how it works."
          : "The project is built and the source is public. Its field report is being written to the same depth as the others; until then, the code is the best record of it."}
      </p>

      <dl className="draft-job">
        <dt>job</dt>
        <dd>{job}</dd>
        <dt>build</dt>
        <dd className="is-ok">✓ shipped</dd>
        <dt>{live ? "report" : "write-up"}</dt>
        <dd className={live ? "is-ok" : "is-run"}>{live ? "✓ published" : "● in progress"}</dd>
        {live && (
          <>
            <dt>deploy</dt>
            <dd className="is-run">● in progress</dd>
          </>
        )}
        {project && (
          <>
            <dt>domain</dt>
            <dd>{project.domain}</dd>
          </>
        )}
      </dl>

      <div className="pg-calls draft-calls">
        {live && project ? (
          <Link href={`/work/${project.slug}/`} className="pg-call pg-call-go">
            <code>read_report</code>
            <span>({project.slug})</span>
          </Link>
        ) : (
          project?.repo && (
            <a href={project.repo} target="_blank" rel="noopener noreferrer" className="pg-call pg-call-go">
              <code>view_source</code>
              <span>(github)</span>
              <ArrowUpRight width={12} height={12} />
            </a>
          )
        )}
        {live && project?.repo && (
          <a href={project.repo} target="_blank" rel="noopener noreferrer" className="pg-call">
            <code>view_source</code>
            <span>(github)</span>
            <ArrowUpRight width={12} height={12} />
          </a>
        )}
        <Link href="/work/" className={`pg-call ${project ? "" : "pg-call-go"}`}>
          <code>open_index</code>
          <span>()</span>
        </Link>
      </div>
    </div>
  );
}
