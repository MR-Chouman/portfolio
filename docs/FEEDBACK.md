# FEEDBACK

Questions, review notes and requested changes. Keep it short and actionable. This file is public: no confidential or personal information.

## Lifecycle

1. **open**: new item. Add it under "Open" with an ID, date, source and what it blocks.
2. **triaged**: turned into a task (`-> T-xxx`) or a decision (`-> D-xxx`), or explicitly rejected with a reason.
3. **resolved**: the task/decision is done. Move the item to "Resolved" with the link and date.

Item format: `F-001 · status · date · source (owner | self | review | auto (recommended)) · blocks T-xxx`, then one or two lines.

## Open

_None._

## Triaged

- **F-007** · triaged · 2026-10-23 · owner · -> T-024, T-026
  The CV goes into a folder whose contents Git ignores (T-026). The published copy goes in `public/` (F-008, T-024).

## Resolved

- **F-012** · resolved · 2026-10-30 · auto (recommended) · -> T-021
  What copy should the home page's "How I build", About teaser and contact block use before T-035? Chosen: section titles that restate REQUIREMENTS facts only ("One foundation, many platforms", "A shared data layer", "A component library", "From biology to frontend lead"), with every body sentence marked "Placeholder" and pointing at T-035. Alternatives: draft full copy now; hide the sections until T-035. Reason: the page is complete in structure without inventing claims about the owner's work.
- **F-013** · resolved · 2026-10-30 · auto (recommended) · -> T-021, T-024
  Should the home contact block show the email address and CV link now? Chosen: the GitHub profile link only, with T-024 adding the `mailto:` link and the CV (D-018). Alternatives: add the email in T-021; leave the block empty. Reason: T-024 owns contact and CV, and the CV PDF is not in `public/` yet.

- **F-010** · resolved · 2026-10-30 · auto (recommended) · -> T-020
  What content should the content layer ship with before the case studies (Phase 3) and final copy (T-023, T-035)? Chosen: four project files whose frontmatter uses only the facts in REQUIREMENTS section 4, with the role and body marked "Placeholder"; profile and experience use the same facts and mark everything else (summary, story, university, employer description, dates) as placeholders. Alternatives: one invented sample project; empty files. Reason: real slugs let T-021/T-022 build on the final URLs without inventing any claim.
- **F-011** · resolved · 2026-10-30 · auto (recommended) · -> T-020, D-025
  Prerendering `/work/<slug>` fails the build when no route matches, so how does T-020 prove every slug is prerendered before T-022? Chosen: a minimal `/work/:slug` route (header, metrics, MDX body, per-route meta) that T-022 extends into the full template. Alternatives: leave slugs out of the prerender list until T-022 (fails "Done when"); a placeholder route with no content. Reason: it also verifies the MDX pipeline end to end, as D-007 asks.
- **F-009** · resolved · 2026-10-23 · owner · -> T-015
  The owner allowed a draft verification PR into `main` (#24, closed unmerged); the second e2e run restored the cache.
- **F-002** · resolved · 2026-10-23 · owner · -> D-019, D-020
  Design direction delegated to Claude: vermilion accent, Fraunces + Geist + Geist Mono, soft radii (6-20 px), shown on `/style-tile`.
- **F-008** · resolved · 2026-10-23 · owner · -> T-024
  As originally planned: the owner adds the CV PDF to `public/` when T-024 needs it, so the site serves it. `private/` stays for the owner's own files.
- **F-001** · resolved · 2026-10-23 · owner · -> D-018
  No client names, logos or screenshots: generic descriptions and invented data only.
- **F-003** · resolved · 2026-10-23 · owner · -> D-018, T-071
  No personal-name domain: production stays on `pages.dev`. The CV keeps the Gmail address.
- **F-004** · resolved · 2026-10-23 · owner · -> D-018, T-024
  Publish only the email address (the Gmail address on the CV) and the GitHub profile. No LinkedIn, no phone number.
- **F-005** · resolved · 2026-10-22 · owner · -> T-005, D-017
  License: MIT for the source code; written content, images and the CV PDF stay all rights reserved.
- **F-006** · resolved · 2026-10-23 · owner · -> D-018, T-021, T-023
  No headshot: typographic About section.
