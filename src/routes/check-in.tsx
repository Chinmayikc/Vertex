import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { checkInNeuralNetworkWorkshop } from "@/lib/neural-network-workshop.functions";

export const Route = createFileRoute("/check-in")({
  head: () => ({ meta: [{ title: "Event check-in — Vertex" }, { name: "robots", content: "noindex" }] }),
  component: CheckInPage,
});

function CheckInPage() {
  const checkIn = useServerFn(checkInNeuralNetworkWorkshop);
  const [message, setMessage] = useState("Camera is ready. Hold the attendee QR inside the frame.");
  const [tone, setTone] = useState<"idle" | "ok" | "warn" | "bad">("idle");
  const [busy, setBusy] = useState(false);
  const process = async (code: string) => {
    if (!code.trim() || busy) return;
    setBusy(true);
    setTone("idle");
    setMessage("Checking the pass…");
    try {
      const result = await checkIn({ data: { code } });
      if (result.status === "ok") { setTone("ok"); setMessage(`Checked in · ${result.name} (${result.srn})`); }
      else if (result.status === "already") { setTone("warn"); setMessage(`Already checked in · ${result.name} (${result.srn})`); }
      else { setTone("bad"); setMessage("This pass is invalid or not approved."); }
    } catch (error) {
      setTone("bad");
      setMessage(error instanceof Error ? error.message : "Sign in with your assigned event email first.");
    } finally { setBusy(false); }
  };
  const bg = tone === "ok" ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-100" : tone === "warn" ? "border-amber-300/50 bg-amber-300/10 text-amber-100" : tone === "bad" ? "border-red-400/50 bg-red-400/10 text-red-100" : "border-hairline bg-card/50 text-muted-foreground";
  return <div className="min-h-screen bg-background text-foreground"><SiteHeader /><main className="mx-auto max-w-xl px-5 py-10 sm:py-16">
    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-silver">Vertex event operations</p>
    <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Door check-in.</h1>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Neural Networks from Scratch · 28 October · B009. Use your assigned club email to access this desk.</p>
    <section className="mt-8 rounded-2xl border border-hairline bg-card/40 p-4 sm:p-6">
      <QRScanner onResult={(code) => void process(code)} cooldownMs={3500} autoStart />
      <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; void process(String(new FormData(form).get("code") ?? "")).then(() => form.reset()); }}>
        <input name="code" required placeholder="Paste backup pass code" className="field-input min-w-0 flex-1 rounded-lg px-3 py-3 text-sm" />
        <button disabled={busy} className="btn-primary rounded-lg px-4 py-3 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50">{busy ? "Checking…" : "Check in"}</button>
      </form>
    </section>
    <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm font-medium ${bg}`} aria-live="polite">
      {tone === "ok" ? <CheckCircle2 className="mt-0.5 shrink-0" size={23} /> : tone === "warn" ? <AlertTriangle className="mt-0.5 shrink-0" size={23} /> : tone === "bad" ? <XCircle className="mt-0.5 shrink-0" size={23} /> : <ScanLine className="mt-0.5 shrink-0" size={23} />}
      <div>
        <p className="text-base font-semibold">{tone === "ok" ? "Check-in complete" : tone === "warn" ? "Already checked in" : tone === "bad" ? "Pass not accepted" : "Event desk"}</p>
        <p className="mt-1 leading-relaxed">{message}</p>
      </div>
    </div>
    <p className="mt-5 text-center text-xs text-muted-foreground">Need access? <Link to="/auth" className="underline underline-offset-4">Sign in</Link>, then ask the event manager to add your email.</p>
  </main><SiteFooter /></div>;
}
