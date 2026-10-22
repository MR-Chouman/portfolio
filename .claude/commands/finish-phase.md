---
description: Verify the phase, open the dev -> main PR, wait for full CI, merge it with a merge commit if clean, and tag the release
---

Finish the current phase.

## Preconditions

1. Read "Current phase" in `docs/TASKS.md`. If any task in it is not `done`, list those tasks and stop. If any PR into `dev` is still open (`gh pr list --state open --base dev`), stop and list it.
2. `git switch dev && git pull --ff-only`. Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` and `npm run test:e2e`. Report any failure and stop.

## Open the PR

3. Collect: tasks completed (ID, title, PR link), DECISIONS entries added in this phase, known issues, and the tag (Phase 0 -> `v0.1.0`, ..., Phase 6 -> `v0.7.0`, Phase 7 -> `v1.0.0`). If the tag already exists (`git ls-remote --tags origin <tag>`), stop.
4. Open the PR with `gh pr create --base main --head dev`, using `.github/PULL_REQUEST_TEMPLATE/phase.md` as the body, fully filled in.

## Merge only if everything is clean

5. Wait for checks: `gh pr checks --watch --fail-fast`. This includes Playwright and Lighthouse.
6. Merge only if **all** of these hold:
   - every required check is green, including the Cloudflare preview build for `dev` if it is reported;
   - the PR is mergeable, has no requested changes and no unresolved review comments;
   - no open item in `docs/FEEDBACK.md` blocks a task of this phase.
7. If all conditions hold: `gh pr merge --merge` (a merge commit, never squash) and **do not delete `dev`**. Otherwise do not merge: leave the PR open and tell me exactly what stopped it.

## Tag and advance

8. `git fetch origin main --tags`. Get the merge commit with `gh pr view --json mergeCommit`, then `git tag -a <tag> <merge-sha> -m "Phase <N>: <name>"` and `git push origin <tag>`. Confirm with `git ls-remote --tags origin <tag>`.
9. Advance the "Current phase" line in `docs/TASKS.md` to the next phase (after Phase 7, set it to `Complete`). Do it on a branch `chore/advance-to-phase-<N>` from `dev`, changing only that line, then open a PR into `dev`, wait for the light CI, and merge it with `gh pr merge --merge` (keep the branch).
10. Reply with: the phase PR URL, the tag, that production deploys from `main` through Cloudflare Pages, what the next phase is and its first eligible task, and what I should look at on the live site (visual checks, copy) since automated checks cannot judge those.
