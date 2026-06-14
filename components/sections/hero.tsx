import Link from "next/link";
import { PROFILE, METRICS } from "@/lib/projects";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { Magnetic } from "@/components/magnetic";
import { StatusClock } from "@/components/status-clock";
import { SocialLinks } from "@/components/social-links";
import { ArrowIcon, ArrowUpRight } from "@/components/icons";

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="u-container hero-inner">
        <Reveal>
          <p className="hero-kicker u-mono">
            {PROFILE.name} <span className="hero-kicker-sep">/</span> {PROFILE.role}
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <h1 className="hero-headline">
            I develop <span className="hero-mark">scalable models</span> that drive real-world impact.
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="status-line u-mono" role="status">
            <span className="status-pill">
              <span className="status-dot" /> Available for work
            </span>
            <span className="status-sep">·</span>
            <span>{PROFILE.location} {/* live */}<StatusClock /></span>
            <span className="status-sep">·</span>
            <span className="status-building">
              building <em>{PROFILE.building}</em>
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="hero-bio">{PROFILE.bio}</p>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="hero-note u-mono">
            <span className="hero-note-arrow">→</span> {PROFILE.analystNote}{" "}
            <a href={PROFILE.analystResume} target="_blank" rel="noopener noreferrer" className="u-link">
              View Data Analyst résumé
            </a>
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="hero-actions">
            <Magnetic>
              <Link href="/work/" className="btn btn-primary" data-cursor="explore">
                Explore work <ArrowIcon width={17} height={17} />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/#contact" className="btn btn-ghost" data-cursor="say hi">
                Get in touch
              </Link>
            </Magnetic>
            <a href={PROFILE.resume} target="_blank" rel="noopener noreferrer" className="btn btn-text">
              Résumé <ArrowUpRight width={14} height={14} />
            </a>
            <SocialLinks className="hero-social" />
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <dl className="hero-metrics">
            {METRICS.map((m) => (
              <div className="metric" key={m.label}>
                <dt className="metric-value">
                  <CountUp value={m.value} prefix={m.prefix} suffix={m.suffix} />
                </dt>
                <dd className="metric-label u-mono">{m.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
