# Auth, Gallery, and Persistent Navigation Plan

## Context

This plan continues the active Linkit rewrite goal after Slice 18.

Current state:

- The app has been promoted to the project root.
- The public home/feed page has the editorial info-page style.
- Auth.js credentials auth exists at `/api/auth/[...nextauth]`.
- Persistent navigation now renders from `app/layout.tsx`.
- The visible auth links now point to first-class `/signin` and `/register` routes.
- `/signin` and `/register` are Linkit-styled forms backed by server actions.
- `/work` now exists as an initial Briganti-style catalogue surface for links.

User request:

- Auth system should align with the Linkit visual style.
- Add proper registered and sign-in flows.
- Gallery page should follow `https://www.briganti.works/work` style.
- Navigation bar should persist across the whole site.
- Export this as a plan so another agent can continue.

## Reference Direction

Use the Andrés Briganti work page as the primary layout and motion reference for Linkit's link gallery, not merely as loose inspiration:

- Sparse persistent navigation anchored at the top-right.
- Fixed or visually persistent left rail with numbered work/link index.
- Large low-contrast vertical background display word, similar to the reference's oversized "Selection" treatment.
- Main content starts offset from the left rail and uses a multi-column visual catalogue grid.
- Each link should appear as a numbered gallery tile, not a generic feed row or card.
- Image/thumbnail surfaces are the primary visual signal; title/provider metadata is secondary.
- Minimal metadata groups such as catalogue label, version, topics/providers, and counts.
- Strong typography with restrained color and high whitespace.
- Page structure should feel like an archival portfolio/catalogue, not a SaaS dashboard.

Observed public reference content includes top-level links for Home, Info, and Work; a `Catalogue` heading; a numbered catalogue list `(01)` through `(21)` on the left rail; a visual tile grid with numbered items; version metadata; a large faint vertical "Selection" word; and topic labels such as Graphic Design, Type Design, Identity, Artwork, Editorial, Logotype, and Website.

Motion/animation target:

- Initial state may show the left index, background display word, and metadata first.
- Gallery tiles should fade/slide in once images are loaded, matching the reference's delayed visual reveal.
- Tile hover/focus should be restrained: slight image lift/scale or opacity shift, plus clearer metadata/title reveal if needed.
- Page transition should be subtle and non-blocking.
- Respect `prefers-reduced-motion`.
- Do not implement heavy custom animation frameworks unless needed; CSS transitions plus a small client component for image-loaded state is preferred.

## Slice 19: Persistent Site Shell and Navigation

Status: complete.

Goal: move navigation out of `app/page.tsx` and into a reusable global shell.

Implementation:

- Add `components/site-nav.tsx`.
- Render `SiteNav` from `app/layout.tsx` so it appears on every page.
- Remove page-local nav from `app/page.tsx`.
- Add nav links:
  - `Home` → `/`
  - `Gallery` or `Work` → `/work`
  - `Sign in` → `/signin`
  - `Register` → `/register`
  - `Share` → `/#submit`
- Keep the visual treatment aligned with current editorial nav:
  - Uppercase.
  - Letter-spaced.
  - Border rule.
  - No card wrapper.
  - Mobile-safe wrapping or compact grouping.

Tests first:

- Add Playwright test: nav appears on `/`, `/signin`, `/register`, and `/work`.
- Add Playwright test: nav links route to the correct pages.
- Keep no-horizontal-overflow assertion on mobile.

Acceptance:

- Navigation is persistent on every app route.
- Navigation does not overlap content on mobile or desktop.
- Home still keeps `/` static/cached.

## Slice 20: Styled Sign-In and Register Flows

Status: complete.

Goal: replace default Auth.js UI with Linkit-native pages that match the editorial style.

Implementation:

- Add `/signin` page.
- Add `/register` page.
- Add server actions for:
  - `signInWithCredentials`
  - `registerWithCredentials`
- Registration behavior:
  - Normalize email to lowercase.
  - Require email and password.
  - Hash password with `bcryptjs`.
  - Reject duplicate email.
  - Create a `users` row with `passwordHash`.
  - Redirect to sign-in or sign the user in after registration. Prefer sign-in redirect first for lower risk.
- Sign-in behavior:
  - Use Auth.js `signIn("credentials")`.
  - Redirect to `/` on success.
  - Show product-styled feedback on failure.
- Keep `/api/auth/[...nextauth]` as Auth.js backend route.
- Keep default Auth.js route usable only as backend/fallback; visible navigation should use `/signin`.

Tests first:

- Unit tests for registration workflow:
  - valid user creates a DB row with password hash.
  - duplicate email rejected.
  - blank/invalid input rejected.
