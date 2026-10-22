---
description: Verify the current task, open a PR into dev, wait for CI, and merge it (merge commit, branch kept) if everything is clean
argument-hint: [T-012] (optional)
---

Finish the current task ($ARGUMENTS if given, otherwise infer the ID from the branch name `task/T-xxx-*`). If you are not on a task branch, stop.

## Verify

1. Re-read the task's "Done when" line in `docs/TASKS.md` and confirm every part is true. List anything that is not.
2. Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`. Also run `npm run test:e2e` if the task touched routes, layout or behavior. Fix failures properly; never skip, disable or weaken a check. If something still fails after two honest fix attempts, stop and report.
3. Update docs in this same branch:
   - `docs/TASKS.md`: set the task to `done`.
   - `docs/DECISIONS.md`: add an entry for any non-trivial technical choice or new dependency.
   - `docs/FEEDBACK.md`: resolve or raise items this task affects.

## Open the PR

4. Commit with a Conventional Commit message, push, and open a pull request with `gh pr create --base dev`, using `.github/pull_request_template.md` as the body, fully filled in.

## Merge only if everything is clean

5. Wait for checks: `gh pr checks --watch --fail-fast`.
6. Merge only if **all** of these hold:
   - every required check is green;
   - `gh pr view --json mergeable,mergeStateStatus,reviewDecision,reviews,comments` shows the PR is mergeable, has no requested changes and no unresolved review comments;
   - every part of "Done when" is true;
   - the task's heading line in `docs/TASKS.md` does **not** contain `Owner review` (those tasks always wait for my review);
   - you did not raise a FEEDBACK item that blocks this task or the next ones.
7. If the branch is behind `dev`, update it (`gh pr update-branch`, or merge `origin/dev`), resolve only trivial conflicts (for example other tasks' lines in `docs/TASKS.md`), re-run the checks and wait again. Any non-trivial conflict: stop and do not merge.
8. If all conditions hold: `gh pr merge --merge --subject "<PR title>"` (a merge commit, never squash or rebase, and do **not** delete the branch). Then `git switch dev && git pull --ff-only` and confirm the task shows `done`.
9. If any condition fails: do not merge. Leave the PR open, change the task to `review` in the branch (commit and push), and tell me exactly what stopped the merge and what I need to do.
10. Reply with the PR URL, whether it merged, a 3-line summary of the change, and the ID of the next eligible task. Do not start it.
