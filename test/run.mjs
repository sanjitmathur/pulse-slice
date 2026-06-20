// test/run.mjs — node-runnable asserts for the pure logic modules.
// Run:  node test/run.mjs
import assert from 'node:assert';
import {
  createScoreState, applyHit, applyMiss, comboMultiplier, pointsForSwing, accuracy, isFailed, MAX_ENERGY,
} from '../src/scoring.js';
import { matchesColor, matchesDirection, judgeSlice } from '../src/slicing.js';
import { Scheduler, spawnTime } from '../src/scheduler.js';
import { buildBeatmap, SONG_LENGTH } from '../src/beatmap.js';

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

console.log('scoring');
test('combo multiplier steps', () => {
  assert.equal(comboMultiplier(0), 1);
  assert.equal(comboMultiplier(2), 2);
  assert.equal(comboMultiplier(6), 4);
  assert.equal(comboMultiplier(14), 8);
});
test('faster swing scores more', () => {
  assert.ok(pointsForSwing(8) > pointsForSwing(0));
});
test('hit raises score, combo, hits', () => {
  const s = createScoreState();
  applyHit(s, 4);
  assert.ok(s.score > 0);
  assert.equal(s.combo, 1);
  assert.equal(s.hits, 1);
});
test('combo multiplies score', () => {
  const s = createScoreState();
  s.combo = 14; // -> 8x
  const pts = applyHit(s, 0);
  assert.equal(pts, pointsForSwing(0) * 8);
});
test('miss zeroes combo and drains energy', () => {
  const s = createScoreState();
  applyHit(s, 4); applyHit(s, 4);
  applyMiss(s);
  assert.equal(s.combo, 0);
  assert.ok(s.energy < MAX_ENERGY);
});
test('accuracy and fail', () => {
  const s = createScoreState();
  applyHit(s, 1); applyMiss(s);
  assert.equal(accuracy(s), 0.5);
  s.energy = 0;
  assert.ok(isFailed(s));
});

console.log('slicing');
test('color must match', () => {
  assert.ok(matchesColor('red', 'red'));
  assert.ok(!matchesColor('red', 'blue'));
});
test('direction match honors arrow', () => {
  assert.ok(matchesDirection({ x: 0, y: -5 }, 'down'));   // fast downward
  assert.ok(!matchesDirection({ x: 0, y: 5 }, 'down'));    // wrong way
  assert.ok(!matchesDirection({ x: 0, y: 0.2 }, 'down'));  // too slow
  assert.ok(matchesDirection({ x: 3, y: 3 }, 'any'));      // any accepts
});
test('full judgment', () => {
  const block = { color: 'blue', dir: 'right' };
  assert.ok(judgeSlice('blue', { x: 5, y: 0 }, block).ok);
  assert.ok(!judgeSlice('red', { x: 5, y: 0 }, block).ok);   // wrong color
  assert.ok(!judgeSlice('blue', { x: -5, y: 0 }, block).ok); // wrong dir
});

console.log('scheduler');
test('spawn time leads the beat by flight time', () => {
  assert.equal(spawnTime({ t: 5 }, 2), 3);
});
test('due() emits notes once, in order', () => {
  const notes = [{ t: 2 }, { t: 2.5 }, { t: 3 }];
  const sch = new Scheduler(notes, 1); // spawn times: 1, 1.5, 2
  assert.equal(sch.due(0).length, 0);       // nothing yet
  assert.equal(sch.due(1).length, 1);       // first note's spawn time reached
  assert.equal(sch.due(1.5).length, 1);     // second
  assert.equal(sch.due(10).length, 1);      // third (and no repeats)
  assert.equal(sch.due(10).length, 0);
});

console.log('beatmap');
test('beatmap is non-empty, sorted, within song', () => {
  const m = buildBeatmap();
  assert.ok(m.length > 30, 'should have plenty of notes: ' + m.length);
  for (let i = 1; i < m.length; i++) assert.ok(m[i].t >= m[i - 1].t, 'sorted by time');
  for (const n of m) {
    assert.ok(n.t >= 0 && n.t <= SONG_LENGTH);
    assert.ok(['red', 'blue'].includes(n.color));
    assert.ok(n.col >= 0 && n.col <= 3 && n.row >= 0 && n.row <= 2);
  }
});
test('deterministic across builds', () => {
  assert.deepEqual(buildBeatmap(), buildBeatmap());
});

console.log(`\nAll ${passed} tests passed.`);
