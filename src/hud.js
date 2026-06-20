// hud.js — in-world canvas-texture panel (score/combo/energy). Visible in both
// desktop and VR because it lives in the 3D scene, not the DOM.

import * as THREE from 'three';
import { MAX_ENERGY } from './scoring.js';

export class Hud {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    this.cx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    const mat = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
    const geo = new THREE.PlaneGeometry(1.2, 0.6);
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(0, 2.25, -2.4); // floating up and ahead
  }

  update(state, message) {
    const c = this.cx;
    c.clearRect(0, 0, 512, 256);

    // panel bg
    c.fillStyle = 'rgba(8,10,20,0.55)';
    roundRect(c, 0, 0, 512, 256, 24);
    c.fill();

    c.textAlign = 'center';
    c.fillStyle = '#e8ecff';
    c.font = 'bold 64px system-ui, sans-serif';
    c.fillText(state.score.toLocaleString(), 256, 80);

    c.font = 'bold 40px system-ui, sans-serif';
    c.fillStyle = state.combo > 0 ? '#6cf0c2' : '#7a86b8';
    c.fillText(`${state.combo}x combo`, 256, 135);

    // energy bar
    const bw = 400, bh = 26, bx = 56, by = 175;
    c.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(c, bx, by, bw, bh, 13); c.fill();
    const frac = Math.max(0, state.energy / MAX_ENERGY);
    c.fillStyle = frac > 0.4 ? '#37e0a0' : '#ff5a6a';
    roundRect(c, bx, by, bw * frac, bh, 13); c.fill();

    if (message) {
      c.font = 'bold 34px system-ui, sans-serif';
      c.fillStyle = '#ffd34d';
      c.fillText(message, 256, 235);
    }

    this.texture.needsUpdate = true;
  }
}

// Floating "+points" / "MISS" popups in front of the player.
export class Popups {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  spawn(text, color, worldPos) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const c = canvas.getContext('2d');
    c.textAlign = 'center';
    c.font = 'bold 72px system-ui, sans-serif';
    c.fillStyle = color;
    c.fillText(text, 128, 88);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(0.5, 0.25, 1);
    sprite.position.copy(worldPos);
    this.scene.add(sprite);
    this.items.push({ sprite, tex, life: 0.7 });
  }

  update(dt) {
    for (const it of this.items) {
      it.life -= dt;
      it.sprite.position.y += dt * 0.6;
      it.sprite.material.opacity = Math.max(0, it.life / 0.7);
    }
    this.items = this.items.filter((it) => {
      if (it.life <= 0) { this.scene.remove(it.sprite); it.tex.dispose(); it.sprite.material.dispose(); }
      return it.life > 0;
    });
  }
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
