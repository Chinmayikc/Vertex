import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import {
  EventPassCard,
  EventRegistrationForm,
  type EventPass,
} from "@/components/EventRegistration";
import { getEvents } from "@/lib/club.functions";
import {
  SIH_2026_INTERNAL_DATES,
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
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [pass, setPass] = useState<EventPass | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-40" />
        <div className="relative mx-auto max-w-5xl px-6 py-20">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-silver" />
            Calendar · 2026
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            Events.
          </h1>

          {pass && <EventPassCard pass={pass} onClose={() => setPass(null)} />}

          <div className="mt-14 flex flex-col gap-px border border-hairline bg-hairline">
            <article className="bg-background p-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="border border-hairline px-2 py-0.5 text-silver">Workshop</span>
                    <span className="ml-2">· Event workspace</span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
                    Neural Networks from Scratch: The Math Behind the Magic
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Explore the workshop details, session workflow, agenda, and registration.
                  </p>
                </div>
                <Link
                  to="/events/workshop"
                  className="btn-primary rounded-lg px-4 py-2 font-mono text-[11px] uppercase tracking-widest"
                >
                  View workshop →
                </Link>
              </div>
            </article>
            {events.map((e) => {
              const isSih = e.slug === "sih-internal-hackathon";
              const d = e.event_date ? new Date(e.event_date) : null;
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

              if (isSih) {
                return (
                  <article key={e.id} className="min-w-0 bg-background p-4 sm:p-6">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
                      <div className="flex w-20 shrink-0 flex-col items-center border border-hairline p-3">
                        <div className="font-display text-3xl leading-none">{day}</div>
                        <div className="mt-1 font-mono text-[10px] tracking-widest text-silver">
                          {mon}
                        </div>
                        <div className="mt-2 font-mono text-[10px] text-muted-foreground">2026</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          <span className="border border-hairline px-2 py-0.5 text-silver">
                            {e.tag}
                          </span>
                          <span className="break-words">· {SIH_2026_INTERNAL_VENUE}</span>
                          <span className="whitespace-normal">· {SIH_2026_INTERNAL_TIME}</span>
                        </div>
                        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
                          {e.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                          Vertex is hosting REVA's internal selection for Smart India Hackathon
                          2026. Explore official problem statements and themes — register your team
                          via the Microsoft Form.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
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
                      </div>
                      <Link
                        to="/events/sih-internal-hackathon"
                        className="btn-primary mt-2 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 font-mono text-[11px] uppercase tracking-widest sm:mt-0 sm:w-auto sm:shrink-0"
                      >
                        View details →
                      </Link>
                    </div>
                  </article>
                );
              }

              return (
                <article key={e.id} className="min-w-0 bg-background p-4 sm:p-6">
                  <div className="flex flex-wrap items-start gap-6">
                    <div className="flex w-20 shrink-0 flex-col items-center border border-hairline p-3">
                      <div className="font-display text-3xl leading-none">{day}</div>
                      <div className="mt-1 font-mono text-[10px] tracking-widest text-silver">
                        {mon}
                      </div>
                      <div className="mt-2 font-mono text-[10px] text-muted-foreground">
                        {d ? d.getFullYear() : ""}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span className="border border-hairline px-2 py-0.5 text-silver">
                          {e.tag}
                        </span>
                        <span>· {e.location}</span>
                        {e.start_time && <span>· {e.start_time}</span>}
                      </div>
                      <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
                        {e.title}
                      </h2>
                      {e.description && (
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                          {e.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setOpenSlug(open ? null : e.slug)}
                      className="border border-hairline px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:border-silver"
                    >
                      {open ? "Close" : "Register →"}
                    </button>
                  </div>

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
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
