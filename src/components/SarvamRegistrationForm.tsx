import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Plus, X } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { registerForSarvamHackathon } from "@/lib/sarvam.functions";

type Member = {
  name: string;
  email: string;
  phone: string;
  usn: string;
  college: string;
  branch: string;
  year: string;
};

type TrackName =
  | "Education and Learning"
  | "Healthcare and well being"
  | "Agriculture and rural Innovation"
  | "Security and developer tools"
  | "Open innovation";

type ProjectDetails = {
  projectTitle: string;
  track: TrackName;
  problem: string;
  solution: string;
  innovation: string;
  aiUse: string;
  beneficiaries: string;
  originalityConfirmed: boolean;
  rulesConfirmed: boolean;
};

const trackNames: TrackName[] = [
  "Education and Learning",
  "Healthcare and well being",
  "Agriculture and rural Innovation",
  "Security and developer tools",
  "Open innovation",
];

const createMember = (): Member => ({
  name: "",
  email: "",
  phone: "",
  usn: "",
  college: "",
  branch: "",
  year: "",
});

const createProject = (): ProjectDetails => ({
  projectTitle: "",
  track: "Education and Learning",
  problem: "",
  solution: "",
  innovation: "",
  aiUse: "",
  beneficiaries: "",
  originalityConfirmed: false,
  rulesConfirmed: false,
});

