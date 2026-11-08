# Backup and reconstruction procedure

## Before application/database changes

1. Record current frontend commit, backend code/module hashes, schema migration state and health.
2. Run `/usr/local/sbin/vancore-backup.py` on the server. It uses the SQLite online backup API and checks integrity before archiving application files, uploaded/document bytes, JSON data, Nginx and installed service units. Keep archives root-only.
3. Download the archive and manifest into the private local backup directory and compare SHA-256. Never attach the archive to a public PR: it contains real data and operational secrets.
4. Preserve frontend history with `git bundle create ... --all`; keep pending uncommitted changes separately if any.
5. Record what is NOT covered. SQLite backup is not Supabase backup; Nginx configuration is not a copy of managed Vercel settings, DNS, email service, certificates or external storage.

## Reconstruct in an isolated environment

Use a separate directory/database/port. Inspect archive paths for traversal before extraction. Restore files without running legacy scripts automatically. Verify SQLite integrity and schema/table inventory. Install exact dependencies from the lockfile, using a tested runtime compatible with native sqlite3. Restore secrets from the private archive or controlled secret store. Test health, anonymous/A/B/admin access and file ownership with disposable fixtures. Verify public content against the accepted snapshot before assigning production traffic.

Supabase recovery must separately cover database schema/data, authentication identities, storage object bytes/policies and required service settings. Test its restore independently; do not infer recoverability from RLS migrations alone.

Use `python scripts/verify-backup.py ARCHIVE --sha256 EXPECTED --report REPORT` to check a downloaded archive hash, reject unsafe paths, restore its SQLite files in a temporary directory, and validate integrity/foreign keys without exposing records. It does not execute archived code or modify live files. The 31 October archive passed this check for both databases; full application reconstruction remains a separate exercise.

## Supabase logical snapshot and offline drill

The private `20261031-supabase` directory contains `data-snapshot.json`, `catalog.json`, per-table metadata under `public-schema/` and `managed-schema/`, advisor results and a SHA-256 manifest. Access is restricted to the local owner. Data and Auth password hashes must never enter Git or public outputs.

The read-only query in `scripts/supabase-schema-snapshot.sql` records the catalog. Data is captured in one SQL statement for a consistent data snapshot. Metadata is a separate read; repeat inventory checks before any future migration. Live session tokens and managed service configuration are outside this snapshot. There are no Supabase Storage object bytes to export at this capture.

Install pinned verification dependencies with `npm ci --prefix ops/qa-runtime`. Run `node scripts/verify-supabase-snapshot.cjs PRIVATE_DIRECTORY REPORT.json`. The in-memory offline database restores application tables and Auth users/identities, constraints, indexes, functions, triggers and policies; compares row contents privately; and prints aggregate results only. It has no hosted connection or Auth server. Use `VANCORE_QA_RUNTIME` only to select a separately installed trusted copy of the same pinned verification packages.

Run `node tests/supabase-boundary.cjs PRIVATE_DIRECTORY MIGRATION.sql REPORT.json` to exercise anonymous/client A/client B/admin access and the matching code/ACL rollback. Never point these tools at production: they only accept local snapshot paths and create an in-memory database.

Standard `pg_dump`/CLI roles-schema-data export, managed Auth/SMTP/config reconstruction and hosted recovery remain separate acceptance items. Do not present the logical/offline drill as a complete hosted Supabase recovery.

## Code rollback

Restore the exact prior code/modules and restart the existing service with the correct environment. Keep the live database and newly uploaded files. Preserve new CMS overlay rows/AI conversations even if their reader is rolled back. Re-run health, permissions and public-content checks. Rolling back a security boundary may reintroduce exposure; prefer a protected maintenance response over reopening private data.

## Runtime and startup reconstruction

The current backend/PM2 interpreter is `/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node`. `stage-node-runtime.py` pins the official archive and verifies its checksum/member paths before installation. The verified archive is kept privately on the server and in the local `20261031-node24` backup directory.

