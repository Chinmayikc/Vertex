import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { finalLinks, deckExtension, MAX_DECK_BYTES, submissionOpen } from "./finalists.validation";

export const finalistDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = await import("./finalists.server");
    const { team, event, settings } = await s.resolveFinalist(context.supabase, context.claims);
    return {
      ...(await s.teamDetails(team.id, event.id)),
      settings,
      open: submissionOpen(settings),
    };
  });
export const authorizeFinalDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(200),
        size: z.number().int().min(1).max(MAX_DECK_BYTES),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const s = await import("./finalists.server");
    const { team, event, settings, user } = await s.resolveFinalist(
      context.supabase,
      context.claims,
    );
    s.requireWindow(settings);
    deckExtension(data.name);
    const upload = s.checked(
      await s.db
        .rpc("reserve_finalist_upload", {
          p_event: event.id,
          p_team: team.id,
          p_user: user.id,
          p_name: data.name,
          p_size: data.size,
          p_id: crypto.randomUUID(),
        })
        .single(),
    );
    const signed = s.checked(
      await s.db.storage.from(s.BUCKET).createSignedUploadUrl(upload.object_key, { upsert: false }),
    );
    return {
      id: upload.id as string,
      key: upload.object_key as string,
      token: signed.token,
      expires: upload.expires_at as string,
    };
  });
export const saveFinalProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ uploadId: z.string().uuid(), links: finalLinks }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const s = await import("./finalists.server");
    const { team, event, settings, user } = await s.resolveFinalist(
      context.supabase,
      context.claims,
    );
    const last = s.optional(
      await s.db
        .from("final_project_submissions")
        .select("*")
        .eq("event_id", event.id)
        .eq("team_id", team.id)
        .maybeSingle(),
    );
    if (last?.upload_id === data.uploadId) return last;
    s.requireWindow(settings);
    const upload = s.checked(
      await s.db
        .from("finalist_uploads")
        .select("*")
        .eq("id", data.uploadId)
        .eq("event_id", event.id)
        .eq("team_id", team.id)
        .eq("user_id", user.id)
        .single(),
    );
    if (upload.consumed_at || upload.deleted_at || Date.parse(upload.expires_at) <= Date.now())
      throw new Error("Upload expired. Choose the presentation again.");
    const file = s.checked(await s.db.storage.from(s.BUCKET).download(upload.object_key));
    if (file.size > MAX_DECK_BYTES) throw new Error("Presentation exceeds 5,000,000 bytes.");
    const { validateDeck } = await import("./finalists.deck.server");
    validateDeck(Buffer.from(await file.arrayBuffer()), upload.file_name, upload.file_size);
    return s.checked(
      await s.db
        .rpc("commit_finalist_submission", {
          p_event: event.id,
          p_team: team.id,
          p_user: user.id,
          p_upload: upload.id,
          p_links: data.links,
        })
        .single(),
    );
  });
export const reviewFinalists = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = await import("./finalists.server");
    s.privateResponse();
    const { assertStaff } = await import("./roles.server");
    await assertStaff(context.supabase, context.userId);
    const { event, settings } = await s.configuration();
    const rows = await s.reviewFinalistRows(event.id);
    return { rows, settings };
  });
export const downloadFinalDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ teamId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const s = await import("./finalists.server");
    s.privateResponse();
    const { assertStaff } = await import("./roles.server");
    await assertStaff(context.supabase, context.userId);
    const { event } = await s.configuration();
    const sub = s.checked(
      await s.db
        .from("final_project_submissions")
        .select("deck_key,deck_name")
        .eq("event_id", event.id)
        .eq("team_id", data.teamId)
        .single(),
    );
    return s.checked(
      await s.db.storage
        .from(s.BUCKET)
        .createSignedUrl(sub.deck_key, 60, { download: sub.deck_name }),
    ).signedUrl;
  });
export const cleanupFinalDecks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = await import("./finalists.server");
    s.privateResponse();
    const { assertStaff } = await import("./roles.server");
    await assertStaff(context.supabase, context.userId);
    const { event } = await s.configuration();
    // Two-hour signed upload lifetime, then a full day of grace for in-flight requests.
    const stale = s.checked(
      await s.db
        .from("finalist_uploads")
        .select("id,object_key")
        .eq("event_id", event.id)
        .is("deleted_at", null)
        .lt("expires_at", new Date(Date.now() - 86400000).toISOString())
        .limit(200),
    );
    const current = s.checked(
      await s.db.from("final_project_submissions").select("upload_id").eq("event_id", event.id),
    );
    const retained = new Set(current.map((r) => r.upload_id));
    const deletable = stale.filter((r) => !retained.has(r.id));
    if (deletable.length) {
      s.checked(await s.db.storage.from(s.BUCKET).remove(deletable.map((r) => r.object_key)));
      s.checked(
        await s.db
          .from("finalist_uploads")
          .update({ deleted_at: new Date().toISOString() })
          .in(
            "id",
            deletable.map((r) => r.id),
          ),
      );
    }
    return { removed: deletable.length };
  });

export const downloadOwnFinalDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = await import("./finalists.server");
    const { team, event } = await s.resolveFinalist(context.supabase, context.claims);
    const sub = s.checked(
      await s.db
        .from("final_project_submissions")
        .select("deck_key,deck_name")
        .eq("event_id", event.id)
        .eq("team_id", team.id)
        .single(),
    );
    return s.checked(
      await s.db.storage
        .from(s.BUCKET)
        .createSignedUrl(sub.deck_key, 60, { download: sub.deck_name }),
    ).signedUrl;
  });
