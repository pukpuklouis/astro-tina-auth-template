# Deployment Note (2026-03-14)

## Current status
- ✅ Cloudflare Worker had been deployed successfully multiple times earlier.
- ✅ `/api/auth/ok` had returned `200 {"ok":true}` in prior successful deploys.
- ✅ Better Auth schema migration (`migrations/0001_better_auth_init.sql`) was applied to D1.
- ✅ `/admin` auth guard has been implemented as a catch-all Worker route: `src/pages/admin/[...slug].ts`.

## Why deploy failed this time
Latest `wrangler deploy` in this session failed with:
- `Failed to fetch auth token: 400 Bad Request`
- `In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN`

This is a CLI auth-context issue in the current shell/session, not a project-code regression.

## Fix options
1. Use API token in shell:
   - `export CLOUDFLARE_API_TOKEN=...`
   - `npx wrangler deploy`
2. Or refresh OAuth login:
   - `npx wrangler logout`
   - `npx wrangler login`
   - `npx wrangler deploy`

## Template readiness updates done
- Worker/project name changed in `wrangler.jsonc` to: `astro-tina-auth-template`
- npm package name changed in `package.json` to: `astro-tina-auth-template`
- `.dev.vars` is now ignored via `.gitignore` to avoid leaking local config
- Auth base URL fallback no longer hard-codes a specific Worker URL; now uses request origin

## GitHub template goal
Next step is to initialize git, push to GitHub, and set repository as a Template Repository.
