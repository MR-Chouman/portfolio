# DECISIONS

Append-only log of technical and process decisions (ADR style). Do not rewrite history: to change a decision, add a new entry that supersedes the old one and mark the old one `Superseded by D-0xx`.

Entry format: **ID · Title** / Status · Date / Context / Decision / Consequences.

---

## D-001 · Static site on Vite, not Next.js
Status: Accepted · 2026-10-22

**Context.** Hosting is Cloudflare's free plan. Next.js on Cloudflare means either the OpenNext adapter (an adapter rather than first-party support, with feature gaps and Worker size limits) or a static export that gives up Server Actions, runtime API routes and dynamic OG images. The owner's CV already demonstrates Next.js.

**Decision.** Build a Vite-based static site.

**Consequences.** No runtime server features; contact is `mailto:` (D-009); OG images are generated at build time; simplest possible hosting.

## D-002 · React Router framework mode with `ssr: false` and `prerender`
Status: Accepted · 2026-10-22

**Context.** A plain SPA serves the same `index.html` for every route, which breaks per-page link previews (LinkedIn, WhatsApp, Slack do not run JavaScript). Options considered: `vite-react-ssg` (keeps SSG support for React Router v6 only and points to React Router 7's built-in SSG), Astro with React islands, plain SPA (rejected).

**Decision.** Use React Router's framework mode (built on Vite) with `ssr: false` and an explicit `prerender` path list, including every case study slug.

**Consequences.** Build output is `build/client` with per-route `.html` and `.data` files plus an SPA fallback. Routes cannot export `action` or `headers`. Case study slugs must be known at build time (derived from `content/`). `vite preview` is not used; `sirv-cli` serves the output locally and in CI.

## D-003 · Branching model: main, dev, task branches
Status: Accepted · 2026-10-22 · Squash-merge of task PRs superseded by D-013

**Context.** Work is organized in phases with tasks. The repo is also a showcase.

**Decision.** `main` is production; `dev` is integration/staging; each task has `task/T-xxx-slug` branched from `dev`. Task PRs are **squash-merged** into `dev`. Phase PRs `dev` -> `main` use a **merge commit** and get a version tag. Hotfixes branch from `main` and are merged back into `dev`. Branch names map to IDs in `docs/TASKS.md`.

**Consequences.** Clean one-commit-per-task history on `dev`; phases visible in `main` history; `dev` and `main` do not diverge from squashing. GitHub rulesets can enforce the allowed merge method per branch.

## D-004 · Two-tier CI
Status: Accepted · 2026-10-22

**Context.** The owner wanted checks only on `main`. Skipping checks on `dev` delays feedback and makes phase PRs hard to debug.

**Decision.** PRs into `dev` run a light job (lint, typecheck, build). PRs into `main` run the full gate (plus unit tests, Playwright, Lighthouse). Cheap checks also run locally via Husky hooks. Cloudflare preview builds act as an extra build signal.

**Consequences.** About one minute of CI per task PR; heavy checks only at phase boundaries. Both branches are protected and require their respective checks.

## D-005 · Skins are CSS-only over a single DOM; two skins
Status: Accepted · 2026-10-22 · Superseded by D-038

**Context.** Visitors can choose the design they preview the site in. Different markup per skin would cause hydration mismatches, layout shift, and multiply maintenance and tests.

**Decision.** Ship **two** polished skins (Editorial default, Systems), each with light and dark. Skins are `[data-skin]` token sets plus small CSS overrides; components use semantic tokens only. A pre-paint inline script applies the saved choice. Switching uses the View Transitions API (circular reveal for skins, cross-fade for light/dark), with an instant fallback.

**Consequences.** One HTML structure for SEO and prerendering. Fonts load per skin. Tests and axe checks run per skin via `?skin=`. A third skin is out of scope for v1.

## D-006 · Hosting on Cloudflare Pages, production branch `main`
Status: Accepted · 2026-10-22

**Context.** The owner prefers Cloudflare Pages and its free plan. Cloudflare's own guidance for new projects points toward Workers with static assets, and the free plan's build count is limited (commonly listed as 500 builds/month; verify).

**Decision.** Use Cloudflare Pages connected to GitHub. Production branch is `main`; `dev` is a permanent staging preview. Consider limiting preview builds to `dev` if the build count becomes a concern.

**Consequences.** No Wrangler file needed. If Pages becomes less favored, migration to Workers static assets is a configuration change (`wrangler.jsonc` pointing at `build/client`), not a rewrite.

## D-007 · Content as MDX plus Zod-validated data
Status: Accepted · 2026-10-22

**Context.** Content changes a few times a year; a CMS is unnecessary.

**Decision.** Profile and experience live in typed TS files; case studies are MDX with frontmatter. All are validated with Zod at build time. Verify MDX plugin compatibility in T-020 and record the result here.

**Consequences.** Invalid content fails the build. Prerender paths derive from content.

## D-008 · No animation library
Status: Accepted · 2026-10-22

**Context.** Skin/theme transitions are handled by the View Transitions API; other motion is small.

**Decision.** Use CSS transitions and View Transitions. Add a library only with a new DECISIONS entry showing a need CSS cannot meet and the bundle cost.

**Consequences.** Smaller bundle, fewer moving parts.

## D-009 · Contact via `mailto:`, no form in v1
Status: Accepted · 2026-10-22

**Context.** Static hosting has no server; a form needs a Worker/Function and spam handling.

**Decision.** `mailto:` link plus GitHub and LinkedIn. Revisit after launch.

**Consequences.** No backend to secure. The owner's phone number is never published.

## D-010 · Node 24, pinned in `.nvmrc`
Status: Accepted · 2026-10-22

**Context.** As of this date Node 24 and 22 are in maintenance LTS and Node 26 is the upcoming LTS.

**Decision.** Pin Node 24 in `.nvmrc`; CI reads `.nvmrc`; Cloudflare uses `NODE_VERSION=24`.

**Consequences.** Revisit moving to Node 26 once it is Active LTS and dependencies support it.

## D-011 · Public repository and confidentiality rules
Status: Accepted · 2026-10-22

**Context.** The repo is part of the portfolio, while the work shown is private client software.

**Decision.** The repo is public. No client-confidential data, real screenshots, internal URLs, secrets or personal contact details are committed. Client names stay generic until FEEDBACK F-001 is resolved.

**Consequences.** All imagery is cropped and anonymized or recreated with fake data (T-034). Docs in this folder are written to be read by outsiders.

## D-012 · Automated task selection, merging and tagging by Claude Code commands
Status: Accepted · 2026-10-22 · Clarifies D-003 · Merge method for task PRs superseded by D-013

**Context.** The owner wants the task and phase loop to run without manual selection or merge steps.

**Decision.** `/start-task` picks the next eligible `todo` task of the current phase on its own. `/finish-task` squash-merges the task PR into `dev`, and `/finish-phase` merges the phase PR into `main` with a merge commit and pushes the version tag. A merge happens only when all of these hold: required checks are green, the PR is mergeable with no non-trivial conflicts, there are no requested changes or unresolved review comments, "Done when" is fully satisfied, and (for task PRs) the task is not marked **Owner review**. Otherwise the command stops, leaves the PR open and reports why.

**Consequences.** A merge into `main` deploys production through Cloudflare Pages. Automated checks cannot judge visual quality, copy, or confidentiality of images, so those are reviewed by the owner on the live site after a phase release, and **Owner review** tasks (case studies, hero/About copy, image pipeline, final review) keep a manual gate. Rollback: re-activate the previous Cloudflare Pages deployment, then revert in Git with a revert PR (`git revert -m 1 <merge>` for a phase merge). GitHub protection must not require approving reviews (the author cannot approve their own PR) but must keep required checks and block force pushes.

## D-013 · Merge commits for task PRs; branches are kept
Status: Accepted · 2026-10-22 · Supersedes the squash-merge part of D-003 and the branch deletion in D-012's commands

**Context.** The owner prefers to keep the step-by-step commits and the task branches as a visible record of how each task was built.

**Decision.** Task PRs are merged into `dev` with a regular merge commit (`gh pr merge --merge`), and branches are not deleted after merging (task branches and `chore/advance-to-phase-N` branches stay). Phase PRs into `main` already use merge commits, and `dev` is kept. Every commit on a task branch follows Conventional Commits (enforced locally by commitlint), since each one lands on `dev` individually.

**Consequences.** History on `dev` is more detailed and noisier (several commits plus one merge commit per task). A task is reverted with `git revert -m 1 <merge-commit>`. `git branch --merged` correctly shows finished branches. The branch list grows (about 42 task branches) and can be pruned by hand later; GitHub's "automatically delete head branches" setting must stay off, and rulesets should allow only merge commits on `dev` and `main`.

## D-014 · Scaffold on React Router 8 with a temporary lint script
Status: Accepted · 2026-10-22 · Refines D-002

**Context.** D-002 was written with React Router 7's static prerendering in mind. On 2026-10-22 the official `create-react-router` template installs React Router 8.5, and its `ssr: false` + `prerender` behaviour is the same. The dev CI (D-004) runs `npm run lint`, but ESLint is only added in T-002.

**Decision.** Use the current template (React Router 8, Vite 8, Tailwind v4) as-is, minus `@react-router/serve` and the template's Google Fonts links (no runtime server, no third-party requests). Until T-002, `lint` runs `react-router typegen && tsc --noEmit` so the dev CI is meaningful rather than missing.

**Consequences.** Docs that mention React Router 7 apply to 8 for our usage. T-002 replaces the placeholder `lint` script with ESLint.

## D-015 · Lint, format and test tooling
Status: Accepted · 2026-10-22 · Replaces the placeholder lint script from D-014

**Context.** T-002 sets up ESLint, Prettier, Vitest and Playwright. On this date `eslint-plugin-jsx-a11y` (6.10) declares support only up to ESLint 9, while ESLint 10 is current. Running Prettier over the whole repo also reformatted the hand-written docs, including `REQUIREMENTS.md`, which needs owner approval to change.

**Decision.**
- ESLint 9 (flat config) with `@eslint/js` recommended, `typescript-eslint` strict, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` (accessibility is a requirement, so static a11y lint is kept rather than dropped for ESLint 10) and `eslint-config-prettier`. No `--legacy-peer-deps`.
- Prettier with default options, scoped to code and config: `docs/`, `CLAUDE.md`, `.github/` and `.claude/` are in `.prettierignore`.
- Vitest + React Testing Library + jsdom with its own `vitest.config.ts`, so tests do not load the React Router framework plugin.
- Playwright (Chromium) + `@axe-core/playwright` run against the prerendered build served by `sirv-cli` on `:4173`, matching what Cloudflare serves.

**Consequences.** Move to ESLint 10 once `jsx-a11y` supports it (Dependabot will surface it, T-005). Docs formatting stays manual.

## D-016 · Git hooks and Lighthouse CI setup
Status: Accepted · 2026-10-22 · Refines D-004

**Context.** T-003 adds local hooks and checks that the CI workflows match the project. Run locally, Lighthouse CI's `staticDistDir` mode opened `/index.html`, which the client router does not match as a route: the page lost its title and logged an error, failing the accessibility and SEO assertions. It also audited `__spa-fallback.html`.

**Decision.**
- Husky 9 installs the hooks through the `prepare` script. `pre-commit` runs lint-staged (ESLint with `--max-warnings=0`, then Prettier, on staged files only). `commit-msg` runs commitlint with `@commitlint/config-conventional`. Typecheck and tests stay in CI, so commits remain fast.
- Lighthouse CI serves the build with `npm run preview` (sirv, as Playwright does) and audits an explicit URL list, 3 runs per URL. Accessibility, best practices and SEO assert at >= 0.95 as errors. Performance is a warning until T-062 enforces the budgets. `@lhci/cli` moves to 0.15.x. New routes are added to the `url` list as they land.

**Consequences.** Hooks can be bypassed with `--no-verify`, so CI remains the real gate. Lighthouse reports are uploaded to temporary public storage, which is acceptable because the site is public.

## D-017 · MIT for code, content all rights reserved; Dependabot targets `dev`
Status: Accepted · 2026-10-22 · Resolves F-005

**Context.** The repo is public and serves as a showcase, so the code should be reusable. The written content (biography, case studies), images and CV describe the owner's own work and should not be republished by others. Dependabot opens PRs into the default branch (`main`) unless told otherwise, which would bypass the `dev` integration branch (D-003). GitHub reads `dependabot.yml` from the default branch only.

**Decision.**
- `LICENSE` is the standard MIT text, so GitHub detects it. The README states that `content/`, images and the CV PDF are all rights reserved and not covered by it.
- Dependabot version updates for npm and GitHub Actions run weekly with `target-branch: dev`. Minor and patch npm updates are grouped into one PR. Actions updates are grouped together.
- Dependabot alerts are on. Dependabot security-update PRs stay off, because they always target the default branch. Alerts are handled through a normal task branch into `dev`.

**Consequences.** Scheduled updates start once this config reaches `main` (Phase 0 release, `v0.1.0`). Dependabot PRs go through the light `dev` CI and are merged by hand, not by `/finish-task`. Dependabot commit messages use `chore(deps)` and `ci` prefixes to fit Conventional Commits.

## D-018 · Content and contact policy from the owner's answers
Status: Accepted · 2026-10-23 · Resolves F-001, F-003, F-004, F-006, F-008 · Supersedes the contact list and the "phone never published" line in D-009, and the "until F-001" clause in D-011

**Context.** The owner answered the open content questions in `docs/FEEDBACK.md`.

**Decision.**
- Clients are never named. Case studies use generic descriptions ("a regional airline") and invented data only: no logos, no screenshots of real systems (F-001).
- No custom domain: `https://portfolio-4q6.pages.dev` is the canonical production origin (F-003). The CV keeps the Gmail address.
- Public contact on the site's pages is the email address (`mailto:`) and the GitHub profile only. No LinkedIn link and no phone number on the pages (F-004).
- No headshot: the About section is typographic (F-006).
- The owner keeps their own copy of the CV in the git-ignored `private/` folder (F-007, T-026). The downloadable CV is a PDF the owner adds to `public/` for T-024 (F-008). It may include the owner's phone number, by the owner's choice; this is the only place the number appears.

**Consequences.** Task titles for case studies are generic. T-071 becomes "Canonical production URL". T-024 drops LinkedIn. `REQUIREMENTS.md` was updated with the owner's approval to match. Client names remain in earlier Git history.

## D-019 · Design token contract, accent and type pairing
Status: Accepted · 2026-10-23 · Resolves the token part of F-002 (fonts are loaded in T-011)

**Context.** F-002 delegated the accent and type pairing to Claude, with soft radii (12-16 px). T-010 requires that no component uses raw color, font or radius values, and D-005 requires skins to work through tokens only.

**Decision.**
- `app/styles/tokens.css` holds the contract (documented in its header). Raw custom properties on `:root` (`--surface`, `--radius-card`, ...) are the only values skins and themes override. `@theme inline` maps them to Tailwind utilities (`bg-surface`, `text-fg-muted`, `rounded-lg`, `px-gutter`, `max-w-page`).
- Tailwind's default colors, font families, radii, text sizes and easings are reset (`--color-*: initial`, ...), so stock values such as `bg-red-500` do not exist. `tests/unit/tokens.test.ts` fails on hex colors, color functions and arbitrary color/font/radius utilities outside `tokens.css` and `skins/`.
- Colors are written in OKLCH. Neutrals are a warm off-white paper with cool ink; dark mode is a cool near-black. The accent is a vermilion (`oklch(0.53 0.19 32)` light, `oklch(0.74 0.15 38)` dark), editorial yet modern, and distinct from the blue focus ring. Every text pair meets WCAG AA in both themes; ratios are listed in the file header.
- Type pairing: Fraunces (variable serif with an optical-size axis) for headings, Geist for body text and UI, Geist Mono for code and metrics. Until T-011 self-hosts them, system fallbacks apply.
- Radius: tags 6 px, controls 10 px, cards 14 px, large surfaces 20 px. Type sizes from `text-2xl` up are fluid with `clamp()`. Motion durations are tokens that drop to 0 ms under `prefers-reduced-motion`.
- Dark mode follows `prefers-color-scheme` unless `data-theme` is set on `<html>`; T-014 sets it before paint.

**Consequences.** Adding a color, font or radius means adding a token here first. The Systems skin (Phase 4) overrides the same properties under `[data-skin="systems"]`. The contrast ratios in the header must be rechecked whenever a color value changes.

## D-020 · Editorial skin: self-hosted variable fonts, skin files and a style tile
Status: Accepted · 2026-10-23 · Refines D-019 · Editorial skin superseded by D-038

**Context.** T-011 builds the default skin. Fonts must be self-hosted (no third-party requests, D-014) and fast to load, and the skin must be checkable for contrast in both themes.

**Decision.**
- Fonts come from `@fontsource-variable/fraunces`, `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` (5.3.0, OFL-1.1, pinned). They ship only CSS and `woff2` files, no JavaScript. Only the weight axis is used: Fraunces' latin file is 37 kB, against 67 kB with the optical-size axis. `@font-face` rules use `font-display: swap` and per-subset `unicode-range`, so a visitor downloads only the subsets a page needs. The latin Geist and Fraunces files are preloaded from `root.tsx`; Geist Mono is not.
- Skin values (colors, fonts, radii) live in `app/styles/skins/<name>.css`; `tokens.css` keeps the skin-neutral contract, spacing and motion. Theme selectors also match nested elements (`[data-theme="dark"]`), so a section can show the other theme.
- `tests/unit/skins.test.ts` reads each skin file, checks that every color token is set in both themes, that the two dark blocks (system preference and explicit choice) match, and that text pairs meet WCAG AA (focus ring >= 3:1).
- `/style-tile` is an internal reference page (prerendered, `noindex`) showing colors, the type scale, buttons and a work row side by side in both themes. Its copy lives in `content/style-tile.ts`. `app/lib/seo.ts` builds per-route title, description, canonical and Open Graph tags from the production origin.

**Consequences.** The two preloaded latin fonts weigh about 66 kB (Geist 29 kB, Fraunces 37 kB); Geist Mono (23 kB) loads only where it is used. A new skin adds a file in `skins/` and an entry in the skin test. The style tile stays out of the sitemap; T-013 rebuilds it from the primitives.

## D-021 · Page shell in the root layout; "last updated" from the last commit
Status: Accepted · 2026-10-23

**Context.** T-012 adds the header, footer, skip link and page container. Error pages render inside the root `Layout`, and the footer needs a "last updated" date that is the same in the prerendered HTML and after hydration.

**Decision.**
- `root.tsx` `Layout` renders the skip link, `SiteHeader`, one `<main id="main" tabindex="-1">` and `SiteFooter` around every route and the error boundary. Routes render their content without their own `<main>`.
- The footer date is the last commit's date (`git log -1 --format=%cI`), injected by Vite `define` as `__LAST_UPDATED__`, with the build date as a fallback when Git history is missing. It is shown as the calendar day written in that string (the author's local day), independent of the visitor's time zone.
- Layout helpers are two Tailwind utilities in `base.css`: `page-container` (centered, max `--width-page`, side gutters) and `page-grid` (4/8/12 columns). Focus rings come from the `focus` token on `:focus-visible`. Under `prefers-reduced-motion: reduce`, transitions, animations, smooth scrolling and view transition animations are switched off globally.
- The main navigation lists Work, About and Lab (REQUIREMENTS section 5). Until T-022, T-023 and the Lab tasks add those routes, the links lead to the not-found page.

