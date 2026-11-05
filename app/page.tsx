import Link from "next/link";
import { PROFILE, METRICS, FEATURED, PROJECTS, SKILLS, CERTS, techIcon } from "@/lib/projects";
import { AgentShell } from "@/components/agent/shell";
import { BuildSection, SwarmCount } from "@/components/agent/swarm";
import { B } from "@/components/agent/b";
import { SecHead as Head } from "@/components/agent/sec-head";

/** Home section header — a shell line ("madhu@agent:~$ cat work.md"), eyebrow, title. */
function SecHead({ n, sec, eyebrow, title, children }: { n: string; sec: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <Head index={`madhu@agent:~$ cat ${sec.replace("SEC_", "").toLowerCase()}.md  # ${n}/05`} eyebrow={eyebrow} title={title}>
      {children}
    </Head>
  );
}
import { RunStatus, RunUsage, BuildCredit } from "@/components/agent/live";
import { StatusClock } from "@/components/status-clock";
import { ArrowIcon, ArrowUpRight, GithubIcon, LinkedinIcon, DiscordIcon, MailIcon, LockIcon } from "@/components/icons";


const SENTENCES = PROFILE.bio.split(/(?<=\.)\s+/);
const QUOTE = SENTENCES[SENTENCES.length - 1];
const BIO = SENTENCES.slice(0, -1);
const TOOLS = ["LangGraph", "MCP", "Claude API", "vLLM", "PyTorch", "Apache Kafka", "Apache Spark", "Docker"];
const FOCUS = ["Agent orchestration", "Tool integration", "Model fine-tuning", "Evaluation", "Production deployment"];
const SOCIAL = [
  { label: "GitHub", href: PROFILE.github, Icon: GithubIcon },
  { label: "LinkedIn", href: PROFILE.linkedin, Icon: LinkedinIcon },
  { label: "Discord", href: PROFILE.discord, Icon: DiscordIcon },
];