export function SarvamRegistrationForm() {
  const register = useServerFn(registerForSarvamHackathon);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<Member[]>([createMember()]);
  const [project, setProject] = useState<ProjectDetails>(createProject());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ teamName: string; memberCount: number } | null>(
    null,
  );
  const isTeamComplete =
    members.length === 4 &&
    members.every((member) =>
      [
        member.name,
        member.email,
        member.phone,
        member.usn,
        member.college,
        member.branch,
        member.year,
      ].every((value) => value.trim().length > 0),
    );
  const isProjectComplete =
    project.projectTitle.trim().length > 0 &&
    project.problem.trim().length >= 20 &&
    project.solution.trim().length >= 20 &&
    project.innovation.trim().length >= 20 &&
    project.aiUse.trim().length >= 20 &&
    project.beneficiaries.trim().length >= 20 &&
    project.originalityConfirmed &&
    project.rulesConfirmed;
  const canSubmit = teamName.trim().length > 0 && isTeamComplete && isProjectComplete;

  const updateMember = (index: number, field: keyof Member, value: string) => {
    setMembers((current) =>
      current.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member,
      ),
    );
  };

  const updateProject = <K extends keyof ProjectDetails>(field: K, value: ProjectDetails[K]) => {
    setProject((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (members.length !== 4) {
      toast.error("Add all 4 team members before registering.");
      return;
    }
    if (!isProjectComplete) {
      toast.error("Complete the idea details and both declarations before registering.");
      return;
    }
    const emails = members.map((member) => member.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) {
      toast.error("Each team member must use a different email address.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({ data: { teamName, members, ...project } });
      setSubmitted({ teamName: result.teamName, memberCount: result.memberCount });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not register your team.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-strong rounded-2xl p-8 outline-none" role="status">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-700">
          <CheckCircle2 size={18} /> Registration received
        </div>
        <h2 className="mt-7 font-display text-4xl tracking-tight sm:text-5xl">
          {submitted.teamName} is registered.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Your team registration and idea submission have been received with {submitted.memberCount}{" "}
          team members. The organising team will review the proposal and contact shortlisted teams
          using the details provided.
        </p>
        <p className="mt-5 border-l border-silver pl-4 text-sm leading-7 text-muted-foreground">
          Thank you for registering for Build with Sarvam.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(null);
            setTeamName("");
            setMembers([createMember()]);
            setProject(createProject());
          }}
          className="btn-ghost mt-8 rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
        >
          Register another team <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <form
      id="registration-form"
      onSubmit={submit}
      className="glass-panel edge-highlight rounded-2xl p-6 md:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
            Registration dashboard
          </p>
          <h2 className="mt-2 font-display text-2xl">Register your team and idea</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          One idea per team
        </span>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-3" aria-label="Registration steps">
        <StepCard number="01" title="Team lead" detail="Team name and lead contact" active />
        <StepCard number="02" title="Team members" detail="Add the remaining 3 members" />
        <StepCard number="03" title="Idea submission" detail="Describe the project and impact" />
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

      <div className="mt-8 border-t border-hairline pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
          Step 01–02 · Team registration
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Complete the team lead first, then add the remaining three members.
        </p>
        <div className="mt-4 grid gap-4">
          {members.map((member, index) => (
            <div key={index} className="rounded-xl border border-hairline bg-surface-2 p-4 md:p-5">
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
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setMembers((current) => current.filter((_, i) => i !== index))}
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
                  label="Contact number"
                  type="tel"
                  value={member.phone}
                  required
                  onChange={(value) => updateMember(index, "phone", value)}
                />
                <MemberField
                  label="USN / SRN"
                  value={member.usn}
                  required
                  onChange={(value) => updateMember(index, "usn", value)}
                />
                <MemberField
                  label="College name"
                  value={member.college}
                  required
                  onChange={(value) => updateMember(index, "college", value)}
                />
                <MemberField
                  label="Branch"
                  value={member.branch}
                  required
                  onChange={(value) => updateMember(index, "branch", value)}
                />
                <MemberField
                  label="Year"
                  value={member.year}
                  required
                  onChange={(value) => updateMember(index, "year", value)}
                />
              </div>
            </div>
          ))}
        </div>
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
          {members.length}/4 member fields
        </span>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Add exactly 4 team members, with the team lead first. The lead receives event-desk updates.
      </p>

      <div className="mt-8 border-t border-hairline pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
          Step 03 · Idea submission
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Once the team details are complete, share the idea your team wants to build.
        </p>
        <div className="mt-4 grid gap-4">
          <TextField
            label="Project title"
            value={project.projectTitle}
            required
            onChange={(value) => updateProject("projectTitle", value)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Hackathon track
            </span>
            <select
              value={project.track}
              onChange={(event) => updateProject("track", event.target.value as TrackName)}
              className="field-input rounded-lg px-3 py-2 text-sm"
            >
              {trackNames.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="What problem are you trying to solve?"
            hint="Recommended: 50–100 words"
            value={project.problem}
            required
            multiline
            onChange={(value) => updateProject("problem", value)}
          />
          <TextField
            label="What is your proposed solution?"
            hint="Recommended: 100–150 words"
            value={project.solution}
            required
            multiline
            onChange={(value) => updateProject("solution", value)}
          />
          <TextField
            label="What makes your idea innovative or different?"
            hint="Recommended: 50–100 words"
            value={project.innovation}
            required
            multiline
            onChange={(value) => updateProject("innovation", value)}
          />
          <TextField
            label="How do you plan to use AI or Sarvam AI technology?"
            hint="Recommended: 50–100 words"
            value={project.aiUse}
            required
            multiline
            onChange={(value) => updateProject("aiUse", value)}
          />
          <TextField
            label="Who will benefit, and what impact could it create?"
            hint="Recommended: 50–100 words"
            value={project.beneficiaries}
            required
            multiline
            onChange={(value) => updateProject("beneficiaries", value)}
          />
        </div>
      </div>

      <div className="mt-7 grid gap-3 border-t border-hairline pt-6">
        <Declaration
          checked={project.originalityConfirmed}
          onChange={(checked) => updateProject("originalityConfirmed", checked)}
        >
          I confirm that the information submitted is accurate and that this project idea is
          original, or that my team has the necessary rights to use any included material.
        </Declaration>
        <Declaration
          checked={project.rulesConfirmed}
          onChange={(checked) => updateProject("rulesConfirmed", checked)}
        >
          I have read and agree to follow the official Build with Sarvam hackathon rules.
        </Declaration>
      </div>
      <button
        type="submit"
        disabled={submitting || !canSubmit}
        className="btn-primary mt-7 w-full rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest disabled:opacity-50"
      >
        {submitting ? "Registering team…" : "Register team"} <ArrowRight size={15} />
      </button>
      <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        No prototype, PPT, or video is required for this initial round.
      </p>
    </form>
  );
}

function StepCard({
  number,
  title,
  detail,
  active = false,
}: {
  number: string;
  title: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${active ? "border-silver/60 bg-silver/10" : "border-hairline bg-surface-2"}`}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest text-silver">
        {number} · {title}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  multiline = false,
  required = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {hint && (
          <span className="normal-case tracking-normal text-muted-foreground/70">{hint}</span>
        )}
      </span>
      {multiline ? (
        <textarea
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="field-input resize-y rounded-lg px-3 py-2 text-sm leading-6"
        />
      ) : (
        <input
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field-input rounded-lg px-3 py-2 text-sm"
        />
      )}
    </label>
  );
}

function Declaration({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer gap-3 text-sm leading-6 text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--accent)]"
      />
      {children}
    </label>
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
