import { CERTS } from "@/lib/projects";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { ArrowUpRight } from "@/components/icons";

export function Certifications() {
  return (
    <section className="section" id="certifications">
      <div className="u-container">
        <SectionHeading
          index="03"
          eyebrow="Credentials"
          title="Certifications"
          description="Industry certifications validating my expertise across machine learning, data science, cloud, and analytics."
        />

        <div className="certs">
          {CERTS.map((cert, i) => (
            <Reveal key={cert.name} delay={i * 0.05}>
              <a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="cert-card"
                data-cursor="verify"
              >
                <span className="cert-index u-mono">C.{String(i + 1).padStart(2, "0")}</span>
                <span className="cert-badge">
                  <img src={cert.img} alt={cert.name} loading="lazy" />
                </span>
                <span className="cert-meta">
                  <span className="cert-name">{cert.name}</span>
                  <span className="cert-issuer u-mono">{cert.issuer}</span>
                </span>
                <span className="cert-go" aria-hidden="true">
                  <ArrowUpRight width={15} height={15} />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