**Consequences.** Docs-only commits also move the "last updated" date. Cloudflare Pages builds from a Git checkout, so the commit date is available there.

## D-022 · UI primitives without class-merging dependencies
Status: Accepted · 2026-10-23

**Context.** T-013 adds the primitives every page is built from: Button, ButtonLink, Link, Tag/TagList, Section, Metric/MetricList, Prose and WorkRow. Libraries such as `clsx`, `tailwind-merge` or `class-variance-authority` are common for this, and `@tailwindcss/typography` for long-form text.

**Decision.**
- Variants are plain objects of class strings, joined by a five-line `cx()` (`app/lib/cx.ts`). A `className` passed to a primitive is appended, not merged, so primitives avoid conflicting defaults (for example, `Section` sets no outer spacing). No new dependency.
- `Anchor` decides between client-side navigation and a plain `<a>`: site paths without a file extension use React Router's `Link`; external URLs, `mailto:`, `#hash` links and files such as `/cv.pdf` stay plain anchors. Links open in the same tab.
- `WorkRow` is one tab stop: the title link is stretched over the card with a pseudo-element, the card draws the focus ring (`has-[a:focus-visible]`), and the "Read the case study" cue is hidden from assistive tech so the link is named by the project title.
- `Metric` uses a description list with the label first in the DOM and the value shown first on screen.
- `Prose` styles live in a `.prose-content` class in `base.css` that uses tokens, instead of `@tailwindcss/typography`, so skins can restyle long-form text with CSS only (D-005).
- The style tile shows every primitive in both themes and names it; it is the usage reference.

