// main.js — bootstrap: scene, lights, environment, XR, sabers, inputs, loop.

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

import { Saber } from './sabers.js';
import { Hud, Popups } from './hud.js';
import { AudioEngine } from './audio.js';
import { Game } from './game.js';
import { DesktopInput } from './input/desktop.js';
import { VRInput } from './input/vr.js';
import { SLICE_Z } from './blocks.js';

// ---- renderer / scene / camera -------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060d);
scene.fog = new THREE.Fog(0x05060d, 6, 16);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.set(0, 1.4, 0); // desktop eye height; ignored while in XR

// ---- environment ----------------------------------------------------------
scene.add(new THREE.AmbientLight(0x6070a0, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 0.8);
key.position.set(2, 6, 2);
scene.add(key);
const pRed = new THREE.PointLight(0xff2d55, 0.6, 20); pRed.position.set(-3, 2, -6); scene.add(pRed);
const pBlue = new THREE.PointLight(0x2d7dff, 0.6, 20); pBlue.position.set(3, 2, -6); scene.add(pBlue);

const grid = new THREE.GridHelper(40, 40, 0x2d7dff, 0x16203a);
grid.position.y = 0;
scene.add(grid);

// a glowing frame around the slice plane to orient the player
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(1.6, 0.02, 8, 48),
  new THREE.MeshBasicMaterial({ color: 0x2d7dff })
);
ring.position.set(0, 1.45, SLICE_Z - 0.05);
ring.scale.set(1.1, 0.9, 1);
scene.add(ring);

// ---- game pieces ----------------------------------------------------------
const hud = new Hud();
scene.add(hud.mesh);
const popups = new Popups(scene);
const audio = new AudioEngine();

const redSaber = new Saber('red');
const blueSaber = new Saber('blue');
scene.add(redSaber.group, blueSaber.group);

const game = new Game({ scene, audio, hud, popups, onResults: showResults });

const desktopInput = new DesktopInput(renderer, camera, redSaber, blueSaber);
const vrInput = new VRInput(renderer, scene, redSaber, blueSaber, () => game.start());

// ---- DOM menu / results wiring -------------------------------------------
const overlay = document.getElementById('overlay');
const menuCard = document.getElementById('menu');
const resultsCard = document.getElementById('results');

function showOverlay(which) {
  overlay.classList.remove('hidden');
  menuCard.style.display = which === 'menu' ? 'block' : 'none';
  resultsCard.style.display = which === 'results' ? 'block' : 'none';
}
function hideOverlay() { overlay.classList.add('hidden'); }

document.getElementById('playDesktop').addEventListener('click', () => {
  reattachSabersToScene();
  game.setInput(desktopInput);
  hideOverlay();
  game.start();
});

document.getElementById('playAgain').addEventListener('click', () => {
  hideOverlay();
  game.start();
});
document.getElementById('backMenu').addEventListener('click', () => {
  game.toMenu();
  showOverlay('menu');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { game.toMenu(); showOverlay('menu'); }
  if (e.key === 'm' || e.key === 'M') audio.toggleMute();
});

function showResults(r) {
  document.getElementById('resultTitle').textContent = r.failed ? 'OUT OF ENERGY' : 'SONG COMPLETE';
  document.getElementById('rScore').textContent = r.score.toLocaleString();
  document.getElementById('rCombo').textContent = r.maxCombo;
  document.getElementById('rAcc').textContent = r.accuracy + '%';
  showOverlay('results');
}

// ---- VR session: route input to controllers ------------------------------
// Restyle the VRButton then host it next to our menu button.
const vrButton = VRButton.createButton(renderer);
vrButton.style.position = 'fixed';
vrButton.style.bottom = '18px';
document.body.appendChild(vrButton);

document.getElementById('enterVR').addEventListener('click', () => vrButton.click());

renderer.xr.addEventListener('sessionstart', () => {
  game.setInput(vrInput);
  hideOverlay();
  game.toMenu(); // wait in-world until the player pulls a trigger
});
renderer.xr.addEventListener('sessionend', () => {
  reattachSabersToScene();
  game.setInput(desktopInput);
  game.toMenu();
  showOverlay('menu');
});

function reattachSabersToScene() {
  for (const s of [redSaber, blueSaber]) {
    if (s.group.parent && s.group.parent !== scene) s.group.parent.remove(s.group);
    if (s.group.parent !== scene) scene.add(s.group);
  }
}

// ---- resize + loop --------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  game.update(dt);
  renderer.render(scene, camera);
});

showOverlay('menu');
