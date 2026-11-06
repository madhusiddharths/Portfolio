import Link from "next/link";
import "./console.css";
import { PROFILE, METRICS, FEATURED, PROJECTS, SKILLS, CERTS, techIcon, usesSkill } from "@/lib/projects";
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
// name shown → skill it filters the work index by
const TOOLS: { name: string; skill: string }[] = [
  { name: "LangGraph", skill: "LangGraph" },
  { name: "MCP", skill: "MCP" },
  { name: "Claude", skill: "LLM APIs" },
  { name: "vLLM", skill: "vLLM" },
  { name: "PyTorch", skill: "PyTorch" },
  { name: "Hugging Face", skill: "Hugging Face" },
  { name: "FastAPI", skill: "FastAPI" },
  { name: "Docker", skill: "Docker" },
];
const FOCUS = ["agent_orchestration", "tool_integration", "fine_tuning", "evaluation", "deployment"];

/* Experience + education — facts from the résumé knowledge base, verbatim numbers. */
const RUNS = [
  {
    id: "parsec",
    org: "Parsec",
    role: "AI Engineering Intern",
    when: "Oct 2026 — present",
    where: "Remote",
    status: "running",
    task: "Own the video track of OpenJev — an open-source model that scores answer options in one forward pass, running locally on an 18 GB laptop.",
    out: [
      ["video QA · dev split", "54.7% → 73.5%"],
      ["LoRA training set", "7,392 Qs · 1,955 videos"],
      ["memory budget", "64 frames in 18 GB"],
    ],
    tools: ["MLX", "LoRA", "Gemma 4 E4B", "PyTorch", "FastAPI"],
  },
  {
    id: "labelmaster",
    org: "Labelmaster",
    role: "Data Science Co-op",
    when: "Jan — May 2026",
    where: "Chicago, IL",
    status: "completed",
    task: "White-space analysis: pulled sites from 9 government compliance databases and enriched them with LLMs to surface prospects that had never bought.",
    out: [
      ["sites mapped", "26,290 · 178 families"],
      ["white space", "17,999 zero-sales sites"],
      ["LLM enrichment", "12 attrs · mean conf 0.81"],
    ],
    tools: ["Gemini API", "Perplexity", "SciPy", "Placekey", "Python"],
  },
] as const;
const CKPTS = [
  { tag: "fine-tune", degree: "M.S. Data Science", school: "Illinois Institute of Technology", where: "Chicago, IL", when: "May 2026", gpa: "3.77" },
  { tag: "pretrain", degree: "B.Tech Information Technology", school: "Coimbatore Institute of Technology", where: "Coimbatore, India", when: "Apr 2024", gpa: "3.66 · 8.91/10" },
];
const CERT_DATE: Record<string, string> = {
  "IBM Machine Learning Specialist — Advanced": "Aug 2025",
  "IBM Data Science Professional Certificate": "Apr 2023",
  "AWS Certified Cloud Practitioner": "Jun 2025",
  "Google Data Analytics Professional Certificate": "May 2022",
};
const calls = (skill: string) => PROJECTS.filter((p) => usesSkill(p.tech, skill)).length;
const MAX_CALLS = Math.max(...SKILLS.flatMap((g) => g.items.map(calls)), 1);
const nsOf = (group: string) => group.toLowerCase().replace(/&/g, "").replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
type RegGroup = { ns: string; title: string; items: string[]; order: number };
const REG = Object.fromEntries(SKILLS.map((g) => [nsOf(g.group), { ns: nsOf(g.group), title: g.group, items: g.items }])) as Record<
  string,
  Omit<RegGroup, "order">
>;
// The registry-wide leaderboard fills the middle column under the AI panel.
const TOP_CALLS = Array.from(new Set(SKILLS.flatMap((g) => g.items)))
  .sort((a, b) => calls(b) - calls(a))
  .slice(0, 6);
