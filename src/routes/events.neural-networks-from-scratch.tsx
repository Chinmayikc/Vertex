import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  KeyRound,
  MapPin,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  getNeuralNetworkRegistration,
  myNeuralNetworkRegistrations,
  submitNeuralNetworkRegistration,
  type NeuralRegistration,
} from "@/lib/neural.functions";

const TRACKING_STORAGE_KEY = "vertex-neural-network-registration-token";

export const Route = createFileRoute("/events/neural-networks-from-scratch")({
  head: () => ({
    meta: [
      { title: "Neural Networks from Scratch — Vertex" },
      {
        name: "description",
        content:
          "Reserve a seat for Vertex's Neural Networks from Scratch workshop at REVA University.",
      },
      { property: "og:title", content: "Neural Networks from Scratch — Vertex" },
      {
        property: "og:description",
        content: "The math behind the magic. Learn neural networks from first principles.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/3blue1brown-website-bucket/lessons/2017/neural-network-analysis/thumbnail.jpg",
      },
    ],
  }),
  component: NeuralNetworksPage,
});

function NeuralNetworksPage() {
  const submit = useServerFn(submitNeuralNetworkRegistration);
  const lookup = useServerFn(getNeuralNetworkRegistration);
  const loadMine = useServerFn(myNeuralNetworkRegistrations);
  const [active, setActive] = useState<NeuralRegistration | null>(null);
  const [mine, setMine] = useState<NeuralRegistration[]>([]);
  const [lookupCode, setLookupCode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TRACKING_STORAGE_KEY);
    if (savedToken) {
      lookup({ data: { trackingToken: savedToken } })
        .then(setActive)
        .catch(() => window.localStorage.removeItem(TRACKING_STORAGE_KEY));
    }

    loadMine()
      .then((rows) => {
        setMine(rows);
        if (!savedToken && rows[0]) setActive(rows[0]);
      })
      .catch(() => {
        // Registration is intentionally usable without an account.
      });
  }, [loadMine, lookup]);

  const handleSubmit = async (data: Parameters<typeof submit>[0]["data"]) => {
    const registration = await submit({ data });
    window.localStorage.setItem(TRACKING_STORAGE_KEY, registration.trackingToken);
    setActive(registration);
    toast.success("Registration received. Save your tracking code to follow approval.");
  };

  const handleLookup = async (event: FormEvent) => {
    event.preventDefault();
    if (!lookupCode.trim()) return;
    setLookingUp(true);
    try {
      const registration = await lookup({ data: { trackingToken: lookupCode.trim() } });
      window.localStorage.setItem(TRACKING_STORAGE_KEY, registration.trackingToken);
      setActive(registration);
      toast.success("Registration loaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not find that registration.");
    } finally {
      setLookingUp(false);
    }
  };

  const visibleRegistration = active ?? mine[0] ?? null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <Atmosphere mesh />
          <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
              <div>
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-silver">
                  <span className="inline-block h-px w-8 bg-silver" />
                  Workshop · Vertex Club
                </div>
                <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[0.9] tracking-[-0.055em] sm:text-7xl md:text-8xl">
                  Neural Networks from Scratch: The Math Behind the Magic
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
                  A focused workshop on the mathematics behind neural networks, from first
                  principles to the intuition that makes the magic click.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#registration"
                    className="btn-primary rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Reserve your seat <ArrowRight size={15} />
                  </a>
                  <Link
                    to="/events"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    All events
                  </Link>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-hairline bg-[#0d1414] p-2 shadow-[var(--shadow-glow)]">
                <img
                  src="https://storage.googleapis.com/3blue1brown-website-bucket/lessons/2017/neural-network-analysis/thumbnail.jpg"
                  alt="3Blue1Brown neural network visualization"
                  className="h-[22rem] w-full rounded-xl object-cover opacity-85 mix-blend-screen"
                  loading="eager"
                  decoding="async"
                />
                <div className="pointer-events-none absolute inset-2 rounded-xl bg-gradient-to-t from-[#0d1414]/90 via-transparent to-transparent" />
                <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-4 text-white">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
                      Learn · Visualize · Build
                    </div>
                    <div className="mt-2 font-display text-2xl">Follow the signal.</div>
                  </div>
                  <BrainCircuit size={34} strokeWidth={1.2} className="text-emerald-200" />
                </div>
              </div>
            </div>

            <dl className="mt-12 grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
              <EventDetail icon={<CalendarDays size={15} />} label="Date">
                28 October 2026
              </EventDetail>
              <EventDetail icon={<Clock3 size={15} />} label="Time">
                8:30 AM to 12:30 PM
              </EventDetail>
              <EventDetail icon={<MapPin size={15} />} label="Venue">
                B009, SMV Block, REVA University, Bengaluru
              </EventDetail>
              <EventDetail icon={<Sparkles size={15} />} label="Speaker">
                Mohammed Tasawuff
              </EventDetail>
            </dl>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Organized by Vertex Club, REVA University
            </p>
          </div>
        </section>

        <section className="border-b border-hairline bg-surface-2">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:py-20 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div>
              <SectionLabel>01 · What to expect</SectionLabel>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
                The gradient is the story.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                We will build the mental model first, then connect the equations to the code. No
                black boxes, just the path from a weighted sum to a learning system.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["01", "First principles", "Vectors, weights, and the geometry of a decision."],
                ["02", "The learning loop", "Loss, gradients, and why the update moves."],
                ["03", "Make it click", "A live walkthrough from math to a tiny network."],
              ].map(([number, title, copy]) => (
                <div key={number} className="glass-panel edge-highlight rounded-2xl p-5">
                  <div className="font-mono text-[10px] tracking-[0.2em] text-silver">{number}</div>
                  <h3 className="mt-10 font-display text-xl">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="registration" className="border-b border-hairline">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:py-20 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div>
              <SectionLabel>02 · Registration</SectionLabel>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
                Reserve your seat.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                No sign-in is required. After you register, keep the private tracking code shown on
                this page. Sign in with Google later if you want your registration to follow your
                account automatically.
              </p>

              {visibleRegistration && <RegistrationStatus registration={visibleRegistration} />}

              <div className="mt-6 border-t border-hairline pt-5">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <KeyRound size={13} className="text-silver" />
                  Already registered?
                </div>
                <form onSubmit={handleLookup} className="mt-3 flex gap-2">
                  <input
                    value={lookupCode}
                    onChange={(event) => setLookupCode(event.target.value)}
                    placeholder="Paste your tracking code"
                    className="field-input min-w-0 flex-1 rounded-lg px-3 py-2.5 font-mono text-xs"
                  />
                  <button
                    type="submit"
                    disabled={lookingUp}
                    className="btn-ghost rounded-lg px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
                  >
                    {lookingUp ? "Loading…" : "Check"}
                  </button>
                </form>
              </div>
            </div>

            <div className="glass-panel edge-highlight rounded-2xl p-5 md:p-7">
              <RegistrationForm onSubmit={handleSubmit} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function RegistrationForm({
  onSubmit,
}: {
  onSubmit: (data: Parameters<typeof submitNeuralNetworkRegistration>[0]["data"]) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        const reasons = values.getAll("reason").map(String);
        if (reasons.length === 0 || reasons.length > 2) {
          toast.error("Choose one or two reasons for attending.");
          return;
        }
        setBusy(true);
        try {
          await onSubmit({
            name: String(values.get("name") ?? ""),
            srn: String(values.get("srn") ?? ""),
            department: String(values.get("department") ?? ""),
            phone: String(values.get("phone") ?? ""),
            email: String(values.get("email") ?? ""),
            year: String(values.get("year") ?? "1st Year") as "1st Year" | "2nd Year" | "3rd Year",
            attendReason: reasons.join(" | "),
            expectation: String(values.get("expectation") ?? ""),
          });
          form.reset();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Registration failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" required />
        <Field label="SRN" name="srn" required />
        <Field label="Department" name="department" required />
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          pattern="\+?[0-9][0-9() -]{6,29}"
          title="Use 7–30 digits; spaces, parentheses, hyphens, and a leading + are allowed."
          required
        />
        <Field label="Email" name="email" type="email" required />
        <label className="grid gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Year
          </span>
          <select
            name="year"
            defaultValue="1st Year"
            className="field-input rounded-lg px-3 py-2.5 text-sm"
          >
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
          </select>
        </label>
      </div>

      <fieldset className="grid gap-2">
        <legend className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          What makes you attend? <span className="text-red-400">*</span>
        </legend>
        {[
          "Attendance",
          "Something new to learn",
          "Already into neural networks, want to clarify / solidify concepts",
          "Already know this, just want to revise",
        ].map((reason) => (
          <label
            key={reason}
            className="flex items-start gap-3 rounded-lg border border-hairline px-3 py-3 text-sm transition-colors hover:border-silver"
          >
            <input
              type="checkbox"
              name="reason"
              value={reason}
              className="mt-0.5 accent-[#173b2a]"
            />
            <span>{reason}</span>
          </label>
        ))}
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Select up to two
        </p>
      </fieldset>

      <label className="grid gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          What do you expect from the workshop? <span className="text-red-400">*</span>
        </span>
        <textarea
          name="expectation"
          required
          rows={4}
          className="field-input resize-none rounded-lg px-3 py-2.5 text-sm leading-6"
          placeholder="What would make the morning worth it for you?"
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full justify-center rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest disabled:opacity-50"
      >
        {busy ? "Sending registration…" : "Register for the workshop →"}
      </button>
      <p className="flex items-start gap-2 font-mono text-[10px] uppercase leading-5 tracking-widest text-muted-foreground">
        <ShieldCheck size={13} className="mt-0.5 shrink-0 text-silver" />
        Your details are used only for workshop review and entry.
      </p>
    </form>
  );
}

function RegistrationStatus({ registration }: { registration: NeuralRegistration }) {
  const status = registration.status;
  const approved = status === "approved" && registration.qrValue;
  const copyCode = async () => {
    await navigator.clipboard?.writeText(registration.trackingToken);
    toast.success("Tracking code copied.");
  };

  return (
    <div className="mt-8 rounded-2xl border border-silver/30 bg-card/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
            Registration status
          </div>
          <div className="mt-2 flex items-center gap-2 font-display text-2xl">
            {status === "pending" && <Clock3 size={20} className="text-amber-400" />}
            {status === "approved" && <CheckCircle2 size={20} className="text-emerald-400" />}
            {status === "rejected" && <XCircle size={20} className="text-red-400" />}
            {status === "pending"
              ? "Pending review"
              : status === "approved"
                ? "Approved"
                : "Not approved"}
          </div>
        </div>
        <span className="rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {registration.name}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {status === "pending"
          ? "The Vertex team has your request. Keep this page or your tracking code handy; it will update here after review."
          : status === "approved"
            ? "You are on the list. Keep the QR pass below ready for check-in at the workshop."
            : "The team could not approve this registration. If you think this is a mistake, contact Vertex before the event."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 font-mono text-[10px] tracking-widest text-muted-foreground">
          {registration.trackingToken}
        </code>
        <button
          onClick={copyCode}
          className="btn-ghost rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-widest"
        >
          <Copy size={13} /> Copy code
        </button>
      </div>

      {approved && (
        <div className="mt-5 grid gap-5 border-t border-hairline pt-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="w-fit rounded-xl bg-white p-4">
            <QRCodeSVG
              value={registration.qrValue}
              size={154}
              bgColor="#ffffff"
              fgColor="#10251b"
              level="M"
            />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
              Your entry QR
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Present this code at the door. It is generated only after approval and is linked to
              your registration.
            </p>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {registration.checkedInAt ? "Checked in" : "Ready for check-in"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  inputMode,
  pattern,
  title,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  inputMode?: "tel";
  pattern?: string;
  title?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        title={title}
        required={required}
        className="field-input rounded-lg px-3 py-2.5 text-sm"
      />
    </label>
  );
}

function EventDetail({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: string;
}) {
  return (
    <div className="bg-background p-5">
      <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-silver">{icon}</span>
        {label}
      </dt>
      <dd className="mt-3 text-sm leading-6">{children}</dd>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">{children}</p>;
}
