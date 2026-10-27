import nodemailer from "nodemailer";

type SarvamApprovalEmail = {
  registrationId: string;
  teamName: string;
  teamLeadName: string;
  teamLeadEmail: string;
  memberCount: number;
};

/** Sends the approval notice only to the registered team's lead. */
export async function sendSarvamApprovalEmail(registration: SarvamApprovalEmail): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EVENTS_FROM_EMAIL"];
  const replyTo = process.env["EVENTS_REPLY_TO"];
  const message = {
    from,
    to: [registration.teamLeadEmail],
    subject: "BUILD WITH SARVAM · Your team is approved",
    html: renderSarvamApprovalEmail(registration),
    text: `Vertex Club · REVA University

Hi ${registration.teamLeadName},

Your team, ${registration.teamName}, has been approved for BUILD WITH SARVAM.

Event: 13–14 November 2026
Venue: REVA University
Team size: ${registration.memberCount} members

Please keep this email for your team records. We’ll share any further event-desk updates with the team lead.

Vertex Club · In collaboration with Sarvam AI`,
  };

  if (apiKey && from) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `build-with-sarvam-approval-${registration.registrationId}`,
        },
        body: JSON.stringify({ ...message, reply_to: replyTo }),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return true;
      console.error("Sarvam approval email failed", await response.text());
      if (response.status >= 500) return false;
    } catch (error) {
      console.error("Could not confirm Sarvam approval email", error);
      return false;
    }
  }

  const smtpUser = process.env["SMTP_USER"];
  const smtpPass = process.env["SMTP_PASS"];
  if (!from || !smtpUser || !smtpPass) return false;

  try {
    const transport = nodemailer.createTransport({
      host: process.env["SMTP_HOST"] || "smtp.gmail.com",
      port: Number(process.env["SMTP_PORT"] || "465"),
      secure: process.env["SMTP_SECURE"] !== "false",
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transport.sendMail({
      ...message,
      from: process.env["SMTP_FROM_EMAIL"] || from,
      replyTo,
    });
    return true;
  } catch (error) {
    console.error("Sarvam approval email delivery failed", error);
    return false;
  }
}

function renderSarvamApprovalEmail(registration: SarvamApprovalEmail) {
  const escapeHtml = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (character) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
        character,
    );

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BUILD WITH SARVAM team approved</title></head>
  <body style="margin:0;background:#f7f4ed;color:#24352b;font-family:Arial,Helvetica,sans-serif">
    <div style="padding:32px 16px">
      <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #ddd8cc">
        <div style="padding:28px 28px 20px;border-bottom:1px solid #e8e3d8">
          <p style="margin:0;color:#52705c;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase">Vertex × Sarvam AI</p>
          <h1 style="margin:18px 0 0;font:600 34px/1.05 Georgia,serif;color:#24352b">Your team is approved.</h1>
        </div>
        <div style="padding:28px">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6">Hi ${escapeHtml(registration.teamLeadName)},</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.6">The team <strong>${escapeHtml(registration.teamName)}</strong> has been approved for BUILD WITH SARVAM.</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f3f0e8">
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px">When</td><td style="padding:12px 14px;text-align:right;font-size:14px">13–14 November 2026</td></tr>
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px">Where</td><td style="padding:12px 14px;text-align:right;font-size:14px">REVA University</td></tr>
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px">Team size</td><td style="padding:12px 14px;text-align:right;font-size:14px">${registration.memberCount} members</td></tr>
          </table>
          <p style="margin:24px 0 0;color:#5f6b63;font-size:14px;line-height:1.6">Please keep this email for your team records. Further event-desk updates will be shared with the team lead.</p>
        </div>
        <div style="padding:18px 28px;border-top:1px solid #e8e3d8;color:#718077;font-size:12px;line-height:1.5">Vertex Club · REVA University · In collaboration with Sarvam AI</div>
      </div>
    </div>
  </body>
</html>`;
}