**Consequences.** Overriding a primitive's default class requires a variant or a prop, not a conflicting `className`. Revisit `tailwind-merge` only if that becomes a real constraint (it is about 7 kB gzipped).

## D-023 · Pre-paint theme script and light/dark toggle
Status: Accepted · 2026-10-23 · Refines D-005

**Context.** T-014 must avoid a flash of the wrong theme on a static, prerendered site, where the HTML cannot know the visitor's choice, and must keep working when storage is blocked.

**Decision.**
- A small inline script (`themeScript` in `app/lib/theme.ts`) runs in `<head>` before the stylesheets. It reads `localStorage["theme"]` in a `try/catch`, falls back to `prefers-color-scheme`, and sets `data-theme` on `<html>`. It is a string, not a bundled function, so the bundler cannot rewrite it. `<html>` has `suppressHydrationWarning` because the attribute differs from the prerendered HTML by design. T-041 extends the same script with `data-skin`.
- Without JavaScript, the skin CSS still follows the system preference (D-020).
- Only an explicit choice is stored. While nothing is stored, an open page follows changes to the system preference.
- The toggle is a `<button aria-pressed>` named "Dark theme", in the header after the navigation. Its sun/moon icon follows `data-theme` through CSS, so it is correct before hydration; the button is disabled until hydration (`useSyncExternalStore` with a `null` server snapshot).
- Switching uses `document.startViewTransition` with a 200 ms cross-fade of the root (`--duration-base`). It is instant when the API is missing or the visitor prefers reduced motion.

**Consequences.** A Content Security Policy (T-025) must allow this inline script by its `sha256` hash, recomputed whenever `themeScript` changes. A visitor whose storage is blocked keeps a choice until the next reload.

## D-024 · Autonomous phase runs with `/run-phase`
Status: Accepted · 2026-10-29 · Refines D-012

**Context.** Running a phase took one `/start-task`, `/finish-task` and `/clear` per task, plus the owner answering every question. The owner wants a phase to run unattended, with a clean context per task.

**Decision.**
- `/run-phase` is a thin orchestrator. It picks each eligible task and runs it in a fresh general-purpose subagent, which follows `/start-task` and `/finish-task` with `--auto`. A command cannot clear its own chat, so a new subagent per task is how each task gets a clean context; the orchestrator keeps only each task's RESULT block.
- In `--auto` mode, questions are answered with the recommended option and logged as `auto (recommended)` FEEDBACK items and in the PR notes. Claims about the owner's work stay placeholders. Hard stops (client names, confidential or personal data, secrets, `docs/REQUIREMENTS.md`, contradicting a decision) block the task instead.
- Draft verification PRs from the task branch into `dev` or `main` are pre-authorized and closed unmerged (as in F-009).
- Owner review tasks are parked in `review` and Owner action tasks are parked as `blocked`; later tasks that depend on a parked task are skipped. A failed task stops the run, with no automatic retry.
- `/finish-phase` runs automatically only when every task of the phase is `done` and nothing was parked or failed; its own merge conditions still apply.

