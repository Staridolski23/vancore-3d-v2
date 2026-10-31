# Technical construction and maintenance journal

## 24–26 October 2026 — preserved history

- Inspected existing desktop/WSL/server sources and documented system map.
- Established root-only online SQLite/application/config backups; downloaded and checked an initial archive, verified an isolated SQLite restore. Installed daily backup timer and saved PM2 state/startup configuration.
- Isolated frontend maintenance branch; updated Next/security dependencies while keeping React 18/Tailwind 3. Added CI and authorization/private-cache/booking regression coverage.
- Fixed booking month bounds, partial changes, proposal parameter ordering, transactions and conflict rollback on the server.
- Supabase: user-authorized ROLLBACK test passed before profile/content policy fixes were applied. Four independent checks confirmed the migration.
- Installed backend JWT verification, private downloads, safe public images, portal messaging, CMS overlay/moderation and media limits. General enforcement remains pending coordinated frontend rollout.
- Initial CMS activation failed the public-content equivalence check and automatically rolled back. Revised activation uses a dedicated overlay, preserves legacy rows and passed equivalence checks.
- Real preview admin/client checks passed for unchanged content/profile saves, own booking display, portal history and admin denial without losing the client session.
- Removed hardcoded client assessment score and corrected Vera pricing to owner-confirmed values. Runtime audit identified provider HTTP 400, stateless conversations, Contact mismatch and unfinished flows.
- Detailed audit/evidence are retained in the task outputs; PR #1 preserves source revisions.

## 31 October 2026 — authorized implementation resumed

- User approved proceeding with the technical repair plan. Further direction: finish technical correctness before UX redesign; test every function; archive the entire build procedure and database recovery knowledge.
- Rechecked clean branch at `32e4c24e95f6b36393fd7402268217635bc5abb6`. No intervening source edits found.
- Live server SHA-256 remains `1126c21049c5cd1ffd21015232912a9ad5e493ce09cfaba161e9a80a9d4ea12c`.
- Daily backup completed on 31 October with integrity `ok`. Additional pre-repair archive `20261031T102516.852930Z` created, downloaded and SHA verified; Git bundle preserves the complete frontend history. Locations/hashes are in the private backup manifest, not public credentials.
- Created this versioned system record and function acceptance matrix. Supabase full-data/auth/storage backup remains explicitly unverified until access/export/restore is completed.
- Implementation is in progress. Do not interpret this entry as successful production rollout.

### Contact and session repair batch (not yet promoted)

- Added bounded/type-checked contact normalization for both historical form payloads, visible failure handling and duplicate-submit prevention on Home.
- Added an HTTP-only, HTTPS-secure production refresh cookie scoped to auth routes; custom-header + Origin checks; isolated provider refresh/logout; transient errors preserve credentials. Central authenticated fetch retries after renewal and uses the current token rather than stale component props.
- Added a recovery completion form and authenticated provider password update. Recovery tokens are held only in memory and removed from the address bar. No real password has been changed by the agent.
- Fourteen route/security regression tests pass. Production build passed before the last recovery-state correction; a new build is being validated.
- Started reproducible localhost browser checks with synthetic intercepted APIs only. Contact success/error passed. Initial recovery check exposed a genuine state reset after URL scrubbing; corrected by tracking the scrubbed address. Re-run is required before signing off the recovery UI.
- The first UI test selector also matched Next's empty route announcer; narrowed it to the actual visible application error. This was a test harness issue, recorded separately from the recovery bug.
- Confirmed the saved desktop OpenRouter credential returns 401 with a zero-cost synthetic probe. No paid inference was requested. The configured Nous free model remains in its public model catalog; the existing Vercel credential is needed to validate a real provider request.
- Preview HTTP requests from the test runner redirect to Vercel sign-in. A 200 HTML login page is not counted as a successful API check. The prior browser helper stopped because it could not reliably identify the native browser URL; no browser cookies or private authentication state were extracted.
- Rebuilt after the recovery-state correction. All six isolated browser scenarios passed on 31 October: contact success, visible failure with preserved draft, recovery token URL removal/mismatch/invalid link, session renewal, client admin denial, and preservation of a session during a temporary provider failure. Evidence: task output `VANCORE-technical-ui-qa.json`; 0 real emails and 0 real password changes.
- Opened a separate clean Edge test window at the explicitly requested preview URL. Vercel requires user sign-in in that test context; the user has been asked to complete it. No saved browser profile/cookies were imported.

### Vera provider and browser recovery batch

- User completed Vercel sign-in in the isolated Edge context. Preview access works. Supabase still shows sign-in in that context; database export/migrations are pending that separate access.
- Replaced the rejected provider request with an attribution-tagged request to the same configured free Nous model. This is a candidate repair until a real preview response confirms it. Never fall back to a paid model automatically.
- Send bounded previous turns with each request, preserve complete final paragraphs, and never substitute private reasoning for a missing final answer. The current browser history window is 12 messages, each capped at 1,600 characters; it is not durable server storage.
- Label ready/AI/limited/unavailable states truthfully. Handle startup errors with Retry, remove an unnecessary inference request during startup, validate required lead fields/consent choices, and remove personal data from plan-selection URLs. Durable lead/consent storage and session restoration are still outstanding; do not claim a lead has been saved.
- Seventeen automated route/provider tests pass and the production build succeeds. Four additional localhost browser scenarios pass: startup failure/retry, follow-up context, visible limited mode, and usable input after failure. These use synthetic API fixtures, not a real provider; evidence is `VANCORE-vera-ui-qa.json`.
- Revalidated the 31 October backup hash and restored both archived SQLite databases into a temporary directory. Both integrity checks returned `ok`, with zero foreign-key violations (15 and 19 tables). No client records printed. The first verification helper left a SQLite handle open on Windows; corrected explicit connection closing, removed the temporary files, and reran successfully. This validates SQLite recovery only, not Supabase or a complete server boot.
- Preview commit `1239e338e1ec0419773b4de153abe1aa91882149` passed GitHub CI and Vercel deployment. Five real preview API turns used a synthetic sales/delivery case: four returned `mode=ai`, one returned the truthful `limited` fallback. Bulgarian replies reused the team sizes and missing delivery fields. The final preliminary plan retained the four-week target but also asked for a weekly total already supplied; diagnostic quality is not fully accepted. Evidence: `VANCORE-vera-live-qa.json`. This is API integration evidence; it does not prove actual client history persistence or human handoff.
- Follow-up adjustment gives the free reasoning model a larger final-answer token budget and a 45-second bounded request within an explicit 60-second route budget. Adds safe missing-final/timeout diagnostics without provider bodies or credentials. A mid-conversation fallback now explicitly reports limited analysis instead of repeating a prewritten question that may already have been answered. Revalidation pending.
- Visually inspected the outage state at desktop width 1280 and mobile width 390. The input and Send control remain usable; mobile document width equals viewport width. This is a check of the changed chat state only, not complete mobile QA for the site.
