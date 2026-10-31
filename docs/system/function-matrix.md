# Function and acceptance matrix

Baseline: 31 October 2026; evidence includes the 26 October audit. Repeat changed checks before rollout. No status here means all possible edge cases are covered.

| Function | Baseline evidence | Remaining acceptance |
|---|---|---|
| Public pages/navigation | 18 production pages HTTP 200 | Mobile/keyboard/link validation after fixes |
| Assets/PWA/SEO | PNG icons restored; broken industry photos use fallback; single footer verified on 14 routes | Remaining resource inventory and correct per-page metadata |
| Anonymous availability | Maintenance Next maps dates/times; legacy backend still exposes rows | Both entry points exclude PII |
| User sign-in | Real client and admin preview sessions passed | Refresh/expiry/logout/network recovery |
| Registration | Confirmation flow fixed; regression test passed | Actual signup/verify/expired link with disposable account |
| Password recovery | Email request exists; completion missing | Recovery session and password entry completed by user |
| Profile | Real unchanged save and privilege-field regression passed | Two-user isolation; failure preserves edits |
| Admin access | Client redirected with session preserved | Consistent backend and database roles |
| Admin clients/plan/credits | Read path verified; mutation error handling needs repair | Validated writes with audit trail and truthful success |
| Contact forms | Payload mismatch reproduced without external requests | Unified contract, durable record, controlled email delivery |
| Booking create | Live interval guards and validated create installed; concurrent disposable-DB test passed | Real authorized client round trip; notifications |
| Booking status/change/cancel | Disposable DB tests passed | Isolated actual-service round trip; no real customer edits |
| Proposal accept/reject | Transaction/conflict/repeat tests passed | Authorized owner/admin resolution and notifications |
| Calendar/ICS | Shared 45-minute interval policy and Sofia clock; DST, conflict/outage/keyboard browser checks passed | Actual client round trip and email/ICS delivery |
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
| Security | Supabase migration and JWT/ownership regression passed | Anonymous/A/B/admin matrix on all direct/proxy routes |
| Backup | Daily SQLite integrity and prior isolated restore passed | Off-machine copy, full Supabase export and new restore exercise |
| Restart/monitoring | PM2 startup service now active/enabled; controlled cold start and recovery checks passed | Actual machine reboot/complete restore and failure alerts |
| Runtime updates | API and PM2 daemon run Node 24.22.2; nine native/backend tests passed; old system interpreter retained for rollback | Remaining dependency/OS inventory; remove old runtime after agreed retention |

Each new check should record date, commit/server revision, environment, fixture, expected/actual result, side effects and rollback/cleanup evidence in the change log or linked machine-readable result.
