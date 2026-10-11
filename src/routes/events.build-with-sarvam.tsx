import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Instagram, Mail, Sparkles } from "lucide-react";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const Route = createFileRoute("/events/build-with-sarvam")({
  head: () => ({
    meta: [
      { title: "Build with Sarvam — Vertex" },
      {
        name: "description",
        content:
          "Build with Sarvam is an AI innovation hackathon initiative by VERTEX Club at REVA University.",
      },
    ],
  }),
  component: BuildWithSarvamPage,
});

const objectives = [
  "Promote hands-on learning and practical AI development.",
  "Help engineering students understand and use AI APIs effectively.",
  "Encourage innovation, teamwork, and problem-solving.",
  "Enable participants to build functional prototypes addressing real-world problems.",
  "Create opportunities for mentorship, technical evaluation, and industry engagement.",
];

const format = [
  ["Organiser", "VERTEX Club, REVA University"],
  ["Target audience", "Engineering students"],
  ["Format", "Offline, on-campus hackathon"],
  [
    "Theme",
    "Build innovative AI solutions using available tools and APIs; final partner arrangements are subject to confirmation",
  ],
  [
    "Focus areas",
    "AI applications, automation, productivity, education, language technology, and real-world problem-solving",
  ],
  ["Team structure", "To be announced"],
  ["Date and venue", "To be announced"],
];

const evaluation = [
  "Innovation and originality",
  "Practical implementation",
  "Effective use of AI technology",
  "Real-world relevance and impact",
  "Presentation and demonstration",
];

const outcomes = [
  "Functional AI-powered prototypes developed by student teams.",
  "Improved practical knowledge of AI platforms and APIs.",
  "Greater awareness of AI development opportunities.",
  "Stronger collaboration between students, academia, and the AI ecosystem.",
];

function BuildWithSarvamPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <Atmosphere mesh />
          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} /> Back to Vertex
            </Link>
            <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
              <div>
                <div className="chip w-fit rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-silver">
                  <Sparkles size={12} /> Proposed hackathon initiative
                </div>
                <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  AI Innovation Hackathon · Presented by VERTEX Club, REVA University
                </p>
                <h1 className="mt-5 max-w-4xl font-display text-6xl font-semibold leading-[0.88] tracking-[-0.06em] sm:text-8xl">
                  Build with
                  <br />
                  <span className="text-silver-gradient">Sarvam.</span>
                </h1>
                <p className="mt-7 max-w-2xl font-display text-2xl italic leading-tight text-muted-foreground sm:text-3xl">
                  Build with AI. Innovate with Sarvam. Create Real-World Impact.
                </p>
                <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground">
                  A proposed AI-focused hackathon initiative empowering engineering students to
                  explore artificial intelligence and build innovative solutions using AI platforms
                  and APIs.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#interest"
                    className="btn-primary rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Express interest <ArrowRight size={15} />
                  </a>
                  <a
                    href="#format"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Explore the format
                  </a>
                </div>
              </div>
              <div className="glass-panel edge-highlight rounded-2xl p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Hackathon desk
                </div>
                <dl className="mt-5 grid gap-4 text-sm">
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Organiser</dt>
                    <dd className="max-w-[180px] text-right">VERTEX Club, REVA University</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Mode</dt>
                    <dd className="text-right">Offline · on-campus</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="text-right">To be announced</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Venue</dt>
                    <dd className="text-right">To be announced</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">Partner status</dt>
                    <dd className="max-w-[180px] text-right">
                      Proposed collaboration with Sarvam AI
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[.75fr_1.25fr]">
          <Reveal>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
              01 · The idea
            </p>
            <h2 className="mt-4 max-w-md font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              From curiosity to useful things.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Build with Sarvam is designed to move students beyond theoretical learning and into
              practical application. Participants will work with AI-powered technologies to address
              meaningful, real-world challenges and turn early ideas into functional prototypes.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              The proposed collaboration with Sarvam AI aims to introduce participants to its AI
              technologies and explore opportunities for API access, technical guidance, mentorship,
              and ecosystem engagement.
            </p>
          </Reveal>
        </section>

        <section className="border-y border-hairline bg-surface-2">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-2">
            <Reveal>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                02 · Event objectives
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
                Make the work real.
              </h2>
              <ul className="mt-8 grid gap-4">
                {objectives.map((objective) => (
                  <li
                    key={objective}
                    className="flex gap-3 text-sm leading-6 text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 shrink-0 text-silver" size={17} />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="glass-panel edge-highlight rounded-2xl p-6 md:p-8">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                  03 · Hackathon format
                </p>
                <dl className="mt-7 grid gap-5">
                  {format.map(([label, value]) => (
                    <div
                      key={label}
                      className="grid gap-1 border-b border-hairline pb-4 sm:grid-cols-[130px_1fr] sm:gap-4"
                    >
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="text-sm leading-6">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="interest" className="border-y border-hairline bg-surface-2">
          <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
            <div className="glass-panel flex flex-col gap-6 rounded-2xl p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                  Participation interest
                </p>
                <h2 className="mt-2 font-display text-3xl tracking-tight">
                  Want to build with us?
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Registration dates, team structure, and the official form will be shared after the
                  event plan and partnership details are confirmed. For now, contact VERTEX Club to
                  express interest.
                </p>
              </div>
              <a
                href="mailto:vertexreva@gmail.com?subject=Build%20with%20Sarvam%20interest"
                className="btn-primary shrink-0 rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
              >
                Contact VERTEX <Mail size={15} />
              </a>
            </div>
          </div>
        </section>

        <section id="format" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                04 · Technology & innovation
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
                Build with possibility.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
                Participants will explore AI-powered development using APIs and available AI tools,
                with an emphasis on experimentation, practical use cases, and understanding how AI
                can solve meaningful problems.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "AI applications",
                  "Automation",
                  "Productivity",
                  "Education",
                  "Language technology",
                  "Real-world problem-solving",
                ].map((focus) => (
                  <div key={focus} className="surface-card rounded-xl p-5">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-silver">
                      Focus area
                    </div>
                    <div className="mt-3 font-display text-xl">{focus}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-hairline bg-surface-2">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-2">
            <Reveal>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                05 · Mentorship & evaluation
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
                Ideas, tested well.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
                The event is planned to include technical guidance, prototype demonstrations, and
                evaluation across the dimensions that turn a promising idea into a useful solution.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-3 sm:grid-cols-2">
                {evaluation.map((item, index) => (
                  <div key={item} className="flex gap-4 border border-hairline bg-background p-5">
                    <span className="font-mono text-xs text-silver">0{index + 1}</span>
                    <span className="text-sm leading-6">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                Mentorship, judging, and prize distribution arrangements will be confirmed based on
                the final event plan and partner participation.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.1fr_.9fr]">
          <Reveal>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
              06 · Expected outcomes
            </p>
            <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
              Leave with momentum.
            </h2>
            <ul className="mt-8 grid gap-4">
              {outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-silver" size={17} />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="ring-card rounded-2xl p-7 md:p-9">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                About VERTEX Club
              </div>
              <h2 className="mt-4 font-display text-3xl tracking-tight">
                Code · Innovate · Elevate
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                VERTEX Club is a student-led technology community at REVA University focused on
                coding, innovation, collaboration, and building impactful solutions. Through
                technical events, hackathons, and learning initiatives, the club creates
                opportunities for students to develop practical skills and explore emerging
                technologies.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="mailto:vertexreva@gmail.com"
                  className="btn-ghost rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
                >
                  <Mail size={14} /> vertexreva@gmail.com
                </a>
                <a
                  href="https://www.instagram.com/vertex.reva/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
                >
                  <Instagram size={14} /> @vertex.reva
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              This event is proposed and subject to final confirmation of dates, event arrangements,
              and partnership details.
            </p>
            <Link
              to="/events"
              className="btn-primary shrink-0 rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
            >
              Explore all events <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
