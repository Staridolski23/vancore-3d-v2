# Architecture and data map

## Runtime

1. Public site: `https://www.vancoresys.com`, Vercel, Next.js App Router, React 18, Tailwind 3. Production still differs from the maintenance branch at the 31 October baseline.
2. Supabase project `wqvhivuyvzdbuguuojhk`, Ireland: identity, profiles, conversations/messages/notes/reports/tasks and legacy content tables. The service key stays in server configuration. The 26 October profile/content security migration is applied.
3. Backend: `https://api.vancoresys.com`, DigitalOcean Frankfurt, Nginx -> Express/PM2, application `/home/vancore/vancore-backend`, SQLite `data/vancore.db`.
4. Backend stores bookings/proposals, document metadata, incoming messages, reviews and historical CRM/AI records. Uploaded/document bytes are separate files and must be backed up with the database.
5. Vera currently calls Nous from Next.js and has an FAQ fallback. Baseline faults: provider rejects the request, conversation history/lead persistence are incomplete, fallback is not visibly identified.
6. Email: backend SMTP configuration. Stripe dependency exists, but checkout/webhook fulfillment is not implemented in the inspected Next routes.
7. Hermes/WSL is a separate agent environment; website operation does not depend on the laptop running it. Do not start historical messaging/paid-model automations as part of maintenance.

31 October update: direct Supabase connector access works. RLS helpers now live in the non-exposed `vancore_private` schema; existing policy dependencies are preserved. A private logical data/catalog snapshot and offline row-by-row restore check are available. Full hosted recovery/settings remain unverified. Vera inference works in the maintenance preview, with explicitly labelled limited mode; durable conversation/lead storage remains incomplete.

## Trust boundaries

- Browser input and user metadata are not authority for roles, plans or client identity.
- Next verifies Supabase identity; backend independently verifies the JWT signature, issuer, audience and expiry and checks ownership.
- Anonymous availability must include only dates/times. Private metadata and document bytes require identity and ownership checks.
- The backend compatibility flag is temporary and must be removed/disabled through coordinated rollout; protecting Next alone does not protect the direct backend.
- Never restore an older database as part of a routine code rollback: preserve newly created records.
- UI prices and AI statements must use the owner-confirmed €25 one-time, €49/month, €99/month catalog.

## Reproducibility gaps at baseline

Live backend has no Git checkout and historically includes legacy credential constants. Reviewed maintenance modules are tracked here; full legacy source/configuration remains only in private archives until secrets are removed. Supabase full data/auth/storage export needs a separately verified recovery path; a schema migration and local SQLite archive do not constitute that export.
