export type SarvamApprovalEmailData = {
  teamName: string;
  teamLeadName: string;
  memberCount: number;
  code: string;
};

export const SARVAM_APPROVAL_QR_CID = "sarvam-checkin-qr";

export const SARVAM_APPROVAL_SAMPLE: SarvamApprovalEmailData = {
  teamName: "Team Vertex AI",
  teamLeadName: "Aarav Sharma",
  memberCount: 4,
  code: "bws-2026-demo-qr",
};

export const SARVAM_APPROVAL_SUBJECT = "BUILD WITH SARVAM · Your team is selected";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
      character,
  );

export function buildSarvamApprovalText(registration: SarvamApprovalEmailData) {
  return `Build with Sarvam
Vertex Club · REVA University

Hello ${registration.teamLeadName},

Thank you for registering your team. Heartfelt congratulations — your team, ${registration.teamName}, has been selected for the final round of Build with Sarvam.

Event information
Date: 13–14 November 2026
Venue: REVA University, Bengaluru
Format: Inter-college AI hackathon
Team size: ${registration.memberCount} members

Build with Sarvam is an inter-college AI hackathon hosted by Vertex Club, REVA University, in collaboration with Sarvam AI. The event brings together student teams to build practical, responsible, and impactful solutions using AI.

Ready for check-in
Your team QR code is included with this email. Keep it ready on your phone for check-in on the day of the hackathon.
Backup check-in code: ${registration.code}

Build with Sarvam
Vertex Club
REVA University`;
}

export function renderSarvamApprovalEmail(
  registration: SarvamApprovalEmailData,
  qrSource = `cid:${SARVAM_APPROVAL_QR_CID}`,
) {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Build with Sarvam team selected</title></head>
  <body style="margin:0;background:#f4f1eb;color:#1f3128;font-family:Arial,Helvetica,sans-serif">
    <div style="padding:32px 16px">
      <div style="max-width:600px;margin:0 auto;background:#fffefa;border:1px solid #dcd8ce">
        <div style="padding:30px 30px 24px;border-bottom:1px solid #e7e2d9;background:#f8f6f0">
          <p style="margin:0;color:#52705c;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase">Vertex Club · REVA University</p>
          <h1 style="margin:18px 0 0;font:600 32px/1.1 Georgia,serif;color:#1f3128">Your team is selected.</h1>
          <p style="margin:10px 0 0;color:#637068;font-size:14px;line-height:1.5">BUILD WITH SARVAM · Final round confirmation</p>
        </div>
        <div style="padding:30px">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6">Hello ${escapeHtml(registration.teamLeadName)},</p>
          <p style="margin:0 0 10px;font-size:16px;line-height:1.6">Thank you for registering your team.</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6">Heartfelt congratulations — your team, <strong>${escapeHtml(registration.teamName)}</strong>, has been selected for the final round of Build with Sarvam.</p>

          <div style="margin:0 0 24px;padding:20px;background:#eef3ed;border-left:4px solid #52705c">
            <p style="margin:0 0 10px;color:#52705c;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase">About the hackathon</p>
            <p style="margin:0;color:#3e5046;font-size:14px;line-height:1.65">Build with Sarvam is an inter-college AI hackathon hosted by Vertex Club, REVA University, in collaboration with Sarvam AI. The event brings together student teams to build practical, responsible, and impactful solutions using AI.</p>
          </div>

          <p style="margin:0 0 12px;color:#52705c;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase">Event information</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f5f2ec;margin-bottom:26px">
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e6e1d8">Date</td><td style="padding:12px 14px;text-align:right;font-size:14px;border-bottom:1px solid #e6e1d8">13–14 November 2026</td></tr>
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e6e1d8">Venue</td><td style="padding:12px 14px;text-align:right;font-size:14px;border-bottom:1px solid #e6e1d8">REVA University, Bengaluru</td></tr>
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e6e1d8">Format</td><td style="padding:12px 14px;text-align:right;font-size:14px;border-bottom:1px solid #e6e1d8">Inter-college AI hackathon</td></tr>
            <tr><td style="padding:12px 14px;color:#647268;font-size:12px;text-transform:uppercase;letter-spacing:1px">Team size</td><td style="padding:12px 14px;text-align:right;font-size:14px">${registration.memberCount} members</td></tr>
          </table>

          <div style="padding:22px;text-align:center;border:1px solid #d9dfd8;background:#fbfcf9">
            <p style="margin:0;color:#52705c;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase">Ready for check-in</p>
            <p style="margin:12px auto 18px;max-width:400px;color:#4d5d54;font-size:14px;line-height:1.6">Your team QR code is below. Keep it ready on your phone for check-in on the day of the hackathon.</p>
            <img src="${qrSource}" width="220" height="220" alt="Team check-in QR code" style="display:block;width:220px;height:220px;margin:0 auto;padding:10px;background:#ffffff;border:1px solid #d6dcd4">
            <p style="margin:16px 0 0;color:#718077;font-size:12px;line-height:1.5">Backup check-in code: <strong style="color:#3e5046;letter-spacing:1px">${escapeHtml(registration.code)}</strong></p>
          </div>
        </div>
        <div style="padding:22px 30px;border-top:1px solid #e7e2d9;color:#5c6b62;font-size:13px;line-height:1.7">
          <strong style="display:block;color:#1f3128;font-size:14px">Build with Sarvam</strong>
          Vertex Club<br>REVA University
        </div>
      </div>
    </div>
  </body>
</html>`;
}
