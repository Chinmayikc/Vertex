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

// In-memory registration registry for the hackathon workspace (starts empty)
const registeredList: RegistrationRecord[] = [];

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

    // Check for duplicate email in this hackathon track
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = registeredList.find(
      (r) => r.email.toLowerCase() === normalizedEmail && r.track === data.track,
    );
    if (existing) {
      throw new Error(
        `Participant with email ${data.email} is already registered for the ${data.track} track.`,
      );
    }

    if (data.registrationType === "team" && !data.teamName) {
      throw new Error("Team name is required for team registrations.");
    }

    const regCode = `VTX-HACK-${Math.floor(1000 + Math.random() * 9000)}`;

    // Try persisting to Supabase if configured
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // Check if events table has the hackathon
      const { data: eventRow } = await supabaseAdmin
        .from("events")
        .select("id")
        .eq("slug", "hackathon-workspace")
        .maybeSingle();

      if (eventRow) {
        const metadataTag = data.teamName
          ? `Team: ${data.teamName} [${data.track}] | USN: ${data.collegeOrUsn || "N/A"}`
          : `Track: ${data.track} | USN: ${data.collegeOrUsn || "N/A"}`;

        await supabaseAdmin.from("event_registrations").insert({
          event_id: eventRow.id,
          name: data.participantName,
          email: data.email,
          phone: data.phone || null,
          usn: metadataTag,
          code: regCode,
        });
      }
    } catch {
      // Supabase is optional in standalone/offline mode; fall back gracefully to the server registry
    }

    const newRecord: RegistrationRecord = {
      id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      code: regCode,
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
      registeredAt: new Date().toISOString(),
    };

    registeredList.push(newRecord);

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

    // Try fetching from database if configured
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: eventRow } = await supabaseAdmin
        .from("events")
        .select("id")
        .eq("slug", "hackathon-workspace")
        .maybeSingle();

      if (eventRow) {
        const { data: rows } = await supabaseAdmin
          .from("event_registrations")
          .select("id, code, name, email, phone, usn, created_at")
          .eq("event_id", eventRow.id)
          .order("created_at", { ascending: false });

        if (rows && rows.length > 0) {
          return rows.map((r) => {
            const isTeam = Boolean(r.usn?.startsWith("Team:"));
            const teamMatch = r.usn?.match(/Team:\s*([^[\s|]+)/);
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
        }
      }
    } catch {
      // Return server in-memory list
    }

    return registeredList;
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
