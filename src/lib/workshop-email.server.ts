import nodemailer from "nodemailer";
import QRCode from "qrcode";

type WorkshopPassEmail = {
  name: string;
  email: string;
  passUrl: string;
  code: string;
};

/**
 * Send through Resend when it has a verified sender, otherwise through the
 * dedicated event Gmail account. Passes are sent only after an event manager
 * has approved the registration; an administrator can resend them later.
 */
export async function sendWorkshopPassEmail(pass: WorkshopPassEmail): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EVENTS_FROM_EMAIL"];
  const replyTo = process.env["EVENTS_REPLY_TO"];
  // The web pass is useful to a participant, but it is a poor scanner payload:
  // it produces a dense QR in Gmail and can be changed by URL rewriting. The
  // door scanner and web pass both use this same short, non-personal pass code.
  const qrContent = await QRCode.toBuffer(pass.code, {
    type: "png",
    errorCorrectionLevel: "Q",
    margin: 2,
    width: 640,
    color: { dark: "#111827", light: "#ffffff" },
  });
  const qrBase64 = qrContent.toString("base64");
  const message = {
    from,
    to: [pass.email],
    subject: "Your approved entry pass · Neural Networks from Scratch",
    html: renderPassEmail(pass),
    text: `Vertex Club · REVA University\n\nHi ${pass.name}, your registration for Neural Networks from Scratch has been approved.\n\nYour QR is included in the HTML version of this email. Show it at the Vertex desk for check-in.\n\nWhen: 28 October 2026 · 8:30 AM–12:30 PM\nWhere: SVB B009, REVA University\n\nOpen your pass: ${pass.passUrl}\nBackup pass code: ${pass.code}\n\nKeep this email available on event day.`,
  };

  if (apiKey && from) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...message,
        reply_to: replyTo,
        attachments: [
          {
            filename: "vertex-entry-pass.png",
            content: qrBase64,
            content_type: "image/png",
            content_id: "vertex-entry-pass",
          },
        ],
      }),
      });
      if (response.ok) return true;
      console.error("Resend workshop pass delivery failed; trying SMTP fallback", await response.text());
    } catch (error) {
      console.error("Resend workshop pass delivery failed; trying SMTP fallback", error);
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
          filename: "vertex-entry-pass.png",
          content: qrContent,
          contentType: "image/png",
          cid: "vertex-entry-pass",
          contentDisposition: "inline",
        },
      ],
    });
    return true;
  } catch (error) {
    console.error("Workshop pass email failed", error);
    return false;
  }
}

function renderPassEmail(pass: WorkshopPassEmail) {
  const safeUrl = escapeHtml(pass.passUrl);
  const siteUrl = escapeHtml(new URL(pass.passUrl).origin);
  return `<!doctype html>
    <html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Your Vertex entry pass</title></head>
    <body style="margin:0;padding:0;background:#f3f4f6;color:#172033;font-family:Arial,Helvetica,sans-serif">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6"><tr><td align="center" style="padding:28px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d9dee8;border-radius:18px;overflow:hidden">
          <tr><td style="padding:22px 28px;border-top:5px solid #173f2d;border-bottom:1px solid #e5e7eb">
            <img src="${siteUrl}/vertex-logo-transparent.png" width="132" height="44" alt="Vertex Club" style="display:block;width:132px;height:auto;border:0" />
            <div style="padding-top:14px;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#5d6a62">Vertex Club · REVA University</div>
            <div style="padding-top:8px;font-size:28px;line-height:34px;font-weight:700;color:#172033">Your entry pass is ready.</div>
          </td></tr>
          <tr><td style="padding:28px">
            <p style="margin:0 0 10px;font-size:16px;line-height:24px">Hi ${escapeHtml(pass.name)},</p>
            <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#4b5563">Your registration for <strong style="color:#172033">Neural Networks from Scratch</strong> has been approved. Show the QR below at the Vertex desk.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d9dee8;border-radius:12px;background:#f8faf9"><tr><td style="padding:18px 20px">
              <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#5d6a62">Event details</div>
              <div style="padding-top:7px;font-size:16px;line-height:24px;font-weight:700">28 October 2026 · 8:30 AM–12:30 PM</div>
              <div style="font-size:15px;line-height:23px;color:#4b5563">SVB B009, REVA University</div>
            </td></tr></table>
            <div style="padding:28px 0 10px;text-align:center">
              <img src="cid:vertex-entry-pass" width="240" height="240" alt="QR code for ${escapeHtml(pass.name)}'s Vertex entry pass" style="display:block;width:240px;height:240px;margin:0 auto;border:0;background:#ffffff" />
            </div>
            <p style="margin:8px 0 24px;text-align:center;font-size:13px;line-height:20px;color:#5d6a62">This is your check-in QR. Keep this email open or take a screenshot before you arrive.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr><td style="border-radius:8px;background:#172033">
              <a href="${safeUrl}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">Open web pass</a>
            </td></tr></table>
            <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e5e7eb;font-size:12px;line-height:19px;color:#6b7280">Backup pass code: <strong style="color:#172033">${escapeHtml(pass.code)}</strong><br/>The QR contains no personal information. Need help? Reply to this email.</p>
          </td></tr>
          <tr><td style="padding:18px 28px;background:#f8faf9;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
            Sent by Vertex Club · Technical partner <a href="https://abscissa.dev" style="color:#173f2d;font-weight:700;text-decoration:none">Abscissa</a>
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
