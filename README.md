# 🎵 PULSE SLICE

A **WebXR rhythm slicer** in the spirit of Beat Saber. Red and blue blocks fly at
you in time with the music — slice each with the **matching-color saber** in the
direction its **arrow** points. Builds combos, energy, and accuracy.

Runs from a single URL with **two modes**:

- 💻 **Laptop** — mouse + clicks, no headset needed.
- 🥽 **VR (Meta Quest)** — open the page in the Quest Browser, tap *Enter VR*, and
  slice with your two controllers.

Built with **Three.js + WebXR**. No build step, no install — it's a static site.
The music is **synthesized in the browser** (Web Audio), so the beatmap stays
perfectly in sync and there are no audio files to ship.

## ▶ Play

**Live:** https://sanjitmathur.github.io/pulse-slice/ — open this in the **Quest Browser**, then tap *Enter VR*.

**Locally** (a server is required — ES modules + audio don't run from `file://`):

```bash
# from the project folder
python -m http.server 8000
# then open http://localhost:8000
```

For VR, your headset and laptop must be on the same Wi-Fi; open
`http://<your-laptop-ip>:8000` in the Quest Browser. (Public HTTPS via GitHub
Pages is the easiest path for VR.)

## 🎮 Controls

| | Laptop | VR (Quest) |
|---|---|---|
| Move saber | mouse | move your hand |
| Blue saber | hold **Left-click** | **right** controller |
| Red saber | hold **Right-click** | **left** controller |
| Start song | click *Play on Laptop* | **pull a trigger** |
| Back to menu | **Esc** | end VR session |
| Mute | **M** | — |

Match the saber **color** to the block, and swing the way the **arrow** points.
Faster swings score more; chained hits raise the combo multiplier (up to 8×).
Miss too many and your energy runs out.

## 🧩 How it works

```
index.html          entry: canvas, import-map, menu/results overlay
src/
  main.js           scene, lights, environment, XR session, render loop
  game.js           state machine (menu -> playing -> results) + orchestration
  scheduler.js      spawns blocks so they ARRIVE on the beat        (pure, tested)
  scoring.js        score / combo / energy / accuracy               (pure, tested)
  slicing.js        color + arrow-direction hit validation          (pure, tested)
  blocks.js         flying note-blocks: mesh, motion, collision AABB
  sabers.js         saber blade, per-frame tip velocity, blade-vs-AABB
  audio.js          procedural chiptune + the master song clock
  beatmap.js        BPM + deterministic note pattern
  hud.js            in-world score panel + floating hit/miss popups
  input/desktop.js  mouse-driven saber
  input/vr.js       WebXR controllers -> sabers (by handedness)
test/               headless + in-browser tests for the pure logic
```

### Add your own song
The music is generated in `src/audio.js`. To use a real track instead, decode an
audio file with the Web Audio API (see the commented `loadTrack()` swap point) and
hand-author note times in `src/beatmap.js`.

## 🧪 Tests

```bash
node test/run.mjs      # headless
# or open test/index.html in a browser
```

## License
MIT
