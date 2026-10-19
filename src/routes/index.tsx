import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowUpRight, CalendarDays, Code2, Megaphone, UsersRound } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { KineticHeading, Magnetic } from "@/components/motion-kit";
import { NEURAL_NETWORK_WORKSHOP } from "@/data/neural-network-workshop";
import { getAnnouncements, getShowcase } from "@/lib/public.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [showcase, announcements] = await Promise.all([getShowcase(), getAnnouncements()]);
    return {
      projects: showcase.projects.slice(0, 3),
      announcements: announcements.items.slice(0, 3),
    };
  },
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
  const { projects, announcements } = Route.useLoaderData();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <WorkshopBanner />
      <SiteHeader />
      <main>
        <section
          ref={heroRef}
          className="relative min-h-[min(760px,calc(100svh-72px))] overflow-hidden border-b border-hairline"
        >
          <Atmosphere mesh />
          <div className="relative mx-auto flex min-h-[min(760px,calc(100svh-72px))] max-w-6xl flex-col justify-center px-6 py-20">
            <motion.div style={{ y: contentY, opacity: contentOpacity }}>
              <img
                src="/vertex-logo-transparent.png"
                alt="Vertex — The Tech Club"
                className="h-14 w-auto sm:h-16"
                width={180}
                height={60}
                decoding="async"
              />
              <h1 className="mt-10 max-w-5xl font-display text-6xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-8xl lg:text-[8rem]">
                <KineticHeading text="Vertex" delay={0.15} />
              </h1>
              <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-silver">
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
                    className="btn-primary rounded-lg px-5 py-3 font-mono text-xs uppercase tracking-[0.12em]"
                  >
                    Join Vertex <ArrowUpRight size={16} />
                  </Link>
                </Magnetic>
                <Magnetic strength={8}>
                  <Link
                    to="/events"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-xs uppercase tracking-[0.12em]"
                  >
                    See events
                  </Link>
                </Magnetic>
              </motion.div>
            </motion.div>
            <Reveal delay={0.25} className="mt-16 max-w-4xl">
              <NextUp />
            </Reveal>
          </div>
        </section>

        <section className="border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <SectionIntro eyebrow="How Vertex works" title="Make room for good work." />
            <div className="mt-12 grid gap-px border border-hairline bg-hairline md:grid-cols-3">
              <PracticeCard
                icon={<Code2 size={19} />}
                title="Build"
                text="Work on projects that are useful outside a presentation deck, with credit that follows the people who made them."
                link="/projects"
                action="See the work"
              />
              <PracticeCard
                icon={<UsersRound size={19} />}
                title="Learn"
                text="Find collaborators, ask better questions, and turn a workshop or a shared problem into a reason to keep going."
                link="/members"
                action="Meet the club"
              />
              <PracticeCard
                icon={<CalendarDays size={19} />}
                title="Host"
                text="Run workshops, hackathons, and sessions with clear information, proper registration, and an actual room to show up in."
                link="/events"
                action="Explore events"
              />
            </div>
          </div>
        </section>

        <section className="border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <SectionIntro eyebrow="Selected work" title="Things worth opening." />
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                All projects <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="mt-12 grid gap-px border border-hairline bg-hairline md:grid-cols-3">
              {projects.map((project) => (
                <article key={project.id} className="flex min-h-64 flex-col bg-background p-6">
                  <div className="font-mono text-xs uppercase tracking-[0.14em] text-silver">
                    {project.year ?? "Selected work"}
                  </div>
                  <h3 className="mt-8 font-display text-3xl font-semibold leading-tight">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-auto pt-8">
                    {project.tech.length > 0 && (
                      <div className="mb-5 flex flex-wrap gap-2">
                        {project.tech.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground hover:text-silver"
                      >
                        Open project <ArrowUpRight size={15} />
                      </a>
                    ) : (
                      <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground hover:text-silver"
                      >
                        View project <ArrowUpRight size={15} />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-hairline">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionIntro eyebrow="From the board" title="Keep up with the club." />
              <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">
                Event updates, calls for collaborators, and the details people need before they walk
                into the room.
              </p>
              <Link
                to="/announcements"
                className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground hover:text-silver"
              >
                Open the feed <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="flex flex-col gap-px border border-hairline bg-hairline">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <article key={announcement.id} className="bg-background p-6">
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      <span>{announcement.pinned ? "Pinned" : "Update"}</span>
                      <span className="h-1 w-1 rounded-full bg-silver" />
                      <time dateTime={announcement.created_at}>
                        {new Date(announcement.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold leading-tight">
                      {announcement.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {announcement.body}
                    </p>
                  </article>
                ))
              ) : (
                <div className="bg-background p-7">
                  <Megaphone size={20} className="text-silver" />
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    The club feed is ready for the next announcement.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 grid-backdrop opacity-30" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-20 sm:flex-row sm:items-end sm:py-24">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-silver">
                Get involved
              </p>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[0.98] sm:text-6xl">
                Bring a question. Find the people for it.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/join"
                className="btn-primary rounded-lg px-5 py-3 font-mono text-xs uppercase tracking-[0.12em]"
              >
                Join Vertex <ArrowUpRight size={16} />
              </Link>
              <Link
                to="/events"
                className="btn-ghost rounded-lg px-5 py-3 font-mono text-xs uppercase tracking-[0.12em]"
              >
                Attend an event
              </Link>
            </div>
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
        className={`flex w-max items-center gap-10 py-2.5 font-mono text-xs uppercase tracking-[0.16em] ${reduceMotion ? "" : "marquee-track"}`}
      >
        {row.map((_, index) => (
          <span key={index} className="flex items-center gap-10 whitespace-nowrap">
            <span className="font-semibold">Neural Networks Workshop registration is open</span>
            <span className="opacity-60">◆</span>
            <span className="inline-flex items-center gap-1.5 underline underline-offset-4">
              Register now <ArrowUpRight size={13} />
            </span>
            <span className="opacity-60">◆</span>
          </span>
        ))}
      </div>
    </Link>
  );
}

function NextUp() {
  return (
    <Link
      to="/events/neural-networks-from-scratch"
      className="group grid gap-5 border border-hairline bg-background/85 p-5 backdrop-blur-sm transition-colors hover:border-silver sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6"
    >
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center border border-hairline">
        <span className="font-display text-2xl leading-none">28</span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Oct
        </span>
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-silver">
          Up next · Workshop
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
          Neural Networks from Scratch
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {NEURAL_NETWORK_WORKSHOP.time} · {NEURAL_NETWORK_WORKSHOP.venue}
        </p>
      </div>
      <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground group-hover:text-silver">
        Details <ArrowUpRight size={16} />
      </span>
    </Link>
  );
}

function SectionIntro({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-silver">{eyebrow}</p>
      <h2 className="mt-5 font-display text-4xl font-semibold leading-[0.98] sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

function PracticeCard({
  icon,
  title,
  text,
  link,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  link: "/projects" | "/members" | "/events";
  action: string;
}) {
  return (
    <Link
      to={link}
      className="group flex min-h-72 flex-col bg-background p-6 transition-colors hover:bg-secondary/45"
    >
      <span className="text-silver">{icon}</span>
      <h3 className="mt-8 font-display text-3xl font-semibold">{title}</h3>
      <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">{text}</p>
      <span className="mt-auto inline-flex items-center gap-2 pt-8 font-mono text-xs uppercase tracking-[0.12em] group-hover:text-silver">
        {action} <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}
