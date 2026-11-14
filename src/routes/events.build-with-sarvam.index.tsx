import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
export const Route = createFileRoute("/events/build-with-sarvam/")({
  head: () => ({ meta: [{ title: "Build with Sarvam — Vertex" }] }),
  component: Page,
});
function Page() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-24">
        <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Vertex · Finalist workspace
        </p>
        <h1 className="mt-5 text-5xl font-semibold">Build with Sarvam</h1>
        <p className="my-8 max-w-xl text-muted-foreground">
          Selected teams can review their registered team and original idea, and submit their final
          project when submissions open.
        </p>
        <Link
          to="/events/build-with-sarvam/dashboard"
          className="btn-primary inline-block px-6 py-3"
        >
          Team Dashboard →
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">
          Sign in with the team leader’s registered Google email. For help, contact the organizers
          using your selection email.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
