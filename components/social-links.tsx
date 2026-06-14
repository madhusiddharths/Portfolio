import { PROFILE } from "@/lib/projects";
import { GithubIcon, LinkedinIcon, DiscordIcon, MailIcon } from "./icons";

const LINKS = [
  { label: "GitHub", href: PROFILE.github, Icon: GithubIcon, external: true },
  { label: "LinkedIn", href: PROFILE.linkedin, Icon: LinkedinIcon, external: true },
  { label: "Discord", href: PROFILE.discord, Icon: DiscordIcon, external: true },
  { label: "Email", href: `mailto:${PROFILE.email}`, Icon: MailIcon, external: false },
];

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`social-links ${className}`}>
      {LINKS.map(({ label, href, Icon, external }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          data-cursor={label.toLowerCase()}
          className="icon-button"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <Icon />
        </a>
      ))}
    </div>
  );
}
