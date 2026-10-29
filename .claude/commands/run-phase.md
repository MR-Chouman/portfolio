---
description: Run every task of the current phase autonomously (one fresh subagent per task), then finish the phase if everything is clean
argument-hint: [max-tasks] (optional, default 15)
---

Run the current phase without stopping for questions (D-024). $ARGUMENTS may give the maximum number of tasks to run; default 15.

This chat is only the orchestrator. Each task runs in its own fresh subagent, so every task starts with a clean context. Keep this context small: never read source files or run checks here, and keep only each subagent's RESULT block.

## Preconditions

1. The working tree is clean (`git status --porcelain` is empty). Otherwise stop and tell me.
2. `git switch dev && git pull --ff-only`. Read "Current phase" in `docs/TASKS.md`.

## Loop

Repeat until no eligible task is left, a task fails, or the maximum is reached:

1. **Pick the task.** Read `docs/TASKS.md` and `docs/FEEDBACK.md` on `dev` and apply the eligibility rules of `/start-task` step 3, with these differences: a `doing` task is picked first (resumed); skip tasks in `review` or `blocked` and tasks parked in this run instead of stopping; also skip a task whose description or "Done when" depends on a parked or blocked task, and park it as "waits on T-xxx".
2. **Run it in a fresh subagent.** Spawn one general-purpose subagent in the foreground with this prompt, filling in the ID:

   > You are running task <ID> of this repository autonomously under `/run-phase` (D-024). Read `CLAUDE.md`. Then follow `.claude/commands/start-task.md` with the arguments `<ID> --auto`, and when the implementation is done, follow `.claude/commands/finish-task.md` with `<ID> --auto`. Apply the "Auto mode" sections of both files: never wait for the owner, answer questions with the recommended option and log them as the Auto-answer rule says, and respect its hard stops. Work only on <ID>; never start another task, never run `/finish-phase`. End your final message with exactly this block:
   >
   > ```
   > RESULT: merged | parked-review | blocked | failed
   > TASK: <ID>
   > PR: <url or none>
   > AUTO-ANSWERS: <F-xxx, ... or none>
   > VERIFICATION-PRS: <#nn (closed), ... or none>
   > NOTE: <one line>
   > ```

3. **Record the result.** Keep only the RESULT block. If it is missing, treat the task as `failed`.
   - `merged`: continue.
   - `parked-review` or `blocked`: add the task to the parked list and continue.
   - `failed`: stop the loop. Never retry a task automatically.
4. **Reset.** `git switch dev && git pull --ff-only` and check the working tree is clean. If it is not, stop the loop.

## Finish the phase

5. If every task of the current phase is `done` in `docs/TASKS.md`, nothing was parked or failed, and `gh pr list --state open --base dev` shows no task PR, follow `.claude/commands/finish-phase.md`. It re-checks everything and refuses to merge on any failure. Otherwise do not run it.

## Reply

6. A table: task, result, PR, auto-answers. Then what I must do: parked reviews (PR links), owner actions (FEEDBACK items), failures, and the auto-answers worth checking. Then whether the phase was released and its tag, or why it was not.