**Consequences.** Auto-answered choices land without the owner seeing them first, so the owner reviews `auto (recommended)` FEEDBACK items after a run. A phase release can deploy to production without an owner in the loop when every check is green.

## D-025 · Content layer: build-time Zod validation, MDX through `@mdx-js/rollup`
Status: Accepted · 2026-10-30 · Records the MDX check asked for in D-007

**Context.** T-020 needs typed, validated content that fails the build when it is wrong, case studies written in MDX with frontmatter, and a prerender list derived from content. D-007 asked to verify that an MDX plugin works with React Router framework mode (React Router 8.5, Vite 8 with Rolldown).

**Decision.**
- `content/schema.ts` holds Zod 4 schemas for the profile, the experience timeline and the project frontmatter. Objects are strict (unknown keys fail, which catches typos), with no transforms or defaults, so the data the app renders is exactly the data that was validated. Slugs are the MDX file names and must be lowercase kebab-case; project `order` values must be unique.
- Validation runs at build time only. `react-router.config.ts` sets `prerender` to a function that calls `content/load.ts`: it validates `profile.ts` and `experience.ts`, reads each `content/projects/*.mdx` file's YAML frontmatter with `yaml`, validates it, and returns the static paths plus `/work/<slug>` for every project. Any error stops `npm run build` with the file and field named. The app imports only the inferred types (`import type`), so Zod is not in the client bundle; `profile.ts` and `experience.ts` use `satisfies` for compile-time checks.
- MDX: `@mdx-js/rollup` 3.1 with `remark-frontmatter` and `remark-mdx-frontmatter` (YAML exported as `frontmatter`), added before the React Router plugin with `enforce: "pre"` in a shared `mdx.config.ts` used by Vite and Vitest. **Verified:** it works in framework mode with `ssr: false` and prerendering; each case study page is prerendered with its MDX body, title and Open Graph tags. The compiled MDX imports only `react/jsx-runtime`, so it adds no client dependency. A unit test checks that the MDX pipeline and `content/load.ts` read the same frontmatter.
- `app/lib/projects.ts` loads the MDX modules with `import.meta.glob` (eager), so case study pages need no `loader` and client-side navigation makes no data request. A minimal `/work/:slug` route ships with T-020 because prerendering a path that matches no route fails the build; T-022 builds the full template on it.
- New dev dependencies (build time only, nothing shipped to the browser): `zod`, `yaml`, `@mdx-js/rollup`, `remark-frontmatter`, `remark-mdx-frontmatter`, `@types/mdx`. `tsconfig.json` allows `.ts` extensions in imports so `vite.config.ts` can import `mdx.config.ts` in the form Vite's future native config loader requires.

**Consequences.** Adding a case study means adding one MDX file; its page is prerendered automatically. All case study bodies are in the `/work/:slug` route chunk, which is fine for four projects; T-062 can split them with a lazy glob if they grow. Unknown `/work/*` slugs render the generic error page until T-025 adds the 404 page. When a client-side feature needs Zod at runtime (the CRUD drawer, T-052), it moves to `dependencies`.

## D-026 · Work index and case study template
Status: Accepted · 2026-10-30 · Refines D-025

**Context.** T-022 extends the minimal `/work/:slug` route of T-020 into the full case study template and adds the `/work` index. REQUIREMENTS section 5 lists a summary header, problem, what I owned, key decisions, outcome, captioned images and a next-project link. The case study texts and images are written later (T-030 to T-034).

**Decision.**
- Page titles and labels for both routes live in `content/work.ts`, validated by `workSchema` with the other content at build time. Project facts stay in the MDX frontmatter. `/work` is a static prerender path.
- Sections are the `##` headings of each MDX body, not frontmatter fields, so each case study can phrase and order them and place figures inside them. The project files carry the four REQUIREMENTS sections as placeholders (F-014).
- Captioned images use `Figure` (`<figure>`, `<img>` with required `width`, `height` and `alt`, and `<figcaption>`), lazy-loaded unless `priority` is set. The route passes it to the MDX content through `components`, so MDX files use `<Figure ... />` without importing it. Styles live in `.prose-content` so skins can restyle them (D-005).
- "Next project" follows display order and wraps from the last project to the first, so every case study ends with a next step. It sits in a `nav` landmark, and its link is named "Next project: <title>".
- Case studies set `og:type` to `article` (`pageMeta` takes an optional `type`); other pages stay `website`.

**Consequences.** Adding a component for case studies means adding it to the route's MDX `components` map. Figures need the AVIF/WebP files from the image pipeline (T-034) before any case study uses them.

## D-027 · 404 page as a prerendered 404.html; `_headers` with a hashed CSP
Status: Accepted · 2026-10-30 · Refines D-002, D-023

**Context.** T-025 needs unknown URLs to return the 404 page with a 404 status on Cloudflare Pages, long caching for hashed assets, and sensible security headers. Without a top-level `404.html`, Pages treats the site as a single-page app and answers every unknown URL with the home page and a 200 status (checked on the `dev` preview before this change). React Router refuses to prerender a path that answers 404, and the prerendered HTML carries inline scripts: the pre-paint theme script (D-023) and React Router's hydration and scroll restoration scripts, which differ per page.

