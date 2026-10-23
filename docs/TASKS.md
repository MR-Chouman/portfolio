# TASKS

Current phase: **Phase 1: Design foundations**

## Rules

- Statuses: `todo`, `doing`, `review` (PR open), `done` (merged into `dev`), `blocked` (reason in the line or FEEDBACK).
- Work tasks in ID order inside a phase unless a task says otherwise. One task per branch: `task/T-012-short-slug`.
- Each PR edits only its own task line(s) in this file, to avoid merge conflicts.
- A task is done only when its **Done when** line is true, checks pass, and docs are updated.
- Tasks marked **Owner** need input or an action from the owner; if it is missing, mark `blocked` and add a FEEDBACK item.
- Tasks marked **Owner review** are never auto-merged: `/finish-task` opens the PR, waits for CI, then stops for the owner's review.
- `/start-task` picks the first eligible `todo` task of the current phase in ID order (it skips `blocked` tasks and tasks listed under an open FEEDBACK item's "blocks").
- Phase end: `/finish-phase` opens `dev` -> `main`, merges it with a merge commit when everything is clean, tags `v0.N.0` (Phase 0 -> `v0.1.0`, ..., Phase 6 -> `v0.7.0`, Phase 7 -> `v1.0.0`) and advances "Current phase".

---

## Phase 0: Foundation (tag v0.1.0)

- **T-001** · done · Scaffold the app
  Official React Router scaffold (TypeScript, Tailwind v4). In `react-router.config.ts` set `ssr: false` and a `prerender` list. TypeScript strict. Add `.nvmrc` (24) and `engines`. If the CLI refuses a non-empty directory, scaffold in a temp folder and move files in, leaving `CLAUDE.md`, `docs/`, `.github/`, `.claude/` untouched.
  Done when: `npm run dev` serves the home route and `npm run build` writes `build/client/index.html`.
- **T-002** · done · Tooling and scripts
  ESLint (flat config), Prettier, Vitest + React Testing Library + jsdom, Playwright + `@axe-core/playwright`, `sirv-cli`. Scripts: `lint`, `typecheck`, `test`, `test:e2e`, `build`, `preview` (`sirv build/client --single __spa-fallback.html --port 4173`). Playwright config builds and serves on `:4173`.
  Done when: every script passes on the scaffold, with one unit test and one Playwright smoke test (home loads, no axe violations).
- **T-003** · done · Git hooks and CI verification
  Husky, lint-staged, commitlint (Conventional Commits). Run the steps of `.github/workflows/ci-dev.yml` and `ci-main.yml` locally and fix mismatches (output dir `build/client`, `lighthouserc.json`, script names). Tune Lighthouse CI (URL list, number of runs).
  Done when: a bad commit message is rejected, and both workflows are green on a draft PR into `dev` and a draft PR `dev` -> `main`.
  Notes: hooks and Lighthouse setup in D-016. `ci-main` was verified with a draft PR from the task branch into `main` (closed, not merged), because the changes are not on `dev` yet.
- **T-004** · done · Cloudflare Pages (Owner action, Claude guides)
  Connect the repo; production branch `main`; build command `npm run build`; output directory `build/client`; set `NODE_VERSION=24`; enable preview deployments for `dev`. See D-006.
  Done when: production URL shows the scaffold from `main`, the `dev` preview URL works, and both URLs are recorded in `README.md`.
  Notes: owner decision 2026-10-22: done once the `dev` preview works and production is configured. `main` has no app until the Phase 0 merge, so the production build from `main` is checked at the `v0.1.0` release.
- **T-005** · done · Repo hygiene
  Dependabot (npm and GitHub Actions, weekly), `.editorconfig`, `.gitattributes`, license (see F-005), README stub with run instructions.
  Done when: Dependabot is active and README explains how to run and test the project.
  Notes: license and Dependabot setup in D-017 (F-005 resolved). Dependabot alerts are on now; scheduled version updates start when `dependabot.yml` reaches `main` at the `v0.1.0` release, the same deferral as T-004.

## Phase 1: Design foundations (tag v0.2.0)

- **T-010** · done · Design token contract
  `app/styles/tokens.css` defining semantic tokens: surface, surface-raised, fg, fg-muted, line, accent, accent-fg, focus, radii, font families, type scale, spacing scale, motion durations/easing. Map to the Tailwind theme.
  Done when: the contract is documented in the file header and no component uses raw color/font/radius values.
  Notes: F-002: Claude chooses a modern accent and type pairing; radius is soft (12-16 px).
- **T-011** · done · Editorial skin (light and dark)
  `app/styles/skins/editorial.css`; fonts self-hosted via Fontsource with `font-display: swap`; default fonts preloaded.
  Done when: a style-tile route or story shows colors, type scale, buttons and a work row in both themes, with AA contrast.
- **T-012** · done · Base layout
  Header with navigation, footer with "last updated", skip link, container and grid, `:focus-visible` styles, reduced-motion handling.
  Done when: layout works at 375 px and 1440 px, keyboard-only navigation works, axe is clean.
  Notes: D-021. Navigation links to `/work`, `/about` and `/lab` show the not-found page until those routes land (T-022, T-023, Phase 5).
- **T-013** · done · UI primitives
  Button, Link, Badge/Tag, Section, Metric, Prose, WorkRow, with unit tests.
  Done when: primitives are documented by usage in the style tile and tested.
- **T-014** · done · Pre-paint script and light/dark toggle
  Inline script in `root.tsx` sets `data-theme` (and later `data-skin`) before first paint from storage/system preference (storage in try/catch). Toggle uses a 200 ms View Transitions cross-fade, instant when unsupported or reduced motion.
  Done when: no flash of wrong theme on reload, toggle is keyboard accessible, tested in Playwright.
- **T-015** · done · Cache Playwright browsers in CI
  In `ci-main.yml`, cache `~/.cache/ms-playwright` keyed on the installed `@playwright/test` version. On a cache hit, install only the system dependencies (`npx playwright install-deps chromium`). In the Phase 0 release, the browser install took 7m22s while the tests took 7 s.
  Done when: a second run on a PR into `main` restores the cache, and the Playwright job is clearly faster than the first run.
  Notes: verified on draft PR #24 (closed, F-009): attempt 1 missed and saved `playwright-Linux-1.64.1` (browser install 24 s, cache save 19 s, job 68 s); attempt 2 restored it (install skipped, system deps 17 s, job 41 s).

## Phase 2: Content and pages (tag v0.3.0)

- **T-020** · todo · Content layer
  Zod schemas in `content/schema.ts`; `profile.ts`, `experience.ts`; projects as MDX with validated frontmatter (verify the MDX Vite plugin works with React Router framework mode, record in DECISIONS). Derive the `prerender` path list from content.
  Done when: invalid content fails `npm run build`, and every project slug is prerendered.
- **T-021** · todo · Home page
  Hero, metrics strip, selected work, "How I build" teaser, About teaser, contact block. Placeholder content allowed until Phase 3.
  Done when: home is complete at all breakpoints with per-route `meta`.
- **T-022** · todo · Work index and case study template
  `/work` and `/work/:slug`: summary header, sections, captioned images, next-project link, per-route `meta`.
  Done when: each slug has its own prerendered HTML with its own title and Open Graph tags.
- **T-023** · todo · About page
  Story, experience timeline, skills, education.
  Done when: page is complete and content comes only from `content/`.
- **T-024** · todo · Contact and CV (Owner: CV PDF in `public/`)
  `mailto:` link (the Gmail address) and the GitHub profile only (D-018). No LinkedIn, no phone number on the pages. The owner adds the CV PDF to `public/` (F-008); it may include the phone number (D-018).
  Done when: CV downloads from the header and contact block.
- **T-025** · todo · 404 and headers
  404 page; `public/_headers` with long-cache for hashed assets and sensible security headers.
  Done when: an unknown URL returns the 404 page with a 404 status on the Cloudflare preview.
- **T-026** · todo · Private CV folder (Owner action)
  `private/` exists and Git ignores everything in it except its `.gitkeep` (created with F-007's triage). The owner adds the current CV PDF there (the version with the Gmail address).
  Done when: the CV is in `private/` and `git status` does not show it.

## Phase 3: Case studies and imagery (tag v0.4.0)

- **T-030** · todo · Case study: airline crew management platform (Owner review, D-018)
  Done when: MDX validated; has context, role, scope, key decisions (SSO, rostering, approvals), outcome, and 2-4 captioned images.
- **T-031** · todo · Case study: business operations platform (Owner review, D-018)
  Done when: same structure; highlights the shared CRUD and server-side table data layer.
- **T-032** · todo · Case study: EV charging platform (Owner review, D-018)
  Done when: same structure; highlights the 132 screens and 50-module API layer.
- **T-033** · todo · Case study: hospital management platform (Owner review, D-018)
  Done when: same structure; highlights the 57-component library and print/barcode/Excel workflows.
- **T-034** · todo · Image pipeline (Owner review: anonymized crops)
  Script converting and resizing to AVIF/WebP with explicit dimensions; guidance for anonymized crops with fake data.
  Done when: all case study images go through the script and none contain real client data.
- **T-035** · todo · Final hero and About copy (Owner review)
  Done when: owner approves the copy and numbers match REQUIREMENTS section 4.

## Phase 4: Skins and switcher (tag v0.5.0)

- **T-040** · todo · Systems skin (light and dark)
  `app/styles/skins/systems.css`: different tokens plus structural CSS only, same markup.
  Done when: every page looks finished in both skins, both themes.
- **T-041** · todo · Skin mechanism
  `app/lib/skin.ts`: get/set, `localStorage` (try/catch), `?skin=` param, system theme default; pre-paint script extended.
  Done when: no flash on reload; param works; unit tested.
- **T-042** · todo · Skin switcher and transition
  Header control, keyboard accessible, announces state; View Transitions circular reveal from the control; preload the target skin's fonts before switching; instant when reduced motion/unsupported.
  Done when: switch works in Chrome, Safari and Firefox with a graceful fallback, no layout jump.
- **T-043** · todo · Command palette
  `cmdk`-based; navigate, switch design/theme, download CV.
  Done when: opens with Ctrl/Cmd+K, fully keyboard and screen-reader usable, lazy loaded.
- **T-044** · todo · Per-skin QA
  Playwright smoke and axe checks run for each skin via `?skin=`; contrast verified; visual check at 375/768/1440.
  Done when: all checks pass for both skins and both themes.

## Phase 5: Lab demo (tag v0.6.0)

- **T-050** · todo · Mock data layer
  Static JSON or MSW; no runtime server; seeded fake records.
  Done when: the data layer is typed and supports pagination, sorting and filtering.
- **T-051** · todo · Server-style data table
  Pagination, sorting, filters, URL-synced state, loading/empty/error states.
  Done when: state survives reload and back/forward; unit and e2e tested.
- **T-052** · todo · CRUD drawer flow
  Create/edit in a drawer, Zod validation, optimistic updates with rollback.
  Done when: keyboard accessible, validated, tested.
- **T-053** · todo · Component gallery
  Shows the design-system approach with the primitives.
  Done when: every component shows variants and states in both skins.
- **T-054** · todo · Lab page copy and source links
  Done when: `/lab` explains the patterns and links to the source on GitHub.

## Phase 6: Quality and SEO (tag v0.7.0)

- **T-060** · todo · SEO
  Canonical URLs, sitemap, robots, JSON-LD `Person`, per-route meta audit.
  Done when: validators pass and every route has unique title/description.
- **T-061** · todo · Open Graph images
  Build-time generation per case study.
  Done when: LinkedIn and WhatsApp previews show the right image and title.
- **T-062** · todo · Performance pass
  Budgets from REQUIREMENTS, font subsetting, image sizes, route-level code splitting, Lighthouse CI thresholds enforced.
  Done when: all targets met on the preview deployment.
- **T-063** · todo · Accessibility audit
  Keyboard, screen reader spot checks, axe per skin, reduced motion, zoom 200%.
  Done when: no known WCAG 2.2 AA failures; findings recorded in FEEDBACK.
- **T-064** · todo · Test coverage pass
  Done when: critical flows (navigation, skin/theme switch, palette, lab table, CRUD) have e2e coverage.

## Phase 7: Launch (tag v1.0.0)

- **T-070** · todo · README
  Screenshot, stack, architecture notes, how to run, Lighthouse scores, links to DECISIONS.
  Done when: a stranger can run the project and understand the choices in 5 minutes.
- **T-071** · todo · Canonical production URL
  No custom domain (F-003, D-018): `https://portfolio-4q6.pages.dev` is the canonical origin. Canonical tags, sitemap, Open Graph URLs and JSON-LD use it from one config value, so a domain can be added later in one place.
  Done when: every absolute URL on the site comes from that value and points at the `pages.dev` origin.
- **T-072** · todo · Analytics
  Cloudflare Web Analytics, cookieless.
  Done when: page views are visible and no consent banner is needed.
- **T-073** · todo · Final review (Owner review)
  Content, NDA check, CV link, profile README, pinned repo.
  Done when: owner signs off in FEEDBACK.
- **T-074** · todo · Release v1.0.0
  Done when: tag created, production verified, links updated on CV/LinkedIn/GitHub.
