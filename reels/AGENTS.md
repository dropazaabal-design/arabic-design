# AGENTS.md — reels/

Instructions for any coding agent (Codex, Claude Code, …) working under `reels/`.

**Before producing or changing a reel, read `reels/PIPELINE.md`** — the end-to-end method (brief → research →
script → voice → timing → animation → preview → render → QA → docs → PR) with the exact commands, file
contracts and known failures. Copy the scaffold of `reels/blind-obedience/` (explainer) or
`reels/power-of-no-b/` (physical story) instead of starting from scratch.

Hard rules (details in PIPELINE.md §1):
- New reel = new folder `reels/<slug>/` on a new branch from `claude/new-session-gmtqwj`; never modify other
  reels — import from them (`@mukarram`, `@mukarram-assets`, `@doublethink`, relative sfx paths).
- Never speed up, slow down or pitch the voice; fix length with acting beats or the script.
- Every number on screen comes from a source you actually read; record what you read in `script.md`.
- Arabic only inside the frame (RTL, Western digits); no diagnosis; provocation = a question, not blame.
- Never claim you listened to or watched the result; say what was measured.
- No force push, no merge, no publishing; open a **draft** PR to `claude/new-session-gmtqwj` and read its state.
- Do not commit `node_modules/`, `out/`, `audio/*.wav`.
