# Build with Sarvam finalist rollout

## What was found and what is missing

This checkout has no Build with Sarvam route, event seed, confirmed shortlist, or event-specific registration schema. Existing event/team/idea infrastructure is `events`, `hackathon_teams`, `hackathon_team_members`, and `hackathon_submissions`. The implementation reuses those IDs and reads their records without changing registration or idea flows. Do **not** treat SIH `selected` statuses as the Sarvam shortlist.

The configured Supabase endpoint could not be inspected: the managed environment proxy rejects that destination with HTTP 403. Its credentials do not establish staging status. No production migrations, roster writes, or uploads were performed. Development database tests use isolated in-memory Postgres (PGlite) with fixture records, never the configured remote project.

Before rollout, organizers must supply/confirm:

- The existing `events.id` for slug `build-with-sarvam`, and the 50 organizer-confirmed `hackathon_teams.id` values belonging to that event. If the real registrations use other tables or an external form, first map the read adapter in `src/lib/finalists.server.ts` to those records and adjust the migration foreign keys. Do not recreate teams or assign new IDs.
- Registered leader Google emails, team names, member records, and original ideas. This schema records leader/member roles (`is_lead`), title (`solution_title`), track (`theme`), problem statement, and the submitted answer (`solution_summary`). No separate arbitrary-question/answer JSON column or external form answers were found. Map any additional recorded answers before enabling access. Missing ideas are explicitly shown as missing rather than invented.
- The dashboard availability date, opening time, deadline (with timezone), and organizer contact details. There is no guessed deadline.
- Google OAuth provider setup and real browser/server Supabase environment values.
- Storage quota/headroom, including other buckets, existing usage, retries, and replacements.

## Local checks

Use Node 24+ and `npm ci`, then:

```sh
npm run test:finalists
npm run build
npx tsc --noEmit
```

The test suite runs the migration in isolated Postgres and verifies default closure, upload reservation limits, save status, ownership mismatch, one-row uniqueness, idempotent receipts, replacements, expired uploads, deadline cutoff, direct client permission denial, unchanged fixture registrations, and private bucket size configuration. It also checks verified Google identity, unique normalized leader matching, organizer authorization, required HTTPS links, GitHub URLs, CSV formula escaping, PDF size/content checks, and PPTX container validation.

Browser smoke checks should run with explicit local/staging Supabase URLs, never credential placeholder strings. Verify `/events/build-with-sarvam` and `/events/build-with-sarvam/dashboard` at desktop/mobile sizes. An unauthenticated visitor sees Google sign-in, switch-account, and contact instructions, with no private team/form data. The private page contains no server-rendered personal data; data loads through authenticated POST server functions.

## Staging rollout

1. Use a separate Supabase staging project with the existing schema and sanitized copies of the actual event records. Apply all prior migrations in filename order, then `supabase/migrations/20261114000000_sarvam_finalists.sql`, using `psql -v ON_ERROR_STOP=1 --single-transaction -f ...` or the project's migration mechanism. The new migration is additive; it does not seed or modify registered teams or ideas.
2. The migration creates a private `finalist-decks` bucket with `file_size_limit = 5000000`, separate settings, an event-scoped allowlist, upload reservations, and final records. All new tables have RLS enabled and no anon/authenticated CRUD grants. RPC execution is service-role only. There are no browser Storage CRUD policies. Signed upload/download capabilities are issued only after server authorization. Confirm no broad pre-existing `storage.objects` policy permits access to this new bucket; scope any broad policies to their original buckets before opening access.
3. Prepare `finalists.csv` containing a single `team_id` header and exactly 50 existing confirmed IDs. From that directory run:

   ```sh
   psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f /path/to/Vertex/scripts/import-sarvam-finalists.sql
   ```

   The import verifies exactly 50 unique IDs, event ownership, nonblank and unambiguous normalized leader emails, and compatibility with any existing allowlist. It aborts the transaction on disagreement and never automatically removes finalists. First import creates settings with both switches **false**. Re-running the same file is safe.

