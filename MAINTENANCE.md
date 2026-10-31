# Maintenance release — 26 October 2026

This branch repairs routing, authorization, private caching and booking workflows while preserving React 18 and Tailwind 3. Next.js is pinned to 15.5.28 with patched PostCSS/parser overrides. The latest npm audit reports zero known vulnerabilities.

## Verified and applied

- Daily online SQLite backups, a separately verified restore and PM2 startup recovery are configured on DigitalOcean. A real reboot has not been performed.
- Booking month bounds, partial updates and proposal transactions are fixed on the backend.
- Supabase migration 20261026_profile_and_content_security.sql was applied to project wqvhivuyvzdbuguuojhk after a disposable-table RLS test ending with ROLLBACK. Independent checks confirmed profile columns, restricted content writes, the privilege trigger and repaired recursive admin policies.
- Backend modules in ops/backend implement verified Supabase JWT identities, private document downloads, safe public images and persistent portal messages. Identity verification and new portal handlers are installed in compatibility mode. New portal handlers always require a verified token; legacy API routes await coordinated enforcement.
- Known historical HTTP backend addresses are upgraded to HTTPS before forwarding bearer tokens. Existing Vercel environment values are preserved; no new shared secret is needed.
- Public signup uses the normal confirmation flow and cannot overwrite an existing profile. Password-reset requests now reach the correct handler; full email/recovery completion still needs validation.
- Content editing and moderation handlers are installed with the verified JWT administrator guard. A dedicated vancore_site_content overlay preserves legacy CMS rows and was initialized from currently served content. Backend response comparison confirmed unchanged public sections. A real administrator preview session loaded the editor and saved an unchanged title successfully. Direct uploads now enforce the same 10 MB image-only limits as Next.js.

## Validation

Run npm ci --ignore-scripts, npm test, npm run build, npm run typecheck, and npm audit --audit-level=moderate. Builds do not require production secrets. Backend tests use existing backend dependencies and temporary SQLite databases/files: BACKEND_PACKAGE=/absolute/backend/package.json node --test ops/backend/*.test.cjs.

## Required before production promotion

1. Test admin and two separate client sessions in the Vercel preview: sign-in, profile changes, document isolation, reservations, reviews, messages and uploads. Verify real storage and mail separately.
2. Preserve approved public copy: backend content differs from production frontend defaults. The live overlay now preserves currently served backend content; reconcile the preview wording with the published site before frontend promotion.
3. Validate an actual media upload and moderation with disposable fixtures. Real review records were not changed to test moderation.
4. Promote the tested frontend, enable VANCORE_AUTH_ENFORCE=true on the backend, restart PM2 with the updated environment, and repeat public/admin/client checks. Confirm no legitimate integrations depend on legacy SQLite sign-in first. Direct backend protection is incomplete while compatibility mode is active.
5. Validate recovery email completion, payment processing and external AI calls. A build does not prove those integrations work.

## Rollback

Frontend: promote the previously working Vercel deployment. Latest content/media rollback: restore server.js from /var/backups/vancore/codex-20261024-initial/content-repair-v2-rollback and restart PM2; retain the overlay table to preserve subsequent edits. Earlier portal rollback: restore server.js and bookings.cjs from /var/backups/vancore/codex-20261024-initial/portal-compat-rollback, with bookings.cjs restored to maintenance/bookings.cjs. Never replace the live database during a code rollback. Assess security impact before disabling a new access boundary.

Production frontend has not been promoted. The original desktop checkout remains unchanged.

## Sources

- https://nextjs.org/blog/nextjs-security-update-october-14-2026
- https://supabase.com/docs/guides/auth/jwts
