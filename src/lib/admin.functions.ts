import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  announcementInput,
  badgeAwardInput,
  eventInput,
  memberInput,
  projectInput,
} from "@/lib/schemas";

export const getViewer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadViewer } = await import("@/lib/roles.server");
    return loadViewer(context.supabase, context.userId);
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertJudge } = await import("@/lib/roles.server");
    const viewer = await assertJudge(context.supabase, context.userId);
    const sb = context.supabase;

    // Judges get their own console; they never see club data.
    if (!viewer.isAdmin && !viewer.isHead) {
      return {
        viewer,
        applications: [],
        members: [],
        teams: [],
        events: [],
        projects: [],
        announcements: [],
        registrations: [],
      };
    }

    const [apps, members, teams, events, projects, announcements, regs] = await Promise.all([
      sb.from("applications").select("*").order("created_at", { ascending: false }),
      sb.from("members").select("*").order("sort_order"),
      sb.from("teams").select("*").order("sort_order"),
      sb.from("events").select("*").order("event_date", { ascending: false }),
      sb.from("projects").select("*").order("year", { ascending: false }),
      sb.from("announcements").select("*").order("created_at", { ascending: false }),
      sb
        .from("event_registrations")
        .select("id, event_id, name, email, usn, code, checked_in_at, created_at")
        .order("created_at", { ascending: false }),
    ]);

    return {
      viewer,
      applications: apps.data ?? [],
      members: members.data ?? [],
      teams: teams.data ?? [],
      events: events.data ?? [],
      projects: projects.data ?? [],
      announcements: announcements.data ?? [],
      registrations: regs.data ?? [],
    };
  });

export const setApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "shortlisted", "accepted", "rejected"]),
        notes: z.string().trim().max(2000).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .update({ status: data.status, notes: data.notes })
      .eq("id", data.id);
    if (error) throw new Error("Could not update that application.");
    return { ok: true };
  });

export const saveMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => memberInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const row = {
      slug: data.slug,
      name: data.name,
      role: data.role,
      team_id: data.teamId,
      is_head: data.isHead,
      is_leadership: data.isLeadership,
      photo_url: data.photoUrl,
      bio: data.bio,
      skills: data.skills,
      links: data.links,
      sort_order: data.sortOrder,
    };
    const query = data.id
      ? context.supabase.from("members").update(row).eq("id", data.id)
      : context.supabase.from("members").insert(row);
    const { error } = await query;
    if (error) {
      throw new Error(
        error.code === "23505"
          ? "A member with that link name already exists."
          : "Could not save the member.",
      );
    }
    return { ok: true };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("members").delete().eq("id", data.id);
    if (error) throw new Error("Could not remove that member.");
    return { ok: true };
  });

export const saveEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => eventInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const row = {
      slug: data.slug,
      title: data.title,
      event_date: data.eventDate,
      start_time: data.startTime,
      location: data.location,
      tag: data.tag,
      description: data.description,
      cover_url: data.coverUrl,
      capacity: data.capacity,
      published: data.published,
    };
    const query = data.id
      ? context.supabase.from("events").update(row).eq("id", data.id)
      : context.supabase.from("events").insert(row);
    const { error } = await query;
    if (error) {
      throw new Error(
        error.code === "23505"
          ? "That event already exists — same link name, or same title on the same date."
          : "Could not save the event.",
      );
    }
    return { ok: true };
  });

export const saveProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => projectInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const row = {
      slug: data.slug,
      title: data.title,
      description: data.description,
      tech: data.tech,
      cover_url: data.coverUrl,
      link: data.link,
      year: data.year,
      published: data.published,
    };
    const res = data.id
      ? await context.supabase.from("projects").update(row).eq("id", data.id).select("id").single()
      : await context.supabase.from("projects").insert(row).select("id").single();
    if (res.error || !res.data) {
      throw new Error(
        res.error?.code === "23505"
          ? "A project with that link name already exists."
          : "Could not save the project.",
      );
    }
    const projectId = res.data.id;
    await context.supabase.from("project_contributors").delete().eq("project_id", projectId);
    if (data.contributorIds.length > 0) {
      await context.supabase
        .from("project_contributors")
        .insert(
          data.contributorIds.map((memberId) => ({ project_id: projectId, member_id: memberId })),
        );
    }
    return { ok: true };
  });

export const saveAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => announcementInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    const viewer = await assertStaff(context.supabase, context.userId);
    if (!viewer.isAdmin && (!data.teamId || !viewer.headTeams.includes(data.teamId))) {
      throw new Error("Heads can only post to their own team.");
    }
    const row = {
      title: data.title,
      body: data.body,
      team_id: data.teamId,
      pinned: data.pinned,
      published: data.published,
      author_id: context.userId,
    };
    const query = data.id
      ? context.supabase.from("announcements").update(row).eq("id", data.id)
      : context.supabase.from("announcements").insert(row);
    const { error } = await query;
    if (error) throw new Error("Could not post that announcement.");
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete that announcement.");
    return { ok: true };
  });

export const checkInByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(4).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    await assertStaff(context.supabase, context.userId);
    const code = data.code.trim().split("/").pop() ?? data.code.trim();

    const { data: reg, error } = await context.supabase
      .from("event_registrations")
      .select("id, name, email, checked_in_at, event_id, events(title, event_date)")
      .eq("code", code)
      .maybeSingle();
    if (error || !reg) return { status: "invalid" as const };

    if (reg.checked_in_at) {
      return {
        status: "already" as const,
        name: reg.name,
        event: reg.events?.title ?? "",
        at: reg.checked_in_at,
      };
    }

    const { error: upErr } = await context.supabase
      .from("event_registrations")
      .update({ checked_in_at: new Date().toISOString(), checked_in_by: context.userId })
      .eq("id", reg.id);
    if (upErr) throw new Error("Could not record that check-in.");

    return {
      status: "ok" as const,
      name: reg.name,
      event: reg.events?.title ?? "",
      at: new Date().toISOString(),
    };
  });

export const awardBadge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => badgeAwardInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("member_badges")
      .upsert({ member_id: data.memberId, badge_id: data.badgeId, note: data.note });
    if (error) throw new Error("Could not award that badge.");
    return { ok: true };
  });

export const revokeBadge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ memberId: z.string().uuid(), badgeId: z.string().min(1).max(60) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("member_badges")
      .delete()
      .eq("member_id", data.memberId)
      .eq("badge_id", data.badgeId);
    if (error) throw new Error("Could not remove that badge.");
    return { ok: true };
  });

export const finalizeUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ path: z.string().trim().min(3).max(400) }).parse(input),
  )
  .handler(async ({ data }) => {
    return { url: `/api/public/media/${data.path}`, path: data.path };
  });

export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        folder: z
          .string()
          .trim()
          .regex(/^[a-z0-9-]{2,40}$/),
        ext: z
          .string()
          .trim()
          .regex(/^[a-z0-9]{2,5}$/),
        contentType: z
          .string()
          .trim()
          .regex(/^image\/[a-z0-9.+-]{2,20}$/),
        base64: z.string().min(16).max(14_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const binary = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (binary.byteLength > 8 * 1024 * 1024) throw new Error("That image is too large.");
    const path = `${data.folder}/${crypto.randomUUID()}.${data.ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("media").upload(path, binary, {
      contentType: data.contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error("Could not store that image.");
    return { url: `/api/public/media/${path}`, path };
  });