**Decision.**
- A catch-all route (`*`, `app/routes/not-found.tsx`) renders the 404 page. `/404` is in the prerender list; the `buildEnd` hook in `react-router.config.ts` runs `scripts/finalize-build.ts`, which moves `404/index.html` to `build/client/404.html`. Pages serves that file with a 404 status for any URL that matches no file. In the browser the catch-all route matches the same URL, so the page hydrates cleanly and client-side navigation to a missing route shows the same page. Copy lives in `content/not-found.ts` (`notFoundSchema`). The page is `noindex` and has no canonical or Open Graph tags, since it is served at whatever URL was requested.
- Unknown case study slugs render the same `NotFound` section from `/work/:slug` (same markup as `404.html`, so hydration matches). A `data()` thrown from a component is not a route error response, so the old code showed the generic error page. The root error boundary renders `NotFound` for 404 responses and a generic error page with copy from `content/not-found.ts` otherwise.
- `public/_headers` sets, for `/*`: a Content-Security-Policy (`default-src 'self'`, `script-src 'self'` plus hashes, `style-src 'self'`, `img-src 'self' data:`, `font-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`), HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that turns off camera, microphone, geolocation, payment and USB, and `Cross-Origin-Opener-Policy: same-origin`. `/assets/*` (Vite's content-hashed JavaScript, CSS and fonts) gets `Cache-Control: public, max-age=31536000, immutable`; HTML keeps Pages' default revalidation.
- The CSP's script hashes are computed at build time: `finalize-build.ts` hashes (sha256) every inline script in the prerendered HTML and replaces a placeholder in `_headers`. No `'unsafe-inline'`, and no hash to recompute by hand when `themeScript` changes. The build fails if the placeholder is missing, no inline script is found, a line exceeds Cloudflare's 2,000-character limit or the file exceeds 100 rules.
- `npm run preview` serves `404.html` as its fallback, like Pages (sirv answers it with a 200 status). Playwright checks the built `404.html` and `_headers`, and replays the CSP on each page type to prove it blocks nothing (hydration, the theme toggle).

**Consequences.** One site-wide policy lists about two hashes per prerendered page; with 16 hashes the CSP line is about 1,100 characters, so roughly 15 more pages fit before the build stops and the policy must move to per-path rules. Anything that loads a third-party script or connects elsewhere (Cloudflare Web Analytics in T-072) must extend `script-src` and `connect-src`. Inline `style` attributes are blocked by `style-src 'self'`; styles stay in CSS (setting styles from JavaScript is unaffected). `__spa-fallback.html` is still emitted but Pages no longer uses it.

## D-028 · TypeScript 7 for type checking, TypeScript 6 kept for the compiler API

Status: Accepted · 2026-10-30

**Context.** The owner asked to move from TypeScript 5.9 to 7.0 (Dependabot PR #27). TypeScript 7 is the native (Go) compiler: its `typescript` package ships `tsc` but no JavaScript compiler API until at least 7.1. typescript-eslint imports that API, and every release (8.72.1, canary 8.72.2-alpha) declares `typescript >=4.8.4 <6.1.0`, so `npm ci` fails on #27 with ERESOLVE. The maintainers say TS 7 support is blocked on a TS 7 API (typescript-eslint#10940, #12518) and point to the side-by-side setup in Microsoft's TypeScript 7.0 announcement.

**Decision.** Follow that setup, with npm aliases and no `overrides`, `--force` or `--legacy-peer-deps`:
- `"typescript": "npm:@typescript/typescript6@^6.0.2"`: the official compatibility package. It re-exports the TypeScript 6 API (and a `tsc6` binary), so typescript-eslint gets a version inside its supported range.
- `"typescript-7": "npm:typescript@^7.0.2"`: the real TypeScript 7 compiler. `npm run typecheck` calls it by path (`node node_modules/typescript-7/bin/tsc`), because the TypeScript 6 package that `@typescript/typescript6` depends on also installs a `tsc` binary and wins the `node_modules/.bin/tsc` link.
- typescript-eslint is the only dependency that imports the compiler API. Vite, Vitest, React Router typegen and MDX do not, so nothing else changes. The tsconfig already uses only options TS 7 accepts (`moduleResolution: bundler`, no `baseUrl`, `esModuleInterop` on, explicit `types`), and the code type-checks cleanly with no changes.

**Consequences.** CI type checking runs on TS 7. Lint type information comes from TS 6, which shares TS 7's type checker logic. Editors that read `node_modules/typescript` find the compatibility package rather than a full TS install, so use the editor's bundled TypeScript (or the TS 7 extension). Once typescript-eslint supports TS 7 (expected after TS 7.1 ships an API), drop both aliases for a plain `"typescript": "^7"` and restore `tsc` in the typecheck script. Dependabot may propose bumping the aliased packages oddly; check what it targets before accepting.

## D-029 · New Cloudflare Pages project `mr-chouman-portfolio`

Status: Accepted · 2026-10-30 · Refines D-006 · Supersedes the origin in D-018

**Context.** The first Pages project was created with an auto-assigned name, so the site lived at `portfolio-4q6.pages.dev`. The owner created a new Pages project by hand to choose the name, and it replaces the old one.

**Decision.**
- The site is hosted by the Pages project `mr-chouman-portfolio`, connected to this repository with the D-006 settings: production branch `main`, `dev` as the staging preview, build command `npm run build`, output `build/client`, `NODE_VERSION=24`.
- The canonical production origin is `https://mr-chouman-portfolio.pages.dev` (`SITE_ORIGIN` in `app/lib/seo.ts`). Staging is `https://dev.mr-chouman-portfolio.pages.dev`. Still no custom domain (F-003).
- The old `portfolio-4q6` project stops building and is retired by the owner once the new one serves production.

**Consequences.** Canonical and Open Graph URLs point at the new origin once this reaches `main` at the next phase release; until then production pages carry the old origin. Earlier mentions of `portfolio-4q6` in DECISIONS and FEEDBACK stay as history. T-071 uses the new origin.

## D-030 · Case study figures: invented-data illustrations, AVIF with WebP fallback, checked at build time

Status: Superseded by D-031 · 2026-10-30 · Refines D-018, D-026 · Resolves F-023

**Context.** T-030 needs 2-4 captioned images in the airline case study, but D-018 rules out screenshots of client systems and the image pipeline (T-034) does not exist yet. CLAUDE.md asks for AVIF/WebP images with explicit dimensions.

**Decision.**
- Case study images are illustrations of typical screens drawn with invented data (crew codes such as "Crew 0142", flight numbers with an "XX" prefix, made-up dates and counts), and each caption says so. Their sources are SVG files in `content/projects/figures/<slug>/`; the served files are WebP and AVIF in `public/images/work/<slug>/`.
- For T-030 the SVGs were rendered to PNG with Playwright's Chromium (site fonts) and encoded once with ffmpeg (`libwebp` quality 85, `libaom-av1` still picture CRF 30, 4:4:4). T-034 replaces these one-off steps with the image script and re-runs it on these sources.
- `Figure` takes an optional `avif` prop and then renders a `<picture>` with an `image/avif` source before the WebP `<img>`.
- `content/figures.ts` checks every `<Figure />` in project MDX at build time (through `content/load.ts`): files under `/images/work/<slug>/`, WebP required and AVIF optional, both present in `public/`, non-empty alt and caption, and `width`/`height` equal to the size read from each file's header.

**Consequences.** A wrong path, a missing file or a stale size fails `npm run build`. No new dependency. Figures must be self-closing JSX with string and integer props so the build-time reader can parse them.

## D-031 · No screenshots or screen illustrations in case studies for now

Status: Accepted · 2026-10-30 · Owner decision · Supersedes D-030

**Context.** T-030 added three illustrations of typical screens drawn with invented data (D-030). The owner decided not to include screenshots in the portfolio for the time being, and illustrations of app screens count as screenshots for this purpose.

**Decision.**
- Case studies ship as text only: no screenshots, cropped or anonymized captures, or illustrations of app screens.
- The T-030 figures, their SVG sources, the AVIF support in `Figure` and the build-time figure check (`content/figures.ts`) are removed. They remain in the history of `task/T-030-airline-crew-case-study` if images come back.
- `Figure` (D-026) stays as it was, unused, so a later decision can add images without changing the template.

**Consequences.** T-030 to T-033 no longer require captioned images. REQUIREMENTS section 5 still lists "captioned images" for `/work/:slug`, and it is not changed without the owner's approval. Open Graph images (T-061) are generated cards, not screenshots, so they are not affected.

## D-032 · Three.js for a rotatable 3D object per case study

Status: Accepted · 2026-10-30 · Owner decision · Refines D-008, D-026 · Follows D-031

**Context.** With no screenshots in the portfolio for now (D-031), the owner wants each case study to show a 3D object standing for the project, which the visitor can rotate through 360 degrees: an airplane for the airline platform. CSS cannot draw a rotatable 3D model, and the site keeps a tight JavaScript budget (REQUIREMENTS section 7).

**Decision.**
- `three` (0.187.0, MIT) draws the objects, with `@types/three` as a dev dependency. It is a renderer, not an animation library: the motion is a few lines of our own code, so D-008 still holds for everything else.
- The models are low-poly and built in code from simple shapes (`app/components/three/models.ts`): an airplane, crates on a pallet, an EV charger with its cable, and a hospital bed. There are no model files, loaders or textures. Each case study's frontmatter names its model and accessible label (`object: { kind, label }`).
- Each model uses three material slots colored from the `--fg`, `--accent` and `--fg-muted` tokens. The colors are read back through a 2D canvas, because tokens may use OKLCH. They are read again whenever `data-theme` or `data-skin` changes on `<html>`, so every skin and theme applies with no per-skin code (D-005).
- `ProjectObject` is in the case study header. Its box reserves its size in the prerendered HTML, so there is no layout shift. After hydration it imports `scene.ts` once the box scrolls into view. Three.js sits in that separate chunk, about 135 kB gzipped, which only `/work/:slug` loads. Frames are drawn only while the object is on screen, the tab is visible and the view has changed.
- Interaction:
  - Dragging or the arrow keys rotate the object; Home resets it. The pitch is clamped to ±35°.
  - It spins slowly when left alone, starting again 3 s after the last input. It does not spin under reduced motion.
  - The box is a focusable `role="img"` with the label as its name and the hint as its description.
  - Without WebGL, the caption says the model cannot be shown and the box leaves the tab order.

**Consequences.** Case study pages load about 135 kB more JavaScript, after first paint. Home and `/work` are unchanged, and Playwright checks that they never request the chunk. A new model means a new builder and a new value in `projectObjectKinds`.


## D-033 · Systems skin: console look from tokens and scoped element styles
Status: Accepted · 2026-10-30 · Refines D-005, D-019, D-020

**Context.** T-040 adds the second skin (D-005). It has to look clearly different from Editorial while keeping the same markup, every token contract (D-019) and WCAG AA in both themes. Its design direction was chosen under `/run-phase` (F-026).

**Decision.**
- `app/styles/skins/systems.css`, imported after `editorial.css`. The look of a well-made admin console: cool neutral greys, a teal accent (`oklch(0.51 0.1 185)` light, `oklch(0.82 0.12 180)` dark), a blue focus ring, Geist for headings and text, Geist Mono for labels, radii of 3/4/6/8 px and a faint 32 px blueprint grid drawn from `--line` behind the page.
- No new font: Geist and Geist Mono already ship with Editorial (D-020).
- Every rule is scoped to `[data-skin="systems"]`. Theme blocks use `[data-skin="systems"][data-theme]` and `[data-skin="systems"] [data-theme]` (and `:root[data-skin="systems"]:not([data-theme="light"])` for the system preference), so they are more specific than Editorial's and a nested `[data-theme]` section keeps the skin.
- Structural styles target elements only (headings, `dd`, the page header and footer, `.prose-content`), never component utility classes: heading tracking and weight, tabular figures, a mono `#` marker before prose `h2` (empty alternative text), a mono non-italic blockquote and solid header and footer bands over the grid.
- `tests/unit/skins.test.ts` runs the color and contrast checks for both skins and fails on any rule in `systems.css` that is not scoped to the skin. `tests/e2e/systems-skin.spec.ts` sets the skin on `<html>` and runs axe on every page in both themes, checks the tokens, fonts and nested themes, and that no page scrolls sideways at 375 px.

**Consequences.** The skin is visible only when `data-skin="systems"` is set; T-041 sets it from storage and `?skin=`, and T-044 moves the e2e checks onto the parameter. Root still preloads Fraunces, which the Systems skin does not use; T-042 handles per-skin font preloading. Contrast ratios are listed in the file header and must be rechecked when a color changes.

## D-034 · Skin mechanism: parameter, stored choice, default, set before the first paint
Status: Accepted · 2026-10-30 · Refines D-005

**Context.** T-041 makes the Systems skin (D-033) reachable: the skin must be applied before the first paint, like the theme (T-014), and be settable from a `?skin=` parameter for shared links and per-skin tests (D-005). Whether the parameter is stored was chosen under `/run-phase` (F-027).

**Decision.**
- `app/lib/skin.ts` holds the skin list (`editorial`, `systems`), the default (`editorial`), the storage key and parameter name (both `skin`), the inline pre-paint script, and the client helpers (`readSkinParam`, `readStoredSkin`, `resolveSkin`, `currentSkin`, `setSkin`, `subscribeSkin`); `app/lib/useSkin.ts` exposes it to React like `useTheme`.
- Order: a valid `?skin=` value, then the stored choice, then `editorial`. A valid parameter is also stored; unknown values are ignored. Every storage access is in try/catch, so blocked storage falls back to the parameter and the default. The script always sets `data-skin`, so the attribute is the single source of truth.
- The theme keeps its own default, the system preference (T-014). `prePaintScript` joins the theme and skin scripts with a semicolon into one inline script in `<head>`, before the stylesheets; its CSP hash is computed by the build (D-027).
- `setSkin` stores and applies at once and notifies subscribers; the switcher and its transition are T-042.

**Consequences.** Shared links with `?skin=` persist the skin for that visitor. The URL keeps the parameter; canonical URLs never include it. T-044 can drive per-skin checks with `?skin=` in a fresh browser context.


## D-035 · Skin switcher: icon button, fonts first, circular View Transitions reveal
Status: Accepted · 2026-10-30 · Refines D-008, D-023, D-033, D-034

**Context.** T-042 adds the header control that switches skins (D-005, D-034). It must be keyboard and screen-reader usable, reveal the new skin with a circle from the control, never paint the new skin with fallback fonts, stay instant under reduced motion or without View Transitions, and work in Chrome, Safari and Firefox. The form of the control and the cross-browser check were chosen under `/run-phase` (F-028, F-029).

**Decision.**
- `SkinSwitcher` (`app/components/layout/SkinSwitcher.tsx`) is a 36 px icon button next to the theme toggle, named "Switch design". With two skins it moves to the next one (`nextSkin`). `aria-describedby` points to a hidden "Current design: Editorial" text, and a polite `role="status"` region announces "Systems design on" after a switch. Like the theme toggle, it is disabled until hydration. Copy lives in `content/site.ts`.
- `switchSkin` (`app/lib/skin.ts`) first calls `loadSkinFonts`: `document.fonts.load` for every family of the target skin (`SKIN_FONTS`), capped at 1 s (`FONT_TIMEOUT_MS`) and never rejecting. Then it sets `data-skin-transition` on `<html>`, calls `document.startViewTransition(() => setSkin(skin))` and, once the transition is ready, animates `clip-path: circle()` on `::view-transition-new(root)` from the button's centre to the farthest viewport corner, using `--duration-slow` and `--easing-standard`. `base.css` turns off the root cross-fade while the attribute is set. With reduced motion or no View Transitions, it calls `setSkin` directly. If a second switch starts while fonts load, only the latest applies. The Web Animations API is not restricted by the CSP's `style-src`, and no library is added (D-008).
- Per-skin preloading (D-033): root.tsx now preloads only Geist, which every skin uses. The pre-paint script adds a `<link rel="preload" as="font">` for each font only the active skin uses (`SKIN_PRELOADS`: Fraunces for Editorial), so Systems visitors no longer download Fraunces up front. The hashed file URL is written into the script at build time, and the CSP hash follows it (D-027).
- `playwright.config.ts` adds Firefox and WebKit projects that run only `tests/e2e/skin-switcher.spec.ts`. `ci-main` installs all three browsers (the cache key includes the browser set). The spec covers the keyboard, the description and announcement, fonts loaded before `data-skin` changes, an unchanged control position, the circular reveal, reduced motion, missing View Transitions and the per-skin preloads.

**Consequences.** A skin added later needs entries in `SKINS`, `SKIN_FONTS`, `SKIN_PRELOADS` and `site.skinSwitcher.names` (a unit test checks the names). The command palette (T-043) can call `switchSkin` without an origin, so the reveal starts from the top centre. The e2e job in `ci-main` takes a little longer because of the two extra browsers.

## D-036 · Command palette: cmdk in a native dialog, loaded on first open
Status: Accepted · 2026-10-30 · Refines D-008, D-035

**Context.** T-043 adds the command palette of REQUIREMENTS §6.3: open with Ctrl/Cmd+K, go to a page or case study, switch design or theme, download the CV; fully keyboard and screen-reader usable and lazy loaded. The task names `cmdk`, which depends on Radix Dialog and is over the ~10 kB gzipped threshold. The build and the trigger were chosen under `/run-phase` (F-030, F-031).

**Decision.**
- Dependency: `cmdk` 1.1.1 (pinned). It brings `@radix-ui/react-dialog` and a few small Radix packages; the palette chunk is about 17.7 kB gzipped. It is imported only by `app/components/layout/CommandPalette.tsx`, which `CommandMenu` loads with `React.lazy` on the first open (and prefetches on hover or focus of the header button). Home's initial JavaScript gains only the small `CommandMenu` component.
- The dialog is a native modal `<dialog>` (`showModal`): it makes the page inert, keeps Tab inside and closes on Escape without extra code. The search field is focused explicitly after `showModal`, because browsers differ on what a dialog focuses first. When the dialog closes (Escape, the shortcut again, a command or a backdrop click), focus returns to the element that had it.
- cmdk provides the combobox (`aria-activedescendant`, `aria-expanded`) and the labelled listbox with grouped options, filtering and arrow-key navigation with wrap-around. Commands: Pages (Home and the header navigation), Case studies (from `~/lib/projects`, already loaded on home), Preferences (`switchSkin` without an origin, so the reveal starts from the top centre as D-035 foresaw, and `setTheme`), Files (the CV, through a temporary download link). Design and theme changes are announced in a polite status region beside the button. Copy lives in `content/site.ts`.
- The header button is an icon button like the theme and design controls, disabled until hydration, with `aria-haspopup="dialog"` and `aria-keyshortcuts="Control+K Meta+K"`. Ctrl/Cmd+K with Shift or Alt is left to the browser.
- No animation is added (D-008); the active option uses an accent left border and the raised surface, from tokens.

**Consequences.** A new page or command is one `Command.Item` and its copy. The e2e spec runs in Chromium only, like the other specs except the skin switcher; Firefox was checked locally. Any later change that adds a status region in the header must keep the e2e locators scoped (the skin switcher spec now targets its own region).

## D-037 · Per-skin QA: one spec over every skin, theme, page and width
Status: Accepted · 2026-10-30 · Refines D-033, D-034

**Context.** T-044 asks for smoke and axe checks per skin through `?skin=`, verified contrast and a visual check at 375, 768 and 1440 px, passing for both skins and both themes. Until now only `tests/e2e/systems-skin.spec.ts` covered the Systems skin, by setting `data-skin` by hand (D-033). The form of the visual check was chosen under `/run-phase` (F-032).

**Decision.**
- `tests/e2e/per-skin.spec.ts` replaces `systems-skin.spec.ts`. For each skin and theme it loads every route (home, `/work`, each case study from `content/projects`, `/about`, `/style-tile`, a 404 path) with `?skin=` in a fresh browser context, the theme coming from the emulated system color scheme, and checks the `data-skin` and `data-theme` attributes, title, h1, header, footer and axe (WCAG 2.2 AA tags).
- Contrast is checked twice: the skin files in unit tests (`tests/unit/skins.test.ts`), and the token values the browser resolves on the built page in e2e, with the same helper (`tests/unit/helpers/contrast.ts`, which now also reads the minified `oklch(95% ...)` form).
- Layout at 375, 768 and 1440 px: no sideways scroll, and the header and h1 stay inside the viewport, on every page in every skin and theme. The visual check is a review of full-page screenshots by eye when the skins change; no screenshot baselines are committed, because font rendering differs between machines and CI.
- The spec keeps its own skin list, since Playwright cannot import `app/lib/skin.ts` (it imports a font through Vite's `?url`); a test compares it with the list in the built pre-paint script.

**Consequences.** A new skin is added to the spec's list (the drift test fails otherwise) and gets the whole matrix. A new route is added to its route list. The spec runs in Chromium only, in `ci-main`.

## D-038 · One design (Systems) with a six-color accent palette and a floating header
Status: Accepted · 2026-10-30 · Supersedes D-005 and the Editorial skin of D-020 · Changes D-033 to D-037

**Context.** After Phase 4 the owner judged the Systems skin much better than Editorial and asked for it to be the only design. Instead of a design switcher, visitors choose an accent color from a floating palette on the left of the page, and the header becomes a floating bar that is always visible. The owner chose the mobile behavior of the palette, the header style and the scheduling (start of Phase 5).

**Decision.**
- **One design.** Systems is the site's only look, in light and dark. The Editorial skin, its fonts (Fraunces), the skin switcher, the circular skin reveal, `?skin=` and the skin commands of the command palette are removed. Styles move from `[data-skin="systems"]` scopes into the base tokens and styles, so there is no skin layer left. The light/dark theme and its cross-fade stay.
- **Accent palette.** Six accents: green (the current Systems teal-green, default), purple, gold, red, blue and orange. Each is a set of accent tokens per theme, tuned so every accent text and UI pair meets WCAG 2.2 AA in light and dark (gold and orange need darker shades in light). Set as `data-accent` on `<html>` by the pre-paint script, from `?accent=` first, then the stored choice (`localStorage`, try/catch), then green; the parameter is stored like `?skin=` was (D-034). Components keep using the semantic accent tokens only.
- **Floating palette.** Fixed to the left edge, vertically centred, above content. From tablet width up it shows the six swatches in a vertical rail; on phones it collapses to one swatch showing the current accent that opens the six. It is a labelled radio group: keyboard reachable, arrow keys move between colors, the choice is announced, and each swatch has a text name (copy in `content/`). It never covers page content at 375 px.
- **Floating header.** A detached, rounded bar inset from the screen edges with a small gap at the top, on a raised surface with a subtle shadow from tokens, fixed and always visible while scrolling. Pages reserve its height so nothing hides under it, and `scroll-padding-top` keeps anchor and focus targets visible.
- The command palette gets one command per accent instead of the design command.

**Consequences.** Less CSS and font weight on every page. Per-skin tests (D-037) become per-theme tests plus a contrast check per accent and theme. A second design is out of scope for v1. The style tile shows the accents instead of skins.

## D-039 · One design in the base styles; end-to-end tests in Chromium only
Status: Accepted · 2026-10-30 · Implements D-038 · Changes D-020, D-035, D-037

**Context.** T-045 makes Systems the only design (D-038). Its values were scoped to `[data-skin="systems"]` in `app/styles/skins/systems.css`, next to the Editorial skin, and the Firefox and WebKit Playwright projects existed only for the skin switcher (D-035).

**Decision.**
- Colors, fonts and radii live in `app/styles/tokens.css`, the only file allowed raw values: fonts and radii on `:root`, then the light, dark (system preference) and dark (explicit) color blocks with their contrast ratios. Theme selectors still match any element, so a section can show the other theme. The Systems element styles (blueprint grid on `html`, tabular numbers, heading weight and tracking, selection, solid header and footer, the prose `#` heading marker, mono blockquote and accent list markers) move unscoped into `base.css`. `app/styles/skins/` is gone.
- `base.css` imports the Geist and Geist Mono Fontsource packages; `@fontsource-variable/fraunces` is uninstalled. `root.tsx` still preloads the latin Geist file.
- The pre-paint script is the theme script alone (`themeScript`); `app/lib/skin.ts`, `useSkin`, the switcher, its circular reveal and the palette's design command are deleted. The 3D object colors follow `data-theme` only.
- `tests/unit/theme-tokens.test.ts` (was `skins.test.ts`) checks tokens.css; `tests/e2e/per-theme.spec.ts` (was `per-skin.spec.ts`) runs every page in both themes and checks that the build ships no skin layer and no Fraunces file.
- Playwright runs in Chromium only, and `ci-main` installs only Chromium (F-033). The theme cross-fade has an instant fallback and is unit tested.

**Consequences.** A visitor who stored a `skin` value keeps a harmless, unused `localStorage` key. Pages render pixel for pixel as the Systems skin did, apart from the removed header button (checked by screenshot comparison against `dev` with `?skin=systems`). Cross-engine e2e can come back as a project in `playwright.config.ts` if a later feature needs it.

## D-040 · Accent tokens per theme through `data-accent`, set before the first paint
Status: Accepted · 2026-10-30 · Implements D-038

**Context.** T-046 adds the six accents of D-038 (green default, purple, gold, red, blue, orange). Each must meet WCAG 2.2 AA in both themes, apply before the first paint, and leave components on the semantic `accent` tokens. Theme selectors also match nested elements (D-039), so a section in the other theme must keep the page's accent. The shades and the palette commands were chosen under `/run-phase` (F-035, F-036).

**Decision.**
- `tokens.css` has one block per accent, `[data-accent="<name>"]` (green also on `:root`, first, as the default), setting two raw values: `--accent-light` and `--accent-dark`. The theme blocks set `--accent: var(--accent-light)` or `var(--accent-dark)`; `--accent-fg` stays one value per theme. A nested `data-theme` section re-resolves `--accent` from the inherited pair, so it keeps the page's accent in its own theme.
- `app/lib/accent.ts` holds the accent list, the `?accent=` parameter, `localStorage` (try/catch) and a small store (`setAccent`, `subscribeAccent`, `useAccent`), with the order of the pre-paint script: parameter (stored when valid), stored choice, green. `prePaintScript` joins the theme and accent scripts in one inline `<head>` script, so there is no flash on reload. A switch changes only color tokens and runs without a transition.
- Accent names live in `content/site.ts` (`accents`), in the order of `ACCENTS`; a unit test keeps both in step. The command palette has one command per accent (F-036). 3D objects also redraw when `data-accent` changes.
- `tests/unit/theme-tokens.test.ts` checks every accent with both themes (accent as text on both surfaces, `accent-fg` on the accent); `tests/e2e/accent.spec.ts` checks the first frame, the parameter, the contrast the browser resolves for every accent and theme, and the palette command.

**Consequences.** A new accent is one `tokens.css` block, one entry in `ACCENTS`, one name in content and one in the e2e list. Swatches that show another accent than the current one (T-047) cannot reuse `--accent` on a nested `data-accent` alone, because `--accent` is resolved where the theme is set; they need the theme on the swatch too, or their own selectors.

## D-041 · Floating accent palette: native radios, a phone tab and reserved left room
Status: Accepted · 2026-10-30 · Implements D-038

**Context.** T-047 adds the floating palette of D-038: fixed to the left, vertically centred, a rail of six swatches from tablet width up and one swatch that opens them on phones; a labelled radio group with arrow keys and an announcement, never covering content at 375, 768 and 1440 px. At 375 and 768 px the page gutter (16 to 23 px) is narrower than any usable control. The form of the phone control and the way content stays clear were chosen under `/run-phase` (F-037, F-038).

**Decision.**
- `app/components/layout/AccentPalette.tsx`, rendered once in `root.tsx` right after the header (so the keyboard reaches it after the header controls). It is a `div role="radiogroup"` named "Accent color" holding six native radio inputs (visually hidden) inside round swatch labels: the browser provides one tab stop, arrow keys that move and choose, and the checked state; each swatch has its name as text (`content/site.ts`), a check mark on the current accent (not color alone) and the focus ring on the swatch through `has-focus-visible`. A polite status message says "<Name> accent on". Controls are disabled until hydration, like the other preferences.
- Phones (below 48rem): a 24 x 48 px tab flush with the left edge, filled with the current accent and named "Accent color: <Name>", with `aria-expanded` and `aria-controls`; it shows the rail beside it. Escape closes it and returns focus to the tab; a press outside or focus moving elsewhere closes it; choosing does not, so arrow keys keep working.
- Swatches carry their own `data-accent`; `.accent-swatch` in `base.css` paints `--accent-light` or `--accent-dark` for the page's theme (D-040 consequence).
- `--space-rail` (2rem on phones, 3.25rem from 48rem) in `tokens.css` is the room kept free on the left. `page-container`'s start padding is the larger of the gutter and what is still missing once the auto margin is counted, so wide screens are unchanged and narrow ones start content after the palette.
- `tests/unit/accent-palette.test.tsx` covers the group, choice, storage, announcement, tab and closing rules; `tests/e2e/accent-palette.spec.ts` checks every page at 375, 768 and 1440 px (palette right edge never past the content's left edge, no sideways scroll), the centred fixed position, the phone flow, keyboard and focus ring, swatch colors per theme and axe.

**Consequences.** Content on phones is 16 px narrower and on tablets about 29 px narrower. A layout that does not use `page-container` must keep its own content clear of `--space-rail`. The open phone rail sits over the page until closed, like a menu.

## D-042 · Floating header: a sticky bar and a measured scroll padding
Status: Accepted · 2026-10-30 · Implements D-038

**Context.** T-048 turns the header into a detached, rounded bar inset from the edges with a gap at the top, on the raised surface with a subtle shadow from tokens, always in view while scrolling. Anchor and focus targets must never end up under it, the skip link and keyboard order must keep working, and nothing may shift. At 375 px the bar wraps to two rows (about 120 px), from about 640 px it is one row (about 72 px). The positioning and the way the offset is known were chosen under `/run-phase` (F-039).

**Decision.**
- The `<header>` is `position: sticky` (`.site-header` in `base.css`) with `top` and `margin-top` set to `--space-header-gap` (0.75rem), z-index 30 (below the accent palette at 40 and the skip link at 50). Sticky keeps it in the flow, so the page starts below it as before and hydration moves nothing. Its box is transparent and `pointer-events: none`; the bar inside `page-container` is `pointer-events-auto`, `rounded-xl`, `border-line`, `bg-surface-raised` and `shadow-raised`.
- `shadow-raised` is a new token: `@theme inline` resets the `shadow-*` namespace and maps `--shadow-raised` to `--elevation-raised`, set in each theme block (a deeper, darker shadow in dark).
- `useHeaderOffset` measures the bar with a `ResizeObserver` and writes `--header-height` on `<html>`; `html { scroll-padding-top: calc(var(--header-height) + 2 * var(--space-header-gap)) }`. A CSS fallback (7.5rem, 4.5rem from 40rem) covers the page before hydration. Writing a custom property never changes layout.
- `tests/e2e/floating-header.spec.ts` checks every page at 375, 768 and 1440 px in both themes (rounded, shadowed, inset, same place after scrolling to the end, controls usable), anchor and focus targets landing below the bar, the published height, layout shift and the skip link above the bar.

**Consequences.** Content scrolls behind the bar and shows in the gap above it, as with any floating bar. A hard-coded offset would break on zoom or wrapped labels; the measured one follows them. Other surfaces that float over the page can reuse `shadow-raised`.

## D-043 · Accent and header QA: one spec over every accent, theme, page and width
Status: Accepted · 2026-10-30 · Extends D-037, D-040, D-041, D-042

**Context.** T-049 asks for smoke and axe checks per theme, contrast per accent and theme on the built page, the layout at 375, 768 and 1440 px with the floating header and accent palette, and a visual check of every accent, passing for all six accents in both themes. `per-theme.spec.ts` covered both themes with the default accent only; the accent, palette and header specs each checked their own part. The width of the matrix was chosen under `/run-phase` (F-040).

**Decision.**
- `tests/e2e/per-accent.spec.ts` loads every route with `?accent=` in a fresh context for each accent and theme (theme from the emulated color scheme) and checks the `data-theme` and `data-accent` attributes, title, h1, header, footer, the checked palette radio and axe (WCAG 2.2 AA tags).
- Contrast per accent and theme is checked on the tokens the browser resolves, on the page and inside the style tile's nested light and dark sections, with the shared helper (`tests/unit/helpers/contrast.ts`).
- Layout per accent, theme and width on every route: no sideways scroll, the header bar inset inside the viewport, the h1 inside it, exactly one visible palette control, left of the content and below the header bar.
- The spec keeps its own accent list (Playwright cannot import `app/lib/accent.ts`); a test compares it with the list in the built pre-paint script.
- The visual check stays a by-eye review of screenshots when accents, the header or the palette change; no baselines are committed (D-037).

**Consequences.** A new accent is added to the spec's list (the drift test fails otherwise) and gets the whole matrix; a new route is added to its route list. The spec adds 157 tests (about 2.5 minutes locally) to the Chromium e2e run in `ci-main`.

## D-044 · Lab mock data: seeded in-memory records behind a fake async endpoint
Status: Accepted · 2026-10-30 · Extends D-002

**Context.** T-050 asks for a typed mock data layer with pagination, sorting and filtering for the `/lab` demo, with no runtime server (D-002) and seeded fake records, from static JSON or MSW. The choice was made under `/run-phase` (F-041).

**Decision.**
- Records are generated in TypeScript (`app/lib/lab/records.ts`) from a seeded mulberry32 PRNG and a fixed base date, not committed as a JSON file and not dated from "now", so the data is the same on every build, prerender and test run. They describe an invented equipment inventory (assets, sites, categories, statuses): no people, customers, orders or client names. The record vocabulary is demo data, not site copy, so it stays out of `content/`.
- Queries are a pure function (`app/lib/lab/query.ts`) shaped like a list endpoint: filters, a sort field and direction with a stable tie-break by id, a page size from a fixed list, a clamped page, and a result with `total` and `pageCount`. The same module parses and writes URL search parameters (defaults omitted, invalid values fall back), so the table (T-051) keeps its state in the URL.
- A small fake client (`app/lib/lab/api.ts`) wraps the queries in promises with a simulated latency, `AbortSignal` support, cloned results and an injectable failure, so the UI exercises real loading, cancel and error paths.
- No MSW: it adds a service worker file, a dependency well over 10 kB gzipped and CSP work, and offers nothing a static site needs over an in-process function.

**Consequences.** No new dependency. Swapping in a real endpoint means replacing `createMockApi` with a `fetch` client of the same shape. T-052 adds create and update to the same client. Changing the seed, count or generator changes the demo data everywhere at once.

