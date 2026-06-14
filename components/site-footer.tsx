import Link from "next/link";
import { PROFILE } from "@/lib/projects";
import { SocialLinks } from "./social-links";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="u-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <p className="footer-name">{PROFILE.name}</p>
            <p className="footer-tag u-mono">{PROFILE.tagline}</p>
          </div>

          <nav className="footer-nav" aria-label="Footer">
            <Link href="/work/">Work</Link>
            <Link href="/#skills">Skills</Link>
            <Link href="/#certifications">Certifications</Link>
            <Link href="/#contact">Contact</Link>
            <a href={PROFILE.resume} target="_blank" rel="noopener noreferrer">
              Résumé
            </a>
          </nav>

          <SocialLinks />
        </div>

        <div className="footer-base">
          <p className="u-mono">
            © {new Date().getFullYear()} {PROFILE.name} — built with Next.js · Tailwind · Framer Motion
          </p>
          <a href="#top" className="u-link footer-top">
            Back to top <span className="u-arrow">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
