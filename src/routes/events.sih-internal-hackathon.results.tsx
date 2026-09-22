import { createFileRoute } from "@tanstack/react-router";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Ticker } from "@/components/motion-kit";
import {
  SIH_2026_RESULTS,
  SIH_2026_RESULTS_ANNOUNCED_DATE,
  type Sih2026ResultTeam,
} from "@/data/sih-2026-results";

export const Route = createFileRoute("/events/sih-internal-hackathon/results")({
  loader: () => SIH_2026_RESULTS,
  head: () => ({
    meta: [
      { title: "Results — SIH Internal Hackathon — Vertex" },
      {
        name: "description",
        content:
          "The 90 nominated and 10 waitlisted teams from the SIH Internal Hackathon 2026 at REVA University.",
      },
      { property: "og:title", content: "Results — SIH Internal Hackathon — Vertex" },
      {
        property: "og:description",
        content:
          "The 90 nominated and 10 waitlisted teams representing REVA at SIH 2026.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const results = Route.useLoaderData();
  const nominated = results.filter((team) => team.section === "nominated");
  const waitlisted = results.filter((team) => team.section === "waitlisted");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <Atmosphere />
          <Ticker
            items={[
              "SIH Internal Hackathon 2026 · Results announced",
              "90 nominated teams · 10 waitlisted teams",
              "REVA University · SIH 2026",
            ]}
            className="relative"
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
            <div className="chip flex w-fit items-center gap-2 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
              <span className="h-1.5 w-1.5 rounded-full bg-silver" />
              Results announced
            </div>
            <h1 className="text-silver-gradient mt-8 font-display text-5xl font-semibold leading-[0.9] tracking-[-0.055em] md:text-7xl">
              SIH Internal Hackathon 2026
              <br />
              Results.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              The top 100 teams nominated to represent REVA at SIH 2026, announced on {SIH_2026_RESULTS_ANNOUNCED_DATE}.
            </p>
          </div>
        </section>

        <section className="relative">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <ResultGroup title="90 Nominated Teams" teams={nominated} />
            <ResultGroup title="10 Waitlisted Teams" teams={waitlisted} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ResultGroup({ title, teams }: { title: string; teams: Sih2026ResultTeam[] }) {
  return (
    <Reveal className="mb-16 last:mb-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {teams.length} teams
        </span>
      </div>
      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {teams.map((team, index) => (
          <Reveal key={`${team.section}-${team.rank}-${team.teamNumber}`} delay={Math.min(index * 0.015, 0.45)}>
            <article className="bg-background p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                <div className="flex min-w-0 items-baseline gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {String(team.rank).padStart(2, "0")}
                  </span>
                  <h3 className="min-w-0 font-display text-2xl font-semibold leading-tight">
                    {team.teamName}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="border border-hairline px-2 py-0.5">Team {team.teamNumber}</span>
                  <span className="border border-hairline px-2 py-0.5">{team.teamLeaderName}</span>
                  <span className="border border-hairline px-2 py-0.5">{team.psid}</span>
                  <span className="border border-hairline px-2 py-0.5">{team.category}</span>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Reveal>
  );
}
