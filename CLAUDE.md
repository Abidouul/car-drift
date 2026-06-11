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

**Files changed:** `index.html`, `src/main.js`, `src/style.css`, new `src/carPreview.js`,
new `src/routePreview.js`, `CLAUDE.md`, `.claude/launch.json`.

**What changed and why (one commit per area):**
1. `6eb70d9` Car silhouettes — Porsche-inspired build became a true fastback (continuous
   roofline, low frunk, raised round fender headlights, whale-tail) and the E30-inspired
   build a three-box (hood plateau, boxy cabin, trunk step, Kamm tail, grille hint, strut
   wing). Both cars were previously identical hulls with different colors.
2. `c9b402c` Live 3D card previews — replaced the broken CSS car illustrations with real
   rotating `createCar` renders: one shared low-power WebGLRenderer blits per-card studio
   scenes into 2D canvases. Bounding-sphere camera framing means cars can never clip
   their cards; rendering is skipped entirely unless the cars panel is visible; preview
   pixel ratio is independent of the gameplay resolution-scale setting; gradient
   fallback on context loss; alternate-frame rendering on low-power devices.
3. `e13d717` Car cards — stats became numeric in `carConfigs` (single source of truth)
   and render as accent-colored meter bars; fictional names (Stuttgart RS / Bavaria E3)
   replaced real brand names; per-car handling multipliers (±8%) now make car choice
   matter; selection styling follows each car's accent.
4. `7019faa` Drift gauge — bottom-center angle track with the valid 12–78° window,
   ideal mark, live needle, and a reason chip (Too slow / More angle / Too much angle /
   Off road / More throttle) that flips to the live earn rate while scoring.
5. `689d9dc` Feel — collision red edge-flash + contact smoke puffs, speed streaks from
   the existing `--speed-intensity`, combo progress underline + decay warning, smoke
   scaled by drift intensity, camera lateral look-ahead and combo FOV pulse.
6. `b2e0ee7` HUD — shrunk from a 340px panel to a 218px score cluster with icon
   buttons; speed/angle moved beside the gauge; mode toggle + camera sliders moved into
   the pause menu; first-run controls hint (localStorage `driftDonut.controlsHint.v1`);
   results now show max combo, drift time, and a New best badge.
7. `0468723` Map cards — text level buttons replaced with cards showing a top-down SVG
   route preview (sampled from the real road spline), description, difficulty pips, and
   recommended car.
8. `9fc3aad` Garage — the menu platforms were EMPTY; each now parks a showcase car.
   Added concrete floor texture, tyre stacks, cones, cable, light haze sprites (gated by
   the smoke setting / low-power flag). Branding unified to "Drift Donut" with an italic
   gradient title + tagline.

**Tests/builds:** `npm run build` clean after every commit (final: 84.45 kB game JS,
17.89 kB CSS, 519 kB three). Browser-verified via the preview server at 1280×800 and
375×812: full flow main menu → car select (both cars) → level select → all three maps
start → pause/resume → options → results layout; cold start with cleared localStorage
(hint shows once, dismisses on input/7s). FPS: rAF measured a steady 120 Hz (display
rate) at session start while the preview window was visible; the headless preview window
suspends rAF when occluded, so a post-change in-window FPS capture wasn't possible —
perf-sensitive additions are all menu-gated (previews/garage render only on their
screens) or O(1) CSS-variable writes per frame, and particle budgets were not raised.

**Verification notes:** screenshots captured throughout the session (menu, car select
desktop+mobile, gauge states Too slow → More angle, pause, results, map cards
desktop+mobile, garage). One real bug found and fixed during verification: the drift
gauge stayed visible while paused (`display: grid` beat the `hidden` attribute); also
fixed a TDZ crash (`statMeterRanges` declared after the `initializeGame()` call site)
and a mobile overlap between the controls hint and the HUD.

**Known issues left behind:**
- A full 90-second results run wasn't replayed end-to-end headless (rAF suspension);
  the results panel was verified with staged values and the finishRun flow predates
  this session unchanged except for added fields.
- Mobile has no touch steering — keyboard only; the hint shows keys regardless.
- The E30 showcase/preview reads slightly gold under the warm garage/rim lighting.
- `src/main.js` is ~4,500 lines; splitting cars/levels/UI into modules is worth a
  dedicated refactor PR.

**Recommended next steps:** touch controls (on-screen steer/throttle zones), engine
audio polish, a third car using the now-flexible hull-section system, ghost/best-lap
trails, and the main.js modularization.
