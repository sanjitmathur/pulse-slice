// game.js — state machine + per-frame orchestration tying every module together.

import { BlockField, FLIGHT_TIME, SLICE_Z } from './blocks.js';
import { Scheduler } from './scheduler.js';
import { buildBeatmap } from './beatmap.js';
import { createScoreState, applyHit, applyMiss, accuracy, isFailed } from './scoring.js';
import { judgeSlice } from './slicing.js';

export const State = { MENU: 'menu', PLAYING: 'playing', RESULTS: 'results' };

export class Game {
  constructor({ scene, audio, hud, popups, onResults }) {
    this.scene = scene;
    this.audio = audio;
    this.hud = hud;
    this.popups = popups;
    this.onResults = onResults;

    this.field = new BlockField(scene);
    this.scheduler = new Scheduler(buildBeatmap(), FLIGHT_TIME);
    this.score = createScoreState();
    this.state = State.MENU;
    this.input = null;
  }

  setInput(input) {
    if (this.input && this.input !== input) this.input.setEnabled(false);
    this.input = input;
    if (input) input.setEnabled(true);
  }

  start() {
    if (this.state === State.PLAYING) return;
    this.score = createScoreState();
    this.scheduler.reset();
    this.field.clear();
    this.audio.start();
    this.state = State.PLAYING;
  }

  toMenu() {
    this.state = State.MENU;
    this.audio.stop();
    this.field.clear();
  }

  update(dt) {
    if (this.input) this.input.update(dt);
    this.popups.update(dt);

    if (this.state !== State.PLAYING) {
      this.hud.update(this.score, this.state === State.RESULTS ? 'RESULTS' : 'PULSE SLICE');
      return;
    }

    const songTime = this.audio.songTime();

    // spawn blocks whose travel should begin now
    for (const note of this.scheduler.due(songTime)) this.field.spawn(note);

    // slicing: a block is only "hit" on a valid slice (right color + direction)
    const sabers = this.input ? this.input.activeSabers() : [];
    for (const block of this.field.blocks) {
      if (block.sliced || !block.inSliceZone()) continue;
      for (const saber of sabers) {
        if (saber.color !== block.color) continue;
        if (!saber.intersectsAABB(block.aabb())) continue;
        const verdict = judgeSlice(saber.color, saber.planarSwing(), block);
        if (verdict.ok) {
          block.kill();
          const pts = applyHit(this.score, verdict.speed);
          this.popups.spawn(`+${pts}`, '#6cf0c2', block.object.position.clone());
          break;
        }
      }
    }

    // blocks that flew past unsliced -> miss
    const missed = this.field.update(dt);
    for (const m of missed) {
      applyMiss(this.score);
      this.popups.spawn('MISS', '#ff5a6a', { x: m.object.position.x, y: m.object.position.y, z: SLICE_Z });
    }

    this.hud.update(this.score, `${Math.round(accuracy(this.score) * 100)}% acc`);

    if (isFailed(this.score) || (this.scheduler.finished(songTime) && this.field.blocks.length === 0)) {
      this._finish(isFailed(this.score));
    }
  }

  _finish(failed) {
    this.state = State.RESULTS;
    this.audio.stop();
    this.field.clear();
    if (this.onResults) {
      this.onResults({
        failed,
        score: this.score.score,
        maxCombo: this.score.maxCombo,
        accuracy: Math.round(accuracy(this.score) * 100),
      });
    }
  }
}
