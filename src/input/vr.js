// input/vr.js — WebXR controllers drive the sabers.
// Left controller = RED saber, right = BLUE (Beat Saber convention).

export class VRInput {
  constructor(renderer, scene, redSaber, blueSaber, onSelectStart) {
    this.renderer = renderer;
    this.red = redSaber;
    this.blue = blueSaber;
    this.onSelectStart = onSelectStart;
    this.grips = [];
    this.controllers = [];
    this.enabled = false;

    for (let i = 0; i < 2; i++) {
      const grip = renderer.xr.getControllerGrip(i);
      const controller = renderer.xr.getController(i);
      grip.userData.index = i;
      scene.add(grip);
      scene.add(controller);
      this.controllers.push(controller);

      controller.addEventListener('selectstart', () => {
        if (this.onSelectStart) this.onSelectStart();
      });
      controller.addEventListener('connected', (e) => {
        const hand = e.data && e.data.handedness;
        const saber = hand === 'left' ? this.red : this.blue;
        // move any existing saber off this grip, then attach the right one
        this._attach(grip, saber);
      });
      controller.addEventListener('disconnected', () => {
        this._detach(grip);
      });

      this.grips.push(grip);
    }
  }

  _attach(grip, saber) {
    if (saber.group.parent) saber.group.parent.remove(saber.group);
    grip.add(saber.group);
    grip.userData.saber = saber;
  }
  _detach(grip) {
    const saber = grip.userData.saber;
    if (saber && saber.group.parent === grip) grip.remove(saber.group);
    grip.userData.saber = null;
  }

  setEnabled(on) {
    this.enabled = on;
    this.red.group.visible = on;
    this.blue.group.visible = on;
  }

  activeSabers() {
    return [this.red, this.blue];
  }

  update(dt) {
    if (!this.enabled) return;
    this.red.updateKinematics(dt);
    this.blue.updateKinematics(dt);
  }
}
