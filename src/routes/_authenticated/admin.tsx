import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PhotoUpload } from "@/components/PhotoUpload";
import { QRScanner } from "@/components/QRScanner";
import {
  adminOverview,
  awardBadge,
  checkInByCode,
  deleteAnnouncement,
  deleteMember,
  saveAnnouncement,
  saveEvent,
  saveMember,
  saveProject,
  setApplicationStatus,
} from "@/lib/admin.functions";
import { checkInHackathonTeam, reissueHackathonTeamKey } from "@/lib/hackathon.functions";
import {
  reopenHackathonSubmission,
  toggleHackathonShowcase,
  assignHackathonMentor,
  saveHackathonWorkspace,
  getJudging,
  saveJudgingScore,
} from "@/lib/hackathon.functions";
import { listStaffRoles, setUserRole } from "@/lib/admin-users.functions";
import {
  issueStaffInvite,
  listMentorshipRequests,
  listStaffInvites,
  revokeStaffInvite,
} from "@/lib/staff.functions";
import {
  hackathonAdmin,
  saveHackathonProblemStatement,
  setHackathonTeamStatus,
} from "@/lib/hackathon.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  loader: () => adminOverview(),
  head: () => ({
    meta: [
      { title: "Admin console — Vertex" },
      {
        name: "description",
        content: "Manage the Vertex roster, events, projects, and door check-in.",
      },
      { property: "og:title", content: "Admin console — Vertex" },
      { property: "og:description", content: "Vertex staff tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <p className="max-w-sm text-center font-mono text-sm text-muted-foreground">
        This console is for team heads and admins only.
      </p>
    </div>
  ),
});

const TABS = [
  "Check-in",
  "SIH",
  "Judging",
  "Applications",
  "Members",
  "People",
  "Events",
  "Projects",
  "Announcements",
] as const;
type Tab = (typeof TABS)[number];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

function AdminPage() {
  const data = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("Check-in");
  const isAdmin = data.viewer.isAdmin;
  const isJudgeOnly = data.viewer.isJudge && !data.viewer.isAdmin && !data.viewer.isHead;

  if (isJudgeOnly) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-silver" />
            Judge console
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-6xl">
            Score the teams.
          </h1>
          <div className="mt-10">
            <Judging />
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="inline-block h-px w-8 bg-silver" />
          {isAdmin ? "Admin" : "Team head"} console
          {data.viewer.isJudge ? " · judge" : ""}
          {data.viewer.isMentor ? " · mentor" : ""}
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-6xl">
          Control room.
        </h1>

        <div className="mt-6 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
          <Stat label="Applications" value={String(data.applications.length)} />
          <Stat label="Members" value={String(data.members.length)} />
          <Stat label="Registrations" value={String(data.registrations.length)} />
          <Stat
            label="Checked in"
            value={String(data.registrations.filter((r) => r.checked_in_at).length)}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.filter(
            (t) =>
              isAdmin ||
              t === "Check-in" ||
              t === "SIH" ||
              t === "Judging" ||
              t === "Applications" ||
              t === "Announcements",
          ).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
                tab === t
                  ? "border-silver text-foreground"
                  : "border-hairline text-muted-foreground hover:border-silver"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "Check-in" && (
            <CheckIn registrations={data.registrations} events={data.events} />
          )}
          {tab === "SIH" && <SihOperations isAdmin={isAdmin} />}
          {tab === "Judging" && <Judging />}
          {tab === "People" && isAdmin && <People />}
          {tab === "Applications" && <Applications rows={data.applications} />}
          {tab === "Members" && <Members members={data.members} teams={data.teams} />}
          {tab === "Events" && <Events events={data.events} />}
          {tab === "Projects" && <Projects projects={data.projects} members={data.members} />}
          {tab === "Announcements" && (
            <Announcements
              rows={data.announcements}
              teams={data.teams}
              isAdmin={isAdmin}
              headTeams={data.viewer.headTeams}
            />
          )}
        </div>
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

const field =
  "border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none";
const btn =
  "border border-silver bg-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-background disabled:opacity-50";
const ghost =
  "border border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:border-silver";

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {text}
      </span>
      {children}
    </label>
  );
}

/* ---------------- SIH operations ---------------- */

