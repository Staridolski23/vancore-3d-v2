# Function and acceptance matrix

Baseline: 31 October 2026; evidence includes the 26 October audit. Repeat changed checks before rollout. No status here means all possible edge cases are covered.

| Function | Baseline evidence | Remaining acceptance |
|---|---|---|
| Public pages/navigation | 18 production pages HTTP 200 | Mobile/keyboard/link validation after fixes |
| Assets/PWA/SEO | PNG icons restored; broken industry photos use fallback; single footer verified on 14 routes | Remaining resource inventory and correct per-page metadata |
| Anonymous availability | 7 November: both public entry points exclude PII; production frontend updated and direct private routes now require identity | Actual client/admin calendar acceptance and notifications |
| User sign-in | Real client and admin preview sessions passed | Refresh/expiry/logout/network recovery |
| Registration | Confirmation flow fixed; regression test passed | Actual signup/verify/expired link with disposable account |
| Password recovery | 7 November: actual email/public callback and successful reset/sign-in confirmed by owner | Accepted; branded template is an optional blocked SMTP/Pro customization |
| Profile | Real unchanged save and privilege-field regression passed | Two-user isolation; failure preserves edits |
| Admin access | Client redirected with session preserved | Consistent backend and database roles |
| Admin clients/plan/credits | Read path verified; mutation error handling needs repair | Validated writes with audit trail and truthful success |
| Contact forms | 7 November: atomic SQLite enquiry/outbox, native tests, live restart persistence and real preview browser-to-DB round trip passed; production 6c4aeb0 Ready; all existing rows preserved | SMTP verification and controlled notification acceptance; real admin inbox acceptance and pagination |
| Booking create | Live interval guards and validated create installed; concurrent disposable-DB test passed | Real authorized client round trip; notifications |
| Booking status/change/cancel | Native backend tests and final-build browser confirm/cancel/proposal/busy/conflict/network/malformed/refresh-outage tests passed; no premature reschedule | Preview/production release of latest client fixes; actual-service authorized write round trip |
| Proposal accept/reject | Transaction/conflict/repeat tests passed | Authorized owner/admin resolution and notifications |
| Calendar/ICS | UTC export uses Sofia time and 45-minute policy; winter/summer/both DST boundaries and visitor TZ independence passed; actual browser button file inspected | Latest frontend release and real calendar-app import acceptance; notification delivery |
| Document list | Real empty client list; ownership regression passed | Client A/B see only own fixtures |
| Document download | Temporary file/DB test passed | Actual storage/download with disposable files |
| Image upload/serve | Server and Next limits installed; magic-byte serving tested | Controlled real upload, invalid MIME/size, cleanup |
| Reviews | Filters and moderation handler tested with disposable rows | Actual fixture submit/approve/reject and public visibility |
| Optional support chat | Explicit support consent, client verification, SDK shutdown and navigation/logout lifecycle pass 10 synthetic browser scenarios | Real provider handshake/operator receipt and account-bound history isolation |
| CMS | Actual unchanged admin save passed; legacy rows preserved | Versioned content preview/rollback; copy agreement |
| Portal messages | Actual authenticated empty history and isolated persistence test passed | Team reply and distinct AI/support histories |
| Vera inference | Tagged preview request succeeded; 4 AI replies and 1 limited response in 5 synthetic turns | Larger bounded provider budget recheck; outage/recovery consistency |
| Vera session/context | Bounded browser history reaches model; synthetic follow-up UI/API checks passed | Durable server history, restored session, ownership; avoid repeated known questions |
| Vera lead/brief | leadData ignored and progress incomplete | Saved lead/consent, structured brief and handoff |
| Vera language/pricing | English FAQ prices passed; Bulgarian fallback failed | BG/EN diagnostic tests and correct catalog |
| Reports | Generic AI request and transient UI state | Client evidence, durable report/version/export |
| Billing | Owner chose manual enquiries; public/portal buttons and selected-plan form payload pass isolated browser checks | Real enquiry delivery; authorized team activation with audit and consistent limits |
| Security | 7 November: production 6c4aeb0, strict backend enforcement active/saved; 16 native backend tests and live negative probes pass; actual hosted profile RLS/7 protected field tests pass with ROLLBACK | Complete authenticated A/B/admin acceptance and unify role-management paths |
| Backup | Daily SQLite backup, private off-host copies and both-DB restores pass before/after latest contact rollout; source bundles archived | Full managed Supabase export/hosted restoration and complete infrastructure recovery |
| Restart/monitoring | PM2 startup service now active/enabled; controlled cold start and recovery checks passed | Actual machine reboot/complete restore and failure alerts |
| Runtime updates | API and PM2 daemon run Node 24.22.2; nine native/backend tests passed; old system interpreter retained for rollback | Remaining dependency/OS inventory; remove old runtime after agreed retention |

Each new check should record date, commit/server revision, environment, fixture, expected/actual result, side effects and rollback/cleanup evidence in the change log or linked machine-readable result.
