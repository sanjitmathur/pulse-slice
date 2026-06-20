// audio.js — procedurally synthesized chiptune + the master song clock.
// No external audio files. To use a real track instead, see loadTrack() below.

import { BEAT, SONG_LENGTH } from './beatmap.js';

const A = 440;
const note = (semitonesFromA) => A * Math.pow(2, semitonesFromA / 12);

// A simple looping progression (semitone offsets from A4) — moody synthwave-ish.
const BASS = [-24, -24, -17, -19];                 // root notes per bar
const ARP = [0, 4, 7, 12, 7, 4, 0, -5];            // eighth-note arpeggio

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.startTime = 0;
    this.master = null;
    this._timer = null;
    this._nextNoteTime = 0;
    this._step = 0; // eighth-note counter
    this.muted = false;
  }

  // Must be called from a user gesture (click / VR select).
  async start() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    await this.ctx.resume();
    this.startTime = this.ctx.currentTime + 0.1; // small lead-in
    this._nextNoteTime = this.startTime;
    this._step = 0;
    this._scheduleLoop();
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      setTimeout(() => { if (this.master) this.master.gain.value = 0.5; }, 200);
    }
  }

  // Seconds elapsed since the song began. This is the game's master clock.
  songTime() {
    if (!this.ctx) return 0;
    return this.ctx.currentTime - this.startTime;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  // --- synthesis ---------------------------------------------------------
  _scheduleLoop() {
    const lookahead = 0.1;   // schedule 100ms ahead
    const interval = 25;     // ms
    this._timer = setInterval(() => {
      if (!this.ctx) return;
      while (this._nextNoteTime < this.ctx.currentTime + lookahead) {
        this._scheduleStep(this._step, this._nextNoteTime);
        this._nextNoteTime += BEAT / 2; // eighth notes
        this._step++;
        if (this.songTime() > SONG_LENGTH + 1) { this.stop(); break; }
      }
    }, interval);
  }

  _scheduleStep(step, when) {
    const bar = Math.floor(step / 8) % BASS.length;
    const eighth = step % 8;

    // Kick on every beat (every 2 eighths).
    if (eighth % 2 === 0) this._kick(when);
    // Hi-hat on the off-beats.
    if (eighth % 2 === 1) this._hat(when);
    // Bass on the downbeat of each bar-quarter.
    if (eighth % 4 === 0) this._tone(note(BASS[bar]), when, 0.45, 'sawtooth', 0.18);
    // Arpeggio lead.
    this._tone(note(BASS[bar] + 24 + ARP[eighth]), when, 0.18, 'square', 0.08);
  }

  _tone(freq, when, dur, type, gain) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(this.master);
    o.start(when);
    o.stop(when + dur + 0.02);
  }

  _kick(when) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, when);
    o.frequency.exponentialRampToValueAtTime(45, when + 0.12);
    g.gain.setValueAtTime(0.6, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.15);
    o.connect(g).connect(this.master);
    o.start(when);
    o.stop(when + 0.16);
  }

  _hat(when) {
    const bufSize = this.ctx.sampleRate * 0.05;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    src.connect(hp).connect(g).connect(this.master);
    src.start(when);
    src.stop(when + 0.05);
  }

  // --- swap point: load a real audio file instead of synthesis -----------
  // async loadTrack(url) {
  //   const res = await fetch(url);
  //   const buf = await this.ctx.decodeAudioData(await res.arrayBuffer());
  //   this._track = buf; // then play via a BufferSource in start()
  // }
}
