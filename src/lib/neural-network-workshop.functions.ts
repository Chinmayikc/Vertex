import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { NEURAL_NETWORK_ATTEND_REASONS, NEURAL_NETWORK_WORKSHOP_YEARS } from "@/data/neural-network-workshop";

const attendReason = z.enum(NEURAL_NETWORK_ATTEND_REASONS);
const registrationInput = z.object({
  name: z.string().trim().min(1).max(100), srn: z.string().trim().min(1).max(40),
  department: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  email: z.string().trim().email().max(160), year: z.enum(NEURAL_NETWORK_WORKSHOP_YEARS),
  attendReason: z.array(attendReason).min(1).max(2), expectation: z.string().trim().min(1).max(3000),
});

export type NeuralNetworkWorkshopRegistration = {
  id: string; name: string; srn: string; department: string; phone: string; email: string; year: string;
  attend_reason: string; expectation: string; qr_token: string | null; status: "pending" | "approved" | "rejected";
  created_at: string; checked_in_at: string | null; pass_sent_at: string | null;
};
export type WorkshopStaff = { id: string; email: string; permission: "manager" | "checkin" | "viewer"; active: boolean; created_at: string };

const codeValue = (token: string) => `VTX-NN:${token}`;
const passUrl = (token: string) => `${process.env["SITE_URL"] ?? "https://vertex-club.vercel.app"}/passes/neural-networks-from-scratch/${token}`;

export const registerForNeuralNetworkWorkshop = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registrationInput.parse(input))
  .handler(async ({ data }) => {
    const { clientKey, rateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try { rateLimit(await clientKey("neural-network-workshop", "registration"), 5, 60 * 60 * 1000); }
    catch (error) { if (error instanceof RateLimitError) throw new Error(`Too many registration attempts. Try again in ${error.retryAfterSeconds}s.`); throw error; }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = `nn-${crypto.randomUUID().replaceAll("-", "")}`;
    const { data: row, error } = await supabaseAdmin.from("neural_network_workshop_registrations").insert({
      name: data.name, srn: data.srn.toUpperCase(), department: data.department, phone: data.phone,
      email: data.email.toLowerCase(), year: data.year, attend_reason: data.attendReason.join(" | "), expectation: data.expectation,
      status: "approved", qr_token: token,
    }).select("qr_token, status").single();
    if (error?.code === "23505") throw new Error("You have already registered for this workshop with this SRN.");
    if (error) throw new Error("Could not save your registration. Please try again.");
    const { sendWorkshopPassEmail } = await import("@/lib/workshop-email.server");
    const sent = row.status === "approved" && row.qr_token && await sendWorkshopPassEmail({ name: data.name, email: data.email.toLowerCase(), code: codeValue(row.qr_token), passUrl: passUrl(row.qr_token) });
    if (sent && row.qr_token) await supabaseAdmin.from("neural_network_workshop_registrations").update({ pass_sent_at: new Date().toISOString() }).eq("qr_token", row.qr_token);
    return { ok: true, code: codeValue(row.qr_token ?? token), passUrl: passUrl(row.qr_token ?? token), emailSent: Boolean(sent) };
  });

async function currentEmail(context: { supabase: any }) {
  const { data } = await context.supabase.auth.getUser();
  return data.user?.email?.trim().toLowerCase() ?? "";
}
async function workshopPermission(context: { supabase: any; userId: string }) {
  const { loadViewer } = await import("@/lib/roles.server");
  const viewer = await loadViewer(context.supabase, context.userId);
  if (viewer.isAdmin) return "manager" as const;
  const email = await currentEmail(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("neural_network_workshop_staff").select("permission").eq("email", email).eq("active", true).maybeSingle();
  return data?.permission ?? null;
}
async function requireWorkshopAccess(context: { supabase: any; userId: string }, levels: string[]) {
  const permission = await workshopPermission(context);
  if (!permission || !levels.includes(permission)) throw new Error("You do not have access to this workshop operation.");
  return permission;
}

export const listNeuralNetworkWorkshopRegistrations = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<NeuralNetworkWorkshopRegistration[]> => {
  await requireWorkshopAccess(context, ["manager", "checkin", "viewer"]);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("neural_network_workshop_registrations").select("id, name, srn, department, phone, email, year, attend_reason, expectation, qr_token, status, created_at, checked_in_at, pass_sent_at").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load workshop registrations."); return (data ?? []) as NeuralNetworkWorkshopRegistration[];
});

export const checkInNeuralNetworkWorkshop = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().trim().min(8).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireWorkshopAccess(context, ["manager", "checkin"]);
    const raw = data.code.trim().split("/").pop() ?? data.code.trim();
    const code = raw.replace(/^VTX-NN:/i, "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("neural_network_workshop_registrations").select("id, name, srn, status, checked_in_at").eq("qr_token", code).maybeSingle();
    if (error || !row || row.status !== "approved") return { status: "invalid" as const };
    if (row.checked_in_at) return { status: "already" as const, name: row.name, srn: row.srn, at: row.checked_in_at };
    const at = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin.from("neural_network_workshop_registrations").update({ checked_in_at: at, checked_in_by: context.userId }).eq("id", row.id).is("checked_in_at", null);
    if (updateError) throw new Error("Could not record that check-in.");
    return { status: "ok" as const, name: row.name, srn: row.srn, at };
  });

export const setNeuralNetworkWorkshopStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "rejected"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireWorkshopAccess(context, ["manager"]); const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("neural_network_workshop_registrations").update({ status: data.status, reviewed_at: new Date().toISOString(), reviewed_by: context.userId }).eq("id", data.id);
    if (error) throw new Error("Could not update registration status."); return { ok: true };
  });

export const resendNeuralNetworkWorkshopPass = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireWorkshopAccess(context, ["manager"]); const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("neural_network_workshop_registrations").select("name, email, qr_token, status").eq("id", data.id).single();
    if (error || row.status !== "approved") throw new Error("Only approved attendees can receive a pass.");
    const { sendWorkshopPassEmail } = await import("@/lib/workshop-email.server");
    if (!row.qr_token) throw new Error("This registration has no entry pass yet.");
    const sent = await sendWorkshopPassEmail({ name: row.name, email: row.email, code: codeValue(row.qr_token), passUrl: passUrl(row.qr_token) });
    if (!sent) throw new Error("Pass email could not be sent. Configure Resend or the Vertex Gmail SMTP settings in Vercel.");
    await supabaseAdmin.from("neural_network_workshop_registrations").update({ pass_sent_at: new Date().toISOString() }).eq("id", data.id); return { ok: true };
  });

export const getNeuralNetworkWorkshopPass = createServerFn({ method: "GET" }).inputValidator((input: unknown) => z.object({ code: z.string().trim().min(8).max(80) }).parse(input)).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin.from("neural_network_workshop_registrations").select("name, qr_token, status").eq("qr_token", data.code).maybeSingle();
  if (!row || row.status !== "approved" || !row.qr_token) return null;
  return { name: row.name, code: codeValue(row.qr_token) };
});

export const listNeuralNetworkWorkshopStaff = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<WorkshopStaff[]> => {
  await requireWorkshopAccess(context, ["manager"]); const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("neural_network_workshop_staff").select("id, email, permission, active, created_at").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load event staff."); return (data ?? []) as WorkshopStaff[];
});

export const saveNeuralNetworkWorkshopStaff = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ email: z.string().trim().email().max(160), permission: z.enum(["manager", "checkin", "viewer"]), active: z.boolean().default(true) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireWorkshopAccess(context, ["manager"]); const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("neural_network_workshop_staff").upsert({ email: data.email.toLowerCase(), permission: data.permission, active: data.active, created_by: context.userId }, { onConflict: "email" });
    if (error) throw new Error("Could not save event staff access."); return { ok: true };
  });
