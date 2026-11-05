import Link from "next/link";
import { PROFILE, METRICS, FEATURED, PROJECTS, SKILLS, CERTS, techIcon } from "@/lib/projects";
import { AgentShell } from "@/components/agent/shell";
import { BuildSection, SwarmCount } from "@/components/agent/swarm";
import { B } from "@/components/agent/b";
import { SecHead as Head } from "@/components/agent/sec-head";

/** Home section header — "//02.00 SEC_WORK INDEX (02/05)". */
function SecHead({ n, sec, eyebrow, title, children }: { n: string; sec: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <Head index={`//${n}.00 ${sec} INDEX (${n}/05)`} eyebrow={eyebrow} title={title}>
      {children}
    </Head>
  );
}
import { TaskCard, BuildCredit } from "@/components/agent/live";
import { StatusClock } from "@/components/status-clock";
import { ArrowIcon, ArrowUpRight, GithubIcon, LinkedinIcon, DiscordIcon, MailIcon, LockIcon } from "@/components/icons";


const SENTENCES = PROFILE.bio.split(/(?<=\.)\s+/);
const QUOTE = SENTENCES[SENTENCES.length - 1];
const BIO = SENTENCES.slice(0, -1);
const FOCUS = ["Agent orchestration", "Tool integration", "Model fine-tuning", "Evaluation", "Production deployment"];
const SOCIAL = [
  { label: "GitHub", href: PROFILE.github, Icon: GithubIcon },
  { label: "LinkedIn", href: PROFILE.linkedin, Icon: LinkedinIcon },
  { label: "Discord", href: PROFILE.discord, Icon: DiscordIcon },
];

