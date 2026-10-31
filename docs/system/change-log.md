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
