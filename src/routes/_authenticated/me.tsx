import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PhotoUpload } from "@/components/PhotoUpload";
import {
  myDashboard,
  updateMyProfile,
  myMentorships,
  respondMentorship,
} from "@/lib/member.functions";

export const Route = createFileRoute("/_authenticated/me")({
  loader: async () => {
    const [dashboard, mentorships] = await Promise.all([myDashboard(), myMentorships()]);
    return { dashboard, mentorships };
  },
  head: () => ({
    meta: [
      { title: "My profile — Vertex" },
      { name: "description", content: "Update your Vertex profile photo, bio, and skills." },
      { property: "og:title", content: "My profile — Vertex" },
      { property: "og:description", content: "Member dashboard for the Vertex technical club." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MePage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-mono text-sm text-muted-foreground">Your dashboard couldn't load.</p>
    </div>
  ),
});

function MePage() {
  const { dashboard, mentorships } = Route.useLoaderData();
  const router = useRouter();
  const save = useServerFn(updateMyProfile);
  const respond = useServerFn(respondMentorship);
  const member = dashboard.viewer.member;

  const [photo, setPhoto] = useState<string | null>(member?.photoUrl ?? null);
  const [bio, setBio] = useState(member?.bio ?? "");
  const [skills, setSkills] = useState((member?.skills ?? []).join(", "));
  const [links, setLinks] = useState(() => ({
    github: member?.links["github"] ?? "",
    linkedin: member?.links["linkedin"] ?? "",
    instagram: member?.links["instagram"] ?? "",
    website: member?.links["website"] ?? "",
  }));
  const [busy, setBusy] = useState(false);

  const attended = dashboard.attendance.filter((a) => a.checkedInAt).length;
  const badgeName = new Map(dashboard.badgeCatalog.map((b) => [b.id, b.name]));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="inline-block h-px w-8 bg-silver" />
          Member dashboard
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-6xl">
          {member ? member.name : dashboard.email}
        </h1>
        {dashboard.viewer.isAdmin || dashboard.viewer.isHead ? (
          <Link
            to="/admin"
            className="mt-6 inline-block border border-silver px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:opacity-80"
          >
            Open admin console →
          </Link>
        ) : null}

        {!member && (
          <p className="mt-8 border border-hairline bg-card/40 p-5 text-sm text-muted-foreground">
            Your account isn't linked to a roster entry yet. Ask an admin to link it from the admin
            console, then reload this page.
          </p>
        )}

        {member && (
          <>
            <section className="mt-12">
              <h2 className="font-display text-2xl font-semibold">Profile</h2>
              <form
                className="mt-6 grid gap-5 border border-hairline bg-card/40 p-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  try {
                    await save({
                      data: {
                        photoUrl: photo,
                        bio: bio.trim() || null,
                        skills: skills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                        links: Object.fromEntries(
                          Object.entries(links).filter(([, v]) => v.trim() !== ""),
                        ),
                      },
                    });
                    toast.success("Profile updated.");
                    await router.invalidate();
                  } catch {
                    toast.error("Could not save your profile.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <PhotoUpload value={photo} onChange={setPhoto} label="Profile photo" />

                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Bio
                  </span>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="resize-none border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Skills (comma separated)
                  </span>
                  <input
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  {(["github", "linkedin", "instagram", "website"] as const).map((k) => (
                    <label key={k} className="flex flex-col gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {k}
                      </span>
                      <input
                        value={links[k]}
                        onChange={(e) => setLinks({ ...links, [k]: e.target.value })}
                        className="border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none"
                      />
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-fit border border-silver bg-foreground px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-background disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save profile"}
                </button>
              </form>
            </section>

            <section className="mt-14 grid gap-6 md:grid-cols-[auto_1fr]">
              <div className="w-fit bg-white p-4">
                <QRCodeSVG
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/member/${member.slug}`
                      : `/member/${member.slug}`
                  }
                  size={148}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold">Your profile QR</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Any phone camera opens your public profile directly from this code. Print it,
                  stick it on a laptop, drop it in a slide.
                </p>
                <Link
                  to="/member/$slug"
                  params={{ slug: member.slug }}
                  className="mt-5 inline-block border border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:border-silver"
                >
                  View public profile →
                </Link>
              </div>
            </section>

            <section className="mt-14">
              <h2 className="font-display text-2xl font-semibold">Attendance</h2>
              <div className="mt-4 grid grid-cols-3 gap-px border border-hairline bg-hairline">
                <Stat label="Registered" value={String(dashboard.attendance.length)} />
                <Stat label="Checked in" value={String(attended)} />
                <Stat label="Badges" value={String(dashboard.badges.length)} />
              </div>
              <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
                {dashboard.attendance.map((a) => (
                  <div
                    key={a.code}
                    className="flex items-center justify-between gap-4 bg-background p-4"
                  >
                    <div>
                      <div className="font-display text-base">{a.event}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {a.date ? new Date(a.date).toDateString() : ""}
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest ${
                        a.checkedInAt ? "text-silver" : "text-muted-foreground"
                      }`}
                    >
                      {a.checkedInAt ? "Attended" : "Registered"}
                    </span>
                  </div>
                ))}
                {dashboard.attendance.length === 0 && (
                  <div className="bg-background p-4 font-mono text-xs text-muted-foreground">
                    No event registrations under {dashboard.email || "your email"} yet.
                  </div>
                )}
              </div>
            </section>

            {dashboard.badges.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-2xl font-semibold">Badges</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {dashboard.badges.map((b) => (
                    <span
                      key={b.badge_id}
                      className="border border-silver/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-silver"
                    >
                      {badgeName.get(b.badge_id) ?? b.badge_id}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-14">
              <h2 className="font-display text-2xl font-semibold">Mentorship</h2>
              <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
                {mentorships.map((r) => {
                  const incoming = r.mentor_id === member.id;
                  return (
                    <div key={r.id} className="flex flex-wrap items-center gap-4 bg-background p-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-base">{r.topic}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {incoming ? "Incoming request" : "You requested"} · {r.status}
                        </div>
                        {r.message && (
                          <p className="mt-2 text-sm text-muted-foreground">{r.message}</p>
                        )}
                      </div>
                      {incoming && r.status === "pending" && (
                        <div className="flex gap-2">
                          {(["accepted", "declined"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={async () => {
                                await respond({ data: { id: r.id, status: s } });
                                toast.success(`Request ${s}.`);
                                await router.invalidate();
                              }}
                              className="border border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:border-silver"
                            >
                              {s === "accepted" ? "Accept" : "Decline"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {mentorships.length === 0 && (
                  <div className="bg-background p-4 font-mono text-xs text-muted-foreground">
                    No mentorship requests yet.{" "}
                    <Link to="/members" className="text-silver">
                      Find a mentor →
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-5">
      <div className="font-display text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
