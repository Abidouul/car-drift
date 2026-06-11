# Drift Donut — Project Log

Vite + Three.js browser drifting game. Single-file game engine in `src/main.js`,
menus in `index.html`, styling in `src/style.css`. Run with `npm run dev`
(port 5180 via `.claude/launch.json`), build with `npm run build`.

## Work log

### 2026-06-11 — Polish pass session (branch `feat/polish-pass`)

**Goal:** Full polish pass — live 3D car previews in selection cards, garage-quality
car select screen with stat meters, drift-validity feedback, compact game-like HUD,
visual map cards, believable garage menu environment. No physics rewrites.

**Baseline (start of session):**
- Migrated branch `drift-car-selection-menu` + its ~1,079 lines of uncommitted WIP
  from the conductor worktree (`~/conductor/workspaces/Car drift/new-york`) into this
  folder as branch `feat/polish-pass` (baseline commit 574d76d). This folder's prior
  uncommitted graphics-port changes were stashed: stash "main graphics-settings port
  (pre polish-pass)".
- `npm run build` passes (519 kB three chunk, 70 kB game chunk).
- Browser-verified: main menu → car select → map select → gameplay all functional.
  rAF steady at 120 Hz (high-refresh display), no jank.
- Known baseline issues: CSS car illustrations in selection cards are flat unrecognizable
  blobs with truncated stat labels; cards use real brand names (Porsche/BMW); HUD is a
  huge panel covering much of the screen; level cards are text-only; garage platforms
  in the menu backdrop are empty (no cars); default render resolution looks pixelated.

(Entries below appended as the session progresses.)
