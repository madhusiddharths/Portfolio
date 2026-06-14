import { Reveal } from "./reveal";

type Props = {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
};

export function SectionHeading({ index, eyebrow, title, description, action }: Props) {
  return (
    <Reveal className="section-heading">
      <div className="section-heading-top">
        <span className="section-index u-mono">{index}</span>
        <span className="section-eyebrow u-mono">{eyebrow}</span>
      </div>
      <div className="section-heading-main">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {description && <p className="section-description">{description}</p>}
    </Reveal>
  );
}
