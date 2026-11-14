import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { reviewFinalists, downloadFinalDeck, cleanupFinalDecks } from "@/lib/finalists.functions";
import { csvCell, ist } from "@/lib/finalists.validation";
import { TeamRecords } from "./FinalistDashboard";
type Review = Awaited<ReturnType<typeof reviewFinalists>>;
export function FinalistReview() {
  const load = useServerFn(reviewFinalists),
    download = useServerFn(downloadFinalDeck),
    cleanup = useServerFn(cleanupFinalDecks);
  const [data, setData] = useState<Review | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [selected, setSelected] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      setData(await load());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed to load.");
    } finally {
      setBusy(false);
    }
  }, [load]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const rows = data?.rows ?? [],
    submitted = rows.filter((r) => r.submission).length;
  const visible = rows.filter(
    (r) =>
      r.team.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || (status === "submitted") === !!r.submission),
  );
  const detail = rows.find((r) => r.team.id === selected);
  const finalSubmission = detail?.submission;
  function exportCsv() {
    const header = [
      "Team name",
      "Status",
      "Submitted at (UTC)",
      "Project URL",
      "Demo link",
      "GitHub repository URL",
      "Demo video link",
    ];
    const csv = [
      header,
      ...rows.map((r) => [
        r.team.name,
        r.submission ? "Submitted" : "Pending",
        r.submission?.submitted_at,
        r.submission?.project_url,
        r.submission?.demo_url,
        r.submission?.github_url,
        r.submission?.video_url,
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sarvam-final-submissions.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Build with Sarvam → Final Submissions</h2>
      <div className="flex flex-wrap gap-3">
        <button
          className="border border-hairline px-4 py-2"
          disabled={busy}
          onClick={() => void refresh()}
        >
          {busy ? "Refreshing…" : "Refresh from Supabase"}
        </button>
        <button className="border border-hairline px-4 py-2" disabled={!data} onClick={exportCsv}>
          Export all teams CSV
        </button>
        <button
          className="border border-hairline px-4 py-2"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await cleanup();
              toast.success(`Removed ${result.removed} expired or superseded files.`);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Cleanup failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Clean up old uploads
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <p className="border border-hairline p-4">
            {rows.length} confirmed teams · {submitted} Submitted · {rows.length - submitted}{" "}
            Pending
          </p>
          {rows.length !== 50 && (
            <p role="status">
              Expected 50 confirmed finalists. Organizer confirmation is required before opening
              submissions.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Deadline: {data.settings.closes_at ? ist(data.settings.closes_at) : "Not configured"}.
            Only successfully saved final records count as Submitted. Refresh to load current
            progress.
          </p>
          <div className="flex flex-wrap gap-4">
            <label>
              Search teams{" "}
              <input
                className="border border-hairline bg-background p-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              Status{" "}
              <select
                className="border border-hairline bg-background p-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-3">Team</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Latest successful submission</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.team.id} className="border-t border-hairline">
                    <td className="p-3">
                      <button className="underline" onClick={() => setSelected(r.team.id)}>
                        {r.team.name}
                      </button>
                    </td>
                    <td className="p-3">{r.submission ? "Submitted" : "Pending"}</td>
                    <td className="p-3">{r.submission ? ist(r.submission.submitted_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && <p className="p-3">No matching teams.</p>}
          </div>
          {detail && (
            <div className="space-y-5 border border-hairline p-5">
              <div className="flex justify-between">
                <h3 className="text-xl">{detail.team.name}</h3>
                <button onClick={() => setSelected(null)}>Close detail</button>
              </div>
              <TeamRecords details={detail} />
              <section className="space-y-3">
                <h3 className="text-xl font-semibold">Final deliverables</h3>
                {finalSubmission ? (
                  <>
                    <p>Submitted {ist(finalSubmission.submitted_at)}</p>
                    {(
                      [
                        ["Project", "project_url"],
                        ["Demo", "demo_url"],
                        ["GitHub repository", "github_url"],
                        ["Demo video", "video_url"],
                      ] as const
                    ).map(([label, key]) => (
                      <p key={key}>
                        {label}:{" "}
                        <a
                          className="break-all underline"
                          href={finalSubmission[key]}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {finalSubmission[key]}
                        </a>
                      </p>
                    ))}
                    <button
                      className="border border-hairline p-3"
                      onClick={async () => {
                        try {
                          const url = await download({ data: { teamId: detail.team.id } });
                          window.location.assign(url);
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Download failed.");
                        }
                      }}
                    >
                      Download presentation · {finalSubmission.deck_name} (
                      {finalSubmission.deck_size.toLocaleString()} bytes)
                    </button>
                    <p className="text-xs text-muted-foreground">
                      Authorized download link expires after 60 seconds.
                    </p>
                  </>
                ) : (
                  <p>Pending · No successful final submission.</p>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </section>
  );
}
