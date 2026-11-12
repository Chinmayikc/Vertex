import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SARVAM_APPROVAL_SAMPLE, SARVAM_APPROVAL_SUBJECT } from "@/lib/sarvam-email-template";

export const Route = createFileRoute("/email-preview/build-with-sarvam")({
  head: () => ({
    meta: [
      { title: "Email preview · Build with Sarvam · Vertex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SarvamEmailPreviewPage,
});

function SarvamEmailPreviewPage() {
  const sample = SARVAM_APPROVAL_SAMPLE;

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#1f3128]">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
        <Link
          to="/events/build-with-sarvam"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#52705c]"
        >
          <ArrowLeft size={15} /> Back to Build with Sarvam
        </Link>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#52705c]">
              Approval email · preview only
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Final-round email template.
            </h1>
          </div>
          <div className="flex items-center gap-2 border border-[#cbd7cb] bg-[#fbfcf9] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#52705c]">
            <Mail size={15} /> No email will be sent
          </div>
        </div>

        <section className="mt-8 overflow-hidden border border-[#dcd8ce] bg-[#fffefa] shadow-[0_24px_70px_rgba(31,49,40,0.12)]">
          <div className="border-b border-[#e7e2d9] bg-[#f8f6f0] px-5 py-4 sm:px-8">
            <div className="grid gap-2 text-sm sm:grid-cols-[92px_1fr]">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718077]">
                Subject
              </span>
              <span className="font-medium text-[#1f3128]">{SARVAM_APPROVAL_SUBJECT}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718077]">
                To
              </span>
              <span className="text-[#637068]">participant@example.com</span>
            </div>
          </div>

          <div className="mx-auto max-w-[600px] bg-[#fffefa]">
            <div className="border-b border-[#e7e2d9] bg-[#f8f6f0] px-7 py-7 sm:px-9">
              <img src="/vertex-logo.png" alt="Vertex Club logo" className="mb-5 block w-32" />
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[2px] text-[#52705c]">
                Vertex Club · REVA University
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-[#1f3128]">
                Registration approved.
              </h2>
              <p className="mt-2 font-sans text-sm leading-6 text-[#637068]">
                BUILD WITH SARVAM · Personal check-in pass
              </p>
            </div>

            <div className="px-7 py-8 font-sans sm:px-9">
              <p className="text-base leading-7">Hi {sample.participantName},</p>
              <p className="mt-4 text-base leading-7">
                Your team&apos;s registration for the <strong>&quot;Build with Sarvam&quot;</strong>{" "}
                hackathon conducted by Vertex Club is approved. This is your personal check-in
                pass. Please show the QR code below at the Vertex desk during check-in.
              </p>

              <div className="mt-6 border-l-4 border-[#52705c] bg-[#eef3ed] p-5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[1.5px] text-[#52705c]">
                  Team
                </p>
                <p className="mt-2 text-sm leading-7 text-[#3e5046]">
                  <strong>{sample.teamName}</strong> · {sample.memberCount} members
                </p>
              </div>

              <p className="mt-7 font-mono text-[11px] font-semibold uppercase tracking-[1.5px] text-[#52705c]">
                Event details
              </p>
              <div className="mt-3 bg-[#f5f2ec] text-sm">
                {[
                  ["Date", "13–14 November 2026"],
                  ["Venue", "REVA University, Bengaluru"],
                  ["Host", "Vertex Club × Sarvam AI"],
                  ["Format", "Two-day inter-college AI hackathon"],
                ].map(([label, value], index, rows) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between gap-5 px-4 py-3 ${index < rows.length - 1 ? "border-b border-[#e6e1d8]" : ""}`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-[#647268]">
                      {label}
                    </span>
                    <span className="text-right text-[#1f3128]">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 border border-[#d9dfd8] bg-[#fbfcf9] p-5 text-center">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[1.5px] text-[#52705c]">
                  Personal QR code
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#4d5d54]">
                  Show this QR code at the Vertex desk for your check-in. Keep it ready on your phone.
                </p>
                <div className="mx-auto mt-5 w-fit max-w-full border border-[#d6dcd4] bg-white p-2">
                  <QRCodeSVG value={sample.code} size={220} level="M" includeMargin />
                </div>
                <p className="mt-4 text-xs leading-5 text-[#718077]">
                  Backup pass code:{" "}
                  <strong className="tracking-[1px] text-[#3e5046]">{sample.code}</strong>
                </p>
              </div>
            </div>

            <div className="border-t border-[#e7e2d9] px-7 py-5 font-sans text-[13px] leading-7 text-[#5c6b62] sm:px-9">
              <p className="mb-3">
                The QR contains no personal information. Need help? Reply to this email.
              </p>
              Sent by Vertex Club
              <br />
              Thank you,
            </div>
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-6 text-[#637068]">
          This page uses sample recipient and team details. The live approval flow will replace them
          with each approved participant’s name, team name, member count, and personal check-in QR.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