function SihOperations({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const load = useServerFn(hackathonAdmin);
  const saveStatement = useServerFn(saveHackathonProblemStatement);
  const setStatus = useServerFn(setHackathonTeamStatus);
  const saveWorkspace = useServerFn(saveHackathonWorkspace);
  const reissueKey = useServerFn(reissueHackathonTeamKey);
  const reopenSub = useServerFn(reopenHackathonSubmission);
  const toggleShowcase = useServerFn(toggleHackathonShowcase);
  const assignMentor = useServerFn(assignHackathonMentor);
  const [data, setData] = useState<Awaited<ReturnType<typeof hackathonAdmin>> | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setData(await load());
    } catch {
      toast.error("Could not load SIH operations.");
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const [psQuery, setPsQuery] = useState("");
  const [psTheme, setPsTheme] = useState("");
  const [psCategory, setPsCategory] = useState("");
  const [psLimit, setPsLimit] = useState(30);

  if (!data) {
    return <p className="font-mono text-xs text-muted-foreground">Loading SIH operations…</p>;
  }

  const checkedIn = new Set(data.checkins.map((entry) => entry.team_id));
  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
        <Stat label="Teams" value={String(data.teams.length)} />
        <Stat label="Students" value={String(data.members.length)} />
        <Stat
          label="Final submissions"
          value={String(data.submissions.filter((entry) => entry.status === "final").length)}
        />
        <Stat label="Checked in" value={String(checkedIn.size)} />
      </div>

      {data.workspace && (
        <section className="border border-hairline bg-card/40 p-6">
          <div className="font-display text-xl">Workspace controls</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Gates for the whole hackathon. Close registration when slots fill; open submissions for
            the build window.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className={data.workspace.registration_open ? btn : ghost}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await saveWorkspace({
                    data: {
                      registrationOpen: !data.workspace!.registration_open,
                      submissionsOpen: data.workspace!.submissions_open,
                      rules: data.workspace!.rules ?? "",
                    },
                  });
                  toast.success(
                    `Registration ${data.workspace!.registration_open ? "closed" : "opened"}.`,
                  );
                  await refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Registration: {data.workspace.registration_open ? "OPEN" : "CLOSED"}
            </button>
            <button
              className={data.workspace.submissions_open ? btn : ghost}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await saveWorkspace({
                    data: {
                      registrationOpen: data.workspace!.registration_open,
                      submissionsOpen: !data.workspace!.submissions_open,
                      rules: data.workspace!.rules ?? "",
                    },
                  });
                  toast.success(
                    `Submissions ${data.workspace!.submissions_open ? "closed" : "opened"}.`,
                  );
                  await refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Submissions: {data.workspace.submissions_open ? "OPEN" : "CLOSED"}
            </button>
          </div>
        </section>
      )}

      <section className="border border-hairline bg-card/40 p-6">
        <div className="font-display text-xl">Teams</div>
        <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
          {data.teams.map((team) => {
            const roster = data.members.filter((member) => member.team_id === team.id);
            const submission = data.submissions.find((entry) => entry.team_id === team.id);
            const lead = roster.find((member) => member.is_lead);
            return (
              <div key={team.id} className="bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-lg">{team.name}</div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {roster.length}/6 students ·{" "}
                      {checkedIn.has(team.id) ? "checked in" : "not checked in"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {roster
                        .map((member) => `${member.name}${member.is_lead ? " (lead)" : ""}`)
                        .join(", ")}
                    </p>
                    {lead && (
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                        lead: {lead.email}
                        {lead.phone ? ` · ${lead.phone}` : ""}
                      </p>
                    )}
                    {team.mentor_name && (
                      <p className="mt-1 font-mono text-[10px] text-silver">
                        mentor: {team.mentor_name}
                        {team.mentor_email ? ` · ${team.mentor_email}` : ""}
                      </p>
                    )}
                    {submission?.solution_title && (
                      <div className="mt-2 border border-hairline p-3 text-xs">
                        <p className="text-silver">
                          {submission.solution_title} · {submission.status}
                          {submission.finalized_at ? " · final" : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-widest">
                          {submission.deck_path && (
                            <a
                              href={`/api/public/media/${submission.deck_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-silver hover:text-foreground"
                            >
                              Open deck PDF
                            </a>
                          )}
                          {submission.repository_url && (
                            <a
                              href={submission.repository_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-silver hover:text-foreground"
                            >
                              Repository
                            </a>
                          )}
                          {submission.demo_url && (
                            <a
                              href={submission.demo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-silver hover:text-foreground"
                            >
                              Demo
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <select
                    value={team.status}
                    onChange={async (event) => {
                      try {
                        await setStatus({
                          data: { id: team.id, status: event.target.value as "registered" },
                        });
                        toast.success("Team status updated.");
                        await refresh();
                        await router.invalidate();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Could not update team status.",
                        );
                      }
                    }}
                    className={field}
                  >
                    {[
                      "registered",
                      "in_review",
                      "shortlisted",
                      "selected",
                      "waitlisted",
                      "rejected",
                      "withdrawn",
                    ].map((status) => (
                      <option key={status} value={status} className="bg-background">
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    className={ghost}
                    onClick={() => exportTeamsCsv(data.teams, data.members, data.submissions)}
                  >
                    Export CSV
                  </button>
                  <button
                    className={ghost}
                    onClick={async () => {
                      const name = window.prompt(
                        `Mentor name for ${team.name}`,
                        team.mentor_name ?? "",
                      );
                      if (name === null) return;
                      const email =
                        window.prompt("Mentor email (optional)", team.mentor_email ?? "") ?? "";
                      try {
                        await assignMentor({
                          data: { teamId: team.id, mentorName: name, mentorEmail: email },
                        });
                        toast.success("Mentor saved.");
                        await refresh();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Could not save mentor.",
                        );
                      }
                    }}
                  >
                    {team.mentor_name ? "Edit mentor" : "Assign mentor"}
                  </button>
                  <button
                    className={ghost}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Reissue the private team key for ${team.name}? The old key stops working.`,
                        )
                      )
                        return;
                      try {
                        const result = await reissueKey({ data: { teamId: team.id } });
                        await navigator.clipboard.writeText(result.token);
                        toast.success("New team key copied to clipboard — hand it to the lead.");
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Could not reissue key.",
                        );
                      }
                    }}
                  >
                    Reissue team key
                  </button>
                  {submission?.finalized_at && (
                    <>
                      {isAdmin && (
                        <button
                          className={ghost}
                          onClick={async () => {
                            if (!window.confirm(`Reopen the finalized submission of ${team.name}?`))
                              return;
                            try {
                              await reopenSub({ data: { teamId: team.id } });
                              toast.success("Submission reopened.");
                              await refresh();
                            } catch (error) {
                              toast.error(
                                error instanceof Error ? error.message : "Could not reopen.",
                              );
                            }
                          }}
                        >
                          Reopen submission
                        </button>
                      )}
                      <button
                        className={ghost}
                        onClick={async () => {
                          try {
                            await toggleShowcase({
                              data: { teamId: team.id, published: !submission.published },
                            });
                            toast.success(
                              submission.published
                                ? "Removed from showcase."
                                : "Published to showcase.",
                            );
                            await refresh();
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "Could not update showcase.",
                            );
                          }
                        }}
                      >
                        {submission.published ? "Unpublish showcase" : "Publish to showcase"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {data.teams.length === 0 && (
            <div className="bg-background p-4 text-sm text-muted-foreground">
              No SIH teams registered yet.
            </div>
          )}
        </div>
      </section>

      {isAdmin && (
        <StatementsAdmin
          statements={data.statements}
          saveStatement={saveStatement}
          refresh={refresh}
          busy={busy}
          setBusy={setBusy}
          filters={{
            query: psQuery,
            setQuery: setPsQuery,
            theme: psTheme,
            setTheme: setPsTheme,
            category: psCategory,
            setCategory: setPsCategory,
            limit: psLimit,
            setLimit: setPsLimit,
          }}
        />
      )}
    </div>
  );
}

function StatementsAdmin({
  statements,
  saveStatement,
  refresh,
  busy,
  setBusy,
  filters,
}: {
  statements: {
    id: string;
    statement_code: string;
    title: string;
    organization: string | null;
    category: string | null;
    theme: string | null;
    description: string | null;
    source_url: string | null;
    source_version: string | null;
    published: boolean;
    sort_order: number;
  }[];
  saveStatement: ReturnType<typeof useServerFn<typeof saveHackathonProblemStatement>>;
  refresh: () => Promise<void>;
  busy: boolean;
  setBusy: (value: boolean) => void;
  filters: {
    query: string;
    setQuery: (value: string) => void;
    theme: string;
    setTheme: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    limit: number;
    setLimit: (value: number) => void;
  };
}) {
  const themes = [
    ...new Set(statements.map((s) => s.theme).filter((t): t is string => Boolean(t))),
  ].sort();
  const filtered = statements.filter((statement) => {
    if (filters.category && statement.category !== filters.category) return false;
    if (filters.theme && statement.theme !== filters.theme) return false;
    if (filters.query) {
      const haystack =
        `${statement.statement_code} ${statement.title} ${statement.organization ?? ""}`.toLowerCase();
      if (!haystack.includes(filters.query.toLowerCase())) return false;
    }
    return true;
  });
  const visible = filtered.slice(0, filters.limit);

  return (
    <section className="grid gap-5 border border-hairline bg-card/40 p-6">
      <div>
        <div className="font-display text-xl">Official problem statements</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {statements.length} seeded from sih.gov.in. Toggle publishing below; add missing ones with
          the form.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={filters.query}
          onChange={(event) => filters.setQuery(event.target.value)}
          placeholder="Search code, title, ministry…"
          className={`${field} min-w-[200px] flex-1`}
        />
        <select
          value={filters.theme}
          onChange={(event) => filters.setTheme(event.target.value)}
          className={field}
        >
          <option value="" className="bg-background">
            All themes
          </option>
          {themes.map((theme) => (
            <option key={theme} value={theme} className="bg-background">
              {theme}
            </option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(event) => filters.setCategory(event.target.value)}
          className={field}
        >
          <option value="" className="bg-background">
            Software + Hardware
          </option>
          <option value="Software" className="bg-background">
            Software
          </option>
          <option value="Hardware" className="bg-background">
            Hardware
          </option>
        </select>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {filtered.length} / {statements.length}
        </span>
      </div>

      <div className="flex max-h-[420px] flex-col gap-px overflow-y-auto border border-hairline bg-hairline">
        {visible.map((statement) => (
          <div
            key={statement.id}
            className="flex flex-wrap items-center justify-between gap-3 bg-background p-3 text-sm"
          >
            <div className="min-w-0">
              <span className="font-mono text-[10px] text-silver">{statement.statement_code}</span>
              <span className="ml-2">{statement.title}</span>
              <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {statement.category === "Hardware" ? "HW" : "SW"}
                {statement.theme ? ` · ${statement.theme}` : ""}
              </span>
            </div>
            <button
              className={ghost}
              onClick={async () => {
                try {
                  await saveStatement({
                    data: {
                      id: statement.id,
                      statementCode: statement.statement_code,
                      title: statement.title,
                      organization: statement.organization,
                      category: statement.category,
                      theme: statement.theme,
                      description: statement.description,
                      sourceUrl: statement.source_url,
                      sourceVersion: statement.source_version,
                      published: !statement.published,
                      sortOrder: statement.sort_order,
                    },
                  });
                  toast.success(statement.published ? "Unpublished." : "Published to teams.");
                  await refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update.");
                }
              }}
            >
              {statement.published ? "Unpublish" : "Publish"}
            </button>
          </div>
        ))}
      </div>
      {filtered.length > visible.length && (
        <button className={`${ghost} w-fit`} onClick={() => filters.setLimit(filters.limit + 60)}>
          Show more ({filtered.length - visible.length} remaining)
        </button>
      )}

      <div>
        <div className="font-display text-lg">Add a statement manually</div>
      </div>
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = new FormData(form);
          setBusy(true);
          try {
            await saveStatement({
              data: {
                statementCode: String(values.get("code") ?? ""),
                title: String(values.get("title") ?? ""),
                organization: String(values.get("organization") ?? "") || null,
                category: String(values.get("category") ?? "") || null,
                theme: String(values.get("theme") ?? "") || null,
                description: String(values.get("description") ?? "") || null,
                sourceUrl: String(values.get("sourceUrl") ?? "") || null,
                sourceVersion: String(values.get("sourceVersion") ?? "") || null,
                published: values.get("published") === "on",
                sortOrder: Number(values.get("sortOrder") ?? 0),
              },
            });
            toast.success("Problem statement saved.");
            form.reset();
            await refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save statement.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input name="code" required placeholder="Problem statement code" className={field} />
        <input name="title" required placeholder="Official title" className={field} />
        <input name="organization" placeholder="Organisation" className={field} />
        <input name="theme" placeholder="Official theme" className={field} />
        <input name="category" placeholder="Category" className={field} />
        <input name="sourceUrl" type="url" placeholder="Official source URL" className={field} />
        <input name="sourceVersion" placeholder="Source version / release" className={field} />
        <input name="sortOrder" type="number" min="0" defaultValue="0" className={field} />
        <textarea
          name="description"
          placeholder="Official description"
          rows={4}
          className={`${field} resize-none md:col-span-2`}
        />
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <input type="checkbox" name="published" /> Publish to teams
        </label>
        <button className={`${btn} w-fit`} disabled={busy}>
          {busy ? "Saving…" : "Save statement"}
        </button>
      </form>
    </section>
  );
}

/* ---------------- check-in ---------------- */

function CheckIn({
  registrations,
  events,
}: {
  registrations: {
    id: string;
    event_id: string;
    name: string;
    email: string;
    checked_in_at: string | null;
  }[];
  events: { id: string; title: string }[];
}) {
  const router = useRouter();
  const scan = useServerFn(checkInByCode);
  const scanSih = useServerFn(checkInHackathonTeam);
  const [result, setResult] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "warn" | "bad">("ok");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");

  const rows = registrations.filter((r) => r.event_id === eventId);
  const done = rows.filter((r) => r.checked_in_at).length;

  const processCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    try {
      if (code.toUpperCase().includes("VTX-SIH:")) {
        const res = await scanSih({ data: { code } });
        if (res.status === "ok") {
          setTone("ok");
          setResult(`✓ ${res.team} checked in · ${res.members.map((m) => m.name).join(", ")}`);
        } else if (res.status === "already") {
          setTone("warn");
          setResult(
            `! ${res.team} already checked in · ${res.members.map((m) => m.name).join(", ")}`,
          );
        } else {
          setTone("bad");
          setResult("✗ Unknown SIH team code");
        }
      } else {
        const res = await scan({ data: { code } });
        if (res.status === "ok") {
          setTone("ok");
          setResult(`✓ ${res.name} checked in · ${res.event}`);
        } else if (res.status === "already") {
          setTone("warn");
          setResult(`! ${res.name} already checked in`);
        } else {
          setTone("bad");
          setResult("✗ Unknown pass code");
        }
      }
    } catch {
      setTone("bad");
      setResult("✗ Check-in failed");
    }
    await router.invalidate();
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        <QRScanner onResult={(text) => void processCode(text)} />
        <div className="space-y-4">
          <form
            className="flex flex-wrap items-end gap-3 border border-hairline bg-card/40 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const code = String(new FormData(form).get("code") ?? "");
              void processCode(code).then(() => form.reset());
            }}
          >
            <Label text="Pass code or scanned URL">
              <input
                name="code"
                required
                className={`${field} w-80`}
                placeholder="Type or paste…"
              />
            </Label>
            <button className={btn}>Check in</button>
          </form>
          {result && (
            <div
              className={`rounded-xl border p-4 font-mono text-sm leading-6 ${
                tone === "ok"
                  ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
                  : tone === "warn"
                    ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                    : "border-red-400/40 bg-red-400/10 text-red-300"
              }`}
            >
              {result}
            </div>
          )}
          <p className="max-w-md font-mono text-[10px] uppercase leading-5 tracking-widest text-muted-foreground">
            Point the camera at a team's check-in QR. The same scan is ignored for a few seconds;
            duplicates show as a warning instead of an error.
          </p>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Label text="Event">
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={field}>
              {events.map((e) => (
                <option key={e.id} value={e.id} className="bg-background">
                  {e.title}
                </option>
              ))}
            </select>
          </Label>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {done} / {rows.length} attended
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-4 bg-background p-3">
              <div>
                <div className="font-display text-sm">{r.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{r.email}</div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                {r.checked_in_at ? "In" : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- applications ---------------- */

function Applications({
  rows,
}: {
  rows: {
    id: string;
    name: string;
    email: string;
    team_first: string | null;
    team_second: string | null;
    why: string | null;
    status: string;
    notes: string | null;
  }[];
}) {
  const router = useRouter();
  const update = useServerFn(setApplicationStatus);

  return (
    <div className="flex flex-col gap-px border border-hairline bg-hairline">
      {rows.map((a) => (
        <div key={a.id} className="bg-background p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg">{a.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {a.email} · {a.team_first ?? "—"} / {a.team_second ?? "—"} · {a.status}
              </div>
            </div>
            <div className="flex gap-2">
              {(["shortlisted", "accepted", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  className={ghost}
                  onClick={async () => {
                    try {
                      await update({ data: { id: a.id, status: s, notes: a.notes } });
                      toast.success(`Marked ${s}.`);
                      await router.invalidate();
                    } catch {
                      toast.error("Could not update.");
                    }
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {a.why && <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{a.why}</p>}
        </div>
      ))}
      {rows.length === 0 && (
        <div className="bg-background p-6 font-mono text-xs text-muted-foreground">
          No applications yet.
        </div>
      )}
    </div>
  );
}

/* ---------------- members ---------------- */

type MemberRow = {
  id: string;
  slug: string;
  name: string;
  role: string;
  team_id: string | null;
  is_head: boolean;
  is_leadership: boolean;
  photo_url: string | null;
  bio: string | null;
  skills: string[] | null;
  links: unknown;
  sort_order: number;
};

function Members({
  members,
  teams,
}: {
  members: MemberRow[];
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const save = useServerFn(saveMember);
  const remove = useServerFn(deleteMember);
  const award = useServerFn(awardBadge);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (m: MemberRow | null) => {
    setEditing(
      m ??
        ({
          id: "",
          slug: "",
          name: "",
          role: "Member",
          team_id: teams[0]?.id ?? null,
          is_head: false,
          is_leadership: false,
          photo_url: null,
          bio: null,
          skills: [],
          links: {},
          sort_order: 0,
        } as MemberRow),
    );
    setPhoto(m?.photo_url ?? null);
  };

  return (
    <div className="grid gap-8">
      <button className={btn} onClick={() => open(null)}>
        + Add member
      </button>

      {editing && (
        <form
          className="grid gap-4 border border-hairline bg-card/40 p-6 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name") ?? "");
            setBusy(true);
            try {
              await save({
                data: {
                  ...(editing.id ? { id: editing.id } : {}),
                  name,
                  slug: String(f.get("slug") ?? "") || slugify(name),
                  role: String(f.get("role") ?? "Member"),
                  teamId: String(f.get("team") ?? "") || null,
                  isHead: f.get("isHead") === "on",
                  isLeadership: f.get("isLeadership") === "on",
                  photoUrl: photo,
                  bio: String(f.get("bio") ?? "") || null,
                  skills: String(f.get("skills") ?? "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  links: {},
                  sortOrder: Number(f.get("sortOrder") ?? 0),
                },
              });
              toast.success("Member saved.");
              setEditing(null);
              await router.invalidate();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="md:col-span-2">
            <PhotoUpload value={photo} onChange={setPhoto} label="Member photo" />
          </div>
          <Label text="Name">
            <input name="name" required defaultValue={editing.name} className={field} />
          </Label>
          <Label text="Profile link name (slug)">
            <input
              name="slug"
              defaultValue={editing.slug}
              placeholder="auto from name"
              className={field}
            />
          </Label>
          <Label text="Role">
            <input name="role" required defaultValue={editing.role} className={field} />
          </Label>
          <Label text="Team">
            <select name="team" defaultValue={editing.team_id ?? ""} className={field}>
              <option value="" className="bg-background">
                Leadership / none
              </option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} className="bg-background">
                  {t.name}
                </option>
              ))}
            </select>
          </Label>
          <Label text="Skills (comma separated)">
            <input
              name="skills"
              defaultValue={(editing.skills ?? []).join(", ")}
              className={field}
            />
          </Label>
          <Label text="Sort order">
            <input
              name="sortOrder"
              type="number"
              defaultValue={editing.sort_order}
              className={field}
            />
          </Label>
          <Label text="Bio">
            <textarea
              name="bio"
              rows={3}
              defaultValue={editing.bio ?? ""}
              className={`${field} md:col-span-2 resize-none`}
            />
          </Label>
          <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isHead" defaultChecked={editing.is_head} /> Team head
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isLeadership" defaultChecked={editing.is_leadership} />{" "}
              Leadership
            </label>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button className={btn} disabled={busy}>
              {busy ? "Saving…" : "Save member"}
            </button>
            <button type="button" className={ghost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {members.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-4 bg-background p-4">
            <div className="min-w-0 flex-1">
              <div className="font-display text-base">{m.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {m.role} · {teams.find((t) => t.id === m.team_id)?.name ?? "Leadership"} · /{m.slug}
              </div>
            </div>
            <button className={ghost} onClick={() => open(m)}>
              Edit
            </button>
            <button
              className={ghost}
              onClick={async () => {
                const badgeId = window.prompt(
                  "Badge id (founder, team-head, hackathon-win, shipper, regular, mentor)",
                );
                if (!badgeId) return;
                try {
                  await award({ data: { memberId: m.id, badgeId, note: null } });
                  toast.success("Badge awarded.");
                } catch {
                  toast.error("Could not award badge.");
                }
              }}
            >
              Badge
            </button>
            <button
              className={ghost}
              onClick={async () => {
                if (!window.confirm(`Remove ${m.name}?`)) return;
                try {
                  await remove({ data: { id: m.id } });
                  toast.success("Member removed.");
                  await router.invalidate();
                } catch {
                  toast.error("Could not remove.");
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- events ---------------- */

type EventRow = {
  id: string;
  slug: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  location: string;
  tag: string;
  description: string | null;
  cover_url: string | null;
  capacity: number | null;
  published: boolean;
};

function Events({ events }: { events: EventRow[] }) {
  const router = useRouter();
  const save = useServerFn(saveEvent);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (e: EventRow | null) => {
    setEditing(
      e ??
        ({
          id: "",
          slug: "",
          title: "",
          event_date: new Date().toISOString().slice(0, 10),
          start_time: "",
          location: "TBA",
          tag: "Event",
          description: "",
          cover_url: null,
          capacity: null,
          published: true,
        } as EventRow),
    );
    setCover(e?.cover_url ?? null);
  };

  return (
    <div className="grid gap-8">
      <button className={btn} onClick={() => open(null)}>
        + Add event
      </button>

      {editing && (
        <form
          className="grid gap-4 border border-hairline bg-card/40 p-6 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const title = String(f.get("title") ?? "");
            setBusy(true);
            try {
              await save({
                data: {
                  ...(editing.id ? { id: editing.id } : {}),
                  title,
                  slug: String(f.get("slug") ?? "") || slugify(title),
                  eventDate: String(f.get("date") ?? ""),
                  startTime: String(f.get("time") ?? "") || null,
                  location: String(f.get("location") ?? "TBA"),
                  tag: String(f.get("tag") ?? "Event"),
                  description: String(f.get("description") ?? "") || null,
                  coverUrl: cover,
                  capacity: f.get("capacity") ? Number(f.get("capacity")) : null,
                  published: f.get("published") === "on",
                },
              });
              toast.success("Event saved.");
              setEditing(null);
              await router.invalidate();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="md:col-span-2">
            <PhotoUpload value={cover} onChange={setCover} folder="events" label="Cover image" />
          </div>
          <Label text="Title">
            <input name="title" required defaultValue={editing.title} className={field} />
          </Label>
          <Label text="Link name (slug)">
            <input
              name="slug"
              defaultValue={editing.slug}
              placeholder="auto from title"
              className={field}
            />
          </Label>
          <Label text="Date">
            <input
              name="date"
              type="date"
              required
              defaultValue={editing.event_date ?? ""}
              className={field}
            />
          </Label>
          <Label text="Start time">
            <input name="time" defaultValue={editing.start_time ?? ""} className={field} />
          </Label>
          <Label text="Location">
            <input name="location" required defaultValue={editing.location} className={field} />
          </Label>
          <Label text="Tag">
            <input name="tag" required defaultValue={editing.tag} className={field} />
          </Label>
          <Label text="Capacity">
            <input
              name="capacity"
              type="number"
              defaultValue={editing.capacity ?? ""}
              className={field}
            />
          </Label>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <input type="checkbox" name="published" defaultChecked={editing.published} /> Published
          </label>
          <Label text="Description">
            <textarea
              name="description"
              rows={3}
              defaultValue={editing.description ?? ""}
              className={`${field} resize-none md:col-span-2`}
            />
          </Label>
          <div className="flex gap-2 md:col-span-2">
            <button className={btn} disabled={busy}>
              {busy ? "Saving…" : "Save event"}
            </button>
            <button type="button" className={ghost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {events.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-4 bg-background p-4">
            <div>
              <div className="font-display text-base">{e.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {e.event_date ? new Date(e.event_date).toDateString() : "Date TBA"} · {e.location} ·{" "}
                {e.published ? "live" : "draft"}
              </div>
            </div>
            <button className={ghost} onClick={() => open(e)}>
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- projects ---------------- */

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tech: string[];
  cover_url: string | null;
  link: string | null;
  year: number | null;
  published: boolean;
};

function Projects({ projects, members }: { projects: ProjectRow[]; members: MemberRow[] }) {
  const router = useRouter();
  const save = useServerFn(saveProject);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [people, setPeople] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const open = (p: ProjectRow | null) => {
    setEditing(
      p ??
        ({
          id: "",
          slug: "",
          title: "",
          description: "",
          tech: [],
          cover_url: null,
          link: "",
          year: new Date().getFullYear(),
          published: true,
        } as ProjectRow),
    );
    setCover(p?.cover_url ?? null);
    setPeople([]);
  };

  return (
    <div className="grid gap-8">
      <button className={btn} onClick={() => open(null)}>
        + Add project
      </button>

      {editing && (
        <form
          className="grid gap-4 border border-hairline bg-card/40 p-6 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const title = String(f.get("title") ?? "");
            setBusy(true);
            try {
              await save({
                data: {
                  ...(editing.id ? { id: editing.id } : {}),
                  title,
                  slug: String(f.get("slug") ?? "") || slugify(title),
                  description: String(f.get("description") ?? "") || null,
                  tech: String(f.get("tech") ?? "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  coverUrl: cover,
                  link: String(f.get("link") ?? "") || null,
                  year: f.get("year") ? Number(f.get("year")) : null,
                  published: f.get("published") === "on",
                  contributorIds: people,
                },
              });
              toast.success("Project saved.");
              setEditing(null);
              await router.invalidate();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="md:col-span-2">
            <PhotoUpload value={cover} onChange={setCover} folder="projects" label="Cover image" />
          </div>
          <Label text="Title">
            <input name="title" required defaultValue={editing.title} className={field} />
          </Label>
          <Label text="Link name (slug)">
            <input
              name="slug"
              defaultValue={editing.slug}
              placeholder="auto from title"
              className={field}
            />
          </Label>
          <Label text="Tech (comma separated)">
            <input name="tech" defaultValue={editing.tech.join(", ")} className={field} />
          </Label>
          <Label text="External link">
            <input name="link" defaultValue={editing.link ?? ""} className={field} />
          </Label>
          <Label text="Year">
            <input name="year" type="number" defaultValue={editing.year ?? ""} className={field} />
          </Label>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <input type="checkbox" name="published" defaultChecked={editing.published} /> Published
          </label>
          <Label text="Description">
            <textarea
              name="description"
              rows={3}
              defaultValue={editing.description ?? ""}
              className={`${field} resize-none md:col-span-2`}
            />
          </Label>
          <div className="md:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Contributors
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() =>
                    setPeople(
                      people.includes(m.id) ? people.filter((p) => p !== m.id) : [...people, m.id],
                    )
                  }
                  className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${
                    people.includes(m.id)
                      ? "border-silver text-foreground"
                      : "border-hairline text-muted-foreground"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button className={btn} disabled={busy}>
              {busy ? "Saving…" : "Save project"}
            </button>
            <button type="button" className={ghost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 bg-background p-4">
            <div>
              <div className="font-display text-base">{p.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.year ?? "—"} · {p.published ? "live" : "draft"}
              </div>
            </div>
            <button className={ghost} onClick={() => open(p)}>
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- announcements ---------------- */

function Announcements({
  rows,
  teams,
  isAdmin,
  headTeams,
}: {
  rows: {
    id: string;
    title: string;
    body: string;
    team_id: string | null;
    pinned: boolean;
    published: boolean;
    created_at: string;
  }[];
  teams: { id: string; name: string }[];
  isAdmin: boolean;
  headTeams: string[];
}) {
  const router = useRouter();
  const save = useServerFn(saveAnnouncement);
  const remove = useServerFn(deleteAnnouncement);
  const [busy, setBusy] = useState(false);
  const allowed = isAdmin ? teams : teams.filter((t) => headTeams.includes(t.id));

  return (
    <div className="grid gap-8">
      <form
        className="grid gap-4 border border-hairline bg-card/40 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const form = e.currentTarget;
          setBusy(true);
          try {
            await save({
              data: {
                title: String(f.get("title") ?? ""),
                body: String(f.get("body") ?? ""),
                teamId: String(f.get("team") ?? "") || null,
                pinned: f.get("pinned") === "on",
                published: true,
              },
            });
            toast.success("Announcement posted.");
            form.reset();
            await router.invalidate();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not post.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Label text="Title">
          <input name="title" required className={field} />
        </Label>
        <Label text="Message">
          <textarea name="body" rows={4} required className={`${field} resize-none`} />
        </Label>
        <div className="flex flex-wrap items-center gap-4">
          <Label text="Audience">
            <select
              name="team"
              className={field}
              defaultValue={isAdmin ? "" : (allowed[0]?.id ?? "")}
            >
              {isAdmin && (
                <option value="" className="bg-background">
                  Club-wide
                </option>
              )}
              {allowed.map((t) => (
                <option key={t.id} value={t.id} className="bg-background">
                  {t.name}
                </option>
              ))}
            </select>
          </Label>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <input type="checkbox" name="pinned" /> Pin to top
          </label>
          <button className={btn} disabled={busy}>
            {busy ? "Posting…" : "Post announcement"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {rows.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-4 bg-background p-4">
            <div className="min-w-0">
              <div className="font-display text-base">{a.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {a.team_id
                  ? (teams.find((t) => t.id === a.team_id)?.name ?? a.team_id)
                  : "Club-wide"}{" "}
                · {new Date(a.created_at).toDateString()}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
            </div>
            <button
              className={ghost}
              onClick={async () => {
                try {
                  await remove({ data: { id: a.id } });
                  toast.success("Deleted.");
                  await router.invalidate();
                } catch {
                  toast.error("Could not delete.");
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- judging ---------------- */

function Judging() {
  const load = useServerFn(getJudging);
  const saveScore = useServerFn(saveJudgingScore);
  const [data, setData] = useState<Awaited<ReturnType<typeof getJudging>> | null>(null);
  const [teamId, setTeamId] = useState("");
  const [draft, setDraft] = useState<Record<string, { score: string; feedback: string }>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load()
      .then(setData)
      .catch(() => toast.error("Could not load judging data."));
  }, [load]);

  if (!data) return <p className="font-mono text-xs text-muted-foreground">Loading judging…</p>;
  if (data.teams.length === 0)
    return <p className="font-mono text-xs text-muted-foreground">No teams to judge yet.</p>;

  const team = data.teams.find((t) => t.id === teamId) ?? data.teams[0]!;
  const myScores = new Map(
    data.scores.filter((s) => s.team_id === team.id).map((s) => [s.criterion_id, s]),
  );

  return (
    <div className="grid gap-8">
      <section className="border border-hairline bg-card/40 p-6">
        <div className="font-display text-xl">Leaderboard</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Weighted average across all judges. Criteria weights:{" "}
          {data.criteria.map((c) => `${c.name.split(" ")[0]} ×${c.weight}`).join(", ")}
        </p>
        <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
          {data.leaderboard.map((row, index) => (
            <button
              key={row.teamId}
              onClick={() => setTeamId(row.teamId)}
              className={`flex items-center justify-between gap-4 bg-background p-3 text-left hover:bg-black/[0.03] ${
                row.teamId === team.id ? "outline outline-1 outline-silver" : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-right font-mono text-[10px] text-muted-foreground">
                  {row.scoreTotal === null ? "—" : `#${index + 1}`}
                </span>
                <span className="font-display text-sm">{row.name}</span>
              </span>
              <span className="font-mono text-xs text-silver">
                {row.scoreTotal === null
                  ? "not scored"
                  : `${row.scoreTotal}/10 · ${row.judgeCount} judge${row.judgeCount === 1 ? "" : "s"}`}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="border border-hairline bg-card/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-display text-xl">Score team</div>
          <select value={team.id} onChange={(e) => setTeamId(e.target.value)} className={field}>
            {data.teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-background">
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 grid gap-4">
          {data.criteria.map((criterion) => {
            const existing = myScores.get(criterion.id);
            const entry = draft[criterion.id] ?? {
              score: existing ? String(existing.score) : "",
              feedback: existing?.feedback ?? "",
            };
            return (
              <div key={criterion.id} className="border border-hairline p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm">{criterion.name}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      0–{criterion.max_score} points · weight ×{criterion.weight}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={criterion.max_score}
                    step="0.5"
                    value={entry.score}
                    onChange={(e) =>
                      setDraft({ ...draft, [criterion.id]: { ...entry, score: e.target.value } })
                    }
                    className={`${field} w-24`}
                    placeholder="0"
                  />
                </div>
                <textarea
                  rows={2}
                  value={entry.feedback}
                  onChange={(e) =>
                    setDraft({ ...draft, [criterion.id]: { ...entry, feedback: e.target.value } })
                  }
                  placeholder="Feedback for the team (optional)"
                  className={`${field} mt-3 w-full resize-none`}
                />
                <button
                  className={`${btn} mt-3`}
                  disabled={busy || entry.score === ""}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await saveScore({
                        data: {
                          teamId: team.id,
                          criterionId: criterion.id,
                          score: Number(entry.score),
                          feedback: entry.feedback,
                        },
                      });
                      toast.success(`Saved ${criterion.name}.`);
                      setData(await load());
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not save score.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Save score
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ---------------- people: codes, roles, mentorship ---------------- */

function People() {
  const [section, setSection] = useState<"codes" | "roles" | "mentorship">("codes");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["codes", "Access codes"],
            ["roles", "Staff roles"],
            ["mentorship", "Mentorship"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
              section === id
                ? "border-silver text-foreground"
                : "border-hairline text-muted-foreground hover:border-silver"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {section === "codes" && <AccessCodes />}
      {section === "roles" && <StaffRoles />}
      {section === "mentorship" && <MentorshipAdmin />}
    </div>
  );
}

function AccessCodes() {
  const load = useServerFn(listStaffInvites);
  const issue = useServerFn(issueStaffInvite);
  const revoke = useServerFn(revokeStaffInvite);
  const [data, setData] = useState<Awaited<ReturnType<typeof listStaffInvites>> | null>(null);
  const [role, setRole] = useState<"judge" | "mentor">("judge");
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [lastCode, setLastCode] = useState("");

  useEffect(() => {
    load()
      .then(setData)
      .catch(() => toast.error("Could not load codes."));
  }, [load]);

  return (
    <div className="grid gap-6">
      <div className="border border-hairline bg-card/40 p-6">
        <div className="font-display text-xl">Issue a verification code</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Hand a code to a judge or mentor you trust. They enter it once at sign-up — no code, no
          staff access.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Label text="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "judge")}
              className={field}
            >
              <option value="judge" className="bg-background">
                Judge
              </option>
              <option value="mentor" className="bg-background">
                Mentor
              </option>
            </select>
          </Label>
          <Label text="Label (optional)">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Prof from NMIT"
              className={`${field} w-56`}
            />
          </Label>
          <Label text="Uses">
            <input
              type="number"
              min={1}
              max={50}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className={`${field} w-20`}
            />
          </Label>
          <button
            className={btn}
            onClick={async () => {
              try {
                const result = await issue({ data: { role, label, maxUses } });
                setLastCode(result.code);
                await navigator.clipboard.writeText(result.code).catch(() => {});
                toast.success("Code created and copied.");
                setData(await load());
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not create code.");
              }
            }}
          >
            Create code
          </button>
          {lastCode && (
            <span className="font-mono text-sm tracking-widest text-silver">{lastCode}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-px border border-hairline bg-hairline">
        {(data?.invites ?? []).map((invite) => (
          <div
            key={invite.id}
            className="flex flex-wrap items-center justify-between gap-3 bg-background p-3"
          >
            <div>
              <span className="font-mono text-sm tracking-widest">{invite.code}</span>
              <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-silver">
                {invite.role}
                {invite.label ? ` · ${invite.label}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground">
                {invite.used_count}/{invite.max_uses} used
              </span>
              {invite.revoked ? (
                <span className="font-mono text-[10px] uppercase tracking-widest text-red-300">
                  revoked
                </span>
              ) : (
                <button
                  className={ghost}
                  onClick={async () => {
                    try {
                      await revoke({ data: { id: invite.id } });
                      toast.success("Code revoked.");
                      setData(await load());
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not revoke.");
                    }
                  }}
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
        {data?.invites.length === 0 && (
          <div className="bg-background p-4 text-sm text-muted-foreground">
            No codes issued yet.
          </div>
        )}
      </div>
    </div>
  );
}

function MentorshipAdmin() {
  const load = useServerFn(listMentorshipRequests);
  const [data, setData] = useState<Awaited<ReturnType<typeof listMentorshipRequests>> | null>(null);

  useEffect(() => {
    load()
      .then(setData)
      .catch(() => toast.error("Could not load mentorship."));
  }, [load]);

  if (!data) return <p className="font-mono text-xs text-muted-foreground">Loading…</p>;

  return (
    <div className="flex flex-col gap-px border border-hairline bg-hairline">
      {data.requests.map((request) => (
        <div
          key={request.id}
          className="flex flex-wrap items-center justify-between gap-3 bg-background p-3"
        >
          <div>
            <div className="text-sm">
              {request.mentee} → {request.mentor}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">{request.topic}</div>
          </div>
          <span
            className={`font-mono text-[10px] uppercase tracking-widest ${
              request.status === "accepted"
                ? "text-emerald-300"
                : request.status === "pending"
                  ? "text-amber-300"
                  : "text-muted-foreground"
            }`}
          >
            {request.status}
          </span>
        </div>
      ))}
      {data.requests.length === 0 && (
        <div className="bg-background p-4 text-sm text-muted-foreground">
          No mentorship requests yet.
        </div>
      )}
    </div>
  );
}

function StaffRoles() {
  const load = useServerFn(listStaffRoles);
  const save = useServerFn(setUserRole);
  const [data, setData] = useState<Awaited<ReturnType<typeof listStaffRoles>> | null>(null);

  useEffect(() => {
    load()
      .then(setData)
      .catch(() => toast.error("Could not load roles."));
  }, [load]);

  if (!data) return <p className="font-mono text-xs text-muted-foreground">Loading roles…</p>;

  const roleOf = (userId: string) => data.roles.find((r) => r.userId === userId)?.role ?? "none";

  return (
    <div className="border border-hairline bg-card/40 p-6">
      <div className="font-display text-xl">Staff roles</div>
      <p className="mt-1 text-sm text-muted-foreground">
        Admins control everything. Heads can run check-in, judge, and triage teams. Only members who
        signed in at least once appear here.
      </p>
      <div className="mt-4 flex flex-col gap-px border border-hairline bg-hairline">
        {data.members.map((member) => (
          <div
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-3 bg-background p-3"
          >
            <div>
              <div className="font-display text-sm">{member.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground">
                /{member.slug}
                {member.isHead ? " · roster head" : ""}
              </div>
            </div>
            <select
              value={roleOf(member.userId)}
              onChange={async (event) => {
                try {
                  await save({
                    data: { userId: member.userId, role: event.target.value as "admin" },
                  });
                  toast.success("Role updated.");
                  setData(await load());
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update role.");
                }
              }}
              className={field}
            >
              {["none", "member", "head", "admin"].map((role) => (
                <option key={role} value={role} className="bg-background">
                  {role}
                </option>
              ))}
            </select>
          </div>
        ))}
        {data.members.length === 0 && (
          <div className="bg-background p-4 text-sm text-muted-foreground">
            No signed-in members yet.
          </div>
        )}
      </div>
    </div>
  );
}

function exportTeamsCsv(
  teams: {
    id: string;
    name: string;
    status: string;
    lead_name: string;
    lead_email: string;
    lead_phone: string | null;
    mentor_name: string | null;
    mentor_email: string | null;
  }[],
  members: {
    team_id: string;
    name: string;
    email: string;
    phone: string | null;
    usn: string | null;
    branch: string | null;
    year: string | null;
    gender: string | null;
    is_lead: boolean;
  }[],
  submissions: {
    team_id: string;
    solution_title: string | null;
    status: string;
    problem_statement_title?: string | null;
    theme?: string | null;
  }[],
) {
  const rows = [
    [
      "team",
      "status",
      "member",
      "is_lead",
      "email",
      "phone",
      "srn",
      "branch",
      "year",
      "gender",
      "mentor",
      "submission",
      "submission_status",
    ],
  ];
  for (const team of teams) {
    const submission = submissions.find((s) => s.team_id === team.id);
    const mentor = [team.mentor_name, team.mentor_email].filter(Boolean).join(" ");
    const roster = members.filter((m) => m.team_id === team.id);
    if (roster.length === 0) {
      rows.push([
        team.name,
        team.status,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        mentor,
        submission?.solution_title ?? "",
        submission?.status ?? "",
      ]);
    }
    for (const m of roster) {
      rows.push([
        team.name,
        team.status,
        m.name,
        m.is_lead ? "yes" : "no",
        m.email,
        m.phone ?? "",
        m.usn ?? "",
        m.branch ?? "",
        m.year ?? "",
        m.gender ?? "",
        mentor,
        submission?.solution_title ?? "",
        submission?.status ?? "",
      ]);
    }
  }
  const csv = rows
    .map((row) => row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vertex-sih-teams-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
