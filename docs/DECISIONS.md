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
Status: Accepted · 2026-10-22

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
