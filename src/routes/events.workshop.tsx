import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  EventPassCard,
  EventRegistrationForm,
  type EventPass,
} from "@/components/EventRegistration";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getEvents } from "@/lib/club.functions";

const sessionWorkflow = [
  "Introduction and Welcome",
  "Expert Session",
  "Live Demo — Mathematical Flowcharts Demo",
  "Q&A Discussion",
  "PPT",
];

type RegistrationAvailability = "ready" | "upcoming" | "unavailable";

export const Route = createFileRoute("/events/workshop")({
  loader: async (): Promise<RegistrationAvailability> => {
    try {
      const events = await getEvents();
      return events.some((event) => event.slug === "workshop") ? "ready" : "upcoming";
    } catch (error) {
      console.error("Unable to check Workshop registration availability.", error);
      return "unavailable";
    }
  },
  head: () => ({
    meta: [
      { title: "Workshop — Vertex" },
      { name: "description", content: "Explore the Vertex workshop agenda and registration." },
    ],
  }),
  component: WorkshopPage,
});

function WorkshopPage() {
  const registrationAvailability = Route.useLoaderData();
  const [pass, setPass] = useState<EventPass | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <Atmosphere />
          <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-16">
            <p className="chip w-fit rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
              Vertex · Workshop
            </p>
            <div className="mt-7 grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Learn · Explore · Build
                </p>
                <h1 className="text-silver-gradient mt-4 font-display text-5xl font-semibold leading-[0.9] tracking-[-0.055em] sm:text-7xl">
                  Workshop.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Join Mohammed Taswuff for an expert session, a live mathematical flowcharts demo,
                  and an open Q&amp;A.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="#agenda"
                    className="btn-primary rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Explore the agenda <ArrowRight size={15} />
                  </a>
                  <a
                    href="#registration"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Registration
                  </a>
                </div>
              </div>

              <aside
                aria-labelledby="workshop-information-heading"
                className="glass-panel edge-highlight rounded-2xl p-6"
              >
                <h2
                  id="workshop-information-heading"
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
                >
                  Workshop information
                </h2>
                <dl className="mt-5 grid gap-4 text-sm">
                  <InformationRow icon={<CalendarDays size={15} />} label="Date">
                    To be announced
                  </InformationRow>
                  <InformationRow icon={<Clock3 size={15} />} label="Time">
                    To be announced
                  </InformationRow>
                  <InformationRow icon={<MapPin size={15} />} label="Venue">
                    To be announced
                  </InformationRow>
                </dl>
                <div className="mt-5 border-t border-hairline pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Confirmed speaker
                  </p>
                  <p className="mt-1 font-display text-xl font-medium">Mohammed Taswuff</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section
          id="agenda"
          aria-labelledby="workshop-agenda-heading"
          className="border-b border-hairline"
        >
          <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <SectionLabel>01 · Session plan</SectionLabel>
                <h2
                  id="workshop-agenda-heading"
                  className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl"
                >
                  Workshop agenda
                </h2>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Five sessions · No times announced
              </p>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Workshop agenda will be announced soon.
            </p>

            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {sessionWorkflow.map((session, index) => (
                <li
                  key={session}
                  className="glass-panel edge-highlight flex min-h-40 flex-col justify-between rounded-2xl p-5"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
                    Session 0{index + 1}
                  </span>
                  <p className="mt-8 font-display text-lg leading-snug">{session}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="workshop-speaker-heading"
          className="border-b border-hairline bg-surface-2"
        >
          <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
            <div className="glass-panel edge-highlight grid gap-6 rounded-2xl p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
              <div
                aria-hidden="true"
                className="flex h-20 w-20 items-center justify-center rounded-2xl border border-hairline bg-background font-display text-2xl text-silver"
              >
                MT
              </div>
              <div>
                <SectionLabel>02 · Workshop speaker</SectionLabel>
                <h2
                  id="workshop-speaker-heading"
                  className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl"
                >
                  Mohammed Taswuff
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">Confirmed workshop speaker</p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="registration"
          aria-labelledby="registration-heading"
          className="border-b border-hairline"
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <SectionLabel>03 · Registration</SectionLabel>
              <h2
                id="registration-heading"
                className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl"
              >
                Registration
              </h2>
              {registrationAvailability === "ready" ? (
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                  Register for the Workshop using the form.
                </p>
              ) : (
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                  {registrationAvailability === "upcoming"
                    ? "Registration will open soon."
                    : "Registration availability could not be checked. Please try again later."}
                </p>
              )}
            </div>
            {pass ? (
              <div className="glass-panel edge-highlight rounded-2xl p-5 md:p-6">
                <EventPassCard pass={pass} onClose={() => setPass(null)} />
              </div>
            ) : registrationAvailability === "ready" ? (
              <div className="glass-panel edge-highlight rounded-2xl p-5 md:p-6">
                <EventRegistrationForm slug="workshop" onDone={setPass} />
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function InformationRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="inline-flex items-center gap-2 text-muted-foreground">
        <span className="text-silver">{icon}</span>
        {label}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">{children}</p>;
}
