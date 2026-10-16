import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const hackathonRegisterInput = z.object({
  registrationType: z.enum(["individual", "team"]),
  participantName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(160),
  phone: z.string().trim().min(7, "Phone number too short").max(20).optional().or(z.literal("")),
  collegeOrUsn: z.string().trim().max(100).optional().or(z.literal("")),
  teamName: z.string().trim().max(100).optional().or(z.literal("")),
  teamSize: z.number().int().min(1).max(6).optional().default(1),
  teamMembers: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Teammate name required"),
        email: z.string().trim().email("Invalid teammate email"),
      }),
    )
    .optional()
    .default([]),
  track: z.enum(["SARVAM AI", "ABSCISSA", "OPEN INNOVATION", "TO BE ANNOUNCED"]),
});

export type HackathonRegisterInput = z.infer<typeof hackathonRegisterInput>;

export type RegistrationRecord = {
  id: string;
  code: string;
  registrationType: "individual" | "team";
  participantName: string;
  email: string;
  phone?: string;
  collegeOrUsn?: string;
  teamName?: string;
  teamSize: number;
  teamMembers: Array<{ name: string; email: string }>;
  track: string;
  status: "confirmed";
  registeredAt: string;
};

export const registerForHackathonWorkspace = createServerFn({ method: "POST" })
  .validator((input: unknown) => hackathonRegisterInput.parse(input))
  .handler(async ({ data }) => {
    // Sliding-window burst rate-limit to protect registration desk from spam
    const { clientKey, rateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try {
      rateLimit(await clientKey("hackathon-reg", "hackathon-register"), 10, 60 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(
          `Too many registration attempts. Please retry in ${error.retryAfterSeconds}s.`,
        );
      }
      throw error;
    }

    if (data.registrationType === "team" && !data.teamName) {
      throw new Error("Team name is required for team registrations.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: eventRow, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("slug", "hackathon-workspace")
      .maybeSingle();

    if (eventError) {
      console.error("Could not verify the hackathon registration event", eventError);
      throw new Error("Could not verify the hackathon event. Please try again.");
    }
    if (!eventRow) {
      throw new Error("The hackathon event is not configured for registration.");
    }

    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("event_workspaces")
      .select("registration_open")
      .eq("event_id", eventRow.id)
      .eq("published", true)
      .maybeSingle();

    if (workspaceError) {
      console.error("Could not verify hackathon registration status", workspaceError);
      throw new Error("Could not verify registration status. Please try again.");
    }
    if (!workspace) {
      throw new Error("The hackathon workspace is not configured for registration.");
    }
    if (!workspace.registration_open) {
      throw new Error("Hackathon registration is closed.");
    }

    const metadataTag = data.teamName
      ? `Team: ${data.teamName} [${data.track}] | USN: ${data.collegeOrUsn || "N/A"}`
      : `Track: ${data.track} | USN: ${data.collegeOrUsn || "N/A"}`;
    const { data: savedRegistration, error: registrationError } = await supabaseAdmin
      .from("event_registrations")
      .insert({
        event_id: eventRow.id,
        name: data.participantName,
        email: data.email,
        phone: data.phone || null,
        usn: metadataTag,
      })
      .select("id, code, created_at")
      .single();

    if (registrationError) {
      if (registrationError.code === "23505") {
        throw new Error("This email is already registered for the hackathon.");
      }
      console.error("Could not save the hackathon registration", registrationError);
      throw new Error("Could not save your registration. Please try again.");
    }
    if (!savedRegistration) {
      throw new Error("Could not confirm that your registration was saved.");
    }

    const newRecord: RegistrationRecord = {
      id: savedRegistration.id,
      code: savedRegistration.code,
      registrationType: data.registrationType,
      participantName: data.participantName,
      email: data.email,
      phone: data.phone || undefined,
      collegeOrUsn: data.collegeOrUsn || undefined,
      teamName: data.teamName || undefined,
      teamSize: data.registrationType === "team" ? Math.max(2, data.teamMembers.length + 1) : 1,
      teamMembers: data.teamMembers,
      track: data.track,
      status: "confirmed",
      registeredAt: savedRegistration.created_at,
    };

    return {
      success: true,
      registration: newRecord,
      message: `Registration confirmed for ${data.participantName} (${data.track} Track). Keep your registration pass code handy for on-site check-in.`,
    };
  });

/**
 * Organizer-only: Returns the verified list of hackathon registrations.
 * Protected with Supabase Auth + staff role check.
 */
export const getHackathonWorkspaceRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    await assertStaff(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: eventRow, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("slug", "hackathon-workspace")
      .maybeSingle();
    if (eventError) {
      console.error("Could not load the hackathon registration event", eventError);
      throw new Error("Could not load hackathon registrations. Please try again.");
    }
    if (!eventRow) return [];

    const { data: rows, error: registrationsError } = await supabaseAdmin
      .from("event_registrations")
      .select("id, code, name, email, phone, usn, created_at")
      .eq("event_id", eventRow.id)
      .order("created_at", { ascending: false });
    if (registrationsError) {
      console.error("Could not load hackathon registrations", registrationsError);
      throw new Error("Could not load hackathon registrations. Please try again.");
    }

    return (rows ?? []).map((r) => {
      const isTeam = Boolean(r.usn?.startsWith("Team:"));
      const teamMatch = r.usn?.match(/Team:\s*(.*?)\s*\[/);
      const trackMatch = r.usn?.match(/\[([^\]]+)\]/) || r.usn?.match(/Track:\s*([^|]+)/);

      return {
        id: r.id,
        code: r.code,
        registrationType: (isTeam ? "team" : "individual") as "individual" | "team",
        participantName: r.name,
        email: r.email,
        phone: r.phone ?? undefined,
        collegeOrUsn: r.usn ?? undefined,
        teamName: teamMatch ? teamMatch[1].trim() : undefined,
        teamSize: isTeam ? 2 : 1,
        teamMembers: [],
        track: trackMatch ? trackMatch[1].trim() : "SARVAM AI",
        status: "confirmed" as const,
        registeredAt: r.created_at,
      };
    });
  });

/**
 * Check if the current visitor is an authenticated organizer
 */
export const getHackathonWorkspaceViewer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadViewer } = await import("@/lib/roles.server");
    const viewer = await loadViewer(context.supabase, context.userId);
    return {
      isAuthenticated: true,
      isOrganizer: viewer.isAdmin || viewer.isHead,
      name: viewer.member?.name ?? "Staff",
      roles: viewer.roles,
    };
  });
