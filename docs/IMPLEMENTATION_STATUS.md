# Implementation status

Last updated: 2026-11-26 (Phase 2, Phase 3 part 1, Phase 4 app screens). Update this file in the same PR that changes an area.

Legend: ✅ implemented and tested · 🟨 shell in place, feature pending · ⬜ not started

## Phase 2: application foundation

| Area | State | Notes |
| --- | --- | --- |
| Monorepo (pnpm, Turborepo, TypeScript, Vite, Vitest), CI | ✅ | `.github/workflows/ci.yml` |
| Brand configuration from the Mr. Cow website | ✅ | Palette, fonts, logo, two themes; contrast test |
| Shared design system (`@mrcow/ui`) | ✅ | Buttons, forms, cards, tables, modal, toasts, states, shells, icons, bar chart |
| Shared API types and client | ✅ | Generated from TOGIVA Core OpenAPI `1.0.0-alpha.1` |
| Authentication integration (Supabase Auth) | ✅ | Sign-in, sign-up (customers), password reset, sign-out, session refresh; dev-token sign-in for local work |
| Role-based navigation | ✅ | From `/v1/me` permissions; per-store in the franchise portal |
| Customer PWA shell | ✅ | Tabs, welcome/sign-in, membership card, account; manifest, icons, offline shell |
| Franchise portal shell | ✅ | Store switcher, permission-gated navigation, live store overview |
| Corporate console shell | ✅ | Permission-gated navigation, live locations list |

## Later phases (app side)

| Area | State | Phase |
| --- | --- | --- |
| Joining the membership (TOGIVA enrollment: name, usual store) | ✅ | 3 |
| Marketing/notification consents at sign-up | ⬜ | 3 (needs Mr. Cow consent/policy text and versions) |
| Four-digit code screen (live TOGIVA service) | ✅ | 3: issue for a chosen store, digits shown once with countdown, cancel, live status (cashier has it, purchase pending, recorded, under review, voided) |
| Store finder | ✅ | 3: live participating stores, search, directions, call, "my store" |
| Points, level progress, next reward (Home), activity, rewards catalog with eligibility, redeem with token, cancel | ✅ | 4: live TOGIVA loyalty routes; says plainly when the program isn't live |
| Offers and campaigns | 🟨 | 6 |
| Franchise: verify and complete rewards | ✅ | 4 |
| Franchise: identify customer, team, performance, loyalty activity, adjustments, support | 🟨 | 5 |
| Corporate: reporting, regions, franchisees, customers, loyalty, campaigns, staff, audit | 🟨 | 6 (loyalty/rewards in 4) |
| POS screens (both staff apps) | 🟨 | 7 |
| Deployment (Vercel projects per app) | ⬜ | `vercel.json` is ready; projects not created |

## Tests (2026-11-26)

`pnpm test`: **64 passed, 0 failed**.

| Package | Tests |
| --- | --- |
| `packages/brand-config` | 5 |
| `packages/shared-types` | 2 |
| `packages/api-client` | 7 |
| `packages/auth` | 19 |
| `packages/ui` | 7 |
| `apps/customer-pwa` | 14 |
| `apps/franchise-portal` | 6 |
| `apps/corporate-console` | 4 |

Also verified by hand: all three apps running against a local TOGIVA Core with its development fixtures. Dev-token sign-in, `/v1/me`, CORS, organization lookup, store overview and the locations list all worked; the cashier was correctly refused by the corporate console. Phase 3 part 1 was checked the same way: a brand-new user joined, saw the stores, got a code, and the screen switched to "the cashier has your code" when a real cashier lookup reserved it. Phase 4 was checked end to end: a new member joined, got a code, a cashier associated an order, the POS sale ($32.50) arrived, the member's Home showed 32 points and level progress, they redeemed a 25-point reward, and the cashier checked and completed the token in the franchise portal. The ledger read `earn 32, redeem -25`.

## Inputs still needed

- Supabase Auth project URL and anon key per environment.
- The Mr. Cow organization slug once it is onboarded in TOGIVA Core.
- Consent and privacy policy text and versions for registration.
- Hosting decision for the three apps (Vercel configs included).