4. In Google Cloud configure an OAuth Web client, authorized for the Supabase callback `https://<staging-project-ref>.supabase.co/auth/v1/callback`. Enable Google under Supabase Authentication → Providers using that client ID/secret. Keep the secret in provider settings, never the browser bundle. Configure the app's real URL as Supabase Site URL, and add the exact allowed redirect `https://<staging-site>/events/build-with-sarvam/dashboard` (and `http://localhost:3000/events/build-with-sarvam/dashboard` for local development). Sign-in uses `prompt=select_account` and Supabase's existing implicit-session callback handling on that page; no separate application callback route is required.
5. Supply `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` on the server, plus `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at browser build time. Only the service role stays server-side. Set actual HTTP(S) URL values, not unresolved environment placeholders. The verified identity must be Google, email verified, email confirmed, and match the normalized registered leader address. Authentication fails closed for ambiguous multi-provider accounts; ask organizers to resolve such accounts rather than bypassing identity checks.
6. Configure contact details and enable the read-only dashboard independently:

   ```sql
   UPDATE public.finalist_settings
   SET organizer_contact = 'Contact: <confirmed organizer email or phone>',
       dashboard_enabled = true
   WHERE event_id = (SELECT id FROM public.events WHERE slug = 'build-with-sarvam');
   ```

   Leave `submissions_enabled = false` during roster/idea checks.

7. Check the Supabase Storage Usage dashboard and plan quota. Fifty current decks alone can consume **250,000,000 bytes**. Three pending uploads per team can add **750,000,000 bytes**, and retained previous versions add more. Reserve capacity above that working budget, monitor usage, and arrange quota expansion or cleanup before opening. The application cannot infer available plan quota from object sizes. Record organizer confirmation of storage headroom and OAuth/roster/window checks.
8. Set explicit timestamptz values using the organizer's confirmed IST times, then enable submissions only after all confirmations:

   ```sql
   -- Replace every placeholder with the confirmed values; do not use guessed dates.
   UPDATE public.finalist_settings
   SET opens_at = '<confirmed opening YYYY-MM-DD HH:MM:SS+05:30>'::timestamptz,
       closes_at = '<confirmed deadline YYYY-MM-DD HH:MM:SS+05:30>'::timestamptz,
       submissions_enabled = true
   WHERE event_id = (SELECT id FROM public.events WHERE slug = 'build-with-sarvam');
   ```

   The server and atomic save RPC enforce opening inclusive, closing exclusive, using database wall-clock time at finalization. The UI displays IST. Opening the form or starting an upload does not extend the deadline. Repeat confirmation of an already saved upload returns its original receipt even after the deadline; it makes no new write.

## Staging acceptance before production

Real Google redirects, real Storage policy enforcement, and the actual 50-team roster require staging credentials/accounts and are not established by isolated tests. Run the following against staging:

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

After staging acceptance, apply the same migration and confirmed ID import to production, preserving the production team IDs (staging IDs may differ). Verify Google production callback/redirect allowlists and real build-time variables, deploy the code, enable the read-only dashboard, and repeat team/idea checks. Enable final submissions only after the organizer confirms the production roster, opening/deadline, Google OAuth setup, and storage headroom. No live project has been opened by this implementation.

To pause writes, set `submissions_enabled = false`; existing final records and review/downloads remain intact. To close finalist access too, set `dashboard_enabled = false` in the same update. Retain tables, bucket objects, original registrations and ideas. Keep backups and investigate before manually changing an existing allowlist or deleting records.

## Verification recorded for this change

- `npm run test:finalists`: all nine test groups passed, including the isolated Postgres migration/transaction checks.
- `npm run build`: passed.
- ESLint on the new finalist modules/components/routes: passed without errors or warnings.
- Playwright/Chromium: event-to-dashboard navigation, Google/switch-account controls, unauthenticated privacy, desktop/mobile layout, and actual `Cache-Control: private, no-store` response passed with a local test configuration. This did not exercise a real Google account or remote Storage upload.
- Repository-wide checks remain affected by existing issues: TypeScript reports the `IridescenceProps.color` HTML attribute intersection in `AmbientBackground.tsx` and `Atmosphere.tsx`; full lint reports pre-existing formatting and other violations outside the new finalist code. Those unrelated files were not changed.
