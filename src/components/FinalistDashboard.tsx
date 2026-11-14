import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  finalistDashboard,
  authorizeFinalDeck,
  saveFinalProject,
  downloadOwnFinalDeck,
} from "@/lib/finalists.functions";
import { finalLinks, MAX_DECK_BYTES, deckExtension, ist } from "@/lib/finalists.validation";
import { toast } from "sonner";
type Dashboard = Awaited<ReturnType<typeof finalistDashboard>>;
export function TeamRecords({
  details,
}: {
  details: Pick<Dashboard, "team" | "members" | "idea">;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="border border-hairline p-6">
        <h2 className="text-xl font-semibold">Registered team</h2>
        <p className="mt-3 text-lg">{details.team.name}</p>
        <p>Leader: {details.team.lead_name}</p>
        <ul className="mt-4 space-y-2">
          {details.members.map((m: { name: string; is_lead: boolean }, i: number) => (
            <li key={i}>
              {m.name} · {m.is_lead ? "Team leader" : "Member"}
            </li>
          ))}
        </ul>
      </section>
      <section className="border border-hairline p-6">
        <h2 className="text-xl font-semibold">Original idea · read only</h2>
        {details.idea ? (
          <dl className="mt-4 space-y-3">
            {Object.entries(details.idea)
              .filter(([key]) => key !== "submitted_at")
              .map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs uppercase text-muted-foreground">
                    {(
                      {
                        solution_title: "Title",
                        theme: "Track",
                        problem_statement_title: "Problem statement",
                        solution_summary: "Submitted answer",
                        problem_statement_id: "Problem ID",
                      } as Record<string, string>
                    )[key] ?? key}
                  </dt>
                  <dd className="whitespace-pre-wrap break-words">
                    {String(value ?? "Not recorded")}
                  </dd>
                </div>
              ))}
          </dl>
        ) : (
          <p className="mt-4">No original idea is recorded. Contact the organizers.</p>
        )}
      </section>
    </div>
  );
}
export function FinalistDashboard() {
  const load = useServerFn(finalistDashboard),
    authorize = useServerFn(authorizeFinalDeck),
    save = useServerFn(saveFinalProject),
    download = useServerFn(downloadOwnFinalDeck);
  const [data, setData] = useState<Dashboard | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const requestVersion = useRef(0);
  const [pending, setPending] = useState<{ id: string; file: File; uploaded: boolean } | null>(
    null,
  );
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const result = await load();
      if (version !== requestVersion.current) return;
      setData(result);
      setError("");
    } catch (e) {
      if (version !== requestVersion.current) return;
      setData(null);
      setError(
        e instanceof Error
          ? e.message.startsWith("Unauthorized:")
            ? "Sign in with Google to open your team dashboard."
            : e.message
          : "Unable to load the dashboard.",
      );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    const invalidate = () => {
      requestVersion.current += 1;
    };
    void refresh();
    const { data: auth } = supabase.auth.onAuthStateChange((event) => {
      invalidate();
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
        setData(null);
        setPending(null);
      }
      setTimeout(() => void refresh(), 0);
    });
    return () => {
      invalidate();
      auth.subscription.unsubscribe();
    };
  }, [refresh]);
  async function google(switchAccount = false) {
    try {
      if (switchAccount) {
        ++requestVersion.current;
        await supabase.auth.signOut();
        setData(null);
        setPending(null);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/events/build-with-sarvam/dashboard",
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed.");
    }
  }
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary px-5 py-3" disabled={busy} onClick={() => void google()}>
          Continue with Google
        </button>
        <button
          className="border border-hairline px-5 py-3"
          disabled={busy}
          onClick={() => void google(true)}
        >
          Switch account
        </button>
        <button
          className="border border-hairline px-5 py-3"
          disabled={loading || busy}
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>
      <p className="text-muted-foreground">
        Use the same Google email your team leader used to register. Only confirmed finalist leaders
        can access this private dashboard. For access help, contact the Vertex organizers using the
        details in your selection email.
      </p>
      {loading && <p role="status">Checking finalist access…</p>}
      {error && (
        <p role="alert" className="border border-hairline p-5">
          {error}
        </p>
      )}
      {data && (
        <>
          <TeamRecords details={data} />
          <section className="border border-hairline p-6 space-y-5">
            <h2 className="text-2xl font-semibold">Final project submission</h2>
            <p>
              Deadline: {data.settings.closes_at ? ist(data.settings.closes_at) : "To be announced"}
            </p>
            {data.submission ? (
              <p role="status" className="border border-emerald-500/40 p-4">
                Submitted · Receipt: {ist(data.submission.submitted_at)}. Your last successful
                submission remains available while you replace it.
              </p>
            ) : (
              <p>Pending · No final project has been saved yet.</p>
            )}
            {data.submission && (
              <div className="space-y-2">
                <p>
                  Saved presentation: {data.submission.deck_name} ·{" "}
                  {data.submission.deck_size.toLocaleString()} bytes
                </p>
                <button
                  type="button"
                  className="underline"
                  onClick={async () => {
                    try {
                      window.location.assign(await download());
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Download failed.");
                    }
                  }}
                >
                  Download saved presentation
                </button>
              </div>
            )}
            {!data.open && (
              <p>
                Final submissions are closed. You can still review your registered team and idea.
              </p>
            )}
            <form
              className="grid gap-5"
              key={data.team.id}
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setBusy(true);
                try {
                  const form = new FormData(e.currentTarget);
                  const links = finalLinks.parse(
                    Object.fromEntries(
                      ["project", "demo", "github", "video"].map((k) => [k, form.get(k)]),
                    ),
                  );
                  const selected = form.get("deck");
                  const file =
                    pending?.file ?? (selected instanceof File && selected.size ? selected : null);
                  if (!file) throw new Error("Choose a presentation file.");
                  deckExtension(file.name);
                  if (file.size > MAX_DECK_BYTES)
                    throw new Error("Presentation must be at most 5,000,000 bytes.");
                  let upload = pending;
                  if (!upload || upload.file !== file) {
                    const signed = await authorize({ data: { name: file.name, size: file.size } });
                    upload = { id: signed.id, file, uploaded: false };
                    setPending(upload);
                    const result = await supabase.storage
                      .from("finalist-decks")
                      .uploadToSignedUrl(signed.key, signed.token, file, {
                        contentType: "application/octet-stream",
                      });
                    if (result.error) {
                      setPending(null);
                      throw result.error;
                    }
                    upload = { ...upload, uploaded: true };
                    setPending(upload);
                  }
                  if (!upload.uploaded)
                    throw new Error("Upload did not finish. Choose the file again.");
                  const receipt = await save({ data: { uploadId: upload.id, links } });
                  setData((previous) =>
                    previous && previous.team.id === data.team.id
                      ? { ...previous, submission: receipt }
                      : previous,
                  );
                  setPending(null);
                  toast.success("Final project saved. Your receipt is below.");
                } catch (e) {
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : "Save failed. Retry to confirm your submission.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {(
                [
                  ["project", "Project URL", "project_url"],
                  ["demo", "Demo link", "demo_url"],
                  ["github", "GitHub repository URL", "github_url"],
                  ["video", "Demo video link (HTTPS)", "video_url"],
                ] as const
              ).map(([name, label, column]) => (
                <label className="grid gap-2" key={name}>
                  {label}
                  <input
                    className="border border-hairline bg-background p-3"
                    type="url"
                    name={name}
                    required
                    disabled={!data.open || busy}
                    defaultValue={data.submission?.[column] ?? ""}
                    placeholder="https://"
                  />
                </label>
              ))}
              <label className="grid gap-2">
                Presentation · PDF, PPT, or PPTX · maximum 5,000,000 bytes
                <input
                  type="file"
                  name="deck"
                  accept=".pdf,.ppt,.pptx"
                  disabled={!data.open || busy}
                  onChange={() => setPending(null)}
                />
              </label>
              <p className="text-sm text-muted-foreground">
                Project and demo may use the same URL. Grant judges access to the video and any
                private GitHub repository. All four links and a presentation are required.
              </p>
              <button
                className="btn-primary px-5 py-3 justify-self-start disabled:opacity-40"
                disabled={!data.open || busy}
              >
                {busy
                  ? "Uploading and saving…"
                  : pending?.uploaded
                    ? "Retry save"
                    : "Save final project"}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
