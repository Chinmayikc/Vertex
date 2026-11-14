import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { setResponseHeader } from "@tanstack/react-start/server";
import { verifiedGoogleEmail, uniqueLeader, submissionOpen } from "./finalists.validation";
import type { FinalistDatabase } from "./finalists.types";

type Registration = {
  id: string;
  event_id: string;
  name: string;
  email: string;
  status: string;
  form_data: unknown;
  created_at: string;
};

export const db = supabaseAdmin as unknown as SupabaseClient<FinalistDatabase>;
export const BUCKET = "finalist-decks";
export function privateResponse() {
  setResponseHeader("Cache-Control", "private, no-store, max-age=0");
  setResponseHeader("Vary", "Authorization, Cookie");
}
export function checked<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data == null) throw new Error("Expected database result was not returned.");
  return result.data;
}
export function optional<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function configuration() {
  const event = optional(
    await db.from("events").select("id,title").eq("slug", "build-with-sarvam").maybeSingle(),
  );
  if (!event)
    throw new Error("Build with Sarvam has not been configured. Contact the Vertex organizers.");
  const settings = optional(
    await db.from("finalist_settings").select("*").eq("event_id", event.id).maybeSingle(),
  );
  if (!settings)
    throw new Error("The finalist dashboard is not available yet. Contact the Vertex organizers.");
  return { event, settings };
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function requiredText(form: Record<string, unknown>, field: string) {
  const value = form[field];
  if (typeof value !== "string" || !value.trim())
    throw new Error(`An approved Build with Sarvam registration is missing ${field}.`);
  return value.trim();
}

function registrationSnapshot(row: Registration) {
  if (row.status !== "approved")
    throw new Error("This registration is no longer an approved finalist.");
  const form = object(row.form_data);
  if (!form) throw new Error("The approved registration has invalid team data.");
  const teamName = requiredText(form, "team_name");
  const rawMembers = form.members;
  if (!Array.isArray(rawMembers) || rawMembers.length !== 4)
    throw new Error(`Approved team ${teamName} must have four recorded members.`);
  const members = rawMembers.map((raw) => {
    const member = object(raw);
    if (!member || typeof member.name !== "string" || typeof member.is_lead !== "boolean")
      throw new Error(`Approved team ${teamName} has an invalid member record.`);
    return {
      name: member.name.trim(),
      email: typeof member.email === "string" ? member.email.trim() : "",
      is_lead: member.is_lead,
    };
  });
  const leads = members.filter((member) => member.is_lead);
  if (
    leads.length !== 1 ||
    !leads[0].email ||
    leads[0].email.trim().toLowerCase() !== row.email.trim().toLowerCase()
  )
    throw new Error(`Approved team ${teamName} has an ambiguous registered leader.`);
  const lead = leads[0];

  return {
    team: {
      id: row.id,
      event_id: row.event_id,
      name: teamName,
      lead_name: lead.name || row.name,
      lead_email: row.email,
    },
    members: members.map(({ name, is_lead }) => ({ name, is_lead })),
    idea: {
      solution_title: requiredText(form, "project_title"),
      theme: requiredText(form, "track"),
      problem_statement_title: requiredText(form, "problem"),
      solution_summary: requiredText(form, "solution"),
      innovation: typeof form.innovation === "string" ? form.innovation : null,
      ai_use: typeof form.ai_use === "string" ? form.ai_use : null,
      beneficiaries: typeof form.beneficiaries === "string" ? form.beneficiaries : null,
      submission_type: typeof form.submission_type === "string" ? form.submission_type : null,
      prize: typeof form.prize === "string" ? form.prize : null,
      submitted_at: row.created_at,
    },
  };
}

async function finalistRegistrations(eventId: string) {
  const allowlist = checked(
    await db.from("event_finalists").select("team_id").eq("event_id", eventId),
  );
  if (!allowlist.length) return [];
  return checked(
    await db
      .from("event_registrations")
      .select("id,event_id,name,email,status,form_data,created_at")
      .eq("event_id", eventId)
      .eq("status", "approved")
      .in(
        "id",
        allowlist.map((row) => row.team_id),
      ),
  ) as Registration[];
}

export async function resolveFinalist(client: SupabaseClient, claims: Record<string, unknown>) {
  privateResponse();
  const { event, settings } = await configuration();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  let email: string;
  try {
    if (error) throw error;
    email = verifiedGoogleEmail(user, claims);
  } catch {
    throw new Error(
      `Sign in with your verified Google leader account. ${settings.organizer_contact}`,
    );
  }
  if (!settings.dashboard_enabled)
    throw new Error(`The finalist dashboard is not open yet. ${settings.organizer_contact}`);
  const registrations = await finalistRegistrations(event.id);
  const teams = registrations.map(registrationSnapshot).map((record) => record.team);
  try {
    return { event, settings, team: uniqueLeader(teams, email), user: user! };
  } catch (e) {
    throw new Error(
      `${e instanceof Error ? e.message : "Access denied."} ${settings.organizer_contact}`,
    );
  }
}

export async function teamDetails(teamId: string, eventId: string) {
  const registration = checked(
    await db
      .from("event_registrations")
      .select("id,event_id,name,email,status,form_data,created_at")
      .eq("event_id", eventId)
      .eq("id", teamId)
      .eq("status", "approved")
      .single(),
  ) as Registration;
  const { team, members, idea } = registrationSnapshot(registration);
  const submission = optional(
    await db
      .from("final_project_submissions")
      .select("*")
      .eq("event_id", eventId)
      .eq("team_id", teamId)
      .maybeSingle(),
  );
  const { lead_email: _private, ...publicTeam } = team;
  return { team: publicTeam, members, idea, submission };
}

export async function reviewFinalistRows(eventId: string) {
  const registrations = await finalistRegistrations(eventId);
  if (!registrations.length) return [];
  const ids = registrations.map((row) => row.id);
  const submissions = checked(
    await db
      .from("final_project_submissions")
      .select("*")
      .eq("event_id", eventId)
      .in("team_id", ids),
  );
  return registrations
    .map((row) => {
      const { team, members, idea } = registrationSnapshot(row);
      const { lead_email: _private, ...publicTeam } = team;
      return {
        team: publicTeam,
        members,
        idea,
        submission: submissions.find((submission) => submission.team_id === row.id) ?? null,
      };
    })
    .sort((a, b) => a.team.name.localeCompare(b.team.name));
}

export function requireWindow(settings: Parameters<typeof submissionOpen>[0]) {
  if (!submissionOpen(settings))
    throw new Error("Final submissions are closed. Your last successful submission is preserved.");
}
