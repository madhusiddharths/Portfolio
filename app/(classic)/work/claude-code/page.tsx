import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Caveat } from "next/font/google";
import { techIcon } from "@/lib/projects";
import { ReadingProgress } from "@/components/reading-progress";
import { BuildSection } from "@/components/agent/swarm";
import { B } from "@/components/agent/b";
import { WobbleDefs, Mascot, Notebook, Memory, LaptopPhone, Resume, Ferry, Critic, Plug, Sparkle, Crew } from "./doodles";
import "../[slug]/fieldnotes.css";
import "@/app/console.css";
import "./claude.css";

const hand = Caveat({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-hand" });

const SUMMARY = "A sketchbook of the everyday problems Claude solves for me, and the little setup behind it.";

export const metadata: Metadata = {
  title: "My Claude",
  description: SUMMARY,
};

type Line = [who: "me" | "claude", text: string];

/** One sketchbook page. Every child is a build node, so the swarm builds it live. */
function Sheet({
  n,
  tag,
  title,
  art,
  note,
  side,
  wide,
  children,
}: {
  n: string;
  tag: string;
  title: string;
  art: ReactNode;
  note?: string;
  side: "l" | "r";
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="cc-sheet" data-side={side} data-seg={`page-${n}`}>
      <B as="p" kind="type" label="p.tag" className="cc-tag">
        p.{n} · {tag}
      </B>
      <B as="h2" kind="type" label="h2" className="cc-h">
        {title}
      </B>
      <B kind="media" label="svg.doodle" className={wide ? "cc-art cc-art-wide" : "cc-art"}>
        {art}
      </B>
      {children}
      {note && (
        <B as="p" kind="type" label="p.note" className="cc-note">
          {note}
        </B>
      )}
    </div>
  );
}

function Chat({ lines }: { lines: Line[] }) {
  return (
    <B kind="block" label="div.chat" className="cc-chat">
      {lines.map(([who, text], i) => (
        <p key={i} data-who={who}>
          <span>{who}</span>
          {text}
        </p>
      ))}
    </B>
  );
}

const STATS: [string, string][] = [
  ["chats deleted", "all of them"],
  ["decisions lost", "0"],
  ["résumé pages", "1, every time"],
  ["tools on my phone", "all of them"],
];

const RULES = [
  "think first. ask when unsure.",
  "smallest change that works.",
  "done means tested, not typed.",
  "no secrets. ask before anything risky.",
];

export default function MyClaudePage() {
  const claudeIcon = techIcon("Claude");
  return (
    <div className={`case-study cc-page ${hand.variable}`}>
      <WobbleDefs />
      <ReadingProgress />

      <BuildSection id="report" sec="SEC_REPORT" className="cc-hero">
        <div className="wrap cc-hero-grid">
          <div>
            <B kind="type" label="a.back" className="cs-back-wrap">
              <Link href="/" className="cs-back">
                <span>←</span> cd ~
              </Link>
            </B>
            <B as="p" kind="type" label="p.eyebrow" className="cc-eyebrow">
              {claudeIcon && <img src={claudeIcon} alt="" width={14} height={14} />}
              my_claude · field notes
            </B>
            <B as="h1" kind="type" label="h1.title" className="cc-title">
              Me, Claude, and a sketchbook of fixes.
            </B>
            <B as="p" kind="para" label="p.summary" className="cc-lede">
              I use Claude every day, mostly for small things that used to eat my evenings. Here&apos;s what it fixes,
              drawn out.
            </B>
            <B as="p" kind="type" label="p.note" className="cc-note cc-note-hero">
              (meet my little agent →)
            </B>
          </div>
          <B kind="media" label="svg.mascot" className="cc-hero-art">
            <Mascot wave />
          </B>
        </div>
      </BuildSection>

      <BuildSection id="notes" sec="SEC_NOTES" className="cc-book">
        <div className="wrap cc-pages">
          <div className="cc-margin cc-margin-l" aria-hidden="true">
            <B kind="media" label="svg.crew" className="cc-m cc-m-crew"><Crew /></B>
            <B kind="media" label="svg.plug" className="cc-m cc-m-plug"><Plug /></B>
            <B kind="media" label="svg.sparkle" className="cc-m cc-m-sp1"><Sparkle /></B>
          </div>
          <div className="cc-margin cc-margin-r" aria-hidden="true">
            <B kind="media" label="svg.sparkle" className="cc-m cc-m-sp2"><Sparkle /></B>
            <B kind="media" label="svg.mascot" className="cc-m cc-m-bot"><Mascot /></B>
            <B kind="media" label="svg.sparkle" className="cc-m cc-m-critic"><Sparkle /></B>
          </div>

          <Sheet n="01" tag="the amnesia problem" title="Claude kept forgetting my projects." art={<Notebook />} side="l"
            note="works with a local model too. no internet needed.">
            <B as="p" kind="para" label="p" className="cc-p">
              Every new chat started from zero, and I was tired of explaining my own work. So I gave Claude a notebook:
              one page per project with what it does, what matters, and what tends to break. It reads the page before it
              touches any code, updates it after, and a little checker complains if a page falls behind.
            </B>
            <Chat lines={[["me", "what's fragile in pulsetrade?"], ["claude", "the API key default. it's in your notes, under gotchas."]]} />
          </Sheet>

          <Sheet n="02" tag="chats die, decisions don't" title="I delete my chats. Nothing gets lost." art={<Memory />} side="r"
            note="every save is versioned. nothing gets overwritten.">
            <B as="p" kind="para" label="p" className="cc-p">
              When I say &ldquo;save&rdquo;, Claude writes down what I decided, the exact date, and why, in plain
              sentences future me can read. It works out dates itself, so &ldquo;last Tuesday&rdquo; never turns into a
              guess. The same idea runs a training coach that reads my watch before it gives advice.
            </B>
            <Chat lines={[["me", "save that."], ["claude", "saved: ferry talks over my private network only. dated, done."]]} />
          </Sheet>

          <Sheet n="03" tag="tools that follow me" title="My laptop's tools, on my phone." art={<LaptopPhone />} side="l" wide
            note="servers asleep right now: most of them.">
            <B as="p" kind="para" label="p" className="cc-p">
              My helpers live on my Mac, which made them useless the moment I left my desk. So I built a tiny menu-bar
              app that wakes each one only when Claude asks, lets it nap when it&apos;s quiet, and opens a safe door so
              Claude on my phone can use them too.
            </B>
            <Chat lines={[["me", "(from my phone) what did I decide about ferry's clipboard?"], ["claude", "mac to phone, text only. answered from your laptop."]]} />
          </Sheet>

          <Sheet n="04" tag="one page. always." title="Résumés that never spill onto page two." art={<Resume />} side="r"
            note="pasting a job post is the whole workflow.">
            <B as="ul" kind="list" label="ul.checks" className="cc-checks">
              <li>reads my facts fresh, every single time</li>
              <li>matches the job&apos;s own words</li>
              <li>writes every bullet new. nothing invented, nothing recycled</li>
              <li>a checker and a ruler reject anything that isn&apos;t exactly one page</li>
            </B>
          </Sheet>

          <Sheet n="05" tag="tiny tools" title="Things I'd never have built alone." art={<Ferry />} side="l" wide
            note="idea → working app in a few days.">
            <B as="p" kind="para" label="p" className="cc-p">
              Moving a link from my phone to my Mac shouldn&apos;t be hard, and no app did it the way I wanted. So Claude
              and I built <strong>Ferry</strong>: share anything on the phone and it lands on the Mac, copy on the Mac and
              it&apos;s on the phone. Private network only, and it ignores anything my password manager copies.
            </B>
          </Sheet>

          <Sheet n="06" tag="house rules" title="Fast and wrong is worse than slow." art={<Critic />} side="r">
            <B kind="block" label="div.rules" className="cc-rules">
              {RULES.map((r) => (
                <p key={r}>{r}</p>
              ))}
            </B>
            <B as="p" kind="para" label="p" className="cc-p">
              On top of that I installed a few helpers: a critic that tries to break each change, a design guide, and an
              editor that keeps my writing sounding like me.
            </B>
          </Sheet>

          <Sheet n="07" tag="proof" title="This site goes through the same loop." art={<Mascot />} side="l" note="yes, really.">
            <B as="p" kind="para" label="p" className="cc-p">
              Every change lands on a branch, gets built, and gets clicked through in a real browser before it ships.
              This page went through it too, including the version that loaded blank.
            </B>
          </Sheet>
        </div>
      </BuildSection>

      <BuildSection id="stats" sec="SEC_STATS" className="cc-stats-sec">
        <div className="wrap">
          <B as="dl" kind="block" label="dl.stats" className="cc-stats" data-seg="stats">
            {STATS.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </B>
        </div>
      </BuildSection>

    </div>
  );
}
