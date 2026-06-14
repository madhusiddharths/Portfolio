import { SKILLS, techIcon } from "@/lib/projects";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

export function Skills() {
  return (
    <section className="section" id="skills">
      <div className="u-container">
        <SectionHeading
          index="02"
          eyebrow="Capability matrix"
          title="The toolbox"
          description="Languages, frameworks, and platforms I reach for across the data and ML lifecycle — grouped by where they live in the stack."
        />

        <div className="matrix">
          {SKILLS.map((group, gi) => (
            <Reveal key={group.group} delay={gi * 0.05} className="matrix-group">
              <div className="matrix-group-head">
                <span className="matrix-group-index u-mono">{String(gi + 1).padStart(2, "0")}</span>
                <h3 className="matrix-group-title">{group.group}</h3>
                <span className="matrix-group-count u-mono">{group.items.length}</span>
              </div>
              <ul className="matrix-items">
                {group.items.map((item) => {
                  const icon = techIcon(item);
                  return (
                    <li key={item} className="matrix-chip" data-cursor="">
                      {icon ? (
                        <img src={icon} alt="" loading="lazy" width={18} height={18} />
                      ) : (
                        <span className="matrix-chip-dot" aria-hidden="true" />
                      )}
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