// Three balanced columns, AI in the middle. `order` sets the stacking when
// the columns collapse on narrow screens (AI first).
const REG_COLUMNS: RegGroup[][] = [
  [
    { ...REG.languages_query, order: 1 },
    { ...REG.data_cloud_infra, order: 3 },
  ],
  [
    { ...REG.ai_engineering_agents, order: 0 },
    { ns: "top_calls", title: "Most called", items: TOP_CALLS, order: 5 },
  ],
  [
    { ...REG.ml_data_science, order: 2 },
    { ...REG.serving_bi, order: 4 },
  ],
];

function RegPanel({ ns, title, items, order }: RegGroup) {
  const total = items.reduce((sum, t) => sum + calls(t), 0);
  const used = items.filter((t) => calls(t) > 0).length;
  return (
    <B kind="block" label={`ns.${ns}`} className="reg" style={{ order }}>
      <header className="reg-head">
        <span className="reg-ns">
          <b>ns</b> {ns}
        </span>
        <span className="reg-count">{items.length} tools</span>
      </header>
      <p className="reg-title">{title}</p>
      <ul className="reg-list">
        <li className="reg-row reg-row-h" aria-hidden="true">
          <span />
          <span>tool</span>
          <span>calls</span>
        </li>
        {items.map((item, i) => {
          const icon = techIcon(item);
          const n = calls(item);
          return (
            <li key={item} style={{ ["--i" as string]: i }}>
              <Link href={`/work/?skill=${encodeURIComponent(item)}`} className="reg-row" data-zero={n === 0 ? "true" : undefined}>
                {icon ? <img src={icon} alt="" loading="lazy" width={15} height={15} /> : <i className="reg-dot" />}
                <span className="reg-name">{item}</span>
                <span className="reg-calls">
                  <span className="reg-bar" style={{ ["--w" as string]: n / MAX_CALLS }} />
                  {n}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <footer className="reg-foot">
        <span>
          {used}/{items.length} in use
        </span>
        <span>Σ {total} calls</span>
      </footer>
    </B>
  );
}

const SOCIAL = [
  { label: "GitHub", href: PROFILE.github, Icon: GithubIcon },
  { label: "LinkedIn", href: PROFILE.linkedin, Icon: LinkedinIcon },
  { label: "Discord", href: PROFILE.discord, Icon: DiscordIcon },
];

export default function Home() {
  return (
    <AgentShell className="ag-skin ag-home">
        {/* ── HERO · a model playground ─────────────────────────────── */}
        <BuildSection id="home" sec="SEC_HOME" className="hero">
          <div className="wrap">
            <B as="p" kind="type" label="p.env" className="hero-status">
              <span className="live-dot" /> available for work <span className="sep">/</span> {PROFILE.location} <StatusClock />{" "}
              <span className="sep">/</span> building <em>{PROFILE.building}</em>
            </B>

            <B kind="frame" label="div.playground" className="pg" data-seg="playground">
              <div className="pg-bar">
                <span className="pg-name">playground</span>
                <span className="pg-run">run_01JD4M · madhu-v2</span>
                <RunStatus />
              </div>

              <div className="pg-grid">
                <div className="pg-thread">
                  <div className="pg-msg">
                    <span className="pg-role">system</span>
                    <B as="p" kind="type" label="msg.system" className="pg-system">
                      Answer as Madhu. Ground every claim in the résumé, the project logs and the repos.
                    </B>
                    <B as="ul" kind="list" label="ctx.retrieved" className="pg-ctx" data-ops="write,style">
                      <li style={{ ["--i" as string]: 0 }}>
                        <b>ctx</b> resume_kb.yaml
                      </li>
                      <li style={{ ["--i" as string]: 1 }}>{PROJECTS.length} projects</li>
                      <li style={{ ["--i" as string]: 2 }}>{RUNS.length} roles</li>
                      <li style={{ ["--i" as string]: 3 }}>{CERTS.length} certs</li>
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
                    <B as="h1" kind="fill" label="h1.name" className="hero-name" data-defect="overlap">
                      <span>Madhu Siddharth.</span>
                    </B>
                    <B as="p" kind="type" label="p.role" className="hero-role">
                      <i aria-hidden="true" /> {PROFILE.role} · agentic workflows · end-to-end automation
                    </B>
                    <B as="p" kind="type" label="p.tagline" className="hero-tagline">
                      I ship <mark>agents that do the work</mark>, then measure exactly where they break.
                    </B>
                    <B kind="block" label="tool_calls" className="pg-calls" data-ops="create,write,style,resize,place">
                      <span className="pg-calls-h">tool_calls · 3</span>
                      <a href={PROFILE.resume} target="_blank" rel="noopener noreferrer" className="pg-call pg-call-go">
                        <code>get_resume</code>
                        <span>()</span>
                        <ArrowUpRight width={12} height={12} />
                      </a>
                      <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="pg-call">
                        <code>connect</code>
                        <span>(linkedin)</span>
                        <ArrowUpRight width={12} height={12} />
                      </a>
                      <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="pg-call">
                        <code>view_source</code>
                        <span>(github)</span>
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
                      {TOOLS.map(({ name, skill }, i) => {
                        const icon = techIcon(name);
                        return (
                          <li key={name} style={{ ["--i" as string]: i }}>
                            <Link href={`/work/?skill=${encodeURIComponent(skill)}`} title={`Projects using ${name}`}>
                              {icon && <img src={icon} alt="" width={14} height={14} loading="lazy" />}
                              {name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </B>
                  <B kind="block" label="cfg.usage" className="pg-field" data-ops="create,write,style,place">
                    <span className="pg-k">this run</span>
                    <RunUsage />
                  </B>
                </aside>
              </div>
            </B>

            <dl className="hero-metrics" data-seg="metrics">
              {METRICS.map((m, i) => (
                <B key={m.label} kind="block" label="eval.metric" className="metric" data-ops={i % 2 ? "create,write,style,place" : "create,write,style"}>
                  <dt>
                    <SwarmCount value={m.value} prefix={m.prefix} suffix={m.suffix} decimals={m.decimals} />
                  </dt>
                  <dd>{m.label}</dd>
                </B>
              ))}
            </dl>
          </div>
        </BuildSection>

        {/* ── ABOUT · profile, runs, checkpoints ───────────────────── */}
        <BuildSection id="about" sec="SEC_ABOUT">
          <div className="wrap">
            <SecHead n="01" sec="SEC_ABOUT" eyebrow="Agent profile" title="Background, runs & checkpoints" />
            <div className="about-grid" data-seg="profile">
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
              <B kind="block" label="memory.principle" className="principle" data-ops="create,write,style">
                <p className="principle-h">
                  <span>memory/</span>principle.md
                </p>
                <p className="principle-q">
                  <span aria-hidden="true">{"// "}</span>
                  {QUOTE}
                </p>
                <p className="principle-k">capabilities</p>
                <ul className="principle-caps">
                  {FOCUS.map((f, i) => (
                    <li key={f} style={{ ["--i" as string]: i }}>
                      <i aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </B>
            </div>

            <p className="sub-h">
              runs/ <span>experience · {RUNS.length}</span>
            </p>
            <div className="runs" data-seg="runs">
              {RUNS.map((r) => (
                <B as="article" key={r.id} kind="block" label={`run.${r.id}`} className="run">
                  <header className="run-head">
                    <span className="run-status" data-status={r.status}>
                      <i aria-hidden="true" /> {r.status}
                    </span>
                    <span className="run-when">{r.when}</span>
                  </header>
                  <h3 className="run-org">
                    {r.org} <span>/ {r.role}</span>
                  </h3>
                  <p className="run-where">{r.where}</p>
                  <p className="run-task">
                    <b>task</b> {r.task}
                  </p>
                  <dl className="run-out">
                    {r.out.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <ul className="run-tools">
                    {r.tools.map((t) => {
                      const icon = techIcon(t);
                      return (
                        <li key={t}>
                          {icon && <img src={icon} alt="" width={13} height={13} loading="lazy" />}
                          {t}
                        </li>
                      );
                    })}
                  </ul>
                </B>
              ))}
            </div>

            <p className="sub-h">
              checkpoints/ <span>education · {CKPTS.length}</span>
            </p>
            <div className="ckpts" data-seg="checkpoints">
              {CKPTS.map((c) => (
                <B key={c.degree} kind="block" label={`ckpt.${c.tag}`} className="ckpt">
                  <span className="ckpt-tag">ckpt · {c.tag}</span>
                  <h3 className="ckpt-degree">{c.degree}</h3>
                  <p className="ckpt-school">{c.school}</p>
                  <dl className="ckpt-meta">
                    <div>
                      <dt>gpa</dt>
                      <dd>{c.gpa}</dd>
                    </div>
                    <div>
                      <dt>saved</dt>
                      <dd>{c.when}</dd>
                    </div>
                    <div>
                      <dt>where</dt>
                      <dd>{c.where}</dd>
                    </div>
                  </dl>
                </B>
              ))}
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

            <div className="work-grid" data-project-grid data-seg="cards">
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

        {/* ── STACK · tool registry ─────────────────────────────────── */}
        <BuildSection id="stack" sec="SEC_STACK">
          <div className="wrap">
            <SecHead n="03" sec="SEC_STACK" eyebrow="Tool registry" title="Tools the agents can call">
              <B as="p" kind="para" label="p.lead" className="sec-lead">
                Everything I reach for, registered by namespace. <code>calls</code> counts the projects in this portfolio that use
                each tool — pick one to filter them.
              </B>
            </SecHead>
            <div className="reg-grid" data-seg="registry">
              {REG_COLUMNS.map((col, ci) => (
                <div key={ci} className="reg-col">
                  {col.map((g) => (
                    <RegPanel key={g.ns} {...g} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </BuildSection>

        {/* ── CERTS · credential verifier ───────────────────────────── */}
        <BuildSection id="certs" sec="SEC_CERTS">
          <div className="wrap">
            <SecHead n="04" sec="SEC_CERTS" eyebrow="Credential verifier" title="Verified credentials">
              <B as="p" kind="para" label="p.lead" className="sec-lead">
                Industry certifications across machine learning, data science, cloud and analytics — each one checks out against its
                public Credly record.
              </B>
            </SecHead>
            <div className="cred-grid" data-seg="credentials">
              {CERTS.map((c, i) => (
                <B as="a" key={c.name} kind="block" label={`cred.0${i + 1}`} href={c.url} target="_blank" rel="noopener noreferrer" className="cred">
                  <span className="cred-top">
                    <span className="cred-id">cred_0{i + 1}</span>
                    <span className="cred-ok">✓ verified</span>
                  </span>
                  <img src={c.img} alt="" loading="lazy" className="cred-img" />
                  <span className="cred-name">{c.name}</span>
                  <span className="cred-meta">
                    {c.issuer} · {CERT_DATE[c.name] ?? "—"}
                  </span>
                  <span className="cred-call">
                    <code>verify</code>(&quot;credly&quot;) <ArrowUpRight width={12} height={12} />
                  </span>
                </B>
              ))}
            </div>
          </div>
        </BuildSection>

        {/* ── CONTACT ──────────────────────────────────────────────────── */}
        <BuildSection id="contact" sec="SEC_CONTACT" className="contact">
          <div className="wrap">
            <SecHead n="05" sec="SEC_CONTACT" eyebrow="Next steps?" title="Your turn to prompt." />
            <div className="contact-grid" data-seg="request">
              <div>
                <B as="p" kind="para" label="p.copy" className="contact-copy">
                  Hiring for agentic AI, LLM post-training or applied ML? Send the request. Email, LinkedIn or GitHub all reach
                  me, and every one gets a reply.
                </B>
                <B kind="block" label="div.actions" className="contact-actions" data-ops="create,write,style">
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
                    {"  "}<span className="j-k">&quot;timezone&quot;</span>: <span className="j-s">&quot;{PROFILE.timeZone}&quot;</span>,{"\n"}
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
