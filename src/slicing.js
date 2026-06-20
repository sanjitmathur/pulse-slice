// slicing.js — pure hit-validation logic, no Three.js. Easy to unit-test.

// Arrow directions as 2D unit vectors on the slice plane (x right, y up).
export const ARROW_VECTORS = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  any: null, // any direction counts
};

export function matchesColor(saberColor, blockColor) {
  return saberColor === blockColor;
}

// swing = {x, y} swing velocity projected onto the slice plane.
// Returns true if the swing goes roughly the arrow's way (dot > threshold)
// once normalized. "any" accepts any swing above the speed floor.
export function matchesDirection(swing, arrowDir, { minSpeed = 1.5, dotThreshold = 0.5 } = {}) {
  const speed = Math.hypot(swing.x, swing.y);
  if (speed < minSpeed) return false;
  const arrow = ARROW_VECTORS[arrowDir];
  if (!arrow) return true; // "any"
  const nx = swing.x / speed;
  const ny = swing.y / speed;
  const dot = nx * arrow.x + ny * arrow.y;
  return dot >= dotThreshold;
}

export function swingSpeed(swing) {
  return Math.hypot(swing.x, swing.y);
}

// Full judgment for a saber crossing a block.
export function judgeSlice(saberColor, swing, block, opts) {
  if (!matchesColor(saberColor, block.color)) return { ok: false, reason: 'color' };
  if (!matchesDirection(swing, block.dir, opts)) return { ok: false, reason: 'direction' };
  return { ok: true, speed: swingSpeed(swing) };
}
