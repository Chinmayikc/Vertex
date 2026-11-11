import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import {
  buildSarvamApprovalText,
  renderSarvamApprovalEmail,
  SARVAM_APPROVAL_LOGO_CID,
  SARVAM_APPROVAL_QR_CID,
  SARVAM_APPROVAL_SUBJECT,
  type SarvamApprovalEmailData,
} from "@/lib/sarvam-email-template";

type SarvamApprovalEmail = SarvamApprovalEmailData & {
  registrationId: string;
  teamLeadEmail: string;
};

type SarvamApprovalEmailOptions = {
  idempotencyKey?: string;
};

type SarvamRegistrationEmail = {
  registrationId: string;
  teamName: string;
  teamLeadName: string;
  teamLeadEmail: string;
  memberCount: number;
  projectTitle: string;
  track: string;
};

/** Sends the submission receipt to the team's lead immediately after registration. */
export async function sendSarvamRegistrationEmail(
  registration: SarvamRegistrationEmail,
): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EVENTS_FROM_EMAIL"];
  const replyTo = process.env["EVENTS_REPLY_TO"];
  const message = {
    from,
    to: [registration.teamLeadEmail],
    subject: "BUILD WITH SARVAM · Submission received",
    html: renderSarvamRegistrationEmail(registration),
    text: `Vertex Club · REVA University

Hi ${registration.teamLeadName},

We received the Build with Sarvam idea submission for ${registration.teamName}.

Project: ${registration.projectTitle}
Track: ${registration.track}
Team size: ${registration.memberCount} members

Your submission is saved and will be reviewed by the organising team. Please keep this email for your records.

Vertex Club · In collaboration with Sarvam AI`,
  };

  if (apiKey && from) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `build-with-sarvam-registration-${registration.registrationId}`,
        },
        body: JSON.stringify({ ...message, reply_to: replyTo }),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return true;
      console.error("Sarvam registration confirmation email failed", await response.text());
      if (response.status >= 500) return false;
    } catch (error) {
      console.error("Could not send Sarvam registration confirmation email", error);
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
    console.error("Sarvam registration confirmation delivery failed", error);
    return false;
  }
}

/** Sends the approval notice only to the registered team's lead. */
export async function sendSarvamApprovalEmail(
  registration: SarvamApprovalEmail,
  options: SarvamApprovalEmailOptions = {},
): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EVENTS_FROM_EMAIL"];
  const replyTo = process.env["EVENTS_REPLY_TO"];
  const idempotencyKey =
    options.idempotencyKey ?? `build-with-sarvam-approval-${registration.registrationId}`;
  let qrDataUrl: string;
  let logoBuffer: Buffer;
  try {
    [qrDataUrl, logoBuffer] = await Promise.all([
      QRCode.toDataURL(registration.code, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 420,
      }),
      loadVertexLogo(),
    ]);
  } catch (error) {
    console.error("Could not prepare the Sarvam approval email assets", error);
    return false;
  }
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const logoBase64 = logoBuffer.toString("base64");
  const message = {
    from,
    to: [registration.teamLeadEmail],
    subject: SARVAM_APPROVAL_SUBJECT,
    html: renderSarvamApprovalEmail(registration),
    text: buildSarvamApprovalText(registration),
    attachments: [
      {
        filename: "build-with-sarvam-check-in-qr.png",
        content: qrBase64,
        content_type: "image/png",
        content_id: SARVAM_APPROVAL_QR_CID,
      },
      {
        filename: "vertex-club-logo.png",
        content: logoBase64,
        content_type: "image/png",
        content_id: SARVAM_APPROVAL_LOGO_CID,
      },
    ],
  };

  if (apiKey && from) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
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
      attachments: [
        {
          filename: "build-with-sarvam-check-in-qr.png",
          content: Buffer.from(qrBase64, "base64"),
          cid: SARVAM_APPROVAL_QR_CID,
          contentType: "image/png",
          contentDisposition: "inline",
        },
        {
          filename: "vertex-club-logo.png",
          content: Buffer.from(logoBase64, "base64"),
          cid: SARVAM_APPROVAL_LOGO_CID,
          contentType: "image/png",
          contentDisposition: "inline",
        },
      ],
    });
    return true;
  } catch (error) {
    console.error("Sarvam approval email delivery failed", error);
    return false;
  }
}

async function loadVertexLogo() {
  try {
    return await readFile(resolve(process.cwd(), "public/vertex-logo.png"));
  } catch {
    const siteUrl = process.env["SITE_URL"] || "https://vertex-club.vercel.app";
    const response = await fetch(`${siteUrl.replace(/\/$/, "")}/vertex-logo.png`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Vertex logo request failed with ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
}

function renderSarvamRegistrationEmail(registration: SarvamRegistrationEmail) {
  const escapeHtml = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (character) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
        character,
    );

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BUILD WITH SARVAM submission received</title></head>
  <body style="margin:0;background:#f7f4ed;color:#24352b;font-family:Arial,Helvetica,sans-serif">
    <div style="padding:32px 16px">
      <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #ddd8cc">
        <div style="padding:28px 28px 20px;border-bottom:1px solid #e8e3d8">
          <p style="margin:0;color:#52705c;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase">Vertex × Sarvam AI</p>
          <h1 style="margin:18px 0 0;font:600 34px/1.05 Georgia,serif;color:#24352b">Submission received.</h1>
        </div>
        <div style="padding:28px">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6">Hi ${escapeHtml(registration.teamLeadName)},</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.6">We received the idea submission for <strong>${escapeHtml(registration.teamName)}</strong>.</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f3f0e8">
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px">Project</td><td style="padding:12px 14px;text-align:right;font-size:14px">${escapeHtml(registration.projectTitle)}</td></tr>
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px">Track</td><td style="padding:12px 14px;text-align:right;font-size:14px">${escapeHtml(registration.track)}</td></tr>
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px">Team size</td><td style="padding:12px 14px;text-align:right;font-size:14px">${registration.memberCount} members</td></tr>
          </table>
          <p style="margin:24px 0 0;color:#5f6b63;font-size:14px;line-height:1.6">Your submission is saved and will be reviewed by the organising team. Please keep this email for your records.</p>
        </div>
        <div style="padding:18px 28px;border-top:1px solid #e8e3d8;color:#718077;font-size:12px;line-height:1.5">Vertex Club · REVA University · In collaboration with Sarvam AI</div>
      </div>
    </div>
  </body>
</html>`;
}
