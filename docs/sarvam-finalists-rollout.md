# Build with Sarvam finalist rollout

## What was found and what is missing

The live Vertex Supabase project contains the Build with Sarvam event and the source shortlist in `event_registrations.form_data`. It currently has 50 approved, 95 pending, and 9 rejected registrations. The approved records contain unique teams, four members, one registered leader matching each registration email, and idea fields. The app now uses each existing `event_registrations.id` as its finalist team ID; it does not copy or mutate registration data. The other Supabase project under the same profile is an empty, paused/resumed project labeled `main PRODUCTION`, so it is not suitable as a staging database or as the live app's data source without changing the app connection.

The active Vertex project has Google auth enabled and its existing Storage object policies are scoped to the `media` bucket. A read-only usage query found 31 `media` objects totaling 3,108,770 bytes. The project is on the Free plan with 1 GB Storage. The finalist bucket is privately capped at 5 MB per deck and the finalist subsystem enforces a 500 MB event-wide byte budget. The schema and 50-team allowlist are now applied, but live login and file-upload acceptance still require the deployed portal and a real participant account.

Organizer-confirmed submission window: **November 14, 2026, 9:00 a.m. to 3:00 p.m. IST** (`2026-11-14 09:00:00+05:30` through `2026-11-14 15:00:00+05:30`).

## Local checks

Use Node 24+ and `npm ci`, then:

```sh
npm run test:finalists
npm run build
npx tsc --noEmit
```

The test suite runs the migration in isolated Postgres and verifies default closure, upload reservation limits, save status, ownership mismatch, one-row uniqueness, idempotent receipts, replacements, expired uploads, deadline cutoff, direct client permission denial, unchanged fixture registrations, and private bucket size configuration. It also checks verified Google identity, unique normalized leader matching, organizer authorization, required HTTPS links, GitHub URLs, CSV formula escaping, PDF size/content checks, and PPTX container validation.

Browser smoke checks should run with explicit local/staging Supabase URLs, never credential placeholder strings. Verify `/events/build-with-sarvam` and `/events/build-with-sarvam/dashboard` at desktop/mobile sizes. An unauthenticated visitor sees Google sign-in, switch-account, and contact instructions, with no private team/form data. The private page contains no server-rendered personal data; data loads through authenticated POST server functions.

## Database rollout

The alternate project is empty, so it cannot validate this schema against the actual Vertex event without first rebuilding the whole Vertex database. Use the active Vertex Supabase project. The migration is additive; it creates only finalist-specific tables, RPCs and a private bucket. It leaves the original registrations untouched. The importer validates the live event and inserts the existing approved registration IDs:

The import verifies exactly 50 approved records, unique team names and leaders, required idea fields, four members per team, one leader matching the registered email, and compatibility with an existing allowlist. It aborts on disagreement and never removes finalists. The live migration and import succeeded; the dashboard redirect URL is allowlisted. The live settings were set to dashboard and submissions enabled for the confirmed **9:00 a.m.–3:00 p.m. IST** window. The database stores those timestamps in UTC as `03:30–09:30`. The app must use the existing Vertex project URL and keys, with the service role key kept server-side. Identity checks require a verified Google login, a confirmed email, and a match to the normalized registered team-leader email.

The database upload budget is **500 MB** and the per-file maximum is **5 MB**. The active project's existing Storage usage was 3,108,770 bytes against its 1 GB Free-plan quota; the event budget prevents finalist uploads from exceeding its reserved amount. Monitor the project quota during the event. The application cannot infer storage quota shared with other buckets.

## Live acceptance checks

Isolated tests cover the migration, data import, access controls and deadline behavior. Live acceptance still requires the deployed app, a real leader Google account and actual Storage upload. Verify these after deployment:

