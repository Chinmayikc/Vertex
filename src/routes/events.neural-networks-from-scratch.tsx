import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FormEvent, useState } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  NEURAL_NETWORK_ATTEND_REASONS,
  NEURAL_NETWORK_WORKSHOP,
  NEURAL_NETWORK_WORKSHOP_YEARS,
  type NeuralNetworkAttendReason,
} from "@/data/neural-network-workshop";
import { registerForNeuralNetworkWorkshop } from "@/lib/neural-network-workshop.functions";

export const Route = createFileRoute("/events/neural-networks-from-scratch")({
  head: () => ({
    meta: [
      { title: `${NEURAL_NETWORK_WORKSHOP.title} — Vertex` },
      {
        name: "description",
        content:
          "Register for Vertex Club's neural networks workshop at REVA University on 28 October 2026.",
      },
    ],
  }),
  component: NeuralNetworkWorkshopPage,
});

type FormValues = {
  name: string;
  srn: string;
  department: string;
  phone: string;
  email: string;
  year: string;
  attendReason: NeuralNetworkAttendReason[];
  expectation: string;
};

type FormErrors = Partial<Record<keyof FormValues | "form", string>>;

const initialValues: FormValues = {
  name: "",
  srn: "",
  department: "",
  phone: "",
  email: "",
  year: NEURAL_NETWORK_WORKSHOP_YEARS[0],
  attendReason: [],
  expectation: "",
};

function NeuralNetworkWorkshopPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const register = useServerFn(registerForNeuralNetworkWorkshop);

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    setSuccess(false);
  };

  const toggleReason = (reason: NeuralNetworkAttendReason) => {
    const selected = values.attendReason.includes(reason)
      ? values.attendReason.filter((item) => item !== reason)
      : values.attendReason.length < 2
        ? [...values.attendReason, reason]
        : values.attendReason;
    update("attendReason", selected);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        data: {
          ...values,
          year: values.year as (typeof NEURAL_NETWORK_WORKSHOP_YEARS)[number],
        },
      });
      setValues(initialValues);
      setErrors({});
      setSuccess(true);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Could not submit your registration.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <Atmosphere />
          <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 md:pb-24 md:pt-28">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-silver">
              {NEURAL_NETWORK_WORKSHOP.type} · Vertex Club
            </div>
            <h1 className="mt-5 max-w-5xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-7xl">
              {NEURAL_NETWORK_WORKSHOP.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {NEURAL_NETWORK_WORKSHOP.description}
            </p>

            <dl className="mt-10 grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
              <EventDetail label="Date" value={NEURAL_NETWORK_WORKSHOP.date} />
              <EventDetail label="Time" value={NEURAL_NETWORK_WORKSHOP.time} />
              <EventDetail label="Venue" value={NEURAL_NETWORK_WORKSHOP.venue} />
              <EventDetail label="Speaker" value={NEURAL_NETWORK_WORKSHOP.speaker} />
            </dl>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Organized by {NEURAL_NETWORK_WORKSHOP.organizedBy}
            </p>
          </div>
        </section>

        <section id="register" className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-silver" />
            Registration
          </div>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Reserve your seat.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Fill in your details below. Select up to two reasons for attending so the workshop can
            meet you where you are.
          </p>

          {success && (
            <div role="status" className="mt-8 border border-silver/50 bg-card/60 p-5 text-sm">
              <p className="font-semibold text-silver">Registration confirmed.</p>
              <p className="mt-2 text-muted-foreground">
                See you on {NEURAL_NETWORK_WORKSHOP.date}, {NEURAL_NETWORK_WORKSHOP.time} at{" "}
                {NEURAL_NETWORK_WORKSHOP.venue}.
              </p>
            </div>
          )}

          <form
            noValidate
            className="mt-8 grid gap-5 border border-hairline bg-card/40 p-6 md:grid-cols-2"
            onSubmit={submit}
          >
            <TextField
              label="Name"
              id="name"
              value={values.name}
              onChange={(value) => update("name", value)}
              error={errors.name}
            />
            <TextField
              label="SRN"
              id="srn"
              value={values.srn}
              onChange={(value) => update("srn", value)}
              error={errors.srn}
            />
            <TextField
              label="Department"
              id="department"
              value={values.department}
              onChange={(value) => update("department", value)}
              error={errors.department}
            />
            <TextField
              label="Phone number"
              id="phone"
              type="tel"
              value={values.phone}
              onChange={(value) => update("phone", value)}
              error={errors.phone}
            />
            <TextField
              label="Email"
              id="email"
              type="email"
              value={values.email}
              onChange={(value) => update("email", value)}
              error={errors.email}
            />
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Year
              </span>
              <select
                id="year"
                name="year"
                required
                value={values.year}
                onChange={(event) => update("year", event.target.value)}
                aria-invalid={Boolean(errors.year)}
                aria-describedby={errors.year ? "year-error" : undefined}
                className="field-input rounded-lg px-3 py-2.5 text-sm"
              >
                {NEURAL_NETWORK_WORKSHOP_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.year && <FieldError id="year-error" message={errors.year} />}
            </label>

            <fieldset
              className="md:col-span-2"
              aria-describedby={errors.attendReason ? "attend-reason-error" : undefined}
            >
              <legend className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                What makes you attend the workshop?{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </legend>
              <div className="mt-3 grid gap-2">
                {NEURAL_NETWORK_ATTEND_REASONS.map((reason) => {
                  const checked = values.attendReason.includes(reason);
                  const disabled = !checked && values.attendReason.length >= 2;
                  return (
                    <label
                      key={reason}
                      className={`flex items-start gap-3 border border-hairline bg-background px-3 py-3 text-sm ${disabled ? "opacity-50" : "hover:border-silver"}`}
                    >
                      <input
                        name="attendReason"
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleReason(reason)}
                        className="mt-1 accent-[var(--silver)]"
                      />
                      <span>{reason}</span>
                    </label>
                  );
                })}
              </div>
              {errors.attendReason && (
                <FieldError id="attend-reason-error" message={errors.attendReason} />
              )}
            </fieldset>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                What do you expect from the workshop?{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </span>
              <textarea
                id="expectation"
                name="expectation"
                required
                rows={5}
                value={values.expectation}
                onChange={(event) => update("expectation", event.target.value)}
                aria-invalid={Boolean(errors.expectation)}
                aria-describedby={errors.expectation ? "expectation-error" : undefined}
                className="field-input resize-none rounded-lg px-3 py-2.5 text-sm"
              />
              {errors.expectation && (
                <FieldError id="expectation-error" message={errors.expectation} />
              )}
            </label>

            {errors.form && (
              <div className="md:col-span-2">
                <FieldError id="form-error" message={errors.form} />
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-fit rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest md:col-span-2"
            >
              {submitting ? "Submitting…" : "Register for the workshop →"}
            </button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function EventDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-4">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-relaxed">{value}</dd>
    </div>
  );
}

function TextField({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
}: {
  label: string;
  id: keyof FormValues;
  type?: "text" | "tel" | "email";
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="field-input rounded-lg px-3 py-2.5 text-sm"
      />
      {error && <FieldError id={errorId} message={error} />}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <span id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </span>
  );
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const required: (keyof Pick<FormValues, "name" | "srn" | "department" | "year">)[] = [
    "name",
    "srn",
    "department",
    "year",
  ];
  for (const field of required) {
    if (!values[field].trim()) errors[field] = "This field is required.";
  }
  if (!/^[6-9]\d{9}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.attendReason.length === 0) {
    errors.attendReason = "Select at least one reason.";
  } else if (values.attendReason.length > 2) {
    errors.attendReason = "Select no more than two reasons.";
  }
  if (!values.expectation.trim()) errors.expectation = "Tell us what you expect from the workshop.";
  return errors;
}
