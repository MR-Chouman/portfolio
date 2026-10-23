# FEEDBACK

Questions, review notes and requested changes. Keep it short and actionable. This file is public: no confidential or personal information.

## Lifecycle

1. **open**: new item. Add it under "Open" with an ID, date, source and what it blocks.
2. **triaged**: turned into a task (`-> T-xxx`) or a decision (`-> D-xxx`), or explicitly rejected with a reason.
3. **resolved**: the task/decision is done. Move the item to "Resolved" with the link and date.

Item format: `F-001 · status · date · source (owner | self | review) · blocks T-xxx`, then one or two lines.

## Open

_None._

## Triaged

- **F-007** · triaged · 2026-10-23 · owner · -> T-024, T-026
  The CV goes into a folder whose contents Git ignores (T-026). The published copy goes in `public/` (F-008, T-024).

## Resolved

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
