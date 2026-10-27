import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
  Plus,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { registerForSarvamHackathon } from "@/lib/sarvam.functions";

export const Route = createFileRoute("/events/build-with-sarvam")({
  head: () => ({
    meta: [
      { title: "BUILD WITH SARVAM — Vertex" },
      {
        name: "description",
        content:
          "BUILD WITH SARVAM is a two-day AI hackathon by VERTEX Club at REVA University, in collaboration with Sarvam AI.",
      },
    ],
  }),
  component: BuildWithSarvamPage,
});

type Member = {
  name: string;
  email: string;
  phone: string;
  usn: string;
  branch: string;
  year: string;
};

const createMember = (): Member => ({
  name: "",
  email: "",
  phone: "",
  usn: "",
  branch: "",
  year: "",
});

const objectives = [
  "Build practical AI products with Sarvam’s language and voice capabilities.",
  "Turn real-world problems into working prototypes in two focused days.",
  "Learn by shipping alongside a team, mentors, and fellow builders.",
  "Leave with a demo, a clearer product instinct, and a stronger technical network.",
];

const focusAreas = [
  "Language AI",
  "Voice experiences",
  "Automation",
  "Education",
  "Productivity",
  "Indian context",
];

function BuildWithSarvamPage() {
  const register = useServerFn(registerForSarvamHackathon);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<Member[]>([createMember(), createMember()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ teamName: string; memberCount: number } | null>(
    null,
  );

  const updateMember = (index: number, field: keyof Member, value: string) => {
    setMembers((current) =>
      current.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member,
      ),
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emails = members.map((member) => member.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) {
      toast.error("Each team member must use a different email address.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({ data: { teamName, members } });
      setSubmitted({ teamName: result.teamName, memberCount: result.memberCount });
      window.scrollTo({
        top: document.getElementById("register")?.offsetTop ?? 0,
        behavior: "smooth",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <Atmosphere mesh />
          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} /> Back to events
            </Link>
            <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="chip flex w-fit items-center gap-2 rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-silver">
                    <Sparkles size={12} /> VERTEX
                  </div>
                  <span className="font-mono text-xs text-muted-foreground" aria-hidden="true">
                    ×
                  </span>
                  <a
                    href="https://www.sarvam.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 transition-transform hover:-translate-y-0.5"
                    aria-label="Sarvam AI website"
                  >
                    <img
                      src="https://pbs.twimg.com/profile_images/2021450761734062080/XMvWk_lJ_x96.png"
                      alt="Sarvam AI"
                      className="h-8 w-8 rounded-full object-cover mix-blend-multiply"
                      width={32}
                      height={32}
                      loading="eager"
                      decoding="async"
                    />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
                      Sarvam AI
                    </span>
                  </a>
                </div>
                <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Two-day AI innovation hackathon · REVA University
                </p>
                <h1 className="mt-5 max-w-4xl font-display text-6xl font-semibold leading-[0.88] tracking-[-0.06em] sm:text-8xl">
                  Build with
                  <br />
                  <span className="text-silver-gradient">Sarvam.</span>
                </h1>
                <p className="mt-7 max-w-2xl font-display text-2xl italic leading-tight text-muted-foreground sm:text-3xl">
                  Build with AI. Ship something useful.
                </p>
                <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground">
                  Bring a sharp problem, a curious team, and the urge to make. In two days, turn an
                  idea into a working AI prototype with the Sarvam ecosystem.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#register"
                    className="btn-primary rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Register your team <ArrowRight size={15} />
                  </a>
                  <a
                    href="#event-desk"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Event desk
                  </a>
                </div>
              </div>

              <div id="event-desk" className="glass-panel edge-highlight rounded-2xl p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Event desk
                </div>
                <dl className="mt-5 grid gap-4 text-sm">
                  <DeskRow
                    icon={<CalendarDays size={15} />}
                    label="Date"
                    value="13–14 November 2026"
                  />
                  <DeskRow icon={<MapPin size={15} />} label="Venue" value="REVA University" />
                  <DeskRow icon={<Users size={15} />} label="Team size" value="2–4 members" />
                  <DeskRow
                    icon={<Trophy size={15} />}
                    label="Winner"
                    value="25K worth of API credits"
                  />
                  <DeskRow
                    icon={<Sparkles size={15} />}
                    label="Every participant"
                    value="500 API credits"
                  />
                  <DeskRow
                    icon={<CalendarDays size={15} />}
                    label="Deadline"
                    value="12 November · 11 PM"
                  />
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-hairline bg-surface-2">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:grid-cols-3 md:py-10">
            <Stat label="13–14 NOV" detail="Two days to build" />
            <Stat label="2–4 BUILDERS" detail="One team, one idea" />
            <Stat label="25K + 500" detail="Credits to keep building" />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[.75fr_1.25fr]">
          <Reveal>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
              01 · The brief
            </p>
            <h2 className="mt-4 max-w-md font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Start with a problem worth solving.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              BUILD WITH SARVAM is a focused space for students to explore what becomes possible
              when good product thinking meets capable AI. Form a team of two to four and make a
              prototype people can understand, use, and remember.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {objectives.map((objective) => (
                <li key={objective} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-silver" size={17} />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className="border-y border-hairline bg-surface-2">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-2">
            <Reveal>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                02 · What you can build
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
                Language, voice, context.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
                Explore AI-powered products that feel grounded in the people and languages they are
                made for. The strongest entries will be clear, useful, and demonstrated end to end.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-3 sm:grid-cols-2">
                {focusAreas.map((focus) => (
                  <div key={focus} className="surface-card rounded-xl p-5">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-silver">
                      Possible direction
                    </div>
                    <div className="mt-3 font-display text-xl">{focus}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="register" className="scroll-mt-20 border-b border-hairline">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
            <Reveal>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                03 · Team registration
              </p>
              <h2 className="mt-4 max-w-md font-display text-4xl tracking-tight sm:text-5xl">
                Put your builders on the board.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
                Register one team with two to four members. Add the team lead first; everyone else
                can follow in any order. Every field is kept together with the team submission so
                the event desk has one clean roster to work from.
              </p>
              <div className="mt-8 grid gap-3">
                <Benefit
                  icon={<Trophy size={16} />}
                  title="25K worth for the winner"
                  detail="Sarvam API credits to keep the winning idea moving."
                />
                <Benefit
                  icon={<Sparkles size={16} />}
                  title="500 API credits per participant"
                  detail="Every registered builder gets credits to continue experimenting."
                />
                <Benefit
                  icon={<MapPin size={16} />}
                  title="On campus at REVA University"
                  detail="13–14 November 2026 · offline hackathon."
                />
              </div>
            </Reveal>

            <div className="min-w-0">
              {submitted ? (
                <div className="glass-strong rounded-2xl p-8 outline-none" role="status">
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                    <CheckCircle2 size={18} /> Registration received
                  </div>
                  <h3 className="mt-7 font-display text-4xl tracking-tight sm:text-5xl">
                    {submitted.teamName} is on the list.
                  </h3>
                  <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                    Your team registration for BUILD WITH SARVAM is pending event-desk review. We
                    received {submitted.memberCount} member{submitted.memberCount === 1 ? "" : "s"}.
                  </p>
                  <p className="mt-5 border-l border-silver pl-4 text-sm leading-7 text-muted-foreground">
                    The team lead will receive the next update at the email address submitted above.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(null);
                      setTeamName("");
                      setMembers([createMember(), createMember()]);
                    }}
                    className="btn-ghost mt-8 rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
                  >
                    Register another team <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={submit}
                  className="glass-panel edge-highlight rounded-2xl p-6 md:p-8"
                >
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-5">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
                        Team details
                      </p>
                      <h3 className="mt-2 font-display text-2xl">Register your team</h3>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {members.length}/4 members
                    </span>
                  </div>

                  <label className="mt-6 flex flex-col gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Team name
                    </span>
                    <input
                      required
                      value={teamName}
                      onChange={(event) => setTeamName(event.target.value)}
                      placeholder="Give your team a name"
                      className="field-input rounded-lg px-3 py-2.5 text-sm"
                    />
                  </label>

                  <div className="mt-8 grid gap-4">
                    {members.map((member, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-hairline bg-surface-2 p-4 md:p-5"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                              Member {index + 1}
                              {index === 0 ? " · Team lead" : ""}
                            </span>
                            {index === 0 && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                The lead receives event-desk updates.
                              </p>
                            )}
                          </div>
                          {members.length > 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                setMembers((current) => current.filter((_, i) => i !== index))
                              }
                              className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                            >
                              <X size={13} /> Remove
                            </button>
                          )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <MemberField
                            label="Full name"
                            value={member.name}
                            required
                            onChange={(value) => updateMember(index, "name", value)}
                          />
                          <MemberField
                            label="Email"
                            type="email"
                            value={member.email}
                            required
                            onChange={(value) => updateMember(index, "email", value)}
                          />
                          <MemberField
                            label="Phone"
                            type="tel"
                            value={member.phone}
                            onChange={(value) => updateMember(index, "phone", value)}
                          />
                          <MemberField
                            label="USN / SRN"
                            value={member.usn}
                            onChange={(value) => updateMember(index, "usn", value)}
                          />
                          <MemberField
                            label="Branch"
                            value={member.branch}
                            onChange={(value) => updateMember(index, "branch", value)}
                          />
                          <MemberField
                            label="Year"
                            value={member.year}
                            onChange={(value) => updateMember(index, "year", value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      disabled={members.length >= 4}
                      onClick={() => setMembers((current) => [...current, createMember()])}
                      className="btn-ghost rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={14} /> Add member
                    </button>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      Minimum 2 · Maximum 4
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary mt-7 w-full rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest disabled:opacity-50"
                  >
                    {submitting ? "Submitting team…" : "Submit team registration"}{" "}
                    <ArrowRight size={15} />
                  </button>
                  <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    Your details are used for this event registration only.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="flex flex-col gap-5 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-silver">
                Questions?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Reach the VERTEX event desk at vertexreva@gmail.com.
              </p>
            </div>
            <a
              href="mailto:vertexreva@gmail.com?subject=BUILD%20WITH%20SARVAM"
              className="btn-ghost rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
            >
              <Mail size={14} /> Contact the desk
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function DeskRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="max-w-[180px] text-right">{value}</dd>
    </div>
  );
}

function Stat({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="border-l border-hairline pl-4">
      <div className="font-mono text-xs tracking-[0.18em] text-silver">{label}</div>
      <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
    </div>
  );
}

function Benefit({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-hairline bg-surface-2 p-4">
      <span className="mt-0.5 text-silver">{icon}</span>
      <div>
        <div className="text-sm">{title}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

function MemberField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input rounded-lg px-3 py-2 text-sm"
      />
    </label>
  );
}
