---
description: Pick the next eligible task from docs/TASKS.md and start it (branch from dev, mark doing, plan, implement)
argument-hint: [T-012] (optional, overrides the automatic choice)
---

Start the next task. If $ARGUMENTS contains a task ID, use that task instead of choosing one.

## Choose the task

1. Read `CLAUDE.md`, `docs/REQUIREMENTS.md`, `docs/DECISIONS.md`, `docs/FEEDBACK.md` and `docs/TASKS.md`.
2. Find "Current phase" at the top of `docs/TASKS.md` and look only at that phase's tasks (unless an ID was given).
3. Decide in this order:
   - **A task is `doing`:** resume it. Switch to its branch if it exists (`git branch --list 'task/<id>-*'`). If the working tree has unrelated uncommitted changes, stop and tell me.
   - **A task is `review`:** its PR is still open. Show it (`gh pr list --state open --search "<id>"`) and stop; `/finish-task` continues it.
   - **Otherwise** take the first `todo` task in ID order that is eligible. A task is **not eligible** if its line says `blocked`, or an open item in `docs/FEEDBACK.md` lists it under "blocks". Skip ineligible tasks without editing them and remember why.
   - **No `todo`, `doing` or `review` tasks left:** the phase is complete. Tell me to run `/finish-phase` and stop.
   - **Only ineligible tasks left:** list each one with its FEEDBACK item or reason, say exactly what I need to answer, and stop.
4. In one short message say which task you chose and which you skipped, with reasons.

## Start it

5. Make sure the working tree is clean, then `git switch dev && git pull --ff-only`.
6. Create the branch `task/<id>-<short-kebab-slug>` from `dev`.
7. Set the task to `doing` in `docs/TASKS.md` (this edit goes in the task's first commit).
8. Give me a short plan (5 bullets at most): files you expect to touch, dependencies, open questions. If a question blocks you, add it to `docs/FEEDBACK.md` and ask me. Otherwise implement, following `CLAUDE.md` and the task's "Done when" line.
9. If the task is marked **Owner action**, do all the preparation you can, then give me the exact steps I must perform and wait for me.
