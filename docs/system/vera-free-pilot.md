# Vera free-provider pilot — 25 November 2026

## Current status and activation boundary

The implementation is a disabled candidate. Account sign-in is not an inference
connection. Existing production and customer routing remain on the accepted
legacy path. No credentials are stored in source or copied into the browser.

`VERA_AI_MODE=free-pilot` enables the new path only for server-marked synthetic
administrator evaluations. `VERA_AI_CUSTOMER_ENABLED=true` is a separate rollout
gate, not a browser/request-body option. Do not enable it before provider quality,
free-plan status, data-processing arrangements and customer disclosures are
reviewed. Until then no real customer evidence is sent to these new destinations.

## Flow

Identity and owned case retrieval remain in VANCORE/Supabase. The server selects
relevant user evidence and official text, then invokes a model through the fixed
provider adapter. Model output passes the existing schema, exact evidence/quote
and arithmetic validators. An accepted answer retains its actual answering
provider/model; a limited answer creates no assessment and consumes no question.

The pilot tries Groq `openai/gpt-oss-120b`, then independent Cloudflare Workers AI
`@cf/openai/gpt-oss-120b` if the first cannot return a complete final response.
There is at most one outbound attempt per provider, with a shared 42-second
attempt window and 20-second maximum individual request. No paid gateway,
arbitrary model URL, account cycling or automatic paid upgrade is configured.
Output reasoning fields never substitute for a missing final answer.

The fixed adapters use the official OpenAI-compatible interfaces:
- https://console.groq.com/docs/openai
- https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/

## Admission and capacity

Apply the additive `vera_inference_budget` migration before enabling the pilot.
It stores two bounded aggregate provider rows in the non-exposed private schema:
no user identity, case text, keys or generated content. The service-only invoker
RPC reserves budget atomically and issues one active 75-second lease per provider.
Browser roles cannot call the function or read the counters. Missing admission
storage prevents an outbound inference request.

Reservations use a deliberately conservative UTF-8 byte token bound plus template
allowance; they are not a tokenizer measurement or invoice. Evidence is never
silently truncated to fit. Groq requests above the local 7500-token admission
bound are skipped. Output is capped at 1024 tokens for chat and 4096 for JSON.
Cloudflare reservations estimate neurons using the documented pinned model's
31818 input / 68182 output neurons per million tokens. Pin/rereview these rates
and model availability when changing a provider or model.

Local ceilings: Groq 100000 reserved tokens and 300 attempts per UTC day, 7500
tokens per rolling 60-second admission window; Cloudflare 8000 reserved neurons
and 100 attempts per UTC day, 2000 neurons per 60-second window. Both cap six
attempts/window and one in-flight request. These are application ceilings, not
promised account quotas, guaranteed messages/day or provider capacity. Failed
attempts retain their reserved daily budget. An expired crashed lease releases
concurrency without refunding a possibly billed computation. A provider 429's
Retry-After is persisted across Vercel instances before trying the other provider.

Cloudflare Free currently includes 10000 neurons/day; Groq limits vary by model
and account. See https://developers.cloudflare.com/workers-ai/platform/pricing/
and https://console.groq.com/docs/rate-limits . Both providers may still exhaust
their quotas or have outages. Reserve headroom and measure actual case sizes
before deciding the pilot user count; registration alone creates no capacity.

## Zero additional spend is an account constraint too

Both `VERA_GROQ_FREE_CONFIRMED` and `VERA_CLOUDFLARE_FREE_CONFIRMED` default false.
Each provider is used only when its server-side flag and credential are present.
Verify the actual organization/account is on its free plan before setting a flag.
A flag is an operator confirmation, not a billing API or proof of account state.
These same API endpoints can incur charges if somebody later upgrades the
provider account; application ceilings alone cannot guarantee a zero invoice.
No paid plan, prepaid credit purchase, billing method or auto-upgrade is required
by this implementation. Leave paid destinations disabled.

Keys must be entered in Vercel as server-only sensitive preview variables,
initially scoped to `maintenance/2026-10-24`. Use a narrowly scoped Workers AI
token for the selected Cloudflare account and a dedicated Groq project key.
Credential creation/permissions and acceptance of provider terms require the
owner's concrete action/approval. Never send keys or passwords in chat.

## Data and quality gates

Keep customer cases separate from shared knowledge. Sending selected context to
an inference service is external processing even when the database is in the EU.
Do not advertise EU-only processing merely because Supabase storage is in the EU.
Review provider retention/region/subprocessor terms before enabling customer
routing. Groq documents configurable Zero Data Retention:
https://console.groq.com/docs/your-data .

Use fixed invented cases first: greeting, vague intake, correction, topic switch,
checked business calculation, jurisdiction clarification and exact official-source
research. Record actual model provenance, schema/citation rejection, response
time, quota usage and source version. Isolated tests are not a real-provider
quality acceptance. Business reasoning/report usefulness and legal applicability
need separate review; registration in two services cannot confer legal expertise.

## Recovery

Disable `VERA_AI_MODE` or set it to `legacy` to stop the new provider path. Never
rollback customer tables or reopen anonymous access. Preserve the admission rows
and cooldowns across deployments. This migration is additive and older accepted
frontends do not depend on it. A Vercel redeployment is required after an env
change; account login alone does not deploy code or enable the feature.
