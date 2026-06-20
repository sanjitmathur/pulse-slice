// scheduler.js — decides when each beatmap note becomes a flying block so it
// ARRIVES at the slice plane exactly on its beat. Pure-ish (holds an index).

export function spawnTime(note, flightTime) {
  return note.t - flightTime;
}

export class Scheduler {
  // notes must be sorted ascending by t.
  constructor(notes, flightTime) {
    this.notes = notes;
    this.flightTime = flightTime;
    this.index = 0;
  }

  reset() {
    this.index = 0;
  }

  // Return every note whose spawn time has arrived since the last call.
  due(songTime) {
    const out = [];
    while (
      this.index < this.notes.length &&
      spawnTime(this.notes[this.index], this.flightTime) <= songTime
    ) {
      out.push(this.notes[this.index]);
      this.index++;
    }
    return out;
  }

  finished(songTime) {
    return this.index >= this.notes.length && songTime > this.lastBeat() + 1;
  }

  lastBeat() {
    return this.notes.length ? this.notes[this.notes.length - 1].t : 0;
  }
}
