import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowUpRight, CalendarDays, UsersRound, Wrench } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CountUp, KineticHeading, Magnetic } from "@/components/motion-kit";
import { getEvents } from "@/lib/club.functions";

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
      <WorkshopBanner />
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
              <div className="grid max-w-4xl gap-px border border-hairline bg-hairline sm:grid-cols-3">
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

      </main>
      <SiteFooter />
    </div>
  );
}

function WorkshopBanner() {
  const reduceMotion = useReducedMotion();
  const row = Array.from({ length: 8 });
  return (
    <Link
      to="/events/neural-networks-from-scratch"
      aria-label="Neural Networks Workshop registration is open — register now"
      className="block overflow-hidden border-b border-hairline bg-accent text-accent-foreground"
    >
      <div
        className={`flex w-max items-center gap-10 py-2 font-mono text-[10px] uppercase tracking-[0.3em] ${
          reduceMotion ? "" : "marquee-track"
        }`}
      >
        {row.map((_, index) => (
          <span key={index} className="flex items-center gap-10 whitespace-nowrap">
            <span className="font-semibold">Neural Networks Workshop registration is open</span>
            <span className="opacity-60">◆</span>
            <span className="inline-flex items-center gap-1.5 underline underline-offset-4">
              Register now <ArrowUpRight size={12} />
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
  to: "/join" | "/projects" | "/events";
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
