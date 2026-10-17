import nodemailer from "nodemailer";

type WorkshopPassEmail = {
  name: string;
  email: string;
  passUrl: string;
  code: string;
};

/**
 * Send through Resend when it has a verified sender, otherwise through the
 * dedicated event Gmail account. Registration never fails solely because mail
 * delivery is unavailable: the pass is also shown on screen.
 */
export async function sendWorkshopPassEmail(pass: WorkshopPassEmail): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EVENTS_FROM_EMAIL"];
  const replyTo = process.env["EVENTS_REPLY_TO"];
  const message = {
    from,
    to: [pass.email],
    subject: "Your entry pass · Neural Networks from Scratch",
    html: renderPassEmail(pass),
    text: `Hi ${pass.name}, your entry pass for Neural Networks from Scratch is ready.\n\n28 October 2026 · 8:30 AM–12:30 PM\nB009, SMV Block, REVA University\n\nOpen your QR pass: ${pass.passUrl}\nBackup pass code: ${pass.code}`,
  };

  if (apiKey && from) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...message, reply_to: replyTo }),
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
    });
    return true;
  } catch (error) {
    console.error("Workshop pass email failed", error);
    return false;
  }
}

function renderPassEmail(pass: WorkshopPassEmail) {
  return `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111827">
        <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#64748b">Vertex Club · REVA University</p>
        <h1 style="font-size:30px">You’re registered.</h1>
        <p>Hi ${escapeHtml(pass.name)}, your entry pass for <strong>Neural Networks from Scratch</strong> is ready.</p>
        <p><strong>28 October 2026 · 8:30 AM–12:30 PM</strong><br/>B009, SMV Block, REVA University</p>
        <p><a href="${escapeHtml(pass.passUrl)}" style="display:inline-block;padding:14px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">Open your QR pass</a></p>
        <p style="font-size:13px;color:#64748b">Backup pass code: ${escapeHtml(pass.code)}. Keep this email or screenshot your pass. The QR contains no personal information.</p>
        <footer style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#64748b">
          <span style="letter-spacing:1.5px;text-transform:uppercase;font-size:10px">Technical partner</span>
          <a href="https://abscissa.dev" style="margin-left:8px;color:#111827;text-decoration:none;font-weight:700">Abscissa</a>
        </footer>
      </main>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
