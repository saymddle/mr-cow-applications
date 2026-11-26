# Mr. Cow applications

The three Mr. Cow apps, built on TOGIVA Core:

| App | Path | Who uses it | Dev URL |
| --- | --- | --- | --- |
| Customer PWA | `apps/customer-pwa` | Mr. Cow customers (installable, offline shell) | http://localhost:5173 |
| Franchise portal | `apps/franchise-portal` | Franchise owners, general managers, store staff | http://localhost:5174 |
| Corporate console | `apps/corporate-console` | Mr. Cow corporate and regional teams | http://localhost:5175 |

These apps hold **no business logic**. Loyalty, connection codes, POS processing, permissions and data all live in [TOGIVA Core](https://github.com/saymddle/togiva-core); the apps call its versioned v1 API and decide only what to show.

## Packages

| Package | Purpose |
| --- | --- |
| `packages/brand-config` | Mr. Cow colours, fonts, logo and the two themes (consumer, operations). Copied from the Mr. Cow website (`saymddle/Mr-Cow`, `website/src/style.css`). The only place Mr. Cow styling is defined. |
| `packages/ui` | Shared React components (buttons, forms, cards, tables, modal, toasts, status pills, loading/empty/error states, app shells, bar chart, icons). Brand-neutral: styled by `--t-*` CSS variables. |
| `packages/shared-types` | TOGIVA Core API types, generated from a vendored copy of its OpenAPI document. |
| `packages/api-client` | Typed client over `openapi-fetch`: bearer token, error envelope to `TogivaApiError`, 401 handling. |
| `packages/auth` | Sign-in through Supabase Auth, session state, `/v1/me` loading, permission helpers and role-based navigation, shared sign-in screens. |

## Getting started

Requires Node 22+ and pnpm 10.

```sh
pnpm install
cp .env.example apps/customer-pwa/.env.local   # and the same for the other two apps
pnpm dev:customer                               # or dev:franchise / dev:corporate
```

Each app needs, at build time:

- `VITE_TOGIVA_API_URL`: TOGIVA Core base URL. The API must list the app's origin in its `CORS_ALLOWED_ORIGINS`.
- `VITE_TOGIVA_ORGANIZATION_SLUG`: the Mr. Cow organization's slug in TOGIVA Core.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: the Supabase Auth project (public anon key only).

Without Supabase, a dev build can set `VITE_DEV_TOKEN_SIGN_IN=true` and sign in by pasting a token minted for a local TOGIVA Core (production builds ignore this). TOGIVA Core's development fixtures (`pnpm db:seed:dev`) use the slug `fixture-brand` and three synthetic users: a corporate admin, a store employee and a member.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm typecheck` | TypeScript across all packages and apps |
| `pnpm test` | Vitest across all packages and apps |
| `pnpm build` | Production builds of the three apps |
| `pnpm api:sync` | Copy TOGIVA Core's `openapi/v1.json` (set `TOGIVA_OPENAPI_SOURCE` to a path or https URL) |
| `pnpm api:generate` | Regenerate `packages/shared-types/src/generated/schema.ts` from it |

CI runs typecheck, tests and builds, and fails if the generated API types are out of date.

## Deployment

Each app is a static Vite build (`dist/`) with an SPA fallback, and has a `vercel.json`. Create one Vercel project per app with its folder as the root directory, set the `VITE_*` variables per environment, and add each production origin to TOGIVA Core's `CORS_ALLOWED_ORIGINS`.

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).
