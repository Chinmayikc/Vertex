import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { FinalistDashboard } from "@/components/FinalistDashboard";
export const Route = createFileRoute("/events/build-with-sarvam/dashboard")({
  head: () => ({
    meta: [
      { title: "Finalist Team Dashboard — Vertex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
function Page() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="font-mono uppercase text-muted-foreground">Build with Sarvam</p>
        <h1 className="my-6 text-4xl font-semibold">Team Dashboard</h1>
        <FinalistDashboard />
      </main>
      <SiteFooter />
    </>
  );
}
