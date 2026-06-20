# PULSE SLICE — Design Spec

**Date:** 2026-06-20
**Status:** Approved

## Summary
A WebXR rhythm-slicer ("Beat Saber lite"). Red and blue blocks fly toward the
player in time with music; the player slices each block with the matching-color
saber in the direction the block's arrow points. Runs from a single URL on a
**laptop** (mouse) or in a **Meta Quest** headset (two controllers), no install.

## Tech stack
- **Three.js** (via CDN import-map) for 3D + the **WebXR** session.
- Static site, zero build step. Deployed on **GitHub Pages** (HTTPS, required for WebXR).
- **Web Audio API** for procedurally synthesized music (no shipped audio binary).

## Architecture
```
index.html          entry: canvas, import-map, HUD/menu overlay
src/
  main.js           bootstrap, render loop, scene/lights/XR session, menu wiring
  game.js           state machine (menu -> playing -> results), update orchestration
  scheduler.js      reads beatmap, spawns blocks so they ARRIVE on the beat   [pure-ish/testable]
  scoring.js        swing-speed score, combo, hit/miss/accuracy               [pure/testable]
  slicing.js        color + arrow-direction match (velocity dot product)      [pure/testable]
  blocks.js         block pool: geometry, color, arrow mesh, motion, AABB
  sabers.js         two sabers, per-frame tip velocity, blade-vs-AABB collision
  audio.js          procedural chiptune track (Web Audio) -> master song clock
  beatmap.js        BPM, song length, note pattern -> beatmap array
  hud.js            in-world canvas-texture panel (score/combo/energy) for VR + desktop
  input/vr.js       WebXR controllers -> red/blue sabers (handedness, pose, velocity)
  input/desktop.js  mouse-driven saber; LMB=blue swing, RMB=red swing
test/index.html     in-browser asserts for scoring / scheduler / slicing
```

## Key engineering decisions
1. **Music is synthesized in-browser** at a fixed BPM instead of bundling an
   `.mp3`. No licensing/binary baggage; sample-perfect sync. `audio.js` exposes a
   swap point to load a real track later.
2. **Pure, testable core** (`scoring`, `scheduler`, `slicing`) kept free of
   Three.js so the game logic is verifiable without a headset.

## Gameplay
- Blocks spawn ~12m away and travel toward a **slice plane** ~0.4m in front of
  the player, arriving exactly on each beat (constant flight time).
- Spawn grid: 4 columns x 3 rows around chest height (y ~1.0-1.8m).
- Each block: **color** (red = left hand, blue = right) + **arrow**
  (up/down/left/right/any).
- **Hit** = correct-color saber passes through the block AND swing direction
  matches the arrow. Score scales with swing speed; combo multiplier builds.
- **Miss / wrong color / wrong direction** = breaks combo, drains energy.
- Energy empty OR song end -> **results** (score, max combo, accuracy).

## Input modes (toggled at menu)
- **Laptop:** "Play on Laptop" button. Mouse moves the saber on the slice plane;
  hold **Left-click = blue**, **Right-click = red**; mouse movement = swing
  direction & speed. `Esc` returns to menu.
- **VR (Quest):** "Enter VR" button (WebXR needs a user gesture). Left controller
  = red saber, right = blue. Real swing velocity from controller pose. Pull either
  trigger to start the song.

## Testing & deploy
- `test/index.html` runs asserts on the three pure modules.
- GitHub Pages on the new `sanjitmathur/pulse-slice` repo -> live URL.
- Local dev: `python -m http.server` (modules + audio need a server, not file://).

## Out of scope (YAGNI)
Bombs, walls, multiple songs, beatmap editor, leaderboards, hand-tracking
(controllers only for v1).
