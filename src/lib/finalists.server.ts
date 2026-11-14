import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { setResponseHeader } from "@tanstack/react-start/server";
import { verifiedGoogleEmail, uniqueLeader, submissionOpen } from "./finalists.validation";
import type { FinalistDatabase } from "./finalists.types";
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
  const finalists = checked(
    await db.from("event_finalists").select("team_id").eq("event_id", event.id),
  );
  const teams = finalists.length
    ? checked(
        await db
          .from("hackathon_teams")
          .select("id,event_id,name,lead_name,lead_email")
          .eq("event_id", event.id)
          .in(
            "id",
            finalists.map((r) => r.team_id),
          ),
      )
    : [];
  try {
    return { event, settings, team: uniqueLeader(teams, email), user: user! };
  } catch (e) {
    throw new Error(
      `${e instanceof Error ? e.message : "Access denied."} ${settings.organizer_contact}`,
    );
  }
}
export async function teamDetails(teamId: string, eventId: string) {
  const team = checked(
    await db
      .from("hackathon_teams")
      .select("id,name,lead_name")
      .eq("event_id", eventId)
      .eq("id", teamId)
      .single(),
  );
  const members = checked(
    await db
      .from("hackathon_team_members")
      .select("name,is_lead")
      .eq("team_id", teamId)
      .order("created_at"),
  );
  const idea = optional(
    await db
      .from("hackathon_submissions")
      .select(
        "solution_title,theme,problem_statement_title,solution_summary,problem_statement_id,submitted_at",
      )
      .eq("team_id", teamId)
      .maybeSingle(),
  );
  const submission = optional(
    await db
      .from("final_project_submissions")
      .select("*")
      .eq("event_id", eventId)
      .eq("team_id", teamId)
      .maybeSingle(),
  );
  return { team, members, idea, submission };
}
export function requireWindow(settings: Parameters<typeof submissionOpen>[0]) {
  if (!submissionOpen(settings))
    throw new Error("Final submissions are closed. Your last successful submission is preserved.");
}
