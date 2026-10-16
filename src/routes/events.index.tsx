import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import {
  EventPassCard,
  EventRegistrationForm,
  type EventPass,
} from "@/components/EventRegistration";
import { Reveal } from "@/components/Reveal";
import { SpotlightCard } from "@/components/SpotlightCard";
import { getEvents } from "@/lib/club.functions";
import {
  SIH_2026_INTERNAL_TIME,
  SIH_2026_INTERNAL_VENUE,
  SIH_2026_REGISTRATION_DEADLINE,
  SIH_2026_CONTACT_NAME,
  SIH_2026_CONTACT_PHONE,
} from "@/data/sih-2026";

export const Route = createFileRoute("/events/")({
  loader: () => getEvents(),
  head: () => ({
    meta: [
      { title: "Events — Vertex — The Tech Club" },
      {
        name: "description",
        content:
          "Hackathons, workshops, launch nights, and mixers run by Vertex. Register and get a scannable entry pass.",
      },
      { property: "og:title", content: "Events — Vertex — The Tech Club" },
      {
        property: "og:description",
        content: "Register for Vertex events and get a scannable entry pass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-mono text-sm text-muted-foreground">Events couldn't load.</p>
    </div>
  ),
});

function EventsPage() {
  const events = Route.useLoaderData();
  const featuredWorkshop =
    events.find((event) => event.slug === "workshop") ??
    events.find((event) => event.tag.toLowerCase() === "workshop");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [pass, setPass] = useState<EventPass | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-hairline">
          <div
            aria-hidden="true"
            className="absolute inset-0 grid-backdrop opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-32 top-8 h-80 w-80 rounded-full bg-[oklch(0.78_0.08_145)]/20 blur-3xl sm:h-[30rem] sm:w-[30rem]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-14 sm:gap-12 sm:px-6 sm:pb-20 sm:pt-24 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
            <Reveal className="max-w-3xl">
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:text-[11px]">
                <span className="inline-block h-px w-8 bg-silver" />
                Vertex · Events &amp; experiences
              </div>
              <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.75rem,11vw,4rem)] font-semibold leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
                Ideas meet
                <br />
                <span className="text-silver">in real life.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Workshops, build sessions, and gatherings for people who like turning curiosity into
                something real.
              </p>
              <a
                href="#event-list"
                className="btn-ghost mt-8 w-fit rounded-lg px-4 py-3 font-mono text-[10px] uppercase tracking-widest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-silver"
              >
                Explore events <ArrowDown aria-hidden="true" size={14} />
              </a>
            </Reveal>
            <Reveal delay={0.12} className="hidden lg:block">
              <div
                aria-hidden="true"
                className="relative flex h-52 w-52 items-center justify-center rounded-full border border-silver/20"
              >
                <div className="absolute inset-4 rounded-full border border-dashed border-silver/30" />
                <div className="absolute inset-10 rounded-full border border-silver/20" />
                <div className="h-20 w-20 rounded-full bg-[radial-gradient(circle_at_35%_30%,oklch(0.75_0.08_145/.8),oklch(0.38_0.06_145/.14)_68%)] shadow-[0_0_70px_-20px_var(--accent)]" />
                <span className="absolute right-7 top-10 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_var(--accent)]" />
                <span className="absolute bottom-9 left-6 h-1.5 w-1.5 rounded-full bg-silver" />
              </div>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-6">
          {pass && (
            <Reveal>
              <EventPassCard pass={pass} onClose={() => setPass(null)} />
            </Reveal>
          )}

          <section aria-labelledby="featured-workshop-heading" className="py-12 sm:py-16">
            <Reveal>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-silver">
                    Featured experience
                  </p>
                  <h2
                    id="featured-workshop-heading"
                    className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
                  >
                    Make room for a new idea.
                  </h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Workshop · Vertex
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="group relative grid min-w-0 overflow-hidden rounded-2xl border border-hairline bg-card shadow-[var(--shadow-soft)] lg:min-h-[22rem] lg:grid-cols-[1.1fr_.9fr]">
                <div
                  aria-hidden="true"
                  className="relative isolate flex min-h-56 items-center justify-center overflow-hidden border-b border-hairline bg-surface-2 p-6 sm:min-h-64 sm:p-8 lg:order-2 lg:min-h-full lg:border-b-0 lg:border-l"
                >
                  <div className="absolute inset-0 grid-backdrop opacity-70" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_64%)]" />
                  <div className="relative flex aspect-square w-full max-w-[17rem] items-center justify-center rounded-full border border-silver/25">
                    <div className="absolute inset-[12%] rounded-full border border-dashed border-silver/35 transition-transform duration-700 group-hover:rotate-12" />
                    <div className="absolute inset-[25%] rounded-full border border-silver/20" />
                    <div className="relative flex h-[38%] w-[38%] items-center justify-center rounded-2xl border border-silver/30 bg-background/80 font-display text-5xl text-silver shadow-[var(--shadow-glow)]">
                      N
                    </div>
                    <span className="absolute left-[14%] top-[21%] h-3 w-3 rounded-full bg-accent shadow-[0_0_18px_var(--accent)]" />
                    <span className="absolute bottom-[18%] right-[14%] h-2 w-2 rounded-full bg-silver" />
                    <span className="absolute right-[9%] top-[35%] h-1.5 w-1.5 rounded-full bg-accent/70" />
                  </div>
                  <span className="absolute bottom-5 left-5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Learn · Explore · Build
                  </span>
                </div>
                <div className="relative flex min-w-0 flex-col justify-between p-5 sm:p-9 lg:order-1 lg:p-10">
                  <div>
                    <span className="chip rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-silver">
                      Workshop · Event workspace
                    </span>
                    <h3 className="mt-5 max-w-xl break-words font-display text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
                      Neural Networks from Scratch: The Math Behind the Magic
                    </h3>
                    <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Explore the workshop details, session workflow, agenda, and registration.
                    </p>
                    {featuredWorkshop?.event_date && (
                      <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-widest">
                        <time
                          dateTime={featuredWorkshop.event_date}
                          className="inline-flex items-center gap-1.5 text-muted-foreground"
                        >
                          <CalendarDays aria-hidden="true" size={12} />
                          {new Date(`${featuredWorkshop.event_date}T12:00:00`).toLocaleDateString(
                            "en-US",
                            { month: "long", day: "numeric", year: "numeric" },
                          )}
                        </time>
                        <EventDateStatus date={featuredWorkshop.event_date} />
                      </div>
                    )}
                  </div>
                  <Link
                    to="/events/workshop"
                    className="btn-primary mt-8 w-fit rounded-lg px-5 py-3 font-mono text-[10px] uppercase tracking-widest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-silver"
                  >
                    Explore workshop <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>
          </section>

          <section id="event-list" aria-labelledby="event-list-heading" className="scroll-mt-28">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-silver">
                    On the calendar
                  </p>
                  <h2
                    id="event-list-heading"
                    className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
                  >
                    Gather, learn, build.
                  </h2>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {events.length} {events.length === 1 ? "event" : "events"}
                </p>
              </div>
            </Reveal>

            <div className="mt-6 grid gap-4">
              {events.map((e, index) => {
                const isSih = e.slug === "sih-internal-hackathon";
                const eventDate = e.event_date ?? (isSih ? "2026-09-09" : null);
                const d = eventDate ? new Date(`${eventDate}T12:00:00`) : null;
                const day = isSih
                  ? "09"
                  : d
                    ? d.toLocaleDateString("en-US", { day: "2-digit" })
                    : "--";
                const mon = isSih
                  ? "SEP"
                  : d
                    ? d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
                    : "TBA";
                const open = openSlug === e.slug;
                const dateStatus = eventDate ? getEventDateStatus(eventDate) : null;

                return (
                  <Reveal key={e.id} delay={Math.min(index * 0.06, 0.24)}>
                    <SpotlightCard className="rounded-2xl bg-card">
                      <article className="min-w-0 p-5 sm:p-7">
                        <div className="grid min-w-0 gap-5 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[5rem_minmax(0,1fr)_auto] lg:items-start lg:gap-7">
                          <div className="flex h-fit w-fit min-w-16 flex-row items-center gap-2 rounded-xl border border-hairline bg-background/70 px-3 py-2 sm:flex-col sm:gap-0 sm:px-4 sm:py-3">
                            <span className="font-display text-3xl leading-none">{day}</span>
                            <span className="font-mono text-[10px] tracking-widest text-silver">
                              {mon}
                            </span>
                            <span className="hidden font-mono text-[9px] text-muted-foreground sm:block">
                              {isSih ? "2026" : d?.getFullYear()}
                            </span>
                          </div>

                          {e.cover_url && <EventCover src={e.cover_url} title={e.title} />}

                          <div className="min-w-0 break-words lg:col-start-2">
                            <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                              <span className="chip rounded-full px-2.5 py-1 text-silver">
                                {e.tag}
                              </span>
                              {isSih ? (
                                <>
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPin aria-hidden="true" size={12} />
                                    {SIH_2026_INTERNAL_VENUE}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock3 aria-hidden="true" size={12} />
                                    {SIH_2026_INTERNAL_TIME}
                                  </span>
                                </>
                              ) : (
                                <>
                                  {e.location && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <MapPin aria-hidden="true" size={12} />
                                      {e.location}
                                    </span>
                                  )}
                                  {e.start_time && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock3 aria-hidden="true" size={12} />
                                      {e.start_time}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            {dateStatus && eventDate && (
                              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-widest">
                                <time
                                  dateTime={eventDate}
                                  className="inline-flex items-center gap-1.5 text-muted-foreground"
                                >
                                  <CalendarDays aria-hidden="true" size={12} />
                                  {d?.toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </time>
                                <EventDateStatus date={eventDate} />
                              </div>
                            )}
                            <h3 className="mt-3 break-words font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                              {e.title}
                            </h3>
                            {isSih ? (
                              <>
                                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                                  Vertex is hosting REVA&apos;s internal selection for Smart India
                                  Hackathon 2026. Explore official problem statements and themes —
                                  register your team via the Microsoft Form.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] leading-relaxed text-muted-foreground sm:text-[10px]">
                                  <span>Deadline: {SIH_2026_REGISTRATION_DEADLINE}</span>
                                  <span>
                                    SPOC: {SIH_2026_CONTACT_NAME} — {SIH_2026_CONTACT_PHONE}
                                  </span>
                                </div>
                                <picture className="mt-4 block">
                                  <source
                                    srcSet="/sih-2026-logo-480.webp 480w, /sih-2026-logo-720.webp 720w"
                                    type="image/webp"
                                  />
                                  <img
                                    src="/sih-2026-logo.png"
                                    alt="Smart India Hackathon 2026"
                                    width={320}
                                    height={35}
                                    className="h-auto w-64"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </picture>
                              </>
                            ) : (
                              e.description && (
                                <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                  {e.description}
                                </p>
                              )
                            )}
                          </div>

                          <div className="sm:col-start-2 lg:col-start-3 lg:row-span-2">
                            {isSih ? (
                              <Link
                                to="/events/sih-internal-hackathon"
                                className="btn-primary inline-flex w-full flex-wrap items-center justify-center rounded-lg px-4 py-3 text-center font-mono text-[10px] uppercase tracking-widest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-silver sm:w-auto"
                              >
                                View SIH details <ArrowRight aria-hidden="true" size={14} />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                aria-expanded={open}
                                aria-controls={`registration-${e.id}`}
                                onClick={() => setOpenSlug(open ? null : e.slug)}
                                className="btn-ghost w-full flex-wrap justify-center rounded-lg px-4 py-3 font-mono text-[10px] uppercase tracking-widest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-silver sm:w-auto"
                              >
                                {open ? "Close registration" : "Register"}{" "}
                                <ArrowRight aria-hidden="true" size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {!isSih && (
                          <div
                            id={`registration-${e.id}`}
                            className={open ? "mt-5 border-t border-hairline pt-1" : "hidden"}
                          >
                            {open && (
                              <EventRegistrationForm
                                slug={e.slug}
                                onDone={(p) => {
                                  setPass(p);
                                  setOpenSlug(null);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                              />
                            )}
                          </div>
                        )}
                      </article>
                    </SpotlightCard>
                  </Reveal>
                );
              })}
              {events.length === 0 && (
                <div className="rounded-2xl border border-dashed border-hairline bg-card/50 px-6 py-12 text-center">
                  <CalendarDays aria-hidden="true" className="mx-auto text-silver" size={22} />
                  <p className="mt-4 font-display text-2xl font-semibold">
                    The calendar is taking shape.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Check back soon for the next Vertex gathering.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function EventCover({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-hairline bg-surface-2 sm:col-start-2 sm:row-start-2 lg:col-start-1 lg:row-start-2 lg:aspect-square">
      {!failed ? (
        <img
          src={src}
          alt={`${title} event`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="grid-backdrop flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_45%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_65%)]"
        >
          <span className="font-display text-6xl text-silver/70">V</span>
        </div>
      )}
    </div>
  );
}

function getEventDateStatus(date: string): "Past event" | "Upcoming" {
  const eventDate = new Date(`${date.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today ? "Past event" : "Upcoming";
}

function EventDateStatus({ date }: { date: string }) {
  const status = getEventDateStatus(date);

  return (
    <span
      className={`rounded-full px-2.5 py-1 ${
        status === "Upcoming" ? "bg-accent/10 text-silver" : "bg-secondary text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}
