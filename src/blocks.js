// blocks.js — the flying note-blocks: geometry, color, arrow, motion, AABB.

import * as THREE from 'three';
import { GRID_COLS, GRID_ROWS } from './beatmap.js';

export const SPAWN_Z = -12;
export const SLICE_Z = -0.45;
export const FLIGHT_TIME = 1.9;                       // seconds spawn -> slice plane
export const SPEED = (SLICE_Z - SPAWN_Z) / FLIGHT_TIME; // +z m/s
const DESPAWN_Z = 0.8;                                // past the player = missed
const SIZE = 0.34;

const COLOR_HEX = { red: 0xff2d55, blue: 0x2d7dff };

// Grid -> world position. 4 cols centered on x, 3 rows around chest height.
export function cellToWorld(col, row) {
  const x = (col - (GRID_COLS - 1) / 2) * 0.46;
  const y = 1.05 + row * 0.42;
  return { x, y };
}

const ARROW_ROT = { up: 0, right: -Math.PI / 2, down: Math.PI, left: Math.PI / 2, any: 0 };

function makeArrowMesh(dir) {
  if (dir === 'any') {
    const geo = new THREE.SphereGeometry(0.06, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    return new THREE.Mesh(geo, mat);
  }
  const geo = new THREE.ConeGeometry(0.09, 0.16, 3);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.z = ARROW_ROT[dir];
  return m;
}

export class Block {
  constructor(note) {
    this.note = note;
    this.color = note.color;
    this.dir = note.dir;
    this.dead = false;
    this.sliced = false;

    const { x, y } = cellToWorld(note.col, note.row);
    const group = new THREE.Group();
    group.position.set(x, y, SPAWN_Z);

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(SIZE, SIZE, SIZE),
      new THREE.MeshStandardMaterial({
        color: COLOR_HEX[note.color],
        emissive: COLOR_HEX[note.color],
        emissiveIntensity: 0.45,
        metalness: 0.3,
        roughness: 0.4,
      })
    );
    group.add(cube);

    const arrow = makeArrowMesh(note.dir);
    arrow.position.z = SIZE / 2 + 0.01; // on the face toward the player
    group.add(arrow);

    this.object = group;
    this.cube = cube;
    this.half = SIZE / 2;
  }

  update(dt) {
    if (this.sliced) {
      // brief fly-apart on hit
      this.object.position.z += SPEED * dt;
      this.object.scale.multiplyScalar(1 - 3 * dt);
      this.object.rotation.x += 8 * dt;
      if (this.object.scale.x < 0.05) this.dead = true;
      return;
    }
    this.object.position.z += SPEED * dt;
    if (this.object.position.z > DESPAWN_Z) this.dead = true; // missed
  }

  // Is this block currently inside the slice zone (near the plane)?
  inSliceZone() {
    return Math.abs(this.object.position.z - SLICE_Z) < 0.35;
  }

  // World-space AABB for collision tests.
  aabb() {
    const p = this.object.position;
    return {
      min: { x: p.x - this.half, y: p.y - this.half, z: p.z - this.half },
      max: { x: p.x + this.half, y: p.y + this.half, z: p.z + this.half },
    };
  }

  kill() {
    this.sliced = true;
  }
}

export class BlockField {
  constructor(scene) {
    this.scene = scene;
    this.blocks = [];
  }

  spawn(note) {
    const b = new Block(note);
    this.scene.add(b.object);
    this.blocks.push(b);
    return b;
  }

  update(dt) {
    const missed = [];
    for (const b of this.blocks) {
      const wasLive = !b.sliced;
      b.update(dt);
      if (b.dead && wasLive && !b.sliced) missed.push(b);
    }
    // remove dead
    this.blocks = this.blocks.filter((b) => {
      if (b.dead) { this.scene.remove(b.object); disposeGroup(b.object); }
      return !b.dead;
    });
    return missed; // blocks that flew past unsliced this frame
  }

  clear() {
    for (const b of this.blocks) { this.scene.remove(b.object); disposeGroup(b.object); }
    this.blocks = [];
  }
}

function disposeGroup(group) {
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
}
