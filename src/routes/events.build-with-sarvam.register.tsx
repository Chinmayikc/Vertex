import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Atmosphere } from "@/components/Atmosphere";
import { SarvamRegistrationForm } from "@/components/SarvamRegistrationForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const Route = createFileRoute("/events/build-with-sarvam/register")({
  head: () => ({
    meta: [
      { title: "Register for BUILD WITH SARVAM — Vertex" },
      {
        name: "description",
        content:
          "Register your team and submit your idea for the BUILD WITH SARVAM inter-college AI hackathon.",
      },
    ],
  }),
  component: BuildWithSarvamRegistrationPage,
});

function BuildWithSarvamRegistrationPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <Atmosphere mesh />
          <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
            <Link
              to="/events/build-with-sarvam"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} /> Back to Build with Sarvam
            </Link>
            <div className="mt-10 grid gap-10 lg:grid-cols-[.62fr_1.38fr] lg:items-start lg:gap-16">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                  Registration desk
                </p>
                <h1 className="mt-5 max-w-lg font-display text-5xl font-semibold leading-[0.92] tracking-[-0.05em] sm:text-7xl">
                  Register your
                  <br />
                  <span className="text-silver-gradient">team.</span>
                </h1>
                <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
                  Start with the team lead, add all four members, and then submit one clear idea for
                  the Build with Sarvam hackathon.
                </p>
                <div className="mt-8 grid gap-3">
                  <div className="flex gap-3 rounded-xl border border-hairline bg-surface-2 p-4">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-silver" size={17} />
                    <div>
                      <p className="text-sm">Exactly 4 members</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        The team lead should be entered first.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-hairline bg-surface-2 p-4">
                    <ShieldCheck className="mt-0.5 shrink-0 text-silver" size={17} />
                    <div>
                      <p className="text-sm">One idea per team</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        No prototype, PPT, or video is required for this round.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/events/build-with-sarvam"
                    className="btn-ghost rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
                  >
                    View event details <ArrowRight size={14} />
                  </Link>
                  <a
                    href="mailto:vertexreva@gmail.com?subject=BUILD%20WITH%20SARVAM%20REGISTRATION"
                    className="btn-ghost rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
                  >
                    <Mail size={14} /> Contact desk
                  </a>
                </div>
              </div>
              <SarvamRegistrationForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