export default function Home() {
  return (
    <AgentShell>
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <BuildSection id="home" sec="SEC_HOME" className="hero">
          <div className="wrap hero-grid">
            <div className="hero-main">
              <B as="p" kind="type" label="p.status" className="hero-status">
                <span className="live-dot" /> available for work <span className="sep">/</span> {PROFILE.location} <StatusClock />{" "}
                <span className="sep">/</span> building <em>{PROFILE.building}</em>
              </B>

              <div className="hero-title">
                <B kind="block" label="svg.wordmark" className="hero-word" aria-hidden="true">
                  Portfolio
                </B>
                <B as="p" kind="type" label="span.script" className="hero-hello">
                  Hello, I&apos;m
                </B>
                <B as="h1" kind="fill" label="h1.name" className="hero-name">
                  <span>Madhu Siddharth.</span>
                </B>
              </div>

              <B as="p" kind="type" label="p.role" className="hero-role">
                <i aria-hidden="true" /> {PROFILE.role} · agentic workflows · end-to-end automation
              </B>
              <B as="p" kind="type" label="p.tagline" className="hero-tagline">
                I develop <mark>scalable models</mark> that drive real-world impact.
              </B>

              <B kind="block" label="div.actions" className="hero-actions">
                <a href={`mailto:${PROFILE.email}`} className="btn btn-red">
                  Initiate contact <ArrowIcon width={16} height={16} />
                </a>
                <a href="#work" className="btn btn-line">
                  Explore work
                </a>
                <a href={PROFILE.resume} target="_blank" rel="noopener noreferrer" className="btn btn-text">
                  Résumé <ArrowUpRight width={14} height={14} />
                </a>
              </B>
            </div>

            <B as="aside" kind="list" label="aside.task-card" className="hero-task" aria-label="Build progress">
              <TaskCard />
            </B>
          </div>

          <div className="wrap">
            <dl className="hero-metrics">
              {METRICS.map((m) => (
                <B key={m.label} kind="block" label="dl.metric" className="metric">
                  <dt>
                    <SwarmCount value={m.value} prefix={m.prefix} suffix={m.suffix} />
                  </dt>
                  <dd>{m.label}</dd>
                </B>
              ))}
            </dl>
          </div>
        </BuildSection>

        {/* ── ABOUT ────────────────────────────────────────────────────── */}
        <BuildSection id="about" sec="SEC_ABOUT">
          <div className="wrap">
            <SecHead n="01" sec="SEC_ABOUT" eyebrow="Engineer profile" title="Background & Philosophy" />
            <div className="about-grid">
              <div className="about-copy">
                {BIO.length > 0 && (
                  <B as="p" kind="para" label="p.bio" className="about-lead">
                    {BIO[0]}
                  </B>
                )}
                <B as="p" kind="para" label="p.bio" className="about-body">
                  {BIO.slice(1).join(" ")}
                </B>
                <B as="p" kind="type" label="p.note" className="about-note">
                  <span>→</span> {PROFILE.analystNote}{" "}
                  <a href={PROFILE.analystResume} target="_blank" rel="noopener noreferrer">
                    View Data Analyst résumé ↗
                  </a>
                </B>
              </div>
              <div className="about-side">
                <B as="blockquote" kind="para" label="blockquote" className="about-quote">
                  “{QUOTE}”
                </B>
                <B as="ul" kind="list" label="ul.focus" className="about-focus">
                  {FOCUS.map((f, i) => (
                    <li key={f} style={{ ["--i" as string]: i }}>
                      <span>0{i + 1}</span>
                      {f}
                    </li>
                  ))}
                </B>
              </div>
            </div>
          </div>
        </BuildSection>

        {/* ── WORK ─────────────────────────────────────────────────────── */}
        <BuildSection id="work" sec="SEC_WORK">
          <div className="wrap">
            <SecHead n="02" sec="SEC_WORK" eyebrow="Architectural showcase" title="Flagship Deployments">
              <B as="p" kind="para" label="p.lead" className="sec-lead">
                End-to-end systems spanning data engineering, applied machine learning, and agentic AI. Open one for the full
                field report.
              </B>
            </SecHead>

            <div className="work-grid" data-project-grid>
              {FEATURED.slice(0, 6).map((p, i) => {
                const href = p.hasCaseStudy ? `/work/${p.slug}/` : "/work/coming-soon/";
                const extra = p.tech.length - 5;
                return (
                  <B as="article" key={p.slug} kind="block" label={`article.${p.slug}`} className={`card ${i === 0 ? "card-lead" : ""}`} data-project={p.slug}>
                    <div className="card-thumb">
                      <img src={p.thumb} alt="" loading="lazy" />
                    </div>
                    <div className="card-body">
                      <div className="card-meta">
                        <span className="card-pill">
                          <i /> case study
                        </span>
                        <span className="card-index">P.{p.index}</span>
                      </div>
                      <h3 className="card-title">
                        <Link href={href} className="card-link">
                          {p.name}
                        </Link>
                      </h3>
                      <p className="card-domain">{p.domain}</p>
                      <p className="card-summary">{p.summary}</p>
                      <ul className="card-tech">
                        {p.tech.slice(0, 5).map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                        {extra > 0 && <li className="more">+{extra}</li>}
                      </ul>
                      <div className="card-foot">
                        <span className="card-go">
                          Field report <ArrowIcon width={14} height={14} />
                        </span>
                        {p.repo ? (
                          <a href={p.repo} target="_blank" rel="noopener noreferrer" className="card-repo" aria-label={`${p.name} source on GitHub`}>
                            <GithubIcon width={15} height={15} />
                          </a>
                        ) : (
                          <span className="card-repo" title="Private repository">
                            <LockIcon width={14} height={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  </B>
                );
              })}
            </div>

            <B kind="block" label="a.index" className="work-more">
              <Link href="/work/" className="btn btn-line">
                All {PROJECTS.length} projects — full index <ArrowIcon width={16} height={16} />
              </Link>
            </B>
          </div>
        </BuildSection>

        {/* ── STACK ────────────────────────────────────────────────────── */}
        <BuildSection id="stack" sec="SEC_STACK">
          <div className="wrap">
            <SecHead n="03" sec="SEC_STACK" eyebrow="Capability matrix" title="The Toolbox">
              <B as="p" kind="para" label="p.lead" className="sec-lead">
                Languages, frameworks, and platforms I reach for across the AI, ML and data lifecycle — grouped by where they live in
                the stack. Pick one to filter projects.
              </B>
            </SecHead>
            <div className="stack-grid">
              {SKILLS.map((g) => {
                const dir = g.group.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "");
                return (
                  <B key={g.group} kind="list" label={`term.${dir}`} className="term">
                    <div className="term-bar">
                      <span className="term-dots" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span>~/stack/{dir}</span>
                      <span className="term-count">{g.items.length}</span>
                    </div>
                    <h3 className="term-title">{g.group}</h3>
                    <p className="term-cmd">
                      <span>$</span> ls --icons
                    </p>
                    <ul className="term-items">
                      {g.items.map((item, i) => {
                        const icon = techIcon(item);
                        return (
                          <li key={item} style={{ ["--i" as string]: i }}>
                            <Link href={`/work/?skill=${encodeURIComponent(item)}`} className="chip">
                              {icon ? <img src={icon} alt="" loading="lazy" width={16} height={16} /> : <i className="chip-dot" />}
                              {item}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </B>
                );
              })}
            </div>
          </div>
        </BuildSection>

        {/* ── CERTS ────────────────────────────────────────────────────── */}
        <BuildSection id="certs" sec="SEC_CERTS">
          <div className="wrap">
            <SecHead n="04" sec="SEC_CERTS" eyebrow="Credentials" title="Certifications">
              <B as="p" kind="para" label="p.lead" className="sec-lead">
                Industry certifications validating my expertise across machine learning, data science, cloud, and analytics.
              </B>
            </SecHead>
            <div className="cert-grid">
              {CERTS.map((c, i) => (
                <B as="a" key={c.name} kind="block" label="a.credential" href={c.url} target="_blank" rel="noopener noreferrer" className="cert">
                  <span className="cert-i">C.0{i + 1}</span>
                  <img src={c.img} alt="" loading="lazy" />
                  <span className="cert-name">{c.name}</span>
                  <span className="cert-issuer">
                    {c.issuer} <ArrowUpRight width={13} height={13} />
                  </span>
                </B>
              ))}
            </div>
          </div>
        </BuildSection>

        {/* ── CONTACT ──────────────────────────────────────────────────── */}
        <BuildSection id="contact" sec="SEC_CONTACT" className="contact">
          <div className="wrap">
            <SecHead n="05" sec="SEC_CONTACT" eyebrow="Next steps?" title="Don't be a Stranger!" />
            <div className="contact-grid">
              <div>
                <B as="p" kind="para" label="p.copy" className="contact-copy">
                  Feel free to drop me an email if you believe we&apos;d make a great team and would like to collaborate. Let&apos;s
                  make our work together not only productive but also enjoyable!
                </B>
                <B kind="block" label="div.actions" className="contact-actions">
                  <a href={`mailto:${PROFILE.email}`} className="btn btn-red">
                    <MailIcon width={16} height={16} /> Get in touch
                  </a>
                  {SOCIAL.map(({ label, href, Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={label}>
                      <Icon width={17} height={17} />
                    </a>
                  ))}
                </B>
              </div>
              <B as="dl" kind="list" label="dl.details" className="contact-details">
                <div style={{ ["--i" as string]: 0 }}>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
                  </dd>
                </div>
                <div style={{ ["--i" as string]: 1 }}>
                  <dt>Role</dt>
                  <dd>{PROFILE.role}</dd>
                </div>
                <div style={{ ["--i" as string]: 2 }}>
                  <dt>Status</dt>
                  <dd>
                    <span className="live-dot" /> Open to opportunities
                  </dd>
                </div>
              </B>
            </div>
          </div>
        </BuildSection>

        <footer className="ag-foot">
          <div className="wrap ag-foot-inner">
            <span>© {new Date().getFullYear()} {PROFILE.name}</span>
            <BuildCredit />
          </div>
        </footer>
    </AgentShell>
  );
}
