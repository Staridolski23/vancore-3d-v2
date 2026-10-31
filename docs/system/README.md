# VANCORE system record

This is the versioned build and recovery record. User direction on 31 October 2026: finish technical correctness before the UX redesign, test every function, back up before operational/database changes, and preserve the full construction procedure.

## Record structure

- `architecture.md`: services, ownership, data locations and trust boundaries.
- `function-matrix.md`: function inventory, evidence and remaining verification.
- `change-log.md`: dated work, decisions, tests and rollout status.
- `recovery.md`: backups, reconstruction and database-preserving rollback.
- `../../ops/backend/`: reviewed server modules and isolated-data tests.
- `../../supabase/migrations/`: database changes in chronological order.
- `../../MAINTENANCE.md`: release dependencies and verified rollout state.

Git history and PR #1 preserve source changes. Root-only server archives and the private local backup directory preserve the database and operational configuration. Public documentation must never contain API keys, access/refresh tokens, passwords, client records or backup download links.

Mark checks PASS only after observing their result. Keep code review, synthetic tests, actual-service checks and unverified scenarios distinct. Record failures and recoveries as well as successes. A passing build is not proof of email delivery, payment completion, recovery or client isolation.
