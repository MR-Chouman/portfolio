# CLAUDE.md

Personal portfolio for Mohamad Rida Chouman, a frontend lead who builds large admin and operations platforms.
Static site: **React Router (framework mode, `ssr: false`, prerendered) + Vite + TypeScript + Tailwind CSS v4**, hosted on **Cloudflare Pages**.
This repository is **public**. Never commit anything confidential (see "Never").

## Read before every task

1. `docs/TASKS.md`: current phase, task IDs, statuses, "Done when" criteria
2. `docs/REQUIREMENTS.md`: what the site must be
3. `docs/DECISIONS.md`: why things are the way they are (do not contradict without adding a new entry)
4. `docs/FEEDBACK.md`: open questions and review notes that may block or change a task

## Commands

```
npm run dev         # dev server
npm run build       # prerendered static output in build/client
npm run preview     # serve build/client on :4173
npm run lint
npm run typecheck
npm run test        # Vitest
npm run test:e2e    # Playwright (builds and serves the site itself)
```

Node version is pinned in `.nvmrc`. Before opening any PR: `lint`, `typecheck`, `test`, `build` must pass.

## Git workflow

- Branches: `main` (production, deployed by Cloudflare) <- `dev` (integration/staging) <- `task/T-012-short-slug`.
- Never commit or push directly to `main` or `dev` (the only pushes allowed are your task branch and version tags). Never force-push.
- Merging is done only by `/finish-task` (merge commit into `dev`) and `/finish-phase` (merge commit into `main`, then tag), and only under the conditions written in those commands (D-012). Never merge any other PR, and never merge when a check fails, a conflict is non-trivial, or a review comment is unresolved.
- Start a task: branch from an up-to-date `dev`. Open the PR **into `dev`**; it is merged with a merge commit and the branch is kept (D-013). Never delete branches.
- End of a phase: open a PR `dev` -> `main`; it is merged with a merge commit and tagged (`v0.N.0`, final launch `v1.0.0`).
- Commits and PR titles use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`). Because task branches are merged with all their commits (D-013), every commit must follow this and describe a real step: no `wip` or bare `fix` commits.
- PR bodies follow `.github/pull_request_template.md` (task) or `.github/PULL_REQUEST_TEMPLATE/phase.md` (phase).
- Update `docs/TASKS.md` (and DECISIONS/FEEDBACK when relevant) **in the same PR** as the work.
- Slash commands: `/start-task` (picks the next eligible task from `docs/TASKS.md`; an ID such as `T-012` overrides the choice), `/finish-task` (verify, PR, wait for CI, merge into `dev`), `/finish-phase` (full checks, PR, merge into `main`, tag).
- Tasks marked **Owner review** in `docs/TASKS.md` are never auto-merged: open the PR, wait for CI, then stop for my review.

## Structure

```
app/
  root.tsx            # html shell, pre-paint theme/skin script
  routes.ts           # route config
  routes/             # route modules (home, work, work.$slug, about, lab)
  components/         # ui/, sections/, lab/
  lib/                # skin.ts, content loaders, seo helpers
  styles/             # tokens.css, base.css, skins/<name>.css
content/              # profile.ts, experience.ts, projects/*.mdx, schema.ts (Zod)
public/               # cv PDF, images, favicons, _headers
tests/                # unit/, e2e/
docs/                 # REQUIREMENTS, TASKS, DECISIONS, FEEDBACK
```

## Conventions

- TypeScript strict. No `any`. No `@ts-ignore` without a comment explaining why.
- Styling uses Tailwind utilities that reference **semantic tokens** (`bg-surface`, `text-fg`, `border-line`, `text-accent`). No hard-coded colors, fonts, or radii in components.
- **Skins are CSS-only over one DOM** (D-005). Never render different markup or components per skin; use `[data-skin]` selectors, tokens, CSS grid and container queries.
- All copy lives in `content/`, validated by Zod at build time. Pages never hard-code copy.
- Accessibility is a requirement, not polish: semantic HTML, visible focus, keyboard reachable, `prefers-reduced-motion` respected, WCAG 2.2 AA contrast in every skin and theme.
- Performance: images have width/height and use AVIF/WebP. Do not add a dependency over ~10 kB gzipped, or any animation library (D-008), without a DECISIONS entry.
- Every new route sets its own `meta` (title, description, canonical, Open Graph).
- Write tests with the code: unit tests for logic and components, Playwright smoke tests for routes.

## Never

- Commit secrets, tokens, `.env` files, or personal phone/address details.
- Add client-confidential material: real patient, crew, customer or order data, real screenshots, internal URLs. Use invented data or cropped, anonymized visuals.
- Name a client anywhere in content or docs: generic descriptions and invented data only (D-018).
- Commit anything from `private/` (git-ignored; holds the owner's full CV).
- Edit `docs/REQUIREMENTS.md` without asking me first.
- Install dependencies silently: mention each new one in the PR and, if it is a real choice, in DECISIONS.

## When unsure

If a task is ambiguous or blocked by an open FEEDBACK item, add a note to `docs/FEEDBACK.md` and ask me. Do not guess on design direction, copy claims, or anything affecting what is published about my work.
