import nodemailer from "nodemailer";
import QRCode from "qrcode";

type WorkshopPassEmail = {
  name: string;
  email: string;
  passUrl: string;
  code: string;
};

type WorkshopRegistrationEmail = {
  name: string;
  email: string;
  registrationId: string;
};

const WORKSHOP_CALENDAR_URL = (() => {
  const calendar = new URL("https://calendar.google.com/calendar/render");
  calendar.searchParams.set("action", "TEMPLATE");
  calendar.searchParams.set("text", "Neural Networks from Scratch · Vertex Club");
  calendar.searchParams.set("dates", "20261028T030000Z/20261028T070000Z");
  calendar.searchParams.set(
    "details",
    "Neural Networks from Scratch workshop by Vertex Club at REVA University. Registration is subject to approval; your QR pass will arrive by email after approval.",
  );
  calendar.searchParams.set("location", "SVB B009, REVA University, Bengaluru");
  return calendar.toString();
})();

/** Send a durable, non-pass receipt after a registration is saved as pending. */
export async function sendWorkshopRegistrationEmail(
  registration: WorkshopRegistrationEmail,
): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EVENTS_FROM_EMAIL"];
  const replyTo = process.env["EVENTS_REPLY_TO"];
  const message = {
    from,
    to: [registration.email],
    subject: "Vertex Workshop / Application received",
    html: renderRegistrationEmail(registration),
    text: `VERTEX CLUB  /  WORKSHOP SERIES\n\nAPPLICATION RECEIVED\nNeural Networks from Scratch: The Math Behind the Magic\n\nHello ${registration.name},\n\nYour application is in the review queue. We’ll email you when its status changes. This message confirms your application only; it is not an entry pass. If approved, your QR pass will arrive in a separate email at ${registration.email}.\n\n28 October 2026\n8:30 AM–12:30 PM IST\nSVB B009 · REVA University, Bengaluru\n\nAdd to calendar: ${WORKSHOP_CALENDAR_URL}\n\nFor registration help, reply to this email.\n\nVERTEX CLUB · REVA UNIVERSITY\nTechnical partner: Abscissa`,
  };

  if (apiKey && from) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `nn-workshop-registration-receipt-${registration.registrationId}`,
        },
        body: JSON.stringify({ ...message, reply_to: replyTo }),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return true;
      console.error(
        "Resend workshop registration receipt failed; trying SMTP fallback",
        await response.text(),
      );
      // A server error may follow an accepted send, so avoid a second copy
      // through SMTP when Resend's result is ambiguous.
      if (response.status >= 500) return false;
    } catch (error) {
      // A timeout is ambiguous: Resend may have accepted the message. Do not
      // fall back to SMTP and risk delivering a duplicate receipt.
      console.error("Could not confirm Resend workshop registration receipt", error);
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
    await transport.sendMail({ ...message, from: process.env["SMTP_FROM_EMAIL"] || from, replyTo });
    return true;
  } catch (error) {
    console.error("Workshop registration receipt email failed", error);
    return false;
  }
}

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
    subject: "Vertex Workshop / Approved — your entry pass",
    html: renderPassEmail(pass),
    text: `VERTEX CLUB  /  WORKSHOP SERIES\n\nAPPROVED · ENTRY PASS\nNeural Networks from Scratch: The Math Behind the Magic\n\nHello ${pass.name},\n\nYour place is confirmed. Show the QR code in this email at the Vertex check-in desk. If you can’t display it, give the team your backup pass code.\n\n28 October 2026\n8:30 AM–12:30 PM IST\nSVB B009 · REVA University, Bengaluru\n\nOpen your web pass: ${pass.passUrl}\nBackup pass code: ${pass.code}\n\nThe QR contains no personal information. Keep this email available on event day. For help, reply to this message.\n\nVERTEX CLUB · REVA UNIVERSITY\nTechnical partner: Abscissa`,
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
      console.error(
        "Resend workshop pass delivery failed; trying SMTP fallback",
        await response.text(),
      );
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
    <html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Approved · Vertex entry pass</title></head>
    <body style="margin:0;padding:0;background:#eeeae0;color:#23372d;font-family:Arial,Helvetica,sans-serif">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0">Your place is confirmed. Keep this QR pass ready for check-in.</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eeeae0"><tr><td align="center" style="padding:32px 14px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fbfaf6;border:1px solid #d8d5c9">
          <tr><td style="padding:24px 30px 20px;border-top:4px solid #254a39;border-bottom:1px solid #d8d5c9">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td><img src="${siteUrl}/vertex-logo-transparent.png" width="112" alt="Vertex Club" style="display:block;width:112px;height:auto;border:0" /></td><td align="right" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.4px;color:#667568">WORKSHOP SERIES&nbsp; / &nbsp;01</td></tr></table>
            <div style="padding-top:24px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#42624d">APPROVED&nbsp; · &nbsp;ENTRY PASS</div>
            <div style="padding-top:7px;font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:37px;font-weight:normal;color:#23372d">Your place is confirmed.</div>
          </td></tr>
          <tr><td style="padding:26px 30px 30px">
            <p style="margin:0 0 8px;font-size:15px;line-height:23px">Hello ${escapeHtml(pass.name)},</p>
            <p style="margin:0 0 22px;font-size:15px;line-height:23px;color:#526156">You’re in. Present this pass at the Vertex check-in desk for <strong style="color:#23372d">Neural Networks from Scratch</strong>.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #c8cbbf;border-bottom:1px solid #c8cbbf"><tr><td style="padding:15px 0;font-size:14px;line-height:22px"><span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.3px;color:#667568">WHEN</span><br/><strong style="font-weight:600">28 October 2026 · 8:30 AM–12:30 PM IST</strong></td></tr><tr><td style="padding:0 0 15px;font-size:14px;line-height:22px"><span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.3px;color:#667568">WHERE</span><br/><strong style="font-weight:600">SVB B009 · REVA University, Bengaluru</strong></td></tr></table>
            <div style="padding:24px 0 6px;text-align:center">
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;color:#667568">SCAN AT THE DOOR</div>
              <img src="cid:vertex-entry-pass" width="240" height="240" alt="Entry pass QR code" style="display:block;width:240px;height:240px;margin:10px auto 0;border:8px solid #ffffff;background:#ffffff" />
              <div style="padding-top:7px;font-size:12px;line-height:18px;color:#667568">Keep this email open or save the QR before you arrive.</div>
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;background:#f0eee6;border-left:3px solid #42624d"><tr><td style="padding:13px 16px"><div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.4px;color:#667568">BACKUP PASS CODE</div><div style="padding-top:4px;font-family:'Courier New',monospace;font-size:21px;letter-spacing:2px;color:#23372d">${escapeHtml(pass.code)}</div></td></tr></table>
            <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:22px auto 0"><tr><td align="center" style="background:#254a39"><a href="${safeUrl}" style="display:inline-block;min-height:44px;padding:13px 24px;color:#ffffff;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none">Open digital pass</a></td></tr></table>
            <p style="margin:22px 0 0;font-size:12px;line-height:19px;color:#667568">The QR contains no personal information. Need help? Reply to this email.</p>
          </td></tr>
          <tr><td style="padding:16px 30px;background:#f0eee6;border-top:1px solid #d8d5c9;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.5px;color:#667568">VERTEX CLUB&nbsp; · &nbsp;REVA UNIVERSITY<br/><span style="font-family:Arial,Helvetica,sans-serif;letter-spacing:0">Technical partner <a href="https://abscissa.dev" style="color:#254a39;font-weight:bold;text-decoration:none">Abscissa</a></span></td></tr>
        </table>
      </td></tr></table>
    </body></html>`;
}

function renderRegistrationEmail(registration: WorkshopRegistrationEmail) {
  const siteUrl = escapeHtml(process.env["SITE_URL"] || "https://vertex-club.vercel.app");
  const calendarUrl = escapeHtml(WORKSHOP_CALENDAR_URL);
  return `<!doctype html>
    <html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Application received · Vertex Club</title></head>
    <body style="margin:0;padding:0;background:#eeeae0;color:#23372d;font-family:Arial,Helvetica,sans-serif">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0">Your workshop application is under review. We’ll email you when its status changes.</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eeeae0"><tr><td align="center" style="padding:32px 14px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fbfaf6;border:1px solid #d8d5c9">
          <tr><td style="padding:24px 30px 20px;border-top:4px solid #254a39;border-bottom:1px solid #d8d5c9">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td><img src="${siteUrl}/vertex-logo-transparent.png" width="112" alt="Vertex Club" style="display:block;width:112px;height:auto;border:0" /></td><td align="right" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.4px;color:#667568">WORKSHOP SERIES&nbsp; / &nbsp;01</td></tr></table>
            <div style="padding-top:24px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#42624d">APPLICATION&nbsp; · &nbsp;UNDER REVIEW</div>
            <div style="padding-top:7px;font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:37px;font-weight:normal;color:#23372d">A place in the queue.</div>
          </td></tr>
          <tr><td style="padding:26px 30px 30px">
            <p style="margin:0 0 8px;font-size:15px;line-height:23px">Hello ${escapeHtml(registration.name)},</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:23px;color:#526156">Your application for <strong style="color:#23372d">Neural Networks from Scratch</strong> is in the review queue. We’ll email you when its status changes.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #c8cbbf;border-bottom:1px solid #c8cbbf"><tr><td style="padding:15px 0;font-size:14px;line-height:22px"><span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.3px;color:#667568">WHEN</span><br/><strong style="font-weight:600">28 October 2026 · 8:30 AM–12:30 PM IST</strong></td></tr><tr><td style="padding:0 0 15px;font-size:14px;line-height:22px"><span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.3px;color:#667568">WHERE</span><br/><strong style="font-weight:600">SVB B009 · REVA University, Bengaluru</strong></td></tr></table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;background:#f0eee6;border-left:3px solid #a98044"><tr><td style="padding:14px 16px"><div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.4px;color:#776748">STATUS&nbsp; / &nbsp;PENDING APPROVAL</div><div style="padding-top:5px;font-size:13px;line-height:20px;color:#526156">This confirms your application only. It is not an entry pass. If approved, your QR pass will be sent to ${escapeHtml(registration.email)}.</div></td></tr></table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:22px"><tr><td align="center" style="background:#254a39"><a href="${calendarUrl}" style="display:inline-block;min-height:44px;padding:13px 20px;color:#ffffff;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none">Add date to calendar</a></td></tr></table>
            <p style="margin:22px 0 0;font-size:12px;line-height:19px;color:#667568">For registration help, reply to this email.</p>
          </td></tr>
          <tr><td style="padding:16px 30px;background:#f0eee6;border-top:1px solid #d8d5c9;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.5px;color:#667568">VERTEX CLUB&nbsp; · &nbsp;REVA UNIVERSITY<br/><span style="font-family:Arial,Helvetica,sans-serif;letter-spacing:0">Technical partner <a href="https://abscissa.dev" style="color:#254a39;font-weight:bold;text-decoration:none">Abscissa</a></span></td></tr>
        </table>
      </td></tr></table>
    </body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!,
  );
}
