# TASKS

Current phase: **Phase 5: Lab demo**

## Rules

- Statuses: `todo`, `doing`, `review` (PR open), `done` (merged into `dev`), `blocked` (reason in the line or FEEDBACK).
- Work tasks in ID order inside a phase unless a task says otherwise. One task per branch: `task/T-012-short-slug`.
- Each PR edits only its own task line(s) in this file, to avoid merge conflicts.
- A task is done only when its **Done when** line is true, checks pass, and docs are updated.
- Tasks marked **Owner** need input or an action from the owner; if it is missing, mark `blocked` and add a FEEDBACK item.
- Tasks marked **Owner review** are never auto-merged: `/finish-task` opens the PR, waits for CI, then stops for the owner's review.
- `/start-task` picks the first eligible `todo` task of the current phase in ID order (it skips `blocked` tasks and tasks listed under an open FEEDBACK item's "blocks").
- `/run-phase [phase] [max=N]` runs a phase's tasks (default: the current phase) one after another, each in a fresh subagent with `--auto`: questions get the recommended answer (logged in FEEDBACK as `auto (recommended)`), Owner review and Owner action tasks are parked, and `/finish-phase` runs only when every task is `done` (D-024).
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

- **T-020** · done · Content layer
  Zod schemas in `content/schema.ts`; `profile.ts`, `experience.ts`; projects as MDX with validated frontmatter (verify the MDX Vite plugin works with React Router framework mode, record in DECISIONS). Derive the `prerender` path list from content.
  Done when: invalid content fails `npm run build`, and every project slug is prerendered.
  Notes: D-025. MDX works in framework mode via `@mdx-js/rollup`. Content is validated in Node when `react-router.config.ts` builds the prerender list (checked by breaking a project's `order`: the build stops naming the file and field). A minimal `/work/:slug` route ships here and T-022 extends it (F-011); project, profile and experience copy is placeholder or REQUIREMENTS facts only (F-010). Unknown `/work/*` slugs show the generic error page until T-025.
- **T-021** · done · Home page
  Hero, metrics strip, selected work, "How I build" teaser, About teaser, contact block. Placeholder content allowed until Phase 3.
  Done when: home is complete at all breakpoints with per-route `meta`.
  Notes: copy lives in `content/home.ts`, validated by `homeSchema` at build time (links must be site paths, `#anchors` or `https://` URLs); the headline and metrics come from `profile.ts` and the work list from the project files. Approach, About and contact text are marked placeholders for T-035 (F-012). The contact block links the GitHub profile only; T-024 adds the email and CV (F-013). "All case studies" and "More about me" lead to the not-found page until T-022 and T-023. Playwright checks 375/768/1440 px, both themes with axe, and the prerendered meta.
- **T-022** · done · Work index and case study template
  `/work` and `/work/:slug`: summary header, sections, captioned images, next-project link, per-route `meta`.
  Done when: each slug has its own prerendered HTML with its own title and Open Graph tags.
  Notes: D-026. `/work` lists every project (copy in `content/work.ts`, validated by `workSchema`). The case study template has a back link, a summary header (sector, title, summary, role, stack, metrics), the MDX body whose `##` headings are the sections, and a "Next project" link that wraps from the last project to the first. Captioned images use `<Figure>`, available in MDX without an import; no images ship until T-030 to T-034. Each project body now has the four REQUIREMENTS sections with placeholder text (F-014). Case studies use `og:type` `article`. Playwright checks the prerendered title and Open Graph tags of `/work` and every slug, the next-project chain, and axe in both themes at 375 and 1440 px.
- **T-023** · done · About page
  Story, experience timeline, skills, education.
  Done when: page is complete and content comes only from `content/`.
  Notes: `/about` is prerendered with its own `meta`. Page titles and labels live in `content/about.ts` (validated by `aboutSchema`); the story, skills and education come from `profile.ts` and the timeline from `experience.ts`, rendered as an ordered list with `<time>` dates. Typographic, no headshot (D-018). The story, timeline entry, university and page intro are marked placeholders for T-035 (F-015); skills and education restate REQUIREMENTS facts only. The header "About" link and the home "More about me" link now reach the page. Playwright checks the prerendered meta, both links, and every section, horizontal scroll and axe in both themes at 375, 768 and 1440 px.
- **T-024** · done · Contact and CV (Owner: CV PDF in `public/`)
  `mailto:` link (the Gmail address) and the GitHub profile only (D-018). No LinkedIn, no phone number on the pages. The owner adds the CV PDF to `public/` (F-008); it may include the phone number (D-018).
  Done when: CV downloads from the header and contact block.
  Notes: the owner added the CV as `public/cv.pdf` and confirmed the email address matches it (F-020). Contact details live in `content/contact.ts`, validated by `contactSchema` (email address, https GitHub URL, `/name.pdf` CV path; unknown keys such as a LinkedIn entry are rejected). The header shows a compact "CV" link (accessible name "Download CV (PDF)") between the navigation and the theme toggle on every page; the home contact block links the email address (`mailto:`), "Download CV" and the GitHub profile, which moved there from `home.ts` (F-021, F-022). Both CV links point at `/cv.pdf` with `download="Mohamad-Rida-Chouman-CV.pdf"`. Playwright checks both CV links and the `mailto:` link in the prerendered HTML, that no LinkedIn or `tel:` link exists, and the header link on `/`, `/work` and `/about`; it also checks that `/cv.pdf` is served with a 200 status as `application/pdf` and that the header and contact block links download it as `Mohamad-Rida-Chouman-CV.pdf` under the built CSP. `_headers` gives `/cv.pdf` `Cache-Control: public, max-age=0, must-revalidate`, since its URL stays the same when the CV changes.
- **T-025** · done · 404 and headers
  404 page; `public/_headers` with long-cache for hashed assets and sensible security headers.
  Done when: an unknown URL returns the 404 page with a 404 status on the Cloudflare preview.
  Notes: D-027. A catch-all route renders the 404 page (copy in `content/not-found.ts`); it is prerendered at `/404` and moved to `build/client/404.html` after the build, which Pages serves with a 404 status. Unknown case study slugs and client-side navigation to missing routes (`/lab` until Phase 5) show the same page. `_headers` long-caches `/assets/*` and sets a CSP whose inline script hashes are filled in at build time, plus HSTS, nosniff, frame, referrer, permissions and opener policies. Playwright checks the 404 page (three URL shapes, axe in both themes at 375 and 1440 px), the built `_headers`, and replays the CSP on every page type. Only `dev` is built by Cloudflare, so the 404 status on the preview is checked right after the merge (F-016); before it, the `dev` preview answered unknown URLs with a 200.
- **T-026** · done · Private CV folder (Owner action, F-019)
  `private/` exists and Git ignores everything in it except its `.gitkeep` (created with F-007's triage). The owner adds the current CV PDF there (the version with the Gmail address).
  Done when: the CV is in `private/` and `git status` does not show it.
  Notes: preparation checked 2026-10-30: `.gitignore` has `/private/*` and `!/private/.gitkeep`, only `private/.gitkeep` is tracked, and a probe `private/__probe.pdf` was reported as ignored (`!!`) and absent from `git status`. Only the owner step in F-019 remains. Done 2026-10-30: the owner added `private/cv.pdf`; it is ignored by `/private/*`, absent from `git status`, and `git ls-files private` lists only `private/.gitkeep` (F-019 resolved).

## Phase 3: Case studies and imagery (tag v0.4.0)

- **T-030** · done · Case study: airline crew management platform (Owner review, D-018)
  Done when: MDX validated; has context, role, scope, key decisions (SSO, rostering, approvals). No Outcome section and no images (owner decision, D-031).
  Notes: D-030, superseded by D-031. The MDX has "Context", "What I owned", "Scope", "Key decisions" ("Single sign-on", "Rostering", "Approvals") and "Outcome"; the role and narrative were first placeholders (F-024), then written from the project's codebase and commit history at the owner's request. The owner then asked for the Outcome section to be removed from every case study. The three invented-data figures first added (F-023) and the figure tooling around them were removed on the owner's decision to show no screenshots for now (D-031).
- **T-031** · done · Case study: business operations platform (Owner review, D-018)
  Done when: same structure; highlights the shared CRUD and server-side table data layer.
- **T-032** · done · Case study: EV charging platform (Owner review, D-018)
  Done when: same structure; highlights the 132 screens and 50-module API layer.
- **T-033** · done · Case study: hospital management platform (Owner review, D-018)
  Done when: same structure; highlights the 57-component library and print/barcode/Excel workflows.
- **T-034** · done · 3D project objects (Owner review)
  One rotatable low-poly Three.js object per case study, in place of images (D-031, D-032): airplane, crates on a pallet, EV charger, hospital bed.
  Done when: each case study header shows its object, rotatable by drag and arrow keys, with reduced-motion and no-WebGL handling; Three.js loads only on `/work/:slug`; home's initial JS is unchanged.
  Notes: D-032. Owner decision 2026-10-30 replaced the image pipeline with this task. Models are built in code from simple shapes and colored from `--fg`, `--accent` and `--fg-muted`; colors follow theme and skin changes. `scene.ts` (Three.js, ~135 kB gzipped) is imported when the object scrolls into view. Unit tests cover rotation, colors, models (all slots used, centered, within their sphere), the component and the schema; Playwright checks every case study draws and turns its object, the idle spin and reduced motion, and that home, `/work` and `/about` never request the chunk.
- **T-035** · done · Final hero and About copy (Owner review)
  Done when: owner approves the copy and numbers match REQUIREMENTS section 4.
  Notes: draft copy approved by the owner on 2026-10-30, after a check of the timeline against the CV (F-025). Every placeholder in `profile.ts`, `home.ts` (approach, About teaser, contact), `about.ts` and `experience.ts` is replaced; the headline and metrics keep the REQUIREMENTS wording (4 systems, 260+ screens, ~3 years). Facts beyond REQUIREMENTS restate the owner's published CV (`public/cv.pdf`): the timeline (frontend lead since 2026-01, frontend developer 2024-08 to 2026-01, application analyst 2024-01 to 2024-08) with generic organizations, the BSc and MSc universities and the bootcamp certificate, and the CV's frontend and testing skills. No client or employer is named (D-018). Unit tests check that no placeholder text is left, that the headline and metrics match the project count and REQUIREMENTS, and that the timeline runs newest first with one open role. Parked for the owner's review.

## Phase 4: Skins and switcher (tag v0.5.0)

- **T-040** · done · Systems skin (light and dark)
  `app/styles/skins/systems.css`: different tokens plus structural CSS only, same markup.
  Done when: every page looks finished in both skins, both themes.
  Notes: D-033, F-026 (auto). Cool greys, teal accent, Geist headings and Geist Mono labels, 3-8 px radii, a blueprint grid from `--line`, all scoped to `[data-skin="systems"]`; no markup or new font. Checked with screenshots of every page at 1440 and 375 px in both themes. Unit tests run the contrast checks for both skins and reject unscoped rules; `tests/e2e/systems-skin.spec.ts` sets the skin on `<html>` (until T-041 adds `?skin=`) and runs axe on every page in both themes, plus token, nested-theme and 375 px overflow checks. The style tile copy now says "the active skin".
- **T-041** · done · Skin mechanism
  `app/lib/skin.ts`: get/set, `localStorage` (try/catch), `?skin=` param, system theme default; pre-paint script extended.
  Done when: no flash on reload; param works; unit tested.
  Notes: D-034, F-027 (auto). The pre-paint script always sets `data-skin` (parameter, then stored choice, then `editorial`); a valid `?skin=` is stored, unknown values are ignored. The theme still defaults to the system preference. `prePaintScript` joins the theme and skin scripts in one inline script. `setSkin` applies instantly; T-042 adds the switcher and transition. Tested in `tests/unit/skin.test.tsx` and `tests/e2e/skin.spec.ts` (first-frame skin, reload, blocked storage).
- **T-042** · done · Skin switcher and transition
  Header control, keyboard accessible, announces state; View Transitions circular reveal from the control; preload the target skin's fonts before switching; instant when reduced motion/unsupported.
  Done when: switch works in Chrome, Safari and Firefox with a graceful fallback, no layout jump.
  Notes: D-035, F-028 and F-029 (auto). An icon button "Switch design" next to the theme toggle, described by the current design and announcing the new one in a status region. `switchSkin` loads the target skin's fonts (capped at 1 s), then reveals the skin with a View Transitions circle from the button (`--duration-slow`); instant with reduced motion or without the API. Root preloads only Geist; the pre-paint script preloads Fraunces for Editorial only. `tests/e2e/skin-switcher.spec.ts` runs in Chromium, Firefox and WebKit (new Playwright projects; `ci-main` installs the three browsers): keyboard, announcement, fonts ready before the skin applies, unchanged control position, the reveal, reduced motion, no View Transitions, preloads. Unit tests in `tests/unit/skin-switcher.test.tsx`. Chromium and Firefox pass locally, including the reveal. WebKit was checked on draft verification PR #50 into `main` (closed unmerged): 111 passed, 1 skipped; the skip is the reveal test, because Playwright's Linux WebKit build has no View Transitions, so WebKit exercised the instant fallback. Real Safari 18+ supports the API, so it gets the reveal.
- **T-043** · done · Command palette
  `cmdk`-based; navigate, switch design/theme, download CV.
  Done when: opens with Ctrl/Cmd+K, fully keyboard and screen-reader usable, lazy loaded.
  Notes: D-036, F-030 and F-031 (auto). `CommandMenu` (header) adds an icon button "Open command palette" (`aria-haspopup="dialog"`, `aria-keyshortcuts`) and the Ctrl/Cmd+K listener; `CommandPalette` and cmdk load with `React.lazy` on first open (also prefetched on hover or focus of the button), about 17.7 kB gzipped, nothing on first load. A native modal `<dialog>` holds cmdk's combobox and listbox: Pages, Case studies, Preferences (switch design via `switchSkin`, switch theme), Files (CV download). Escape, the shortcut or a backdrop click close it and focus returns; design and theme changes are announced in a status region. Header gaps shrink below `sm` so the four controls and the navigation stay on one row at 375 px. Tests: `tests/unit/command-palette.test.tsx`, `tests/e2e/command-palette.spec.ts` (lazy load, both shortcuts, focus, inert page, arrow keys and `aria-activedescendant`, filtering, each command, axe in both skins and themes, 375 px); the theme and skin switcher specs follow the new tab order and status region. Passed locally in Chromium and Firefox.
- **T-044** · done · Per-skin QA
  Playwright smoke and axe checks run for each skin via `?skin=`; contrast verified; visual check at 375/768/1440.
  Done when: all checks pass for both skins and both themes.
  Notes: D-037, F-032 (auto). `tests/e2e/per-skin.spec.ts` replaces `systems-skin.spec.ts`: every route (home, `/work`, the four case studies, `/about`, `/style-tile`, a 404 path) is loaded with `?skin=` in a fresh context for each skin, with the theme from the emulated system color scheme, and checked for `data-skin`/`data-theme`, title, h1, header and footer, and no axe violations (36 tests). Per skin and theme it also checks WCAG AA contrast on the tokens the browser resolves (the contrast helper now reads the minified `oklch(95% ...)` form) and that no page scrolls sideways, and the header and h1 fit, at 375, 768 and 1440 px. A test fails if the skins in the built pre-paint script and the spec drift apart. The token, font and nested-theme checks moved over and load the skin with `?skin=`. Visual check: 72 full-page screenshots (6 pages x 2 skins x 2 themes x 3 widths) reviewed by eye, no issue found; no baselines are committed.

## Phase 5: Lab demo (tag v0.6.0)

- **T-045** · done · Single design: Systems only
  Make Systems the only design (D-038): move its styles out of `[data-skin="systems"]` into the base tokens and styles; remove the Editorial skin, its fonts, the skin switcher and circular reveal, `?skin=`, the skin commands of the command palette and the skin layer of the pre-paint script; turn the per-skin tests into per-theme tests.
  Done when: every page looks as it did in Systems, in both themes; no Editorial code, font or `skin` reference is left; checks pass.
  Notes: D-039, F-033 (auto), F-034 (open, `CLAUDE.md` for the owner). Systems colors, fonts and radii now live in `tokens.css` and its element styles unscoped in `base.css`; `app/styles/skins/`, `skin.ts`, `useSkin`, `SkinSwitcher`, the reveal CSS, the palette's design command, its copy and `@fontsource-variable/fraunces` are removed, and the pre-paint script is the theme script. `skins.test.ts` became `theme-tokens.test.ts`, `per-skin.spec.ts` became `per-theme.spec.ts` (plus a check that the build has no `data-skin` or Fraunces), and the skin unit and e2e specs are deleted; Playwright runs in Chromium only. Screenshot comparison against `dev` with `?skin=systems` (6 pages, both themes, 375 and 1440 px): identical apart from the removed header button and the style tile's intro copy. Skin mentions remain only in docs history and in `CLAUDE.md` (F-034).
- **T-046** · done · Accent mechanism and tokens
  Six accents (green default, purple, gold, red, blue, orange) as accent tokens per theme, AA in light and dark; `app/lib/accent.ts`: get/set, `localStorage` (try/catch), `?accent=` param (stored), `data-accent` set by the pre-paint script; one command per accent in the command palette; accent names in `content/`.
  Done when: no flash on reload; param works; contrast is unit tested for every accent and theme.
  Notes: D-040, F-035 and F-036 (auto). Each accent in `tokens.css` sets `--accent-light` and `--accent-dark` under `[data-accent]` (green also on `:root`); the theme blocks set `--accent: var(--accent-light | --accent-dark)`, so nested `data-theme` sections keep the page's accent; `accent-fg` stays per theme. `app/lib/accent.ts` (+ `useAccent`) follows the old skin store; `prePaintScript` runs the theme and accent scripts in one inline script. The palette lists "<Name> accent" for all six under Preferences, with an announcement. 3D objects also redraw on `data-accent` changes. Tests: `theme-tokens.test.ts` checks every accent in both themes, `accent.test.ts` the script, parameter and store, `accent.spec.ts` the first frame, the parameter, resolved contrast per accent and theme, and the palette command.
- **T-047** · done · Floating accent palette
  Fixed to the left of every page, vertically centred: a vertical rail of six swatches from tablet width up, one swatch that opens the six on phones. Labelled radio group, arrow keys, announces the choice, visible focus.
  Done when: keyboard and screen-reader usable, never covers content at 375/768/1440, unit and e2e tested.
  Notes: D-041, F-037 and F-038 (auto). `AccentPalette` (after the header in `root.tsx`) is a `radiogroup` of six visually hidden native radios in round swatches with text names, a check mark on the current one, the focus ring on the swatch and a "<Name> accent on" status message. Phones get a 24 x 48 px accent tab at the edge that opens the rail (Escape, a press outside or focus leaving closes it). Swatches use their own `data-accent` and `.accent-swatch` (base.css). `--space-rail` and a `page-container` start padding keep content clear of it. Tests: `accent-palette.test.tsx`, `accent-palette.spec.ts` (every page at 375/768/1440, phone flow, keyboard, swatch colors per theme, axe). Screenshots checked by eye at 375 (closed and open, both themes), 768 and 1440.
- **T-048** · done · Floating header
  Detached rounded bar inset from the edges with a gap at the top, raised surface and subtle shadow from tokens, always visible while scrolling; content and anchor/focus targets are never hidden under it (`scroll-padding-top`).
  Done when: visible and usable on every page at 375/768/1440 in both themes; skip link and keyboard order still work; no layout shift; e2e tested.
  Notes: D-042, F-039 (auto). The `<header>` is sticky (`.site-header`, `top` and `margin-top` from `--space-header-gap`), transparent and click-through; its bar inside `page-container` is `rounded-xl`, bordered, on `bg-surface-raised` with the new `shadow-raised` token (per theme). `useHeaderOffset` writes the bar height to `--header-height` on `<html>`, which feeds `scroll-padding-top` (CSS fallback before hydration). Tests: `tests/e2e/floating-header.spec.ts` (every page at 375/768/1440 in both themes, anchors and focus below the bar, published height, no header layout shift, skip link above the bar), a unit test in `layout.test.tsx`; the existing layout and keyboard specs pass unchanged. Screenshots checked by eye at 375/768/1440 in both themes, top and scrolled.
- **T-049** · done · Accent and header QA
  Playwright smoke and axe per theme; contrast per accent and theme on the built page; layout at 375/768/1440 with the floating header and palette; visual check of every accent.
  Done when: all checks pass for every accent in both themes.
  Notes: D-043, F-040 (auto). `tests/e2e/per-accent.spec.ts` loads every route (home, `/work`, the four case studies, `/about`, `/style-tile`, a 404 path) with `?accent=` in a fresh context for each of the six accents and both themes: `data-theme`/`data-accent`, title, h1, header, footer, the matching palette radio checked, and no axe violations (108 tests). Per accent and theme it checks WCAG AA contrast on the tokens the browser resolves for the page and for the style tile's light and dark sections, and at 375, 768 and 1440 px on every page: no sideways scroll, the header bar inset inside the viewport, the h1 inside it, one palette control left of the content and below the bar (36 tests). A test fails if the spec's accent list and the built pre-paint script drift apart. 157 tests, all passing. Visual check: screenshots of home, a scrolled case study and the style tile at 1440 px and home (palette open) and the case study at 375 px, for every accent in both themes (60), reviewed by eye, no issue found; no baselines are committed. No app code changed.
- **T-050** · done · Mock data layer
  Static JSON or MSW; no runtime server; seeded fake records.
  Done when: the data layer is typed and supports pagination, sorting and filtering.
  Notes: D-044, F-041 (auto). In-memory TypeScript, no MSW and no new dependency. `app/lib/lab/records.ts` generates 240 invented equipment assets (id, name, category, status, site, value, `updatedAt`) from a seeded mulberry32 PRNG and a fixed base date, so every build is identical; no people, customers or orders. `app/lib/lab/query.ts`: `queryRecords` filters (search over id and name, multi-value status, category, site), sorts on any column in both directions with ties by id, and paginates (10/25/50, page clamped); `parseListQuery`/`toSearchParams` round-trip the query through URL parameters with defaults left out and invalid values dropped, for T-051. `app/lib/lab/api.ts`: `createMockApi` resolves `listAssets` and `getAsset` after a simulated latency, honours `AbortSignal`, returns copies, and can be told to fail (`shouldFail`) for the error state. Mutations are left to T-052. Tests: `tests/unit/lab-data.test.ts` (21).
- **T-051** · done · Server-style data table
  Pagination, sorting, filters, URL-synced state, loading/empty/error states.
  Done when: state survives reload and back/forward; unit and e2e tested.
  Notes: D-045, F-042 (auto). Adds the `/lab` route (prerendered, in the existing nav) with copy in `content/lab.ts` (`labSchema`); T-054 refines the page copy. Data comes from a `clientLoader` (`app/lib/lab/client.ts` over the T-050 mock endpoint), so React Router re-runs it on every URL change, reload and back/forward and aborts the request it replaces; the prerendered page is the `HydrateFallback`, the same table with default, disabled controls. `app/components/lab/AssetTable.tsx`: debounced search (Enter commits at once), status/category/site checkbox filters, "Clear filters", sortable column buttons with `aria-sort`, rows per page (10/25/50), first/previous/next/last, a range and a polite status message. Every control writes the whole query to the URL (pushes a history entry, page reset to 1 when the matches change) and shows the requested state at once while the old rows stay, dimmed with `aria-busy`. Empty state in the table body; error state as an alert with "Try again", reached with "Simulate a server error" (one failed request). The table scrolls sideways inside a focusable region on phones. Tests: `tests/unit/lab-table.test.tsx` (17: state helpers, client, copy, meta, the table through `createRoutesStub`), `tests/e2e/lab.spec.ts` (URL writes, reload, back/forward, search, loading, empty, error and retry, keyboard, 375/768/1440 in both themes with axe); `/lab` joins the per-theme, per-accent, floating header, accent palette and CSP page lists; the not-found spec's client-side 404 now navigates through the router, since the Lab link no longer 404s.
- **T-052** · todo · CRUD drawer flow
  Create/edit in a drawer, Zod validation, optimistic updates with rollback.
  Done when: keyboard accessible, validated, tested.
- **T-053** · todo · Component gallery
  Shows the design-system approach with the primitives.
  Done when: every component shows variants and states in both themes and with every accent.
- **T-054** · todo · Lab page copy and source links
  Done when: `/lab` explains the patterns and links to the source on GitHub.
- **T-055** · doing · Filled contact card
  Owner request: the contact card uses the same filled background as the other cards instead of a transparent one, from tokens, in both themes and every accent.
  Done when: the contact card matches the other cards' surface in both themes; contrast stays AA; checks pass.
- **T-056** · todo · CV preview modal
  Owner request: the CV link opens a modal that previews the PDF and offers a download. Native `<dialog>` (or the existing dialog primitive), focus trapped, Escape and a close button, focus returns to the trigger; copy in `content/`; no new dependency over ~10 kB. Inline PDF preview where the browser supports it; on phones that cannot show a PDF inline (Android Chrome, iOS Safari), the modal shows a short note with "Open" and "Download" instead of a broken preview. Never copy the phone number into pages or `content/` (D-018).
  Done when: keyboard and screen-reader usable, preview works on desktop, phone fallback shown at 375 px, download works; unit and e2e tested.

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
  Keyboard, screen reader spot checks, axe per theme, reduced motion, zoom 200%.
  Done when: no known WCAG 2.2 AA failures; findings recorded in FEEDBACK.
- **T-064** · todo · Test coverage pass
  Done when: critical flows (navigation, theme and accent switch, command palette, lab table, CRUD) have e2e coverage.

## Phase 7: Launch (tag v1.0.0)

- **T-070** · todo · README
  Screenshot, stack, architecture notes, how to run, Lighthouse scores, links to DECISIONS.
  Done when: a stranger can run the project and understand the choices in 5 minutes.
- **T-071** · todo · Canonical production URL
  No custom domain (F-003, D-018, D-029): `https://mr-chouman-portfolio.pages.dev` is the canonical origin. Canonical tags, sitemap, Open Graph URLs and JSON-LD use it from one config value, so a domain can be added later in one place.
  Done when: every absolute URL on the site comes from that value and points at the `pages.dev` origin.
- **T-072** · todo · Analytics
  Cloudflare Web Analytics, cookieless.
  Done when: page views are visible and no consent banner is needed.
- **T-073** · todo · Final review (Owner review)
  Content, NDA check, CV link, profile README, pinned repo.
  Done when: owner signs off in FEEDBACK.
- **T-074** · todo · Release v1.0.0
  Done when: tag created, production verified, links updated on CV/LinkedIn/GitHub.
