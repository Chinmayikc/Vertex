import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { HackathonDetailCard } from "@/components/hackathon/HackathonDetailCard";
import { HackathonSectionHeading } from "@/components/hackathon/HackathonSectionHeading";
import { HackathonThemeCard } from "@/components/hackathon/HackathonThemeCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { HACKATHON } from "@/data/hackathon";

export const Route = createFileRoute("/hackathon")({
  head: () => ({
    meta: [
      { title: `${HACKATHON.title} — AI Hackathon — Vertex` },
      {
        name: "description",
        content:
          "Build, innovate, and transform with AI at BUILD WITH SARVAM, a Vertex hackathon in collaboration with Sarvam AI.",
      },
      { property: "og:title", content: `${HACKATHON.title} — AI Hackathon — Vertex` },
      {
        property: "og:description",
        content: HACKATHON.tagline,
      },
    ],
  }),
  component: HackathonPage,
});

function HackathonPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <About />
        <Prizes />
        <Details />
        <Themes />
        <Timeline />
        <Faqs />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-hairline">
      <Atmosphere mesh />
      <div className="relative mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-20 md:pb-28 md:pt-28 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-20">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="chip rounded-full px-3 py-1.5 text-silver">{HACKATHON.eyebrow}</span>
            <span>{HACKATHON.collaboration}</span>
          </div>
          <h1 className="mt-8 max-w-4xl font-display text-6xl font-semibold leading-[0.86] tracking-[-0.05em] sm:text-7xl md:text-8xl">
            {HACKATHON.title.split(" ").map((word, index) => (
              <span key={word} className={index === 1 ? "text-silver-gradient" : "block"}>
                {word} {index === 0 && <br />}
              </span>
            ))}
          </h1>
          <p className="mt-8 max-w-xl font-display text-2xl leading-tight text-silver sm:text-3xl">
            {HACKATHON.tagline}
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            A practical AI building sprint for curious teams ready to turn a sharp idea into a
            working prototype.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={HACKATHON.registrationUrl}
              className="btn-primary rounded-xl px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              Register Now <ArrowRight size={15} />
            </a>
            <a
              href="#about"
              className="btn-ghost rounded-xl px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              Explore Hackathon <ArrowDownRight size={15} />
            </a>
          </div>
        </div>

        <div className="relative lg:pb-2">
          <div className="glass-strong relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[oklch(0.72_0.09_150)]/25 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <span>Event desk</span>
                <span className="text-silver">01 / 06</span>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-7">
                <HeroMeta label="Date" value={HACKATHON.dateShort} />
                <HeroMeta label="Venue" value={HACKATHON.venue} />
                <HeroMeta label="Team size" value={`${HACKATHON.teamSize} members`} />
                <HeroMeta label="Duration" value={HACKATHON.duration} />
              </div>
              <div className="mt-10 border-t border-hairline pt-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Build signal
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="font-display text-5xl font-semibold leading-none">AI</span>
                  <span className="pb-1 font-mono text-[11px] uppercase tracking-widest text-silver">
                    ideas → prototypes
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-4 hidden rounded-xl border border-hairline bg-background/80 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground shadow-[var(--shadow-soft)] sm:block">
            {HACKATHON.heroHighlights[0]}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-xl font-semibold leading-tight">{value}</div>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="relative border-b border-hairline">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:py-28 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
        <Reveal>
          <HackathonSectionHeading eyebrow="01 · The brief" title="Make the idea real." />
        </Reveal>
        <Reveal delay={0.08}>
          <div className="max-w-2xl">
            <p className="font-display text-3xl leading-tight sm:text-4xl">{HACKATHON.about}</p>
            <p className="mt-7 max-w-xl text-sm leading-7 text-muted-foreground">
              Bring your point of view, divide the work, and learn by shipping. The room is for
              thoughtful experiments, clear demos, and real problem-solving—not just slideware.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["01", "Think together"],
                ["02", "Build hands-on"],
                ["03", "Demo with intent"],
              ].map(([number, label]) => (
                <div key={number} className="border-t border-hairline pt-3">
                  <div className="font-mono text-[10px] text-silver">{number}</div>
                  <div className="mt-2 text-sm font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Prizes() {
  return (
    <section className="relative border-b border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <HackathonSectionHeading
            eyebrow="02 · Prizes & benefits"
            title="Keep building after the weekend."
            description="Clear rewards for the people who show up, collaborate, and take an idea all the way to a demo."
          />
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {HACKATHON.prizes.map((prize, index) => (
            <Reveal key={prize.title} delay={index * 0.08}>
              <article className="surface-card edge-highlight h-full rounded-2xl p-7 sm:p-9">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Reward {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-silver">✦</span>
                </div>
                <div className="mt-16 font-display text-6xl font-semibold leading-none tracking-tight sm:text-7xl">
                  {prize.amount}
                </div>
                <h3 className="mt-5 max-w-xs font-display text-2xl font-semibold leading-tight">
                  {prize.title}
                </h3>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                  {prize.detail}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Details() {
  const details = [
    { icon: CalendarDays, label: "Date", value: HACKATHON.date },
    { icon: MapPin, label: "Venue", value: HACKATHON.venue },
    { icon: Clock3, label: "Duration", value: HACKATHON.duration },
    { icon: Users, label: "Team size", value: HACKATHON.teamSize },
    { icon: CalendarDays, label: "Registration deadline", value: HACKATHON.registrationDeadline },
  ];

  return (
    <section className="relative border-b border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <HackathonSectionHeading
            eyebrow="03 · Hackathon details"
            title="Know the coordinates."
            description="The essentials at a glance. Details marked as to be announced will be updated here as the organizing team confirms them."
          />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {details.map((detail, index) => (
            <Reveal key={detail.label} delay={index * 0.05}>
              <HackathonDetailCard {...detail} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Themes() {
  return (
    <section className="relative border-b border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <HackathonSectionHeading
            eyebrow="04 · Themes / problem statements"
            title="Leave room for the spark."
            description="Official themes and problem statements are not confirmed yet. These placeholders will be replaced as soon as the final brief is ready."
          />
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {HACKATHON.themes.map((theme, index) => (
            <Reveal key={theme.number} delay={index * 0.08}>
              <HackathonThemeCard {...theme} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Timeline() {
  return (
    <section className="relative border-b border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <HackathonSectionHeading
            eyebrow="05 · Timeline"
            title="From first click to final demo."
            description="A simple event rhythm for now. Exact dates and times will be added when the schedule is confirmed."
          />
        </Reveal>
        <div className="mt-12 grid border-y border-hairline md:grid-cols-3 md:border-b-0">
          {HACKATHON.timeline.map((item, index) => (
            <Reveal key={item.step} delay={index * 0.04}>
              <div className="relative border-b border-hairline p-5 last:border-b-0 md:min-h-40 md:border-b md:border-r md:p-6 md:nth-[3n]:border-r-0">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>{item.step}</span>
                  <span className="text-silver">{item.time}</span>
                </div>
                <h3 className="mt-10 font-display text-2xl font-semibold leading-tight">
                  {item.title}
                </h3>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faqs() {
  return (
    <section className="relative border-b border-hairline">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
        <Reveal>
          <HackathonSectionHeading
            eyebrow="06 · Rules & FAQs"
            title="The useful answers."
            description="We will keep this section current as official guidance lands."
          />
        </Reveal>
        <Reveal delay={0.08}>
          <Accordion type="single" collapsible className="border-t border-hairline">
            {HACKATHON.faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="py-5 text-base font-medium no-underline hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl pr-8 text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <Atmosphere />
      <div className="relative mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              07 · Your next build starts here
            </div>
            <h2 className="mt-5 font-display text-5xl font-semibold leading-[0.94] tracking-tight sm:text-7xl">
              Ready to build the future with AI?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground">
              Bring a team, bring a question, and leave with something you can show the world.
            </p>
            <a
              href={HACKATHON.registrationUrl}
              className="btn-primary mt-8 inline-flex rounded-xl px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              Register for Hackathon <ArrowRight size={15} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
