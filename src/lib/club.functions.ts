import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Directory, Member, Team } from "@/data/team";

type Row = {
  id: string;
  slug: string;
  name: string;
  role: string;
  team_id: string | null;
  is_head: boolean;
  is_leadership: boolean;
  photo_url: string | null;
  bio: string | null;
  skills: string[] | null;
  links: unknown;
  sort_order: number;
};

function toMember(r: Row, teamName: string | null): Member {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    role: r.role,
    teamId: r.team_id,
    team: teamName,
    isHead: r.is_head,
    isLeadership: r.is_leadership,
    photo: r.photo_url,
    bio: r.bio,
    skills: r.skills ?? [],
    links: (r.links as Record<string, string>) ?? {},
  };
}

export const getDirectory = createServerFn({ method: "GET" }).handler(
  async (): Promise<Directory> => {
    const { serverPublicClient } = await import("@/lib/supabase-public.server");
    const supabase = serverPublicClient();

    const [teamsRes, membersRes] = await Promise.all([
      supabase.from("teams").select("*").order("sort_order"),
      supabase.from("members").select("*").order("sort_order"),
    ]);
    if (teamsRes.error) throw teamsRes.error;
    if (membersRes.error) throw membersRes.error;

    const teamRows = teamsRes.data ?? [];
    const rows = (membersRes.data ?? []) as Row[];
    const nameById = new Map(teamRows.map((t) => [t.id, t.name]));

    const all = rows.map((r) =>
      toMember(r, r.team_id ? (nameById.get(r.team_id) ?? null) : "Leadership"),
    );

    const teams: Team[] = teamRows.map((t) => {
      const mine = all.filter((m) => m.teamId === t.id);
      return {
        id: t.id,
        name: t.name,
        code: t.code,
        blurb: t.blurb,
        head: mine.find((m) => m.isHead),
        members: mine.filter((m) => !m.isHead),
      };
    });

    return {
      teams,
      leadership: all.filter((m) => m.isLeadership),
      all,
    };
  },
);

export const getEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { serverPublicClient } = await import("@/lib/supabase-public.server");
  const { data, error } = await serverPublicClient()
    .from("events")
    .select("id, slug, title, event_date, start_time, location, tag, description, cover_url")
    .eq("published", true)
    .order("event_date");
  if (error) throw error;
  return data ?? [];
});

export const getAchievements = createServerFn({ method: "GET" }).handler(async () => {
  const { serverPublicClient } = await import("@/lib/supabase-public.server");
  const { data, error } = await serverPublicClient()
    .from("achievements")
    .select("id, title, description, happened_on")
    .order("happened_on", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { serverPublicClient } = await import("@/lib/supabase-public.server");
  const { data, error } = await serverPublicClient()
    .from("projects")
    .select("id, slug, title, description, tech, cover_url, link, year")
    .eq("published", true)
    .order("year", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

const applicationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  usn: z.string().trim().max(40).optional().or(z.literal("")),
  year: z.string().trim().max(20).optional().or(z.literal("")),
  branch: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  teamFirst: z.string().trim().max(40),
  teamSecond: z.string().trim().max(40).optional().or(z.literal("")),
  why: z.string().trim().min(10).max(2000),
  links: z.string().trim().max(500).optional().or(z.literal("")),
});

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => applicationSchema.parse(input))
  .handler(async ({ data }) => {
    const { clientKey, rateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try {
      rateLimit(await clientKey("apply", "apply"), 5, 60 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(
          `Too many applications from your network. Try again in ${error.retryAfterSeconds}s.`,
        );
      }
      throw error;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("applications").insert({
      name: data.name,
      usn: data.usn || null,
      year: data.year || null,
      branch: data.branch || null,
      email: data.email,
      phone: data.phone || null,
      team_first: data.teamFirst || null,
      team_second: data.teamSecond || null,
      why: data.why,
      links: data.links || null,
    });
    if (error) throw new Error("Could not submit your application. Try again.");
    return { ok: true };
  });

const registrationSchema = z.object({
  eventSlug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  usn: z.string().trim().max(40).optional().or(z.literal("")),
});

export const registerForEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registrationSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, title, event_date, location")
      .eq("slug", data.eventSlug)
      .eq("published", true)
      .maybeSingle();
    if (eventError || !event) throw new Error("That event is not open for registration.");

    const { data: row, error } = await supabaseAdmin
      .from("event_registrations")
      .insert({
        event_id: event.id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        usn: data.usn || null,
      })
      .select("code")
      .single();
    if (error) throw new Error("Could not save your registration. Try again.");

    return {
      code: row.code,
      event: { title: event.title, date: event.event_date, location: event.location },
    };
  });