Daily application archives now include `runtime/runtime-manifest.json`, `pm2/dump.pm2`, `systemd/pm2-vancore.service` and `maintenance/vancore-backup.py`. The PM2 dump can contain environment secrets: restore it privately, owned by `vancore`, and never publish it. Recreate the pinned runtime path before using the saved startup unit; install app dependencies from the archived lockfile with that runtime. Restore the saved PM2 home/configuration and verify a controlled service start, process executable paths, health, database integrity and public content before assigning traffic.

`activate-node-runtime.py` records the guarded transition and data-preserving rollback procedure. Private pre-change unit/dump/script copies are in `/var/backups/vancore/codex-20261031-node24-qa/runtime-rollback`. Runtime rollback changes interpreter/configuration only; never replace the live database. A controlled service cold start passed; a full machine reboot and managed-service reconstruction remain unverified.

## Evidence to retain

Archive timestamp and SHA, source revision, migration version, dependencies/runtime versions, restore result, required configuration names (never values), failure reason, recovery steps and operator decision. Keep separate private manifests for actual client data and secrets.

## Hosted Auth redirect configuration

Supabase project wqvhivuyvzdbuguuojhk: Authentication > URL Configuration. Site URL must be https://www.vancoresys.com (never the localhost development default). Preserve unrelated allowed redirects and include the exact https://www.vancoresys.com/login and https://vancore-3d-v2-git-maintenance-2026-10-24-vancore-s-projects.vercel.app/login. Keep previous configuration privately for review, but do not restore an erroneous localhost default during code rollback. No wildcard preview origins are required by the maintenance email flow. The public code helper selects only these two origins; adding a new preview requires reviewing both code and the hosted allow-list. Email templates must use the provider verification link/approved redirect rather than a hardcoded localhost URL. Hosted values/templates must be read back before calling the issue resolved.

## Public password recovery (31 October repair)

The public callback is https://api.vancoresys.com/auth/reset-password, served by maintenance/auth-recovery.cjs and auth-recovery.html. The adjacent auth-recovery-config.json contains only the fixed project URL and a publishable key; never substitute a secret/service key. The page removes URL credentials before rendering and submits passwords directly to the fixed Supabase Auth user endpoint. Keep the public page outside API authentication middleware, with per-response CSP nonces, no-store and no-referrer headers. No server-side credential exchange or database migration is required.

Add that exact callback to Supabase Auth Redirect URLs before sending recovery mail. Signup/resend can return to the public production /login; never use a Vercel-protected preview as a customer email callback. Use a deliberately invalid verification token to inspect only the redirect origin/path after an allow-list change; never log real verification tokens or recovery fragments.

Deployment installer: ops/backend/deploy-auth-recovery.py. Pre-install source SHA was 1126c21049c5cd1ffd21015232912a9ad5e493ce09cfaba161e9a80a9d4ea12c; deployed source SHA is c9ef532b2c529728fd81a68c791a79501f69822bd08c5f27c9f5d524eac6ac62. Earlier installers with a pinned old SHA must be reviewed before reuse. Original source is privately archived at /var/backups/vancore/codex-20261031-auth-recovery/code-rollback/server.js. Roll back only the code and restart the vancore PM2 app under Node24; preserve live databases and uploads. Keep a working public callback for outstanding emails during any code rollback.

## Contact outbox recovery (7 November)

Installer ops/backend/deploy-contact-maintenance.py guards the previous server checksum, takes an online backup, installs additive modules before legacy routes, and keeps notification delivery disabled. New server SHA: f1428aaa6fd849032bb94c7bb706e29db5ade10e51774336b9ab4fc929211002. Code rollback source: /var/backups/vancore/codex-20261107-contact-qa/code-rollback/server.js. Restore only code; preserve incoming_messages and vancore_contact_deliveries, including enquiries received after deployment. Keep VANCORE_AUTH_ENFORCE=true and VANCORE_CONTACT_MAIL_ENABLED=false, restart using the reviewed Node24 PM2 invocation, save, then check public health and private 401 boundaries. Do not replay the installer over a different checksum or drop the new table during routine rollback.

