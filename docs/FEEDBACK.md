# FEEDBACK

Questions, review notes and requested changes. Keep it short and actionable. This file is public: no confidential or personal information.

## Lifecycle

1. **open**: new item. Add it under "Open" with an ID, date, source and what it blocks.
2. **triaged**: turned into a task (`-> T-xxx`) or a decision (`-> D-xxx`), or explicitly rejected with a reason.
3. **resolved**: the task/decision is done. Move the item to "Resolved" with the link and date.

Item format: `F-001 · status · date · source (owner | self | review | auto (recommended)) · blocks T-xxx`, then one or two lines.

## Open

None.

## Triaged

- **F-017** · triaged · 2026-10-30 · self · -> T-060
  Cloudflare Pages redirects `/about` to `/about/` (308), because prerendered pages are `<path>/index.html`, while canonical and Open Graph URLs omit the trailing slash. T-060 should make canonical URLs match the served URL (or the reverse) so they do not point at a redirect.

## Resolved

- **F-023** · resolved · 2026-10-30 · auto (recommended) · -> T-035
  Where does the final hero and About copy come from, when the owner is not in the chat and claims about his work must not be invented? Chosen: draft every sentence from REQUIREMENTS section 4 and the owner's published CV (`public/cv.pdf`) only, keep the REQUIREMENTS headline and metrics, describe employers generically ("a software company building client platforms", "a restaurant group"), and name only the universities and the bootcamp (public institutions, not clients); the PR stays open for the owner's approval (Owner review). Alternatives: keep every text a placeholder until the owner writes it (nothing to approve); write freer marketing copy (would add unsourced claims). Reason: the task asks the owner to approve copy, and each sentence can be checked against his own CV. Owner to check: the tone of the first-person story, naming the universities and bootcamp, listing the application analyst role, and the contact line about remote work and the Middle East (from REQUIREMENTS section 2).

- **F-019** · resolved · 2026-10-30 · self · -> T-026
  Owner action: copy the current CV PDF (the version with the Gmail address) into `private/` and confirm Git ignores it. Done 2026-10-30: the owner saved it as `private/cv.pdf`; `git check-ignore -v private/cv.pdf` prints the `/private/*` rule, `git status` lists nothing under `private/`, and `git ls-files private` lists only `private/.gitkeep`.
- **F-007** · resolved · 2026-10-30 · owner · -> T-024, T-026
  The CV goes into a folder whose contents Git ignores (T-026, done). The published copy goes in `public/` (F-008, T-024, done).
- **F-020** · resolved · 2026-10-30 · self · -> T-024
  Owner action: add the CV PDF the site serves, as `public/cv.pdf` (both links point at `/cv.pdf`), and confirm the email address in `content/contact.ts` is the one on the CV (F-022). Done: the owner saved the CV (the version with the Gmail address, D-018) as `public/cv.pdf`, committed on the T-024 branch, and confirmed the email matches the CV. Playwright now checks that `/cv.pdf` is served as `application/pdf` and that both links download it; `_headers` gives it a revalidating cache.
- **F-021** · resolved · 2026-10-30 · auto (recommended), checked by the owner · -> T-024
  Where and how should the CV download appear? Chosen: one file path `/cv.pdf` saved as `Mohamad-Rida-Chouman-CV.pdf` (the `download` attribute); a compact "CV" button in the header between the navigation and the theme toggle (accessible name "Download CV (PDF)"), on every page; in the home contact block, the email address as the primary button, then "Download CV" with a "PDF" hint, then the GitHub profile. Contact details move to `content/contact.ts` (validated by `contactSchema`) so the header and home share one source. Alternatives: a CV item inside the main navigation (it is a file, not a page); a text-only link in the footer (the task asks for the header); a dated file name such as `cv-2026.pdf` (links would change on each update). Reason: one stable URL, a short header item that fits at 375 px, and no new navigation semantics.
- **F-022** · resolved · 2026-10-30 · auto (recommended), checked by the owner · -> T-024
  Which email address does the `mailto:` link use? Chosen: the Gmail address that is the owner's Git identity in this public repository's history, which D-018 and F-004 name as the address on the CV; the address is the visible text of the contact button so visitors without a mail client can copy it. Alternatives: a "Email me" label that hides the address; wait for the owner to type it. Reason: D-018 already decided to publish the Gmail address; the owner confirmed it matches the CV (F-020).
- **F-016** · resolved · 2026-10-30 · auto (recommended) · -> T-025, D-027
  "Done when" asks for a 404 status on the Cloudflare preview, but Cloudflare builds only `dev` (README), so a task branch cannot be checked there before it merges. Chosen: prove it locally (the build writes a top-level `404.html`, which Pages serves with a 404 status; Playwright checks the page, `_headers` and the CSP), merge, then check `https://dev.portfolio-4q6.pages.dev/<unknown>` right after the merge and report the result. Alternatives: park the task in `review` for the owner; temporarily enable preview builds for task branches in Cloudflare. Reason: the check is only possible after the merge into `dev`, which is staging, and `/finish-phase` re-checks before production.

- **F-015** · resolved · 2026-10-30 · auto (recommended) · -> T-023, T-035
  What copy should the About page use before the owner writes it? Chosen: section titles and labels in `content/about.ts`; the story as three paragraphs following the REQUIREMENTS arc (biology, bioinformatics MSc with machine learning on protein sequences, frontend lead), each marked "Placeholder"; the single timeline entry, the university and the page intro stay placeholders, now pointing at T-035 (the Owner review task for About copy); skills and education restate REQUIREMENTS facts only. Alternatives: draft the full story and timeline now; hide unfinished sections until T-035. Reason: the page is complete in structure without inventing claims, dates or employers.

- **F-014** · resolved · 2026-10-30 · auto (recommended) · -> T-022, D-026
  How should the case study template define its sections and images before the case studies are written (T-030 to T-034)? Chosen: sections are `##` headings in each MDX body, and every project body now has the four REQUIREMENTS sections ("The problem", "What I owned", "Key decisions", "Outcome") with text marked "Placeholder"; images use a `<Figure>` component (required width, height, alt and caption) that MDX files use without importing, and no image ships until real anonymized crops exist. Alternatives: section text as structured frontmatter fields rendered by the route; an invented sample image now. Reason: MDX keeps case studies free to vary their headings and embed figures where they belong, and no claim or visual is invented.

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