- Auth config tests remain green.
- Playwright tests:
  - visitor opens `/signin` and sees styled form.
  - visitor opens `/register` and sees styled form.
  - visitor can register, then sign in, then submit a link.
  - invalid sign-in shows styled feedback.

Acceptance:

- No visible auth flow uses the Auth.js default page as the primary UX.
- Sign-in/register pages visually align with the editorial Linkit style.
- Authenticated workflows from existing E2E still pass.

## Slice 21: Gallery / Work Page

Status: complete.

Goal: add a gallery/work page that follows the Briganti work-page layout and animation for Linkit links.

Implementation:

- Add `/work` route.
- Reuse current feed data through `getPublicFeedItems`.
- Present posts as a visual numbered catalogue:
  - `(01)`, `(02)`, etc.
  - Thumbnail or generated visual panel as the dominant tile content.
  - Provider/domain metadata.
  - Title.
  - Comments and visits.
- Use a left-side catalogue rail:
  - Numbered links matching the visible grid items.
  - Topics/providers anchored near the bottom.
  - Large low-contrast vertical background word such as `Selection` or `Catalogue`.
- Use a main gallery grid:
  - Desktop target: 4-5 columns depending on viewport.
  - Mobile target: 1-2 columns, no horizontal overflow.
  - Tiles should preserve stable aspect ratios to avoid layout shift.
- Include a compact metadata block:
  - Version.
  - Count.
  - Topics/providers derived from provider names.
- Avoid generic cards. Use image tiles, numbers, whitespace, and catalogue rhythm.
- Add animation:
  - Image-loaded reveal class for gallery tiles.
  - Staggered entry using CSS variables or index-based delay.
  - Hover/focus image transform and metadata opacity transition.
  - Reduced-motion fallback.

Tests first:

- Unit test for work/gallery view model if mapping logic is extracted.
- Playwright tests:
  - `/work` loads and shows persistent nav.
  - `/work` shows a catalogue/index heading.
  - seeded E2E post appears in the catalogue.
  - numbered entries render.
  - gallery tiles render with stable image/visual surfaces.
  - left rail renders on desktop.
  - image-loaded animation class or reduced-motion-safe reveal state exists.
  - mobile has no horizontal overflow.

Acceptance:

- Gallery page is visually distinct from the home feed while still aligned with the same system.
- It follows the Briganti work/reference direction: fixed/anchored left catalogue rail, numbered visual tiles, large faint display word, metadata blocks, sparse layout, and delayed tile reveal animation.
- Link tiles use real post thumbnail URLs when available and a deterministic typographic fallback when not.

## Slice 22: Verification and Evidence

Status: complete.

Run from project root:

```sh
npm test
npm run typecheck
npm run build
npm audit --omit=dev
TEST_DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run test:e2e
docker compose up --build -d
curl http://127.0.0.1:8080/healthz
curl -k https://localhost:8443/healthz
```

Capture screenshots:

```sh
npx playwright screenshot --viewport-size=1440,1000 http://127.0.0.1:8080/signin test-results/auth-signin-desktop.png
npx playwright screenshot --viewport-size=390,844 http://127.0.0.1:8080/signin test-results/auth-signin-mobile.png
npx playwright screenshot --viewport-size=1440,1000 http://127.0.0.1:8080/register test-results/auth-register-desktop.png
npx playwright screenshot --viewport-size=390,844 http://127.0.0.1:8080/register test-results/auth-register-mobile.png
npx playwright screenshot --viewport-size=1440,1000 http://127.0.0.1:8080/work test-results/work-desktop.png
npx playwright screenshot --viewport-size=390,844 http://127.0.0.1:8080/work test-results/work-mobile.png
```

If using local HTTPS screenshots:

```sh
npx playwright screenshot --ignore-https-errors --viewport-size=1440,1000 https://localhost:8443/work test-results/work-https-desktop.png
```

Persist results in `.codex/goal-state.md` after completion.

Current screenshot artifacts already captured:

- `test-results/auth-signin-desktop.png`
- `test-results/auth-signin-mobile.png`
- `test-results/auth-register-desktop.png`
- `test-results/auth-register-mobile.png`
- `test-results/work-desktop.png`
- `test-results/work-mobile.png`

## Resume Checklist for Another Agent

1. Read `.codex/goal-state.md`.
2. Read this file.
3. Inspect current `app/layout.tsx`, `app/page.tsx`, `src/auth/config.ts`, `src/db/schema.ts`, and `tests/e2e`.
4. If continuing after completion, start from a new user request or supplied screenshot; the auth/gallery/navigation plan is complete.
5. Do not reopen the original rewrite goal unless current evidence contradicts `.codex/goal-state.md`.
