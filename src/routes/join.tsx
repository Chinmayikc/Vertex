import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { getDirectory, submitApplication } from "@/lib/club.functions";

export const Route = createFileRoute("/join")({
  loader: () => getDirectory(),
  head: () => ({
    meta: [
      { title: "Join Vertex — Apply to a team" },
      {
        name: "description",
        content:
          "Applications for Vertex are open. Pick two teams, tell us what you want to build, and we'll get back to you.",
      },
      { property: "og:title", content: "Join Vertex — Apply to a team" },
      {
        property: "og:description",
        content: "Apply to Technical, Media, Events, PR, Sponsorship, Editor, or Design at Vertex.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-mono text-sm text-muted-foreground">
        The application form is unavailable right now.
      </p>
    </div>
  ),
});

function JoinPage() {
  const { teams } = Route.useLoaderData();
  const apply = useServerFn(submitApplication);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const extraPreferences = [
    { id: "editor", name: "Editor" },
    { id: "design", name: "Design" },
  ];

  if (done) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-silver">
            Application received
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight">
            You're in the pile.
          </h1>
          <p className="mt-4 text-muted-foreground">
            A team head will review your application and reach out over email. Keep an eye on your
            inbox.
          </p>
          <Link
            to="/"
            className="mt-10 inline-block border border-hairline px-5 py-3 font-mono text-[11px] uppercase tracking-widest hover:border-silver"
          >
            ← Back to the roster
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-40" />
        <div className="relative mx-auto max-w-3xl px-6 py-20">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-silver" />
            Recruitment · 2026 intake
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            Apply to Vertex.
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Five teams, one club. Tell us where you fit and what you want to work on. No prior
            experience required — just show up and build.
          </p>

          <form
            className="mt-12 grid gap-5 border border-hairline bg-card/40 p-6 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setSending(true);
              try {
                await apply({
                  data: {
                    name: String(f.get("name") ?? ""),
                    usn: String(f.get("usn") ?? ""),
                    year: String(f.get("year") ?? ""),
                    branch: String(f.get("branch") ?? ""),
                    email: String(f.get("email") ?? ""),
                    phone: String(f.get("phone") ?? ""),
                    teamFirst: String(f.get("teamFirst") ?? ""),
                    teamSecond: String(f.get("teamSecond") ?? ""),
                    why: String(f.get("why") ?? ""),
                    links: String(f.get("links") ?? ""),
                  },
                });
                setDone(true);
              } catch {
                toast.error("Something went wrong. Check your details and try again.");
              } finally {
                setSending(false);
              }
            }}
          >
            <Field name="name" label="Full name" required />
            <Field name="usn" label="USN" />
            <Field name="year" label="Year" placeholder="1st / 2nd / 3rd / 4th" />
            <Field name="branch" label="Branch" />
            <Field name="email" label="Email" type="email" required />
            <Field name="phone" label="Phone" />

            <SelectField
              name="teamFirst"
              label="First preference"
              teams={teams}
              extraOptions={extraPreferences}
              required
            />
            <SelectField
              name="teamSecond"
              label="Second preference"
              teams={teams}
              extraOptions={extraPreferences}
            />

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Why Vertex — and what do you want to build?
              </span>
              <textarea
                required
                name="why"
                rows={5}
                minLength={10}
                className="resize-none border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Links (portfolio, GitHub, Instagram — optional)
              </span>
              <input
                name="links"
                className="border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={sending}
                className="border border-silver bg-foreground px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Submit application →"}
              </button>
            </div>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="border border-hairline bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground/60 focus:border-silver focus:outline-none"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  teams,
  extraOptions = [],
  required,
}: {
  name: string;
  label: string;
  teams: { id: string; name: string }[];
  extraOptions?: { id: string; name: string }[];
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none"
      >
        <option value="">—</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
        {extraOptions.length > 0 && (
          <optgroup label="Additional preferences">
            {extraOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </label>
  );
}
