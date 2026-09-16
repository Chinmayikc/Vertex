import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { ArrowUpRight, Award, BriefcaseBusiness, Github, Link2 } from "lucide-react";
import { motion } from "motion/react";
import { VertexLogo } from "@/components/VertexLogo";
import { Avatar } from "@/components/MemberCard";
import { SpotlightCard } from "@/components/SpotlightCard";
import { getDirectory } from "@/lib/club.functions";
import { getMemberExtras } from "@/lib/public.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/member/$slug")({
  loader: async ({ params }) => {
    const directory = await getDirectory();
    const member = directory.all.find((m) => m.slug === params.slug);
    if (!member) throw notFound();
    const teammates = directory.all
      .filter((m) => m.teamId === member.teamId && m.slug !== member.slug)
      .slice(0, 6);
    const extras = await getMemberExtras({ data: { slug: params.slug } });
    return { member, teammates, extras };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.member.name} — Vertex` },
          {
            name: "description",
            content: `${loaderData.member.name} · ${loaderData.member.team ?? "Vertex"} · ${loaderData.member.role}`,
          },
          { property: "og:title", content: `${loaderData.member.name} — Vertex` },
          {
            property: "og:description",
            content: `${loaderData.member.name} · ${loaderData.member.team ?? "Vertex"} · ${loaderData.member.role}`,
          },
          ...(loaderData.member.photo
            ? [{ property: "og:image", content: loaderData.member.photo }]
            : []),
          { name: "theme-color", content: "#0c0a09" },
          { property: "og:type", content: "profile" },
          { name: "twitter:card", content: "summary" },
        ]
      : [{ title: "Member — Vertex" }, { name: "robots", content: "noindex" }],
  }),
  component: MemberProfile,
  notFoundComponent: MemberNotFound,
  errorComponent: MemberNotFound,
});

function MemberNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          404 · Member
        </div>
        <h1 className="mt-4 font-display text-4xl">Not on the roster.</h1>
        <Link
          to="/"
          className="mt-8 inline-block border border-hairline px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:border-silver"
        >
          ← Back to Vertex
        </Link>
      </div>
    </div>
  );
}

function MemberProfile() {
  const { member, teammates, extras } = Route.useLoaderData();
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${member.name} — Vertex`,
          text: `${member.name} · ${member.team ?? "Vertex"}`,
          url,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="hairline-b sticky top-0 z-40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <VertexLogo className="h-6 w-auto" />
            <span className="font-display text-lg font-semibold tracking-tight">Vertex</span>
          </Link>
          <Link
            to="/"
            className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Roster
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-40" />
        <div className="relative mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="mb-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-silver" />
            {member.team ?? "Vertex"} · {member.isHead ? "Team Head" : member.role}
          </div>

          <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-start">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="flex items-start gap-6">
                <Avatar name={member.name} size={140} photo={member.photo} />
                <div className="pt-2">
                  <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
                    {member.name}
                  </h1>
                  <div className="mt-3 font-mono text-xs uppercase tracking-widest text-silver">
                    Vertex · {member.role}
                  </div>
                </div>
              </div>

              {member.bio && (
                <p className="mt-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  {member.bio}
                </p>
              )}

              {member.skills.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {member.skills.map((s) => (
                    <span
                      key={s}
                      className="border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-10 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-3">
                <Stat label="Team" value={member.team ?? "—"} />
                <Stat label="Role" value={member.isHead ? "Head" : member.role} />
                <Stat label="ID" value={member.slug.slice(0, 8).toUpperCase()} />
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <button
                  onClick={share}
                  className="border border-hairline px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-foreground transition-colors hover:border-silver hover:bg-card"
                >
                  Share profile
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(url)}
                  className="border border-hairline px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-silver hover:text-foreground"
                >
                  Copy link
                </button>
              </div>

              {Object.keys(member.links).length > 0 && (
                <div className="mt-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Elsewhere
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(member.links).map(([label, href]) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 border border-hairline px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-silver hover:text-foreground"
                      >
                        <SocialLinkIcon label={label} href={href} /> {socialLabel(label, href)}{" "}
                        <ArrowUpRight size={12} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* QR */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="glass-panel rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  QR · Scan to open
                </span>
                <span className="font-mono text-[10px] text-silver">
                  V.{member.slug.slice(0, 4).toUpperCase()}
                </span>
              </div>
              <div className="bg-white p-4">
                {url && (
                  <QRCodeSVG value={url} size={192} bgColor="#ffffff" fgColor="#000000" level="M" />
                )}
              </div>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Point a camera → land on this profile.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <BriefcaseBusiness size={13} /> Project work
            </div>
            <div className="mt-5 grid gap-2">
              {extras.projects.map((project) => (
                <SpotlightCard key={project.id}>
                  <Link
                    to="/projects"
                    className="group flex items-center justify-between border border-hairline bg-card/40 p-4 transition-colors hover:border-silver"
                  >
                    <span className="font-display text-lg">{project.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {project.year ?? ""} →
                    </span>
                  </Link>
                </SpotlightCard>
              ))}
              {extras.projects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Project work will appear here when it is credited in the club showcase.
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <Award size={13} /> Record
            </div>
            <div className="mt-5 grid gap-2">
              {extras.achievements.map((achievement) => (
                <SpotlightCard key={achievement.id}>
                  <div className="p-4">
                    <div className="font-display text-lg">{achievement.title}</div>
                    {achievement.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    )}
                  </div>
                </SpotlightCard>
              ))}
              {extras.badges.map((badge) => (
                <SpotlightCard key={badge.id}>
                  <div className="p-4">
                    <div className="font-display text-lg">{badge.name}</div>
                    {badge.note && (
                      <p className="mt-1 text-sm text-muted-foreground">{badge.note}</p>
                    )}
                  </div>
                </SpotlightCard>
              ))}
              {extras.achievements.length === 0 && extras.badges.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Achievements will appear here as the club records them.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {teammates.length > 0 && (
        <section className="hairline-t">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="mb-8 flex items-end justify-between gap-4 hairline-b pb-4">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Also on {member.team ?? "Vertex"}
                </div>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  Teammates
                </h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {teammates.map((m) => (
                <Link
                  key={m.slug}
                  to="/member/$slug"
                  params={{ slug: m.slug }}
                  className="flex items-center gap-4 border border-hairline bg-card/40 p-4 transition-colors hover:border-silver/50"
                >
                  <Avatar name={m.name} size={48} photo={m.photo} />
                  <div>
                    <div className="font-display text-base">{m.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {m.role}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function socialLabel(label: string, href: string) {
  const lower = `${label} ${href}`.toLowerCase();
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("github")) return "GitHub";
  if (lower.includes("instagram")) return "Instagram";
  if (lower.includes("twitter") || lower.includes("x.com")) return "X";
  if (lower.includes("portfolio") || lower.includes("website")) return "Portfolio";
  return label || "Link";
}

function SocialLinkIcon({ label, href }: { label: string; href: string }) {
  const lower = `${label} ${href}`.toLowerCase();
  if (lower.includes("github")) return <Github size={12} aria-hidden="true" />;
  if (lower.includes("twitter") || lower.includes("x.com")) return <XIcon />;
  return <Link2 size={12} aria-hidden="true" />;
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-4">
      <div className="font-display text-lg tracking-tight">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
