# Vera knowledge and evaluation storage

Candidate date: 16 November 2026. Apply the tested additive knowledge migration before publishing code that uses its RPC. Hosted application release remains separately gated.

## Data ownership

```mermaid
flowchart LR
  U[Verified client] --> C[Owned conversations and notes]
  P[Approved public sources] --> V[Immutable source versions and chunks]
  M[Versioned business methodology] --> V
  C --> A[Vera: selected case evidence plus relevant knowledge]
  V --> A
  A --> R[Owned answers and AI draft reports]
  R --> L[Atomic link to knowledge version]
  R -->|Explicit selected-case sharing| H[Assigned consultant queue]
  T[Fixed synthetic evaluation cases] --> E[Real model evaluations]
  E --> Q[Archived outputs; human review pending]
```

Private client evidence stays in the existing UUID-owned case ledger. Public legal texts and VANCORE-authored methods occupy a separate corpus. No conversation, case note, uploaded customer document or human client review is automatically promoted into shared knowledge. Search operates only on the selected approved source version, not across client cases.

## Tables in vancore_private

| Table | Purpose |
|---|---|
| vera_knowledge_sources | Migration-approved source registry, area, jurisdiction and fixed URL |
| vera_knowledge_versions | Immutable full retrieved text/HTML, SHA-256, database-generated MD5, timestamp and unreviewed/internal-methodology status |
| vera_knowledge_chunks | Versioned provisions/sections, ordinal and indexed full-text representation |
| vera_knowledge_checks | Append-only retrieval success/failure observations; no private query or upstream response body |
| vera_request_knowledge | Atomic link from a completed owned turn to the versions actually used |
| vera_evaluation_scenarios | Fixed, versioned synthetic dialogue/business/legal cases and explicit rubrics |
| vera_evaluation_runs | Append-only actual output/model, mechanical checks, knowledge references and pending human review |
| vera_evaluation_leases | Short per-administrator, scenario-bound single-flight reservation |

All eight tables have RLS and no browser grants. Service access is limited to required SELECT/INSERT; only ephemeral evaluation leases can be updated/deleted. Public SECURITY INVOKER RPCs grant EXECUTE only to service_role. The old casework function moves into the private schema and remains behind the new wrapper; the registered-account guard is preserved.

## Runtime

Business chat/report generation reads the versioned methodology. Numerical chat/report objects validate cited inputs, units and supported arithmetic. Legal research retrieves only fixed approved official URLs, verifies title/provision structure, archives the full accepted document, then asks the database to select relevant sections within that exact immutable version. Generated quotes must match selected text. Content digests and source/version references remain in the report. A source outage or archive failure produces a limited uncharged response; no stale legal version is silently represented as freshly verified law.

On successful finish, answer/charge and knowledge links commit in one transaction. Bad references abort without charge. A completed retry cannot append different provenance. Existing historical answers without knowledge references remain readable and are not retroactively relabelled.

An authenticated protected-role administrator can run one of six fixed synthetic cases through `/api/adminv2/vera-evaluations`. It accepts no custom prompt, history, customer ID or actor supplied by the browser. It has a scenario-bound two-minute lease and six-completed-runs-per-five-minutes limit. Results are appended to the database without client ledger usage. The Admin Dashboard's Vera section lists the last ten outputs. These mechanical observations are not professional approval or model training.

## Coverage and review

Initial shared corpus: VANCORE internal business methodology plus a registry for three Bulgarian acts, GDPR and Consumer Rights Directive. The registry alone is not ingested legal content; an accepted source must actually be fetched, stored and selected. Metadata unreviewed is never promoted to lawyer-approved by a generic consultant review. Worldwide coverage, all amendments, case law reconciliation, historical versions and reviewer qualification verification remain separate requirements.

Dialogue rules progress from greeting and a clear initial question through facts, corrections, a useful recommendation and optional report/handoff. Greetings and new topics do not inherit stale legal/numerical routing. The model remains the existing free provider; no automatic paid fallback or background messages are added.

## Verification and recovery

`ops/supabase/vera-knowledge.test.cjs` applies the actual migration and checks immutable source ingestion, exact-version retrieval, private grants, atomic charge/provenance, evaluation permissions/leases and both rollback scripts. `verify-vera-knowledge-rollback.sql` runs the hosted acceptance entirely under BEGIN/ROLLBACK; no fake public law, client turn or evaluation is retained.

`scripts/verify-vera-backup.cjs` restores all corpus tables along with existing cases/profiles when the export contains the knowledge keys. It removes migration seed rows only in the isolated restore database, restores original IDs/values, regenerates search/digest columns and reruns casework/knowledge ROLLBACK acceptance. This remains targeted application recovery; it does not restore managed Auth/session/Storage/OS/DNS infrastructure.

Recovery must preserve all new versions, case links and evaluation history. Do not overwrite newer data from the pre-change snapshot. The previous c014ce6 frontend remains compatible with the additive schema, but must not be used as a permanent substitute for source-grounded research after a knowledge release is accepted.
