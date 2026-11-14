# Build with Sarvam finalist rollout

## What was found and what is missing

The live Vertex Supabase project contains the Build with Sarvam event and the source shortlist in `event_registrations.form_data`. It currently has 50 approved, 95 pending, and 9 rejected registrations. The approved records contain unique teams, four members, one registered leader matching each registration email, and idea fields. The app now uses each existing `event_registrations.id` as its finalist team ID; it does not copy or mutate registration data. The other Supabase project under the same profile is an empty, paused/resumed project labeled `main PRODUCTION`, so it is not suitable as a staging database or as the live app's data source without changing the app connection.

The active Vertex project has Google auth enabled and its existing Storage object policies are scoped to the `media` bucket. A read-only usage query found 31 `media` objects totaling 3,108,770 bytes. The project is on the Free plan with 1 GB Storage. The finalist bucket is privately capped at 5 MB per deck and the finalist subsystem enforces a 500 MB event-wide byte budget. Browser and remote upload acceptance still require a real Google login and submission after the schema is deployed.

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

   ```sh
   psql "$VERTEX_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/import-sarvam-finalists.sql
   ```

   The import verifies exactly 50 approved records, unique team names and leaders, all required idea fields, four members per team, one leader matching the registered email, and compatibility with an existing allowlist. It aborts on disagreement and never removes finalists. It creates settings with both switches **false**. Re-running is safe.

4. Google is enabled in the active Vertex project. Its redirect allowlist must include the exact dashboard route `https://vertex-club.vercel.app/events/build-with-sarvam/dashboard` for Google sign-in to return to the app. Keep the OAuth client secret in Supabase provider settings, never in browser code.
5. Supply `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` on the server, plus `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at browser build time. Only the service role stays server-side. Set actual HTTP(S) URL values, not unresolved environment placeholders. The verified identity must be Google, email verified, email confirmed, and match the normalized registered leader address. Authentication fails closed for ambiguous multi-provider accounts; ask organizers to resolve such accounts rather than bypassing identity checks.
6. Enable the read-only dashboard independently:

   ```sql
   UPDATE public.finalist_settings
   SET dashboard_enabled = true
   WHERE event_id = (SELECT id FROM public.events WHERE slug = 'build-with-sarvam');
   ```

   Leave `submissions_enabled = false` during roster/idea checks. The default organizer contact remains the event-organizer instruction unless a confirmed contact is supplied.

7. The live project currently uses about 3.1 MB of its 1 GB Storage quota. The new bucket has a 500 MB event-wide limit plus a 5 MB per-file limit; it fails closed when that budget is full. Monitor quota during the event. The application cannot infer quota shared with other buckets.
8. Set explicit IST timestamps and enable submissions:

   ```sql
   UPDATE public.finalist_settings
   SET opens_at = '2026-11-14 09:00:00+05:30'::timestamptz,
       closes_at = '2026-11-14 15:00:00+05:30'::timestamptz,
       submissions_enabled = true
   WHERE event_id = (SELECT id FROM public.events WHERE slug = 'build-with-sarvam');
   ```

   The server and atomic save RPC enforce opening inclusive, closing exclusive, using database wall-clock time at finalization. The UI displays IST. Opening the form or starting an upload does not extend the deadline. Repeat confirmation of an already saved upload returns its original receipt even after the deadline; it makes no new write.

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

Apply the migration and import to the active Vertex project, preserve its registration IDs, deploy the app, and verify the real Google callback and existing production build variables. The switches remain off until the data import and route are live. Keep submissions disabled if the deployed sign-in or upload smoke checks fail.

To pause writes, set `submissions_enabled = false`; existing final records and review/downloads remain intact. To close finalist access too, set `dashboard_enabled = false` in the same update. Retain tables, bucket objects, original registrations and ideas. Keep backups and investigate before manually changing an existing allowlist or deleting records.

## Verification recorded for this change

- `npm run test:finalists`: all nine test groups passed, including the isolated Postgres migration/transaction checks.
- `npm run build`: passed.
- ESLint on the new finalist modules/components/routes: passed without errors or warnings.
- Playwright/Chromium: event-to-dashboard navigation, Google/switch-account controls, unauthenticated privacy, desktop/mobile layout, and actual `Cache-Control: private, no-store` response passed with a local test configuration. This did not exercise a real Google account or remote Storage upload.
- Repository-wide checks remain affected by existing issues: TypeScript reports the `IridescenceProps.color` HTML attribute intersection in `AmbientBackground.tsx` and `Atmosphere.tsx`; full lint reports pre-existing formatting and other violations outside the new finalist code. Those unrelated files were not changed.
