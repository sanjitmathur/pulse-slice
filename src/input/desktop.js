// input/desktop.js — mouse drives the saber on the slice plane.
// Hold Left-click = BLUE saber, Right-click = RED saber (default blue).

import * as THREE from 'three';
import { SLICE_Z } from '../blocks.js';

const BLADE_CENTER_OFFSET = 0.16 + 0.8 / 2; // handle + half blade

export class DesktopInput {
  constructor(renderer, camera, redSaber, blueSaber) {
    this.renderer = renderer;
    this.camera = camera;
    this.red = redSaber;
    this.blue = blueSaber;

    this.activeColor = 'blue';
    this.target = new THREE.Vector3(0, 1.4, SLICE_Z);
    this._ndc = new THREE.Vector2(0, 0);
    this._ray = new THREE.Raycaster();
    this._plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -SLICE_Z);

    this.enabled = false;
    this._bind();
    // Park the red saber off to the side until used.
    this.red.group.position.set(-2, 1.0, SLICE_Z);
    this.blue.group.position.set(0, 1.4, SLICE_Z);
  }

  _bind() {
    const el = this.renderer.domElement;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      this._ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      this._ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    });
    el.addEventListener('pointerdown', (e) => {
      if (e.button === 0) this.activeColor = 'blue';
      if (e.button === 2) this.activeColor = 'red';
    });
  }

  setEnabled(on) {
    this.enabled = on;
    this.red.group.visible = on;
    this.blue.group.visible = on;
  }

  // Returns the saber objects that should be checked for slicing this frame.
  activeSabers() {
    return this.activeColor === 'red' ? [this.red] : [this.blue];
  }

  update(dt) {
    if (!this.enabled) return;
    this._ray.setFromCamera(this._ndc, this.camera);
    const hit = new THREE.Vector3();
    if (this._ray.ray.intersectPlane(this._plane, hit)) {
      this.target.copy(hit);
    }
    const active = this.activeColor === 'red' ? this.red : this.blue;
    const idle = this.activeColor === 'red' ? this.blue : this.red;

    active.group.position.set(this.target.x, this.target.y - BLADE_CENTER_OFFSET, SLICE_Z);
    // keep the idle saber near the bottom edge, ready to swap in
    idle.group.position.lerp(
      new THREE.Vector3(this.activeColor === 'red' ? 1.4 : -1.4, 0.4, SLICE_Z),
      Math.min(1, dt * 6)
    );

    this.red.updateKinematics(dt);
    this.blue.updateKinematics(dt);
  }
}
