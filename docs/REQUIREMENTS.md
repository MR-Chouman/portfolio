# REQUIREMENTS

Status: baseline v1 (2026-10-22), updated 2026-10-23 with the owner's approval (D-018). Changes need the owner's approval and a note in `DECISIONS.md`.

## 1. Purpose

A portfolio site that presents the owner as a **frontend lead who builds large enterprise admin platforms quickly, on reusable foundations**. Most of the work is private client software, so the site proves the skill through case studies, a live public demo (`/lab`), and the quality of the site itself.

## 2. Audience

- Hiring managers and recruiters (30-second scan, then one case study).
- Engineering leads and CTOs (want decisions, scope, and evidence of craft).
- Potential clients and collaborators, including remote and regional (Middle East) ones.

## 3. Positioning

Headline direction: "Frontend lead building enterprise admin platforms: 4 systems, 260+ screens, one reusable foundation."
Exact wording is finalized in T-035. All numbers must stay consistent with the facts below.

## 4. Facts (source of truth: `content/`)

| Project | Sector | Stack highlights | Scale |
|---|---|---|---|
| Airline crew management platform | Aviation | Next.js, TypeScript, Microsoft SSO | 25 modules (rostering, attendance, leave, appraisals, qualifications, training) |
| Business operations platform | Business services | React, Redux Toolkit, Tailwind | 72 screens (sales to projects, assets, stock, purchasing, staff) |
| EV charging platform | Mobility / EV charging | React, Redux Toolkit, Tailwind | 132 screens, 50-module API layer |
| Hospital management platform | Healthcare | React, Redux, Tailwind | 33 screens, 57 shared components; built from Aug 2024, led since Jan 2026 |

Headline metrics: 4 platforms, 260+ admin screens (230+ across the three 2026 platforms plus the hospital platform), nearly 3 years of experience.
Background story: biology -> bioinformatics (MSc, ML on protein sequences) -> frontend lead. Told briefly on the About page.

Clients are never named: generic descriptions ("a regional airline") and invented data only, no logos or real screenshots (D-018).

## 5. Pages and routes

| Route | Content |
|---|---|
| `/` | Hero, metrics strip, selected work (4), "How I build", About teaser, contact |
| `/work` | Index of case studies |
| `/work/:slug` | Case study: summary header with a rotatable 3D object that stands for the project, context, what I owned, scope, key decisions, next project (no screenshots for now, D-031) |
| `/lab` | Live patterns demo: server-style data table, CRUD drawer flow, component gallery (mock data only) |
| `/about` | Short first-person story, experience timeline, skills, education |
| `404` | Helpful not-found page |

Contact is a `mailto:` link plus GitHub (D-018). CV is downloadable as PDF. No contact form in v1 (D-009).

## 6. Features

1. **Two polished skins** (Editorial default, Systems), each with light and dark. Visitor can switch design and theme. Choice persists and can be set with `?skin=` (D-005).
2. **Switch transitions** use the View Transitions API: circular reveal for skin change, short cross-fade for light/dark. Instant when reduced motion is requested or the API is missing.
3. **Command palette** (Ctrl/Cmd+K): navigate, switch design/theme, download CV.
4. **Per-route SEO**: title, description, canonical, Open Graph and Twitter tags, sitemap, robots, JSON-LD `Person`.
5. **Generated Open Graph images** per case study (build time).
6. **Content layer**: typed and Zod-validated; invalid content fails the build.
7. **3D project objects** (D-032): one low-poly Three.js model per case study, colored by the active skin and theme, rotatable by drag and keyboard, still under reduced motion.

## 7. Non-functional requirements

- **Performance** (mobile, default skin): Lighthouse >= 95 in performance, accessibility, best practices, SEO; LCP < 2.0 s; CLS < 0.05; initial JS <= ~110 kB gzipped and CSS <= ~25 kB gzipped on home (targets, tuned in T-062). The 3D objects load only on case study pages, after first paint, and do not count towards home's initial JS.
- **Accessibility**: WCAG 2.2 AA in every skin and theme; full keyboard use; visible focus; skip link; reduced-motion support; axe checks in Playwright per skin.
- **Responsive**: designed mobile-first from 375 px; no horizontal scroll.
- **Browsers**: current and previous major versions of Chrome, Edge, Safari, Firefox. View Transitions are an enhancement, never required.
- **Privacy**: no cookies, no third-party trackers, no personal phone number or address on the site's pages (the downloadable CV PDF may include the phone number, D-018). Analytics via Cloudflare Web Analytics only (T-072).
- **Resilience**: works with JavaScript disabled for reading content (prerendered HTML).
- **Maintainability**: all copy in `content/`; skins via tokens; tests in CI (D-004).

## 8. Constraints

- Hosting: Cloudflare Pages free plan; static output only, no runtime server (D-006).
- Public GitHub repo: nothing confidential, ever (D-011).
- No animation library; no CMS; no database.

## 9. Out of scope for v1

Blog, CMS, Arabic/RTL (candidate for v1.1), contact form with a backend, a third skin, user accounts, server-side anything.

## 10. Success criteria

- A first-time visitor understands who the owner is and what he builds within 10 seconds.
- Each case study can be read in under 4 minutes and shows decisions, not just screenshots.
- All quality targets in section 7 are met on production.
- Link previews on LinkedIn and WhatsApp show the right title and image for every case study.
- The repo itself reads as a showcase: clean history, CI, ADR-style decisions, clear README.
