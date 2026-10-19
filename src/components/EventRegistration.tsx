import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { registerForEvent } from "@/lib/club.functions";

export type EventPass = {
  code: string | null;
  status: "pending" | "approved" | "rejected" | "waitlisted";
  event: { title: string; date: string | null; location: string };
};

export function EventRegistrationForm({
  slug,
  onDone,
}: {
  slug: string;
  onDone: (pass: EventPass) => void;
}) {
  const register = useServerFn(registerForEvent);
  const [sending, setSending] = useState(false);

  return (
    <form
      className="mt-6 grid gap-4 border border-hairline bg-card/40 p-5 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSending(true);
        try {
          const result = await register({
            data: {
              eventSlug: slug,
              name: String(form.get("name") ?? ""),
              email: String(form.get("email") ?? ""),
              phone: String(form.get("phone") ?? ""),
              usn: String(form.get("usn") ?? ""),
            },
          });
          onDone(result);
        } catch {
          toast.error("Registration failed. Check your details and try again.");
        } finally {
          setSending(false);
        }
      }}
    >
      {[
        { name: "name", label: "Full name", required: true, type: "text" },
        { name: "email", label: "Email", required: true, type: "email" },
        { name: "phone", label: "Phone", required: false, type: "text" },
        { name: "usn", label: "USN", required: false, type: "text" },
      ].map((field) => (
        <label key={field.name} className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {field.label}
          </span>
          <input
            name={field.name}
            type={field.type}
            required={field.required}
            className="border border-hairline bg-background px-3 py-2 font-mono text-sm focus:border-silver focus:outline-none"
          />
        </label>
      ))}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={sending}
          className="border border-silver bg-foreground px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-background disabled:opacity-50"
        >
          {sending ? "Reserving…" : "Get my pass →"}
        </button>
      </div>
    </form>
  );
}

export function EventPassCard({ pass, onClose }: { pass: EventPass; onClose: () => void }) {
  const passIssued = pass.code !== null;

  return (
    <div className="mt-8 grid gap-6 border border-silver/40 bg-card/60 p-6 md:grid-cols-[auto_1fr]">
      {pass.code && (
        <div className="bg-white p-4">
          <QRCodeSVG value={pass.code} size={168} bgColor="#ffffff" fgColor="#000000" level="M" />
        </div>
      )}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver">
          {passIssued
            ? "Entry pass · confirmed"
            : pass.status === "pending"
              ? "Registration · pending review"
              : "Registration · confirmed"}
        </div>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          {pass.event.title}
        </h2>
        <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {pass.event.date ? new Date(pass.event.date).toDateString() : "Date TBA"} ·{" "}
          {pass.event.location}
        </div>
        {pass.code ? (
          <>
            <div className="mt-6 break-all border border-hairline bg-background px-4 py-3 font-mono text-sm text-foreground">
              {pass.code}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Screenshot this. Show the code at the door and a team head scans you in.
            </p>
          </>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            {pass.status === "pending"
              ? "Your registration is awaiting review. If approved, your entry pass will be sent by email."
              : "Your registration is confirmed. An entry pass is not available for this event."}
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-5 border border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:border-silver"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