- First Google login as a selected leader; verify original team, members, title, track, and all recorded answers. Try a wrong account, nonleader member, unselected leader, unverified/non-Google identity, and ambiguous normalized leader addresses. Use Switch account to recover. Verify a user cannot choose a team ID in dashboard/save/upload requests. Attempt to finalize another team's upload UUID; it must fail.
- Admin/head can open Admin → Sarvam Finals (heading: Build with Sarvam → Final Submissions); student, mentor, and judge-only accounts cannot review/download. Verify no anon/authenticated direct table or Storage access. Confirm browser bundles contain no service key.
- All 50 rows start Pending. Upload a genuine PDF/PPT/PPTX, including exactly 5,000,000 bytes; reject 5,000,001 bytes and a renamed Word/HTML/non-presentation file. Provide project, demo, GitHub repo and HTTPS video links. Same project/demo URL is allowed. Ensure judges can open private repository/video links.
- Interrupt an upload: no final record/status is created. Retry, submit twice, simulate a lost save response, and confirm one final row and a timestamped receipt. Keep the prior record/download while a replacement is pending, invalid, failed, or expired. Successfully replace it, then check all five deliverables and latest timestamp in admin immediately after Refresh.
- Submit before opening, exactly at/after cutoff, and after disabling submissions while the form remains open. Check no new final record is written at cutoff. Review and downloads remain available when submissions close.
- Search, Pending/Submitted filter, refresh midway through the event, and CSV export. CSV includes all confirmed teams, status, UTC timestamp, and four links; formula-leading values are escaped.
- Smoke-test existing SIH registration/team join/idea submission and generic event registration in staging using their original flows. Do not run `test:e2e` against production: that existing script creates records in its configured database.

## Cleanup and operational behavior

Uploads use fresh immutable object keys and browser-direct signed upload tokens. Every authorization and save resolves the leader/team again on the server; client inputs cannot choose the event/team. There is at most one final row per event/team. Upload reservations are capped at three unconsumed, unexpired objects per team. The bucket enforces 5,000,000 bytes and finalization downloads the actual object to verify byte count and PDF/PPT/PPTX content markers/container. It does not fetch or execute submitted links. Content validation is format identification, not malware scanning.

A reservation expires after two hours, matching Supabase's signed upload lifetime. Final records point to the last successful immutable object. Admin → Sarvam Finals → Clean up old uploads removes objects only after reservation expiry plus a 24-hour grace period, excluding every current final deck. This covers expired, interrupted and superseded uploads. Run it at least daily and monitor capacity; it processes up to 200 candidates per click. Audit reservation rows remain after deletion. Signed presentation downloads expire after 60 seconds. Do not delete the private bucket to clean up attempts.

The dashboard route has an explicit `private, no-store` Nitro override to the existing public `/events/**` cache rule. Every private data RPC is POST and sets private/no-store plus authorization/cookie variance. Validate the deployed response headers and cache isolation with two independent browser sessions before launch.

## Production and rollback

The live database is prepared. The remaining rollout step is to merge and deploy the branch, then verify Google sign-in and a real upload before the window opens. If either check fails, set `submissions_enabled = false` and fix it before inviting teams.

To pause writes, set `submissions_enabled = false`; existing final records and review/downloads remain intact. To close finalist access too, set `dashboard_enabled = false` in the same update. Retain tables, bucket objects, original registrations and ideas. Keep backups and investigate before manually changing an existing allowlist or deleting records.

## Verification recorded for this change

- `npm run test:finalists`: all nine test groups passed, including the isolated Postgres migration/transaction checks.
- `npm run build`: passed.
- ESLint on the new finalist modules/components/routes: passed without errors or warnings.
- Playwright/Chromium: event-to-dashboard navigation, Google/switch-account controls, unauthenticated privacy, desktop/mobile layout, and actual `Cache-Control: private, no-store` response passed with a local test configuration. This did not exercise a real Google account or remote Storage upload.
- Repository-wide checks remain affected by existing issues: TypeScript reports the `IridescenceProps.color` HTML attribute intersection in `AmbientBackground.tsx` and `Atmosphere.tsx`; full lint reports pre-existing formatting and other violations outside the new finalist code. Those unrelated files were not changed.