Before enabling delivery, verify the existing official Zoho SMTP destination without exposing credentials, review the queued backlog, and accept one controlled notification. The worker retries up to five attempts and recovers leases after ten minutes; it does not guarantee exactly-once delivery across a provider-success/process-crash boundary. Completed jobs are not manually retriable through the retry endpoint. Notification outages do not remove saved enquiries. The admin inbox shows at most the latest 100 enquiries; pagination remains outstanding.

## Canonical account role rollout and rollback constraints (7 November)

The protected public.users.role is the intended authority across Next, direct backend and RLS. Existing public recovery configuration supplies only the public project URL/publishable key for the backend role lookup; never substitute a secret key or log a user bearer. Backend installer ops/backend/deploy-account-roles.py requires pinned source/module checksums and a fresh provider-derived administrator-alignment attestation, takes an online archive, and keeps strict auth plus disabled contact mail in saved PM2 state. Validate an actual authenticated client read after installation, before publishing the new editor.

Apply the reviewed account_change_audit migration only after the private target snapshot and offline restore/transaction tests. Use ops/supabase/verify-profile-privileges-rollback.sql and verify-account-audit-rollback.sql for post-migration acceptance; both roll back all test writes. Compare the before/after profile fingerprint and confirm no synthetic audit remains. Audit rows belong in future private cloud exports; never drop them or restore an old profile snapshot during routine code rollback.

Historical email-allowlist code/deployments are installation-only recovery before any role editing. After a role has changed, do not use an old full Vercel rollback or restore the old backend allowlist: that can resurrect revoked privileges. Preserve the canonical verifier, Next identity guards and service-only audited mutation boundary; roll back a faulty UI with a new reviewed commit or disable its editing controls. Keep the first accepted canonical release as the new recovery baseline. Existing Auth tokens follow provider expiry/session semantics; use the protected role change for immediate administrator-rights revocation.

## Inactive booking proposal protection (7 November)

Installer ops/backend/deploy-booking-lifecycle.py pins server, canonical verifier, previous booking module and tested candidate checksums. It replaces only maintenance/bookings.cjs; current SHA 3233fb43ef33d1858672d2afa93e856a50ca30d43ab8eeefe26541159bdbc188. Before/after off-host archives and both-DB restore results are recorded in the change log. Module-only recovery copy is /var/backups/vancore/codex-20261107-booking-lifecycle/code-rollback/bookings.cjs. Prefer a reviewed forward fix: the older module permits an obsolete proposal to revive an inactive booking. Never restore the older email-list verifier, database snapshots or uploads as part of this code recovery. Keep active/saved strict auth true and contact mail false; check private 401 boundaries, public content, database integrity and a signed-in client read after restart.

## Vera history/quota recovery constraints (8 November candidate)

Apply the reviewed vera_conversations migration only after snapshot restoration and isolated tests; use ops/supabase/verify-vera-rollback.sql plus the existing profile/account rollback scripts and compare row fingerprints/counts before and after. The application/API requires this migration before publishing its frontend. The additive private tables, Starter usage and immutable briefs become production data once clients use Vera; never drop them or overwrite them with the pre-change snapshot during a code rollback.

Installer ops/backend/deploy-vera-boundary.py pins the existing server, booking lifecycle module and canonical role verifier. Candidate verifier SHA a6e719a3466d71759274900b7a3b7fa92bdb3695efc95bc90461a8d18c4b6a57 retains protected-role lookup and retires the two old unmetered model endpoints. Its previous-module recovery is installation-only, before new Vera is published. After release, use a reviewed forward fix retaining canonical roles, the ledger/quota boundary, closed legacy endpoints and existing history. Full rollback to the old Next application or the older backend module would reopen an unmetered route. In an outage keep the service visibly unavailable/limited rather than claiming unsaved replies or bypassing limits. Preserve strict auth and disabled SMTP in active/saved PM2 state.
