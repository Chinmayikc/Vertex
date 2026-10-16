import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NeuralRegistrationStatus = "pending" | "approved" | "rejected";

export type NeuralRegistration = {
  id: string;
  name: string;
  srn: string;
  department: string;
  phone: string;
  email: string;
  year: string;
  attendReason: string;
  expectation: string;
  status: NeuralRegistrationStatus;
  trackingToken: string;
  qrValue: string | null;
  checkedInAt: string | null;
  createdAt: string;
};

const registrationFields =
  "id, name, srn, department, phone, email, year, attend_reason, expectation, status, tracking_token, qr_token, checked_in_at, created_at";

const registrationInput = z.object({
  name: z.string().trim().min(2).max(100),
  srn: z.string().trim().min(2).max(40),
  department: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9() -]{6,29}$/, "Enter a valid phone number."),
  email: z.string().trim().email().max(160),
  year: z.enum(["1st Year", "2nd Year", "3rd Year"]),
  attendReason: z.string().trim().min(2).max(500),
  expectation: z.string().trim().min(2).max(2000),
});

function toRegistration(row: {
  id: string;
  name: string;
  srn: string;
  department: string;
  phone: string;
  email: string;
  year: string;
  attend_reason: string;
  expectation: string;
  status: string;
  tracking_token: string;
  qr_token: string | null;
  checked_in_at: string | null;
  created_at: string;
}): NeuralRegistration {
  return {
    id: row.id,
    name: row.name,
    srn: row.srn,
    department: row.department,
    phone: row.phone,
    email: row.email,
    year: row.year,
    attendReason: row.attend_reason,
    expectation: row.expectation,
    status: row.status as NeuralRegistrationStatus,
    trackingToken: row.tracking_token,
    qrValue: row.status === "approved" && row.qr_token ? `VTX-NN:${row.qr_token}` : null,
    checkedInAt: row.checked_in_at,
    createdAt: row.created_at,
  };
}

export const submitNeuralNetworkRegistration = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registrationInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .insert({
        name: data.name,
        srn: data.srn,
        department: data.department,
        phone: data.phone,
        email: data.email.toLowerCase(),
        year: data.year,
        attend_reason: data.attendReason,
        expectation: data.expectation,
      })
      .select(registrationFields)
      .single();

    if (error || !row) {
      if (error?.code === "23505" && error.message.includes("srn")) {
        throw new Error(
          "This SRN is already registered. Use its tracking code to check the status.",
        );
      }
      if (error?.code === "23514" && error.message.includes("phone")) {
        throw new Error("Enter a valid phone number and try again.");
      }
      throw new Error("Could not save your registration. Please try again.");
    }
    return toRegistration(row);
  });

export const getNeuralNetworkRegistration = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ trackingToken: z.string().trim().min(20).max(100) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .select(registrationFields)
      .eq("tracking_token", data.trackingToken)
      .maybeSingle();

    if (error || !row) throw new Error("We couldn't find a registration with that tracking code.");
    return toRegistration(row);
  });

export const myNeuralNetworkRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string })?.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .select(registrationFields)
      .ilike("email", email)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Could not load your workshop registrations.");
    return (data ?? []).map(toRegistration);
  });

export const listNeuralNetworkRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase
      .from("neural_network_workshop_registrations")
      .select(
        "id, name, srn, department, phone, email, year, attend_reason, expectation, status, checked_in_at, created_at, reviewed_at",
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error("Could not load Neural Networks registrations.");
    return data ?? [];
  });

export const setNeuralNetworkRegistrationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);

    const { data: existing, error: existingError } = await context.supabase
      .from("neural_network_workshop_registrations")
      .select("qr_token")
      .eq("id", data.id)
      .single();
    if (existingError || !existing) throw new Error("Registration not found.");

    const qrToken =
      data.status === "approved"
        ? (existing.qr_token ?? `nn-${crypto.randomUUID().replaceAll("-", "")}`)
        : null;
    const { error } = await context.supabase
      .from("neural_network_workshop_registrations")
      .update({
        status: data.status,
        qr_token: qrToken,
        reviewed_at: data.status === "pending" ? null : new Date().toISOString(),
        reviewed_by: data.status === "pending" ? null : context.userId,
      })
      .eq("id", data.id);

    if (error) throw new Error("Could not update that registration.");
    return { ok: true };
  });
