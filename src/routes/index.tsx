import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, UsersRound, Wrench } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CountUp, KineticHeading, Magnetic, Parallax, Ticker } from "@/components/motion-kit";
import { getEvents } from "@/lib/club.functions";
import { SIH_2026_THEME_NAMES } from "@/data/sih-2026";

export const Route = createFileRoute("/")({
  loader: () => getEvents(),
  head: () => ({
    meta: [
      { title: "Vertex — The Tech Club" },
      {
        name: "description",
        content:
          "Vertex is the technical club of REVA University. Building projects, hosting hackathons, and shaping the next wave of builders.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SihBanner />
      <SiteHeader />
      <main>
        <section
          ref={heroRef}
          className="relative min-h-[min(820px,calc(100svh-72px))] overflow-hidden border-b border-hairline"
        >
          <Atmosphere mesh />
          <div className="relative mx-auto flex min-h-[min(820px,calc(100svh-72px))] max-w-6xl flex-col justify-center px-6 py-20">
            <motion.div style={{ y: contentY, opacity: contentOpacity }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="flex items-center gap-4"
              >
                <img
                  src="/vertex-logo-transparent.png"
                  alt="Vertex — The Tech Club"
                  className="h-14 w-auto sm:h-16"
                  width={180}
                  height={60}
                  decoding="async"
                />
              </motion.div>
              <h1 className="mt-10 max-w-5xl font-display text-6xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-8xl lg:text-[8rem]">
                <KineticHeading text="Vertex" delay={0.15} />
              </h1>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-silver">
                The Tech Club · REVA University
              </p>
              <KineticHeading
                delay={0.5}
                stagger={0.035}
                className="mt-6 block max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
                text="A place to learn seriously, make useful things, and find people who care about the work."
              />
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="mt-9 flex flex-wrap gap-3"
              >
                <Magnetic>
                  <Link
                    to="/join"
                    className="btn-primary rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Join Vertex <ArrowUpRight size={15} />
                  </Link>
                </Magnetic>
                <Magnetic strength={8}>
                  <Link
                    to="/events"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    See what is happening
                  </Link>
                </Magnetic>
              </motion.div>
            </motion.div>

            <Reveal delay={0.2} className="mt-16">
              <div className="grid max-w-5xl gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
                <HomeLink
                  to="/join"
                  icon={<UsersRound size={17} />}
                  label="Members"
                  detail="Find your team"
                />
                <HomeLink
                  to="/projects"
                  icon={<Wrench size={17} />}
                  label="Work"
                  detail="See what gets built"
                />
                <HomeLink
                  to="/events"
                  icon={<CalendarDays size={17} />}
                  label="Events"
                  detail="Find the next room"
                />
                <HomeLink
                  to="/events/workshop"
                  icon={<BookOpen size={17} />}
                  label="Workshop"
                  detail="Neural Networks from Scratch: The Math Behind the Magic"
                />
              </div>
            </Reveal>

            <Reveal delay={0.35} className="mt-12">
              <div className="flex max-w-3xl flex-wrap gap-x-10 gap-y-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <Stat value={30} suffix="+" label="Active members" />
                <Stat value={5} suffix="" label="Core teams" />
                <Stat value={2026} suffix="" label="Established" />
              </div>
            </Reveal>
          </div>
        </section>

        <Ticker items={[...SIH_2026_THEME_NAMES.slice(0, 10)]} />

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <Reveal>
            <Parallax distance={24}>
              <Link
                to="/events/sih-internal-hackathon"
                className="group grid overflow-hidden rounded-2xl ring-card md:grid-cols-[.75fr_1.25fr]"
              >
                <div className="relative min-h-52 overflow-hidden border-b border-hairline p-6 md:border-b-0 md:border-r">
                  <div className="grid-backdrop absolute inset-0 opacity-60" />
                  <div className="relative flex h-full flex-col justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] font-semibold text-silver">
                      Featured · Hosted by Vertex
                    </span>
                    <picture>
                      <source
                        srcSet="/sih-2026-logo-480.webp 480w, /sih-2026-logo-720.webp 720w"
                        type="image/webp"
                      />
                      <img
                        src="/sih-2026-logo.png"
                        alt="Smart India Hackathon 2026 — Ministry of Education, AICTE, MoE's Innovation Cell"
                        width={480}
                        height={52}
                        className="h-auto w-full"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </div>
                </div>
                <div className="flex flex-col justify-between p-6 md:p-9">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] font-semibold text-silver">
                      9–10 September 2026 · REVA Rangasthala
                    </p>
                    <h2 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">
                      SIH Internal Hackathon 2026
                    </h2>
                    <p className="mt-4 max-w-xl text-[13px] font-medium leading-7 text-foreground">
                      Vertex is hosting REVA’s internal selection for Smart India Hackathon 2026.
                      Explore official problem statements and themes here — then register your team
                      via the official Microsoft Form.
                    </p>
                    <p className="mt-2 font-mono text-[11px] font-semibold tracking-widest text-muted-foreground">
                      Deadline: 7 Sept · SPOC: Prof. Kiran M — 9035505082
                    </p>
                  </div>
                  <span className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-silver">
                    Open SIH workspace{" "}
                    <ArrowUpRight
                      size={15}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            </Parallax>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
          <Reveal>
            <Link
              to="/events/build-with-sarvam"
              className="group relative grid overflow-hidden rounded-2xl border border-emerald-950/15 bg-[linear-gradient(135deg,oklch(0.28_0.055_145),oklch(0.36_0.08_150))] text-white shadow-[0_24px_70px_-35px_oklch(0.28_0.055_145)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:48px_48px]" />
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl transition-transform duration-700 group-hover:scale-125" />
              <div className="relative grid gap-8 p-7 md:grid-cols-[1fr_auto] md:items-end md:p-10">
                <div>
                  <div className="flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-100">
                    <span className="h-px w-8 bg-emerald-200/70" />
                    New hackathon workspace
                  </div>
                  <h2 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl">
                    BUILD WITH SARVAM
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/85 sm:text-lg">
                    AI Innovation Hackathon | Presented by VERTEX Club, REVA University
                  </p>
                  <p className="mt-2 max-w-2xl font-display text-xl italic leading-7 text-white/90 sm:text-2xl">
                    Build with AI. Innovate with Sarvam. Create Real-World Impact.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm transition-colors group-hover:bg-white/20">
                  Open workspace <ArrowUpRight size={15} />
                </span>
              </div>
            </Link>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SihBanner() {
  const reduceMotion = useReducedMotion();
  const row = Array.from({ length: 8 });
  return (
    <Link
      to="/join"
      aria-label="Vertex recruitment is open for 2026 — join now"
      className="block overflow-hidden border-b border-hairline bg-accent text-accent-foreground"
    >
      <div
        className={`flex w-max items-center gap-10 py-2 font-mono text-[10px] uppercase tracking-[0.3em] ${
          reduceMotion ? "" : "marquee-track"
        }`}
      >
        {row.map((_, index) => (
          <span key={index} className="flex items-center gap-10 whitespace-nowrap">
            <span className="font-semibold">Vertex recruitment open for 2026</span>
            <span className="opacity-60">◆</span>
            <span className="inline-flex items-center gap-1.5 underline underline-offset-4">
              Join Vertex <ArrowUpRight size={12} />
            </span>
            <span className="opacity-60">◆</span>
          </span>
        ))}
      </div>
    </Link>
  );
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
        <CountUp to={value} suffix={suffix} />
      </div>
      <div className="mt-1">{label}</div>
    </div>
  );
}

function HomeLink({
  to,
  icon,
  label,
  detail,
}: {
  to: "/join" | "/projects" | "/events" | "/events/workshop";
  icon: ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 bg-background p-5 transition-colors hover:bg-black/[0.03]"
    >
      <span className="text-silver">{icon}</span>
      <span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <span className="mt-1 block text-sm text-foreground">{detail}</span>
      </span>
      <ArrowUpRight
        className="ml-auto text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
        size={16}
      />
    </Link>
  );
}
