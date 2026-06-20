// beatmap.js — tempo + note pattern. Both audio.js and scheduler.js read this.

export const BPM = 120;
export const BEAT = 60 / BPM;          // 0.5s per beat
export const SONG_LENGTH = 75;         // seconds of gameplay
export const GRID_COLS = 4;            // x cells: 0..3
export const GRID_ROWS = 3;            // y cells: 0..2

const COLORS = ['red', 'blue'];
const DIRS = ['up', 'down', 'left', 'right'];

// Deterministic pseudo-random so the beatmap is identical every run.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a beatmap: a note on most beats, with a short rest every 8 beats and a
// ramp where late-song beats can carry two simultaneous blocks (left+right).
export function buildBeatmap() {
  const rng = mulberry32(1337);
  const notes = [];
  const totalBeats = Math.floor(SONG_LENGTH / BEAT);

  for (let b = 4; b < totalBeats; b++) { // 2s lead-in before first note
    const t = b * BEAT;
    if (b % 8 === 7) continue; // breathing room

    const intensity = t / SONG_LENGTH;        // 0 -> 1 across the song
    const makeNote = (forceColor) => {
      const color = forceColor ?? COLORS[Math.floor(rng() * COLORS.length)];
      const dir = rng() < 0.85 ? DIRS[Math.floor(rng() * DIRS.length)] : 'any';
      // Red tends left columns, blue right — feels natural to slice.
      const col = color === 'red'
        ? Math.floor(rng() * 2)
        : 2 + Math.floor(rng() * 2);
      const row = Math.floor(rng() * GRID_ROWS);
      return { t, col, row, color, dir };
    };

    notes.push(makeNote());
    // Double notes (one of each color) become more common later on.
    if (b % 4 === 0 && rng() < intensity * 0.6) {
      const last = notes[notes.length - 1];
      notes.push(makeNote(last.color === 'red' ? 'blue' : 'red'));
    }
  }
  return notes;
}
