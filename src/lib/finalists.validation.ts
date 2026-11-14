import type { User } from "@supabase/supabase-js";
import { z } from "zod";
export const MAX_DECK_BYTES = 5_000_000;
export const httpsLink = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((s) => {
    try {
      const u = new URL(s);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Use an HTTPS link without credentials.");
export const finalLinks = z.object({
  project: httpsLink,
  demo: httpsLink,
  github: httpsLink.refine((s) => {
    try {
      const u = new URL(s);
      return u.hostname === "github.com" && /^\/[^/]+\/[^/]+\/?$/.test(u.pathname);
    } catch {
      return false;
    }
  }, "Enter a GitHub repository URL."),
  video: httpsLink,
});
export function deckExtension(name: string) {
  const ext = name.toLowerCase().split(".").pop();
  if (!ext || !["pdf", "ppt", "pptx"].includes(ext))
    throw new Error("Choose a PDF, PPT, or PPTX presentation.");
  return ext;
}
export function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}
export function submissionOpen(
  settings: {
    dashboard_enabled: boolean;
    submissions_enabled: boolean;
    opens_at: string | null;
    closes_at: string | null;
  },
  now = Date.now(),
) {
  return (
    settings.dashboard_enabled &&
    settings.submissions_enabled &&
    !!settings.opens_at &&
    !!settings.closes_at &&
    now >= Date.parse(settings.opens_at) &&
    now < Date.parse(settings.closes_at)
  );
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}

export function verifiedGoogleEmail(user: User | null, claims: Record<string, unknown>) {
  const identity = user?.identities?.find(
    (i) => i.provider === "google" && i.identity_data?.email_verified === true,
  );
  const googleEmail = identity?.identity_data?.email;
  const metadata = claims.app_metadata as { provider?: string } | undefined;
  const methods = claims.amr as { method?: string }[] | undefined;
  if (
    user?.identities?.some((i) => i.provider !== "google" && i.provider !== "email") ||
    metadata?.provider !== "google" ||
    !methods?.some((m) => m.method === "oauth") ||
    !user?.email_confirmed_at ||
    !user.email ||
    typeof googleEmail !== "string" ||
    normalizedEmail(googleEmail) !== normalizedEmail(user.email)
  )
    throw new Error("Sign in with your verified Google leader account.");
  return normalizedEmail(googleEmail);
}
export function uniqueLeader<T extends { lead_email: string }>(teams: T[], email: string): T {
  const matches = teams.filter((t) => normalizedEmail(t.lead_email) === normalizedEmail(email));
  if (matches.length !== 1)
    throw new Error(
      "We could not uniquely match this Google account to a confirmed finalist leader. Switch accounts and use the email used to register.",
    );
  return matches[0];
}

export function ist(value: string) {
  return (
    new Date(value).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " IST"
  );
}
