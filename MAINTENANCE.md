# Maintenance release — 24 October 2026

This branch repairs routing, authorization checks, private caching and booking workflows while keeping React 18 and Tailwind 3. Next.js is pinned to 15.5.28; patched PostCSS/parser overrides avoid an unrelated Tailwind 4 migration. npm audit currently reports zero known vulnerabilities.

## Validation

Run `npm ci --ignore-scripts`, `npm test`, `npm run typecheck`, `npm run build`, and `npm audit`. Builds do not require production secrets. Authenticated integration tests do require a staging Supabase project and test accounts; a successful build alone does not validate them.

## Deployment dependencies — do not merge blindly

- Preserve existing Supabase, Nous and other Vercel environment variables. Use Node 22 or 24.
- `DO_API_URL` should be `https://api.vancoresys.com`. An existing HTTP environment override takes precedence over the safe default and must be corrected in the deployment configuration.
- Set a strong matching `VANCORE_BACKEND_KEY` on the backend and Vercel. Never expose it through a `NEXT_PUBLIC_` variable or browser code.
- Install and validate the backend content-maintenance module before using `/api/maintenance/content` and the new review moderation handler. These features are not functional against the legacy backend until that coordinated deployment is done.
- The media backend must accept the verified server key only after the Next.js admin check; do not bypass admin authorization with arbitrary bearer strings.
- Apply private-route protection on the backend as well as the frontend. Direct DigitalOcean endpoints remain a separate security boundary and must not be considered protected merely because Next.js handlers verify tokens.
- Validate login, profile/password changes, client isolation, bookings, editor, media, documents, review approval and mail in a preview environment before promotion.
- The legacy backend lacks the `/api/chat/send` and `/api/chat/:userId` routes used by the chat proxy. This branch correctly reports failure instead of pretending delivery succeeded; implementing persistent messaging is still outstanding.
- The document-download route is not implemented in the existing backend. Validate real storage and authorized downloads separately; do not equate document metadata with a stored file.
- Supabase RLS must be inspected on the live project. The historic migration permits users to update their own entire profile, including role/plan fields. Do not assume that local migration file proves safe live grants.

## Rollback

Frontend: restore/promote the previous Vercel deployment. Backend: restore the backed-up `server.js` and restart the existing PM2 process. Do not replace the live database during a code rollback; new user data must be preserved. SQLite backups use the online backup API and are integrity-checked.

The original production frontend branch is unchanged until this branch is deliberately promoted.

## Sources

- [Next.js security release, 14 October 2026](https://nextjs.org/blog/nextjs-security-update-october-14-2026)
- [Supabase server/client separation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
