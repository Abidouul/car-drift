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

### 2026-06-11 (later) — Handbrake + visual overhaul (branch `feat/visual-overhaul`)

**Goal:** Handbrake on Space for easier drifting, more realistic car models, bigger and
better-looking maps with real environments, best-achievable graphics.

**Files changed:** `src/main.js`, `src/carPreview.js`, `index.html`, `src/style.css`,
`CLAUDE.md`.

**What changed and why:**
1. `71fb445` Handbrake — new rebindable action (default Space) in the bindings system,
   options panel, and first-run hint. Held: rear lateral grip/cornering cut ~55-60%,
   drive torque cut 85%, rear longitudinal speed dragged toward zero; locked rears stop
   spinning and raise slip so smoke/skids/scoring all react. Driving keys are captured
   only while playing so Space still activates focused menu buttons.
2. `30e716f` Image-based lighting — PMREM RoomEnvironment on the main scene (subtle)
   and preview scenes (studio); default preset now high on desktop / low on small
   machines (was medium/lowest — the game shipped needlessly pixelated).
3. `4d7c828` Car models — hull cross-sections Catmull-Rom subdivided with a tumblehome
   belt point (smooth pressed-steel sides); fake hood/deck slabs removed so painted
   bodywork shows; proper greenhouse (inset glass, flush body-color roof, A/C pillars);
   integrated bumpers (body-color RS wraps, chrome E3 blades).
4. `70680b6` Tracks — 1.55x uniform road scale through the whole pipeline (points, pad
   and zone radii, spawns); lanes widened to 9.2/7.8/9.6 m; 300 m textured terrain
   replaces the dev grid; per-level gradient sky domes + star field; thinner fog.
5. `253cb47` Environments — shared kit (seeded scatter with true road clearance,
   instanced pines, lit-window tower materials, billboards). Urban: mid-rises with
   colliders + 16-tower lit skyline + billboards + denser lamps. Touge: 150 instanced
   pines, ridge line, moon. Dock: reflective harbor sheet, quay with bollards,
   instanced container yard.
6. Final fix — stuck camera-drag: if a pointerup never reached the canvas (released
   over an overlay/outside the window), every subsequent mouse move silently orbited
   the camera toward top-down; window-level pointerup/blur listeners now end drags.

**Tests/builds:** `npm run build` clean per commit. Browser-verified: handbrake flick
reaches valid drift with smoke off locked rears and the gauge flipping to earn-rate;
all three remodeled levels start and read as real places (city night / mountain dusk /
harbor); options shows 5 bindings; 5-key hint; desktop + mobile layouts. Two startup
crashes caught and fixed during the session (window-material TDZ; none shipped).

**Known issues:** instanced trees/containers ignore the shadow-quality toggle nuances
(always castShadow; fine on current presets). Water is a flat reflective plane, no
waves. FPS still unmeasurable headless (rAF suspends when the preview window is
occluded); all additions are instanced or static with lights tagged optional.

**Next steps:** touch steering, engine audio pass, animated water normal map, third
car, main.js modularization.

### 2026-06-11 (later still) — Real GLB car model: Silvia S15 (branch `feat/real-car-model`)

**Goal:** Support real car models (GLB) and add the user's Nissan Silvia S15 Vertex
Edge model as a third selectable car.

**Files changed:** new `src/carModels.js`, `src/main.js`, `src/carPreview.js`,
`index.html`, `src/style.css`, `vite.config.js`, `README.md`, new
`public/models/s15.glb` (12.8 MB).

**What changed and why:**
1. GLB analysis (workflow): plain glTF 2 (no Draco/KTX2 — no decoders needed), 99k
   tris, 27 materials, wheels under one `Wheels_F_00` node with four named caliper
   pivots at the true wheel centers; model loads at 1/100 scale, nose +Z; license
   **CC-BY-NC-SA-4.0 by Ddiaz Design (Sketchfab)** — attribution added to README and
   the options panel; project must stay non-commercial.
2. `src/carModels.js` — background loader (dynamic-import GLTFLoader after the game
   starts; never blocks startup; 404/offline falls back silently) + normalization:
   wheelbase-based auto-scale (wheel-pivot world positions → exactly 2.8 m so arches
   land on the game's axle positions), auto nose orientation, grounding via bbox,
   axle-midpoint z alignment, transmission materials converted to plain transparency
   (skips three's extra transmission render pass), `userData.sharedAsset` markers.
3. `createCar` — when a config has `visual.model` and the template is ready, the
   clone parents under `sprung` (suspension roll/pitch animates the real body) and
   the entire procedural body is skipped; wheels stay procedural, now parameterized
   by `visual.wheelOffset`/`wheelScale` (S15: ±0.84 m track, 0.78 scale) so smoke,
   skids, steering, spin, and blur all keep working. Until the model lands (or if it
   fails) the S15 config renders a procedural placeholder.
4. Refresh-on-load: `refreshCarVisualsForModel` rebuilds the gameplay car (if
   selected), the garage slot (`menuPreviewSystem.refreshSlot`), and the card preview
   (`carPreviewSystem.refresh` with camera re-framing). `disposeObjectTree` now skips
   shared-asset meshes so disposing one clone can't destroy the others' textures.
5. Third car UI: S15 card in index.html, `.car-grid` → auto-fit 3-up (panel 1460px),
   garage rebuilt to three platforms from `carConfigs`, dock route recommends the S15.
6. `vite.config.js` — loaders split into a lazy `three-loaders` chunk so GLTFLoader's
   44 kB never delays the menu.

**Tests/builds:** dev + `GITHUB_PAGES=true` builds clean; dist contains
`models/s15.glb`, inlined `"/car-drift/"` base, relative loader-chunk imports.
Browser-verified: 3 cards with live previews (real S15 on its turntable), garage
parks three cars, S15 selected → real model drives on the dock, handbrake flick →
valid drift (gauge green, +1/s, smoke/skids from locked rears). Loader-failure path
exercised for real (Vite first-load dep 504) — warned and kept procedural bodies.
Adversarial review workflow run on the staged diff before merging.

**Known issues:** model unoptimized (12.8 MB; meshopt/gltfpack would cut it ~3-4x);
all 27 materials doubleSided (fillrate); car body casts whole-mesh shadows (no
per-panel tuning); preview placeholder visibly swaps to the real model a moment
after a cold load.

**Next steps:** gltfpack compression for the GLB, more GLB cars via the manifest
(drop a file in public/models + one manifest/config entry), touch steering, audio.