export default function Home() {
  return (
    <AgentShell>
        {/* ── HERO · a model playground ─────────────────────────────── */}
        <BuildSection id="home" sec="SEC_HOME" className="hero">
          <div className="wrap">
            <B as="p" kind="type" label="p.env" className="hero-status">
              <span className="live-dot" /> available for work <span className="sep">/</span> {PROFILE.location} <StatusClock />{" "}
              <span className="sep">/</span> building <em>{PROFILE.building}</em>
            </B>

            <B kind="frame" label="div.playground" className="pg">
              <div className="pg-bar">
                <span className="pg-name">playground</span>
                <span className="pg-run">run_01JD4M · madhu-v2</span>
                <RunStatus />
              </div>

              <div className="pg-grid">
                <div className="pg-thread">
                  <div className="pg-msg">
                    <span className="pg-role">system</span>
                    <B as="p" kind="para" label="msg.system" className="pg-system">
                      You are Madhu Siddharth, an AI engineer. You design agentic workflows where models plan, call tools and act
                      on their own — and you measure honestly where they hold up.
                    </B>
                  </div>
                  <div className="pg-msg">
                    <span className="pg-role">user</span>
                    <B as="p" kind="type" label="msg.user" className="pg-user">
                      Who are you, and what do you ship?
                    </B>
                  </div>
                  <div className="pg-msg pg-out">
                    <span className="pg-role">
                      assistant <i className="pg-caret" aria-hidden="true" />
                    </span>
                    <B as="p" kind="type" label="span.hello" className="pg-hello">
                      Hello, I&apos;m
                    </B>
                    <B as="h1" kind="fill" label="h1.name" className="hero-name">
                      <span>Madhu Siddharth.</span>
                    </B>
                    <B as="p" kind="type" label="p.role" className="hero-role">
                      <i aria-hidden="true" /> {PROFILE.role} · agentic workflows · end-to-end automation
                    </B>
                    <B as="p" kind="type" label="p.tagline" className="hero-tagline">
                      I develop <mark>scalable models</mark> that drive real-world impact.
                    </B>
                    <B kind="block" label="tool_calls" className="pg-calls" data-ops="create,paint,resize,place">
                      <span className="pg-calls-h">tool_calls · 3</span>
                      <a href={`mailto:${PROFILE.email}`} className="pg-call pg-call-go">
                        <code>contact</code>
                        <span>(to=&quot;madhu&quot;)</span>
                        <ArrowIcon width={14} height={14} />
                      </a>
                      <a href="#work" className="pg-call">
                        <code>open_work</code>
                        <span>(featured=6)</span>
                      </a>
                      <a href={PROFILE.resume} target="_blank" rel="noopener noreferrer" className="pg-call">
                        <code>get_resume</code>
                        <span>()</span>
                        <ArrowUpRight width={12} height={12} />
                      </a>
                    </B>
                  </div>
                </div>

                <aside className="pg-config" aria-label="Run configuration">
                  <B kind="list" label="cfg.model" className="pg-field">
                    <span className="pg-k">model</span>
                    <span className="pg-v">madhu-v2</span>
                    <span className="pg-k">role</span>
                    <span className="pg-v">{PROFILE.role}</span>
                    <span className="pg-k">temperature</span>
                    <span className="pg-v pg-temp">
                      <i style={{ ["--t" as string]: 0.2 }} /> 0.2
                    </span>
                  </B>
                  <B kind="list" label="cfg.tools" className="pg-field pg-tools">
                    <span className="pg-k">
                      tools <b>{TOOLS.length}</b>
                    </span>
                    <ul>
                      {TOOLS.map((t, i) => {
                        const icon = techIcon(t);
                        return (
                          <li key={t} style={{ ["--i" as string]: i }}>
                            <Link href={`/work/?skill=${encodeURIComponent(t)}`} title={`Projects using ${t}`}>
                              <span className="pg-check" aria-hidden="true" />
                              {icon && <img src={icon} alt="" width={14} height={14} loading="lazy" />}
                              {t}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </B>
                  <B kind="block" label="cfg.usage" className="pg-field" data-ops="create,paint,place">
                    <span className="pg-k">this run</span>
                    <RunUsage />
                  </B>
                </aside>
              </div>
            </B>

            <dl className="hero-metrics">
              {METRICS.map((m, i) => (
                <B key={m.label} kind="block" label="eval.metric" className="metric" data-ops={i % 2 ? "create,paint,place" : "create,paint"}>
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
                <B kind="block" label="div.actions" className="contact-actions" data-ops="create,paint">
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
              <B kind="block" label="req.contact" className="req">
                <div className="req-bar">
                  <span className="req-verb">POST</span>
                  <span className="req-path">/v1/contact</span>
                  <span className="req-ok">200 OK</span>
                </div>
                <pre className="req-body">
                  <code>
                    {"{\n"}
                    {"  "}<span className="j-k">&quot;to&quot;</span>: <a href={`mailto:${PROFILE.email}`} className="j-s">&quot;{PROFILE.email}&quot;</a>,{"\n"}
                    {"  "}<span className="j-k">&quot;role&quot;</span>: <span className="j-s">&quot;{PROFILE.role}&quot;</span>,{"\n"}
                    {"  "}<span className="j-k">&quot;status&quot;</span>: <span className="j-s">&quot;open_to_opportunities&quot;</span>,{"\n"}
                    {"  "}<span className="j-k">&quot;timezone&quot;</span>: <span className="j-s">&quot;{PROFILE.location}&quot;</span>,{"\n"}
                    {"  "}<span className="j-k">&quot;channels&quot;</span>: [
                    {SOCIAL.map((x, i) => (
                      <span key={x.label}>
                        <a href={x.href} target="_blank" rel="noopener noreferrer" className="j-s">
                          &quot;{x.label.toLowerCase()}&quot;
                        </a>
                        {i < SOCIAL.length - 1 ? ", " : ""}
                      </span>
                    ))}
                    ]{"\n"}
                    {"}"}
                  </code>
                </pre>
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
