// scoring.js — pure scoring logic, no Three.js. Easy to unit-test.

export const MAX_ENERGY = 100;

export function createScoreState() {
  return {
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    energy: MAX_ENERGY,
  };
}

// Combo multiplier ramps 1x -> 8x like Beat Saber's stepped multiplier.
export function comboMultiplier(combo) {
  if (combo >= 14) return 8;
  if (combo >= 6) return 4;
  if (combo >= 2) return 2;
  return 1;
}

// Base 100 per block, scaled by how fast the saber was swung (0..1 -> 1x..2x).
export function pointsForSwing(swingSpeed) {
  const speedBonus = 1 + Math.min(1, swingSpeed / 8); // 8 m/s caps the bonus
  return Math.round(100 * speedBonus);
}

export function applyHit(state, swingSpeed) {
  const pts = pointsForSwing(swingSpeed) * comboMultiplier(state.combo);
  state.score += pts;
  state.combo += 1;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  state.hits += 1;
  state.energy = Math.min(MAX_ENERGY, state.energy + 2);
  return pts;
}

export function applyMiss(state) {
  state.combo = 0;
  state.misses += 1;
  state.energy = Math.max(0, state.energy - 12);
  return state.energy;
}

export function accuracy(state) {
  const total = state.hits + state.misses;
  return total === 0 ? 1 : state.hits / total;
}

export function isFailed(state) {
  return state.energy <= 0;
}
