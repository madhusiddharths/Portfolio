import { PROFILE } from "@/lib/projects";
import { Reveal } from "@/components/reveal";
import { Magnetic } from "@/components/magnetic";
import { SocialLinks } from "@/components/social-links";
import { ArrowIcon } from "@/components/icons";

export function Contact() {
  return (
    <section className="section contact" id="contact">
      <div className="u-container">
        <Reveal className="contact-card">
          <div className="contact-grid">
            <div className="contact-lead">
              <p className="contact-eyebrow u-mono">
                <span className="section-index">04</span> Next steps?
              </p>
              <h2 className="contact-title">
                Don&apos;t be a <span className="hero-mark">Stranger!</span>
              </h2>
              <p className="contact-copy">
                Feel free to drop me an email if you believe we&apos;d make a great team and would like
                to collaborate. Let&apos;s make our work together not only productive but also enjoyable!
              </p>
              <div className="contact-actions">
                <Magnetic>
                  <a href={`mailto:${PROFILE.email}`} className="btn btn-primary" data-cursor="email">
                    Get in Touch <ArrowIcon width={17} height={17} />
                  </a>
                </Magnetic>
                <SocialLinks />
              </div>
            </div>

            <aside className="contact-card-meta" aria-label="Contact details">
              <dl>
                <div>
                  <dt className="u-mono">Email</dt>
                  <dd>
                    <a href={`mailto:${PROFILE.email}`} className="u-link">
                      {PROFILE.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="u-mono">Role</dt>
                  <dd>{PROFILE.role}</dd>
                </div>
                <div>
                  <dt className="u-mono">Status</dt>
                  <dd>
                    <span className="status-dot" /> Open to opportunities
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
