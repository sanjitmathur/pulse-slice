// sabers.js — the two sabers: blade mesh, per-frame tip velocity, collision.

import * as THREE from 'three';

const COLOR_HEX = { red: 0xff2d55, blue: 0x2d7dff };
const BLADE_LEN = 0.8;

export class Saber {
  constructor(color) {
    this.color = color;
    this.group = new THREE.Group();

    // handle
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 })
    );
    handle.position.y = 0.08;

    // blade (points +Y from the handle)
    const blade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.016, BLADE_LEN, 12),
      new THREE.MeshStandardMaterial({
        color: COLOR_HEX[color],
        emissive: COLOR_HEX[color],
        emissiveIntensity: 1.2,
        metalness: 0.1,
        roughness: 0.2,
      })
    );
    blade.position.y = 0.16 + BLADE_LEN / 2;

    this.group.add(handle, blade);

    this._tip = new THREE.Vector3();
    this._prevTip = new THREE.Vector3();
    this._base = new THREE.Vector3();
    this.velocity = new THREE.Vector3(); // world-space tip velocity
    this._initialized = false;
  }

  // Local tip offset (end of blade) in the saber's own space.
  _localTip() {
    return new THREE.Vector3(0, 0.16 + BLADE_LEN, 0);
  }
  _localBase() {
    return new THREE.Vector3(0, 0.16, 0);
  }

  // Call once per frame after the group's transform is set.
  updateKinematics(dt) {
    this.group.updateMatrixWorld(true);
    this._prevTip.copy(this._tip);
    this._tip.copy(this._localTip()).applyMatrix4(this.group.matrixWorld);
    this._base.copy(this._localBase()).applyMatrix4(this.group.matrixWorld);
    if (!this._initialized) { this._prevTip.copy(this._tip); this._initialized = true; }
    if (dt > 0) this.velocity.copy(this._tip).sub(this._prevTip).divideScalar(dt);
  }

  get tip() { return this._tip; }
  get base() { return this._base; }

  // Swing projected onto the slice plane (x right, y up). Used for arrow match.
  planarSwing() {
    return { x: this.velocity.x, y: this.velocity.y };
  }

  // Does the blade segment (base->tip) intersect a block's AABB this frame?
  intersectsAABB(aabb) {
    return segmentIntersectsAABB(this._base, this._tip, aabb);
  }
}

// Slab-method segment vs AABB.
function segmentIntersectsAABB(p0, p1, box) {
  const d = { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z };
  let tmin = 0, tmax = 1;
  for (const ax of ['x', 'y', 'z']) {
    if (Math.abs(d[ax]) < 1e-8) {
      if (p0[ax] < box.min[ax] || p0[ax] > box.max[ax]) return false;
    } else {
      let t1 = (box.min[ax] - p0[ax]) / d[ax];
      let t2 = (box.max[ax] - p0[ax]) / d[ax];
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}

export { segmentIntersectsAABB };
