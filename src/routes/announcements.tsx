import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Pin } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Reveal } from "@/components/Reveal";
import { SpotlightCard } from "@/components/SpotlightCard";
import { getAnnouncements } from "@/lib/public.functions";

export const Route = createFileRoute("/announcements")({
  loader: () => getAnnouncements(),
  head: () => ({
    meta: [
      { title: "Announcements — Vertex — The Tech Club" },
      {
        name: "description",
        content:
          "Club-wide and per-team announcements from Vertex heads: deadlines, meets, calls for help.",
      },
      { property: "og:title", content: "Announcements — Vertex — The Tech Club" },
      {
        property: "og:description",
        content: "The Vertex announcement feed, straight from the team heads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnnouncementsPage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-mono text-sm text-muted-foreground">The feed couldn't load.</p>
    </div>
  ),
});

function AnnouncementsPage() {
  const { items, teams } = Route.useLoaderData();
  const [team, setTeam] = useState("all");
  const teamName = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const feed = items.filter((a) => team === "all" || (a.team_id ?? "club") === team);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-hairline">
          <div
            aria-hidden="true"
            className="absolute inset-0 grid-backdrop opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[oklch(0.78_0.08_145)]/20 blur-3xl sm:h-96 sm:w-96"
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
            <Reveal className="max-w-3xl">
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:text-[11px]">
                <span className="inline-block h-px w-8 bg-silver" />
                Vertex · The latest
              </div>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
                Notes from
                <br />
                <span className="text-silver">the club.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Updates, opportunities, and important news from across the Vertex community.
              </p>
            </Reveal>
          </div>
        </section>

        <section aria-label="Announcement feed" className="mx-auto max-w-5xl px-6 pb-20">
          <div className="sticky top-[5.5rem] z-20 -mx-2 mt-6 min-w-0 rounded-2xl border border-hairline bg-background/90 p-3 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:mx-0 sm:mt-8 sm:p-4">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Filter updates
                </p>
                <p aria-live="polite" className="mt-1 text-xs text-muted-foreground">
                  {feed.length} {feed.length === 1 ? "announcement" : "announcements"}
                </p>
              </div>
              <div
                role="group"
                aria-label="Filter announcements by team"
                className="flex min-w-0 max-w-full flex-wrap gap-2"
              >
                {[
                  { id: "all", name: "Everything" },
                  { id: "club", name: "Club-wide" },
                  ...teams,
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={team === t.id}
                    onClick={() => setTeam(t.id)}
                    className={`max-w-full break-words whitespace-normal rounded-full border px-3 py-2 text-left font-mono text-[9px] uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silver sm:px-4 ${
                      team === t.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-hairline bg-card text-muted-foreground hover:border-silver hover:text-foreground"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {feed.map((a, index) => (
              <Reveal key={a.id} delay={Math.min(index * 0.045, 0.22)}>
                <SpotlightCard
                  className={`rounded-2xl bg-card ${a.pinned ? "border-silver/40" : ""}`}
                >
                  <article
                    className={`relative p-5 sm:p-7 ${a.pinned ? "bg-[linear-gradient(125deg,color-mix(in_oklab,var(--accent)_5%,transparent),transparent_55%)]" : ""}`}
                  >
                    {a.pinned && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-1 bg-accent/70"
                      />
                    )}
                    <div className="flex flex-wrap items-center gap-2.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground sm:gap-3">
                      <span className="chip rounded-full px-3 py-1 text-silver">
                        {a.team_id ? (teamName.get(a.team_id) ?? a.team_id) : "Club-wide"}
                      </span>
                      <time dateTime={a.created_at}>
                        {new Date(a.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-silver">
                          <Pin aria-hidden="true" size={11} />
                          Pinned
                        </span>
                      )}
                    </div>
                    <h2 className="mt-4 break-words [overflow-wrap:anywhere] font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                      {a.title}
                    </h2>
                    <p className="mt-3 break-words whitespace-pre-line [overflow-wrap:anywhere] text-sm leading-7 text-muted-foreground sm:text-base">
                      {a.body}
                    </p>
                    {a.media_url && (
                      <AnnouncementMedia
                        src={a.media_url}
                        title={a.title}
                        video={a.media_type === "video"}
                      />
                    )}
                  </article>
                </SpotlightCard>
              </Reveal>
            ))}
            {feed.length === 0 && (
              <div className="rounded-2xl border border-dashed border-hairline bg-card/60 px-6 py-14 text-center">
                <Bell aria-hidden="true" className="mx-auto text-silver" size={23} />
                <h2 className="mt-4 font-display text-2xl font-semibold">
                  A little quiet for now.
                </h2>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Nothing posted here yet.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function AnnouncementMedia({ src, title, video }: { src: string; title: string; video: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="mt-6 w-full min-w-0 overflow-hidden rounded-xl border border-hairline bg-surface-2">
      {failed ? (
        <div className="flex min-h-36 items-center justify-center px-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Media preview unavailable
        </div>
      ) : video ? (
        <video
          src={src}
          controls
          preload="metadata"
          onError={() => setFailed(true)}
          aria-label={title}
          className="max-h-[34rem] max-w-full object-contain"
        />
      ) : (
        <img
          src={src}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="max-h-[34rem] max-w-full object-contain"
        />
      )}
    </div>
  );
}
