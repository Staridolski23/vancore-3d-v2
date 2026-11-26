# Vera secretary phase — 26 November 2026

Owner approved pausing client analysis and accepting public enquiries without an
account. The public /ai-analyst page is now a bilingual guided intake, not a
generative chatbot. Six steps collect topic, optional company, situation, goal,
timing and contact, then show the complete summary and require explicit sending.
No network request stores a draft before submission. Drafts stay only in page
memory, disappear on reload and are cleared after confirmed success. No LLM,
inference key, model quota, account creation or marketing subscription is used.

POST /api/vera-enquiry requires same-origin JSON, limits the streamed body to
16 KB, validates a fixed field/choice set, bounds all text, checks a honeypot and
requires shareWithTeam=true. These checks reduce malformed/drive-by submissions;
they are not a complete distributed bot or rate-limiting system. A valid request
is forwarded without an account bearer to the existing DigitalOcean /api/contact
route. Records enter incoming_messages with subject `Vera enquiry · <topic>`
and the existing notification outbox. Administrators read the existing Enquiries
inbox; the public endpoint does not list records. Existing mail delivery remains
disabled. Success means confirmed saved record/reference, not email delivery,
appointment confirmation or a promised response deadline.

An uncertain upstream/network result retains the draft and blocks automatic
resubmission; it directs the visitor to the existing team address. This route
does not provide cross-session durable idempotency. Do not add blind retries.

New client actions open/message/analysis return paused after the existing
verified-account guard and before any RPC/provider call. GET history, downloads,
existing consultant reviews and explicit sharing/withdrawal remain protected by
the existing account/ownership checks. /vera-history opens the existing private
workspace with generation controls disabled; old conversation deep links route
there. No customer quota, plan or data is erased. Administrator synthetic quality
evaluations are separate from customer generation and remain available.

Header/footer, homepage Vera section, services, FAQ, pricing notice and contact
links describe the reduced service. Plan prices/allowances are preserved, with a
visible pause notice; no substitute commercial rules are invented.

Before changes: source 67c846880f678e841850b30e6be995ca65ba582d saved in owner-only
source-before-secretary-20261126.bundle (complete history verified). Existing
backend backup /var/backups/vancore/daily/20261126T081835.998577Z was downloaded
off-host as backend-before-secretary-20261126.tar.gz; local/provider SHA-256 both
f0af5c0697340023bff158c97558c59b950d51148e29784d95b2e4d731de4d53; online SQLite
integrity passed. No backend or Supabase schema migration is needed for this
phase. Archives include private configuration and must remain outside Git.

Recovery: restore reviewed frontend code/config only, preserving incoming
enquiries, private history and newer customer records. Re-enabling generation is
a separate product decision: source/database/provider quality gates still apply.
