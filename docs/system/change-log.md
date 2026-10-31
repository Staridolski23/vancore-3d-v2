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
