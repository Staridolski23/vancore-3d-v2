# Function and acceptance matrix

Updated: 7 November 2026; older baseline evidence is retained where checks remain outstanding. Repeat changed checks before rollout. No status here means all possible edge cases are covered.

| Function | Baseline evidence | Remaining acceptance |
|---|---|---|
| Public pages/navigation | 18 production pages HTTP 200 | Mobile/keyboard/link validation after fixes |
| Assets/PWA/SEO | PNG icons restored; broken industry photos use fallback; single footer verified on 14 routes | Remaining resource inventory and correct per-page metadata |
| Anonymous availability | 7 November: both public entry points exclude PII; production frontend updated and direct private routes now require identity | Actual client/admin calendar acceptance and notifications |
| User sign-in | Real client and admin preview sessions passed | Refresh/expiry/logout/network recovery |
| Registration | Confirmation flow fixed; regression test passed | Actual signup/verify/expired link with disposable account |
| Password recovery | 7 November: actual email/public callback and successful reset/sign-in confirmed by owner | Accepted; branded template is an optional blocked SMTP/Pro customization |
| Profile | Real unchanged save and privilege-field regression passed | Two-user isolation; failure preserves edits |
| Admin access | Protected database role used by Next/backend/RLS; live client bookings/documents read after verifier rollout; client redirected with session preserved | Actual administrator browser acceptance; complete A/B isolation |
| Admin clients/plan/credits | Production 1c52bde; isolated editor success/failure/draft/focus tests; hosted atomic account/audit and privilege tests PASS with ROLLBACK | Actual authorized administrator browser write round trip; commercial quota confirmation |
| Contact forms | 7 November: atomic SQLite enquiry/outbox, native tests, live restart persistence and real preview browser-to-DB round trip passed; production 6c4aeb0 Ready; all existing rows preserved | SMTP verification and controlled notification acceptance; real admin inbox acceptance and pagination |
| Booking create | Live interval guards and validated create installed; concurrent disposable-DB test passed | Real authorized client round trip; notifications |
| Booking status/change/cancel | Production f11c60d and later; native backend tests and final-build browser confirm/cancel/proposal/busy/conflict/network/malformed/refresh-outage tests passed; no premature reschedule | Actual-service authorized write round trip; administrator outcome handling |
| Proposal accept/reject | Transaction/conflict/repeat tests and 7 November inactive-target regression pass; live booking module prevents proposal acceptance reviving cancelled/completed bookings | Durable pending list and authorized administrator browser resolution; notifications |
| Calendar/ICS | Production f11c60d and later; UTC export uses Sofia time and 45-minute policy; winter/summer/both DST boundaries and visitor TZ independence passed; actual browser button file inspected | Real calendar-app import acceptance; notification delivery |
| Document list | Real empty client list; ownership regression passed | Client A/B see only own fixtures |
| Document download | Temporary file/DB test passed | Actual storage/download with disposable files |
| Image upload/serve | Server and Next limits installed; magic-byte serving tested | Controlled real upload, invalid MIME/size, cleanup |
| Reviews | Production e4f8d6c: isolated moderation rejection/hold/success/network/malformed/refresh-failure checks; errors preserve rows and distinguish unavailable lists from empty | Actual fixture submit/approve/reject and public visibility; backend missing-row acknowledgement |
| Optional support chat | Explicit support consent, client verification, SDK shutdown and navigation/logout lifecycle pass 10 synthetic browser scenarios | Real provider handshake/operator receipt and account-bound history isolation |
| CMS | Actual unchanged admin save passed; legacy rows preserved | Versioned content preview/rollback; copy agreement |
| Portal messages | Actual authenticated empty history and isolated persistence test passed | Team reply and distinct AI/support histories |
| Vera inference | 8 November real signed-in Bulgarian answer committed with model provenance and exactly one question charged; isolated limited/failure/idempotency tests pass | Broader diagnostic quality evaluation and longer-case fact memory |
| Vera session/context | Private UUID/capability-owned ledger, canonical six-pair context, actual reload/resume and account isolation tests pass | Anonymous explicit claiming, retention cleanup, long-history pagination and broader abuse controls |
| Vera lead/brief | Explicit visitor choices stored; signed-in consent not fabricated; immutable preliminary versioned TXT briefs saved/read/exported | Human handoff queue and operator receipt; richer analytical brief structure |
| Vera language/pricing | Confirmed €25/€49/€99 catalog and limits enforced; BG/EN limited-mode tests pass and real Bulgarian answer accepted | Wider language/diagnostic corpus and evidence-based advice evaluation |
| Reports | Real saved preliminary brief visible/downloadable in production portal; targeted exact-data restore passes | Human-reviewed business reports, PDF, automated periodic analysis |
| Billing | Owner chose manual enquiries; public/portal buttons and selected-plan form payload pass isolated browser checks | Real enquiry delivery; authorized team activation with audit and consistent limits |
| Security | Production 1c52bde; canonical protected roles, strict backend enforcement active/saved; native tests/live negative probes and hosted profile/audit ROLLBACK checks pass | Complete authenticated A/B/admin acceptance; remaining security review items |
| Backup | Private off-host SQLite archives and both-DB restores pass before/after role rollout; targeted 11-profile Supabase restore and guard/audit tests pass; source bundles archived | Full managed Supabase export/hosted restoration and complete infrastructure recovery |
| Restart/monitoring | PM2 startup service now active/enabled; controlled cold start and recovery checks passed | Actual machine reboot/complete restore and failure alerts |
| Runtime updates | API and PM2 daemon run Node 24.22.2; nine native/backend tests passed; old system interpreter retained for rollback | Remaining dependency/OS inventory; remove old runtime after agreed retention |

Each new check should record date, commit/server revision, environment, fixture, expected/actual result, side effects and rollback/cleanup evidence in the change log or linked machine-readable result.
