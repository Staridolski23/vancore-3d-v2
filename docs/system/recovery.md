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

## Code rollback

Restore the exact prior code/modules and restart the existing service with the correct environment. Keep the live database and newly uploaded files. Preserve new CMS overlay rows/AI conversations even if their reader is rolled back. Re-run health, permissions and public-content checks. Rolling back a security boundary may reintroduce exposure; prefer a protected maintenance response over reopening private data.

## Evidence to retain

Archive timestamp and SHA, source revision, migration version, dependencies/runtime versions, restore result, required configuration names (never values), failure reason, recovery steps and operator decision. Keep separate private manifests for actual client data and secrets.
