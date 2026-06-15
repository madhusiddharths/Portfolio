import { Intro } from "@/components/intro";
import { Hero } from "@/components/sections/hero";
import { Work } from "@/components/sections/work";
import { Skills } from "@/components/sections/skills";
import { Certifications } from "@/components/sections/certifications";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <main id="main">
      <Intro />
      <Hero />
      <Work />
      <Skills />
      <Certifications />
      <Contact />
    </main>
  );
}
