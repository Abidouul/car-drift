import './style.css';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.querySelector('#scene');
const hud = document.querySelector('.hud');
const speedEl = document.querySelector('#speed');
const angleEl = document.querySelector('#angle');
const statusEl = document.querySelector('#status');
const modeToggle = document.querySelector('#mode-toggle');
const cameraZoom = document.querySelector('#camera-zoom');
const cameraAngle = document.querySelector('#camera-angle');
const menuOverlay = document.querySelector('.menu-overlay');
const playButton = document.querySelector('#play-button');
const optionsButton = document.querySelector('#options-button');
const quitButton = document.querySelector('#quit-button');
const shadowsToggle = document.querySelector('#shadows-toggle');
const keybindButtons = [...document.querySelectorAll('[data-bind-action]')];
const keybindStatusEl = document.querySelector('#keybind-status');
const resetBindingsButton = document.querySelector('#reset-bindings');
const graphicsPresetSelect = document.querySelector('#graphics-preset');
const resolutionScaleInput = document.querySelector('#resolution-scale');
const resolutionValueEl = document.querySelector('#resolution-value');
const panels = {
  main: document.querySelector('[data-panel="main"]'),
  levels: document.querySelector('[data-panel="levels"]'),
  options: document.querySelector('[data-panel="options"]'),
  quit: document.querySelector('[data-panel="quit"]'),
};

const movementActions = ['up', 'left', 'right', 'down'];
const actionLabels = {
  up: 'Forward',
  left: 'Left',
  right: 'Right',
  down: 'Reverse',
};
const keyBindingStorageKey = 'driftDonut.keyBindings.v1';
const defaultKeyBindings = {
  up: { key: 'z', code: 'KeyW', label: 'Z' },
  left: { key: 'q', code: 'KeyA', label: 'Q' },
  right: { key: 'd', code: 'KeyD', label: 'D' },
  down: { key: 's', code: 'KeyS', label: 'S' },
};

const smallMachine = (navigator.deviceMemory && navigator.deviceMemory <= 4)
  || navigator.hardwareConcurrency <= 4
  || window.matchMedia('(max-width: 640px)').matches;
const graphicsStorageKey = 'driftDonut.graphics.v1';
const graphicsPresets = {
  high: {
    label: 'High',
    defaultResolutionScale: 100,
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    shadowType: THREE.PCFSoftShadowMap,
    smokeParticles: 180,
    smokeTextureSize: 96,
    skidPoints: 320,
    smoke: true,
    skid: true,
    wheelBlur: true,
    optionalLights: true,
    levelLights: true,
    fogDensityMultiplier: 1,
  },
  medium: {
    label: 'Medium',
    defaultResolutionScale: smallMachine ? 52 : 70,
    antialias: !smallMachine,
    shadows: true,
    shadowMapSize: 768,
    shadowType: THREE.PCFShadowMap,
    smokeParticles: 120,
    smokeTextureSize: 64,
    skidPoints: 240,
    smoke: true,
    skid: true,
    wheelBlur: true,
    optionalLights: true,
    levelLights: false,
    fogDensityMultiplier: 0.9,
  },
  low: {
    label: 'Low',
    defaultResolutionScale: 28,
    antialias: false,
    shadows: false,
    shadowMapSize: 384,
    shadowType: THREE.BasicShadowMap,
    smokeParticles: 48,
    smokeTextureSize: 48,
    skidPoints: 120,
    smoke: true,
    skid: true,
    wheelBlur: false,
    optionalLights: false,
    levelLights: false,
    fogDensityMultiplier: 0.6,
  },
  lowest: {
    label: 'Lowest',
    defaultResolutionScale: 0,
    antialias: false,
    shadows: false,
    shadowMapSize: 128,
    shadowType: THREE.BasicShadowMap,
    smokeParticles: 0,
    smokeTextureSize: 32,
    skidPoints: 2,
    smoke: false,
    skid: false,
    wheelBlur: false,
    optionalLights: false,
    levelLights: false,
    fogDensityMultiplier: 0,
  },
};
let graphicsSettings = loadGraphicsSettings();
let keyLight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07090a);
scene.fog = new THREE.FogExp2(0x07090a, 0.022);

const camera = new THREE.PerspectiveCamera(getResponsiveFov(), window.innerWidth / window.innerHeight, 0.1, 180);
camera.position.set(-9, 7, 12);

const renderer = new THREE.WebGLRenderer({
  antialias: getGraphicsProfile().antialias,
  canvas,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(getRenderPixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = graphicsSettings.shadows && getGraphicsProfile().shadows;
renderer.shadowMap.type = getGraphicsProfile().shadowType;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const clock = new THREE.Clock();
const world = new THREE.Group();
scene.add(world);

const state = {
  elapsed: 0,
  paused: true,
  manual: false,
  screen: 'menu',
  level: 0,
  shadows: graphicsSettings.shadows,
  levelFogDensity: 0.022,
  cameraZoom: 1,
  cameraAngle: 0,
  cameraHeight: 1,
  bindingTarget: null,
  keyBindings: loadKeyBindings(),
  pointer: {
    active: false,
    lastX: 0,
    lastY: 0,
  },
  smokeAccumulator: 0,
  input: {
    up: false,
    down: false,
    left: false,
    right: false,
  },
  vehicle: {
    position: new THREE.Vector3(5.65, 0, 0),
    velocity: new THREE.Vector3(0, 0, 7.4),
    yaw: 2.42,
    yawRate: 0.72,
    steer: 0,
    throttle: 1,
    wheelSpinFront: 0,
    wheelSpinRear: 0,
    rearSlip: 0,
    frontSlip: 0,
    lateralG: 0,
  },
};

const sim = {
  targetRadius: 5.45,
  targetSpeed: 5.95,
  driftAngle: THREE.MathUtils.degToRad(61),
  wheelbase: 2.8,
  frontAxleZ: -1.42,
  rearAxleZ: 1.38,
  track: 2.18,
  mass: 1,
  inertia: 4.2,
  driveForce: 16.8,
  frontGrip: 17,
  rearGrip: 3.1,
  frontCornering: 12.5,
  rearCornering: 4.8,
};

setupLights();
const levelSystem = createGround();
const car = createCar();
world.add(car.root);
const smokeSystem = createSmokeSystem();
const skidSystem = createSkidSystem();
state.vehicle.contacts = createWheelContactData();
levelSystem.setLevel(0);
renderGraphicsSettings();
applyGraphicsSettings();

canvas.addEventListener('pointerdown', (event) => {
  if (state.screen !== 'playing') return;
  state.pointer.active = true;
  state.pointer.lastX = event.clientX;
  state.pointer.lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!state.pointer.active) return;

  const deltaX = event.clientX - state.pointer.lastX;
  const deltaY = event.clientY - state.pointer.lastY;
  state.pointer.lastX = event.clientX;
  state.pointer.lastY = event.clientY;

  state.cameraAngle = normalizeCameraAngle(state.cameraAngle - deltaX * 0.008);
  state.cameraHeight = THREE.MathUtils.clamp(state.cameraHeight - deltaY * 0.006, 0.45, 1.9);
  cameraAngle.value = String(Math.round(THREE.MathUtils.radToDeg(state.cameraAngle)));
});

canvas.addEventListener('pointerup', (event) => {
  state.pointer.active = false;
  canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener('pointercancel', () => {
  state.pointer.active = false;
});

canvas.addEventListener('wheel', (event) => {
  if (state.screen !== 'playing') return;
  event.preventDefault();
  state.cameraZoom = THREE.MathUtils.clamp(state.cameraZoom + event.deltaY * 0.001, 0.65, 1.65);
  cameraZoom.value = state.cameraZoom.toFixed(2);
}, { passive: false });

playButton.addEventListener('click', () => {
  showMenuPanel('levels');
});

optionsButton.addEventListener('click', () => {
  showMenuPanel('options');
});

quitButton.addEventListener('click', () => {
  quitGame();
});

for (const button of document.querySelectorAll('[data-level]')) {
  button.addEventListener('click', () => {
    startLevel(Number(button.dataset.level));
  });
}

for (const button of document.querySelectorAll('[data-back-menu]')) {
  button.addEventListener('click', () => {
    showMainMenu();
  });
}

shadowsToggle.addEventListener('change', () => {
  setShadows(shadowsToggle.checked);
});

for (const button of keybindButtons) {
  button.addEventListener('click', () => {
    startKeyBinding(button.dataset.bindAction);
  });
}

resetBindingsButton.addEventListener('click', () => {
  state.bindingTarget = null;
  state.keyBindings = cloneDefaultKeyBindings();
  saveKeyBindings();
  clearMovementInput();
  renderKeyBindings('Controls reset');
});

graphicsPresetSelect.addEventListener('change', () => {
  const preset = graphicsPresets[graphicsPresetSelect.value] ? graphicsPresetSelect.value : 'medium';
  const profile = graphicsPresets[preset];
  graphicsSettings = {
    preset,
    resolutionScale: profile.defaultResolutionScale,
    shadows: profile.shadows,
  };
  saveGraphicsSettings();
  renderGraphicsSettings();
  applyGraphicsSettings();
});

resolutionScaleInput.addEventListener('input', () => {
  graphicsSettings.resolutionScale = Number(resolutionScaleInput.value);
  saveGraphicsSettings();
  renderGraphicsSettings();
  applyGraphicsSettings();
});

modeToggle.addEventListener('click', () => {
  state.manual = !state.manual;
  modeToggle.textContent = state.manual ? 'Play auto' : 'Play manual';
  resetVehicle(state.manual);
  updateStatusText();
});

cameraZoom.addEventListener('input', () => {
  state.cameraZoom = Number(cameraZoom.value);
});

cameraAngle.addEventListener('input', () => {
  state.cameraAngle = THREE.MathUtils.degToRad(Number(cameraAngle.value));
});

window.addEventListener('keydown', (event) => {
  if (state.bindingTarget) {
    captureKeyBinding(event);
    return;
  }

  if (event.key === 'Escape') {
    showMainMenu();
    return;
  }

  if (!isMovementKey(event)) return;
  event.preventDefault();
  setMovementInput(event, true);
});

window.addEventListener('keyup', (event) => {
  if (!isMovementKey(event)) return;
  event.preventDefault();
  setMovementInput(event, false);
});

window.addEventListener('resize', onResize);
renderKeyBindings();
showMainMenu();
animate();

function setupLights() {
  const hemi = new THREE.HemisphereLight(0xd8f5ff, 0x263124, 1.9);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff0cd, 4.2);
  key.position.set(-10, 15, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(getGraphicsProfile().shadowMapSize, getGraphicsProfile().shadowMapSize);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 48;
  key.shadow.camera.left = -20;
  key.shadow.camera.right = 20;
  key.shadow.camera.top = 20;
  key.shadow.camera.bottom = -20;
  scene.add(key);
  keyLight = key;

  const rim = new THREE.PointLight(0x91e5ff, 70, 32, 2.2);
  rim.position.set(8, 4, -9);
  rim.userData.optionalLight = true;
  scene.add(rim);

  const warm = new THREE.PointLight(0xff7040, 22, 18, 2.4);
  warm.position.set(-6, 2.4, 8);
  warm.userData.optionalLight = true;
  scene.add(warm);
}

function createGround() {
  const levelDecor = new THREE.Group();
  world.add(levelDecor);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(96, 96),
    new THREE.MeshStandardMaterial({
      color: 0x20261f,
      roughness: 0.9,
      metalness: 0.01,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  const grid = new THREE.GridHelper(86, 86, 0x5d6c62, 0x323c35);
  grid.position.y = 0.012;
  grid.material.transparent = true;
  grid.material.opacity = 0.2;
  world.add(grid);

  const donutGuide = new THREE.Mesh(
    new THREE.RingGeometry(sim.targetRadius - 0.05, sim.targetRadius + 0.05, 160),
    new THREE.MeshBasicMaterial({
      color: 0xb9c6a9,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
    }),
  );
  donutGuide.rotation.x = -Math.PI / 2;
  donutGuide.position.y = 0.021;
  world.add(donutGuide);

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.08, 36),
    new THREE.MeshStandardMaterial({
      color: 0xffdf70,
      emissive: 0x906314,
      emissiveIntensity: 0.45,
      roughness: 0.46,
    }),
  );
  inner.position.y = 0.05;
  inner.castShadow = true;
  world.add(inner);

  const levels = [
    {
      background: 0x07090a,
      fog: 0x07090a,
      fogDensity: 0.022,
      ground: 0x20261f,
      gridMain: 0x5d6c62,
      guide: 0xb9c6a9,
      center: 0xffdf70,
      props: createDockyardProps,
    },
    {
      background: 0x071018,
      fog: 0x071018,
      fogDensity: 0.03,
      ground: 0x27343a,
      gridMain: 0x7ea8b4,
      guide: 0xa9d9ee,
      center: 0x9fe7ff,
      props: createFrostTerminalProps,
    },
  ];

  return {
    setLevel(index) {
      const level = levels[index] ?? levels[0];
      scene.background = new THREE.Color(level.background);
      scene.fog.color.setHex(level.fog);
      state.levelFogDensity = level.fogDensity;
      scene.fog.density = getCurrentLevelFogDensity();
      ground.material.color.setHex(level.ground);
      grid.material.color?.setHex(level.gridMain);
      donutGuide.material.color.setHex(level.guide);
      inner.material.color.setHex(level.center);
      inner.material.emissive.setHex(level.center);

      disposeObjectTree(levelDecor);
      levelDecor.clear();
      level.props(levelDecor);
      applyGraphicsSettings();
    },
  };
}

function createDockyardProps(parent) {
  const containerColors = [0x1f6f8b, 0xa43f2b, 0xd19d32, 0x38454d];
  const containerGeometry = new THREE.BoxGeometry(2.8, 1.1, 1.15);
  const containerMaterials = containerColors.map((color) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.74,
    metalness: 0.18,
  }));
  const coneGeometry = new THREE.ConeGeometry(0.18, 0.52, 14);
  const coneMaterial = new THREE.MeshStandardMaterial({
    color: 0xff7a1a,
    roughness: 0.62,
  });
  const poleGeometry = new THREE.CylinderGeometry(0.07, 0.07, 4.2, 10);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3334, roughness: 0.5, metalness: 0.2 });

  for (let i = 0; i < 10; i += 1) {
    const stack = new THREE.Group();
    const box = new THREE.Mesh(containerGeometry, containerMaterials[i % containerMaterials.length]);
    box.castShadow = true;
    box.receiveShadow = true;
    stack.add(box);
    const angle = (i / 10) * Math.PI * 2;
    const radius = 14 + (i % 2) * 4;
    stack.position.set(Math.cos(angle) * radius, 0.55, Math.sin(angle) * radius);
    stack.rotation.y = -angle + Math.PI / 2 + (i % 3) * 0.12;
    parent.add(stack);
  }

  for (let i = 0; i < 18; i += 1) {
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    const angle = (i / 18) * Math.PI * 2;
    cone.position.set(Math.cos(angle) * 7.2, 0.26, Math.sin(angle) * 7.2);
    cone.castShadow = true;
    parent.add(cone);
  }

  for (let i = 0; i < 6; i += 1) {
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    const lamp = new THREE.PointLight(0xffc067, 18, 12, 2.2);
    const angle = (i / 6) * Math.PI * 2 + 0.35;
    pole.position.set(Math.cos(angle) * 12, 2.1, Math.sin(angle) * 12);
    lamp.position.copy(pole.position).add(new THREE.Vector3(0, 2.1, 0));
    lamp.userData.levelLight = true;
    pole.castShadow = true;
    parent.add(pole, lamp);
  }
}

function createFrostTerminalProps(parent) {
  const bankGeometry = new THREE.BoxGeometry(1, 1, 1);
  const bankMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9eef1,
    roughness: 0.96,
    metalness: 0,
  });
  const barrierGeometry = new THREE.BoxGeometry(2.2, 0.72, 0.32);
  const barrierMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xf0f7f8, roughness: 0.78 }),
    new THREE.MeshStandardMaterial({ color: 0x74a6b8, roughness: 0.78 }),
  ];
  const mastGeometry = new THREE.CylinderGeometry(0.06, 0.06, 3.6, 10);
  const mastMaterial = new THREE.MeshStandardMaterial({ color: 0x334b56, roughness: 0.48, metalness: 0.3 });

  for (let i = 0; i < 16; i += 1) {
    const bank = new THREE.Mesh(bankGeometry, bankMaterial);
    const angle = (i / 16) * Math.PI * 2;
    const radius = 9.2 + (i % 4) * 1.1;
    bank.scale.set(2.8 + Math.random() * 1.8, 0.32, 0.75 + Math.random() * 0.5);
    bank.position.set(Math.cos(angle) * radius, 0.16, Math.sin(angle) * radius);
    bank.rotation.y = -angle + Math.PI / 2;
    bank.castShadow = true;
    bank.receiveShadow = true;
    parent.add(bank);
  }

  for (let i = 0; i < 9; i += 1) {
    const barrier = new THREE.Mesh(barrierGeometry, barrierMaterials[i % 2]);
    const angle = (i / 9) * Math.PI * 2 + 0.2;
    barrier.position.set(Math.cos(angle) * 15.5, 0.36, Math.sin(angle) * 15.5);
    barrier.rotation.y = -angle + Math.PI / 2;
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    parent.add(barrier);
  }

  for (let i = 0; i < 7; i += 1) {
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    const lamp = new THREE.PointLight(0x8de8ff, 18, 12, 2.2);
    const angle = (i / 7) * Math.PI * 2;
    mast.position.set(Math.cos(angle) * 13.5, 1.8, Math.sin(angle) * 13.5);
    lamp.position.copy(mast.position).add(new THREE.Vector3(0, 1.6, 0));
    lamp.userData.levelLight = true;
    mast.castShadow = true;
    parent.add(mast, lamp);
  }
}

function createCar() {
  const root = new THREE.Group();
  const sprung = new THREE.Group();
  const wheels = [];
  root.add(sprung);

  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xbe1420,
    roughness: 0.24,
    metalness: 0.52,
    clearcoat: 0.9,
    clearcoatRoughness: 0.16,
  });
  const darkPaint = new THREE.MeshPhysicalMaterial({
    color: 0x4e070b,
    roughness: 0.3,
    metalness: 0.42,
    clearcoat: 0.68,
    clearcoatRoughness: 0.2,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x92ddff,
    roughness: 0.03,
    metalness: 0.02,
    transparent: true,
    opacity: 0.54,
    transmission: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x050607,
    roughness: 0.48,
    metalness: 0.08,
  });
  const carbon = new THREE.MeshStandardMaterial({
    color: 0x101315,
    roughness: 0.34,
    metalness: 0.36,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0xe6e1cd,
    roughness: 0.2,
    metalness: 0.86,
  });
  const brake = new THREE.MeshStandardMaterial({
    color: 0xffc438,
    roughness: 0.24,
    metalness: 0.35,
  });
  const brakeDisc = new THREE.MeshStandardMaterial({
    color: 0xa5a8a3,
    roughness: 0.28,
    metalness: 0.8,
  });
  const lightLens = new THREE.MeshStandardMaterial({
    color: 0xfff4c9,
    emissive: 0xffdf7a,
    emissiveIntensity: 2.2,
    roughness: 0.18,
    metalness: 0.02,
  });
  const tailLens = new THREE.MeshStandardMaterial({
    color: 0xff2632,
    emissive: 0xff1118,
    emissiveIntensity: 2.4,
    roughness: 0.25,
    metalness: 0.02,
  });
  const blurMaterial = new THREE.MeshBasicMaterial({
    color: 0xdad7c7,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const wheelGeometry = {
    tire: new THREE.TorusGeometry(0.34, 0.13, 14, 42),
    sidewall: new THREE.CylinderGeometry(0.4, 0.4, 0.27, 36, 1, true),
    rimOuter: new THREE.CylinderGeometry(0.24, 0.24, 0.3, 28),
    rimHub: new THREE.CylinderGeometry(0.09, 0.09, 0.34, 18),
    spoke: new THREE.BoxGeometry(0.035, 0.055, 0.34),
    brakeDisc: new THREE.CylinderGeometry(0.18, 0.18, 0.035, 28),
    caliper: new RoundedBoxGeometry(0.06, 0.12, 0.24, 3, 0.02),
    blur: new THREE.CircleGeometry(0.33, 28),
  };

  addMesh(sprung, makeCarHullGeometry(), paint);
  addMesh(sprung, new RoundedBoxGeometry(2.76, 0.18, 4.44, 5, 0.08), carbon, [0, 0.43, 0.08]);
  addMesh(sprung, new RoundedBoxGeometry(2.42, 0.06, 1.18, 4, 0.035), darkPaint, [0, 1.03, -1.13], [-0.08, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(2.22, 0.05, 0.82, 4, 0.03), darkPaint, [0, 0.91, 1.48], [0.05, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(0.07, 0.08, 4.08, 3, 0.025), carbon, [-1.42, 0.5, 0.05]);
  addMesh(sprung, new RoundedBoxGeometry(0.07, 0.08, 4.08, 3, 0.025), carbon, [1.42, 0.5, 0.05]);

  const cabin = addMesh(sprung, new RoundedBoxGeometry(1.42, 0.62, 1.28, 7, 0.16), glass, [0, 1.18, 0.28]);
  cabin.scale.set(1, 1, 0.95);
  addMesh(sprung, new RoundedBoxGeometry(1.26, 0.08, 0.84, 5, 0.045), darkPaint, [0, 1.51, 0.32]);
  addMesh(sprung, new RoundedBoxGeometry(1.26, 0.035, 0.68, 5, 0.025), glass, [0, 1.12, -0.56], [-0.38, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(1.18, 0.035, 0.54, 5, 0.025), glass, [0, 1.08, 0.95], [0.32, 0, 0]);

  for (const side of [-1, 1]) {
    addMesh(sprung, new RoundedBoxGeometry(0.035, 0.34, 0.76, 5, 0.025), glass, [side * 0.78, 1.2, 0.18], [0, 0, side * 0.12]);
    addMesh(sprung, new RoundedBoxGeometry(0.06, 0.34, 1.3, 4, 0.045), paint, [side * 1.34, 0.76, 0.03], [0, 0, side * 0.04]);
    addMesh(sprung, new RoundedBoxGeometry(0.035, 0.03, 0.34, 2, 0.014), carbon, [side * 1.39, 0.86, -0.2], [0, 0, side * 0.04]);
    addMesh(sprung, new RoundedBoxGeometry(0.038, 0.04, 0.52, 2, 0.014), black, [side * 1.39, 0.78, 0.55], [0, 0, side * 0.04]);
    addMesh(sprung, new RoundedBoxGeometry(0.08, 0.07, 0.22, 3, 0.025), carbon, [side * 1.12, 1.03, -0.64], [0.04, side * 0.48, 0.04]);
    addMesh(sprung, new RoundedBoxGeometry(0.18, 0.08, 0.22, 4, 0.04), paint, [side * 1.27, 0.98, -0.75], [0, side * 0.38, 0]);

    for (const z of [sim.frontAxleZ, sim.rearAxleZ]) {
      addMesh(sprung, new RoundedBoxGeometry(0.3, 0.4, 1.02, 5, 0.1), paint, [side * 1.24, 0.68, z]);
      addMesh(sprung, new RoundedBoxGeometry(0.06, 0.26, 0.84, 4, 0.055), carbon, [side * 1.45, 0.62, z]);
      addWheelArch(sprung, side, z, carbon);
    }
  }

  addMesh(sprung, new RoundedBoxGeometry(2.52, 0.1, 0.26, 4, 0.045), carbon, [0, 0.48, -2.34], [-0.05, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(2.16, 0.14, 0.24, 4, 0.04), carbon, [0, 0.56, 2.25], [0.08, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(2.38, 0.08, 0.12, 4, 0.035), carbon, [0, 1.27, 2.17], [0.08, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(0.12, 0.42, 0.08, 3, 0.025), carbon, [-0.98, 1.05, 2.08], [0.08, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(0.12, 0.42, 0.08, 3, 0.025), carbon, [0.98, 1.05, 2.08], [0.08, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(2.68, 0.09, 0.38, 4, 0.04), carbon, [0, 1.48, 2.26], [0.03, 0, 0]);

  for (const side of [-1, 1]) {
    addMesh(sprung, new RoundedBoxGeometry(0.48, 0.11, 0.08, 4, 0.035), lightLens, [side * 0.6, 0.78, -2.29], [-0.08, side * 0.08, 0]);
    addMesh(sprung, new RoundedBoxGeometry(0.34, 0.08, 0.07, 4, 0.025), tailLens, [side * 0.76, 0.78, 2.28], [0.04, side * -0.08, 0]);
    addMesh(sprung, new RoundedBoxGeometry(0.36, 0.05, 0.07, 3, 0.02), lightLens, [side * 1.08, 0.7, -2.08], [0, side * -0.25, 0]);
    addMesh(sprung, new THREE.CylinderGeometry(0.075, 0.075, 0.34, 18), carbon, [side * 0.52, 0.48, 2.42], [Math.PI / 2, 0, 0]);
  }

  addMesh(sprung, new RoundedBoxGeometry(0.05, 0.035, 2.75, 2, 0.018), black, [-0.72, 1.01, 0.1]);
  addMesh(sprung, new RoundedBoxGeometry(0.05, 0.035, 2.75, 2, 0.018), black, [0.72, 1.01, 0.1]);
  addMesh(sprung, new RoundedBoxGeometry(1.04, 0.03, 0.045, 2, 0.015), black, [0, 1.05, -1.54]);
  addMesh(sprung, new RoundedBoxGeometry(1.02, 0.03, 0.045, 2, 0.015), black, [0, 0.94, 1.83]);

  const wheelPositions = [
    [-1.35, 0.39, sim.frontAxleZ, true],
    [1.35, 0.39, sim.frontAxleZ, true],
    [-1.35, 0.39, sim.rearAxleZ, false],
    [1.35, 0.39, sim.rearAxleZ, false],
  ];

  for (const [x, y, z, front] of wheelPositions) {
    const steering = new THREE.Group();
    steering.position.set(x, y, z);

    const spin = new THREE.Group();
    steering.add(spin);

    createWheelModel(spin, steering, Math.sign(x), black, rim, brake, brakeDisc, blurMaterial, wheelGeometry, front);

    const blur = spin.userData.blur;

    root.add(steering);
    wheels.push({
      steering,
      spin,
      blur,
      front,
      side: Math.sign(x),
      localContact: new THREE.Vector3(x, 0.04, z),
    });
  }

  const underglow = new THREE.PointLight(0xff3b30, 2.8, 4.2, 3);
  underglow.position.set(0, 0.35, 0.35);
  underglow.userData.optionalLight = true;
  root.add(underglow);

  const headGlow = new THREE.PointLight(0xffe2a6, 1.9, 5.8, 2.1);
  headGlow.position.set(0, 0.68, -2.5);
  headGlow.userData.optionalLight = true;
  root.add(headGlow);

  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });

  return { root, sprung, wheels };
}

function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function disposeObjectResources(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material.map) material.map.dispose();
        material.dispose();
      }
    }
  });
}

function makeCarHullGeometry() {
  const sections = [
    { z: -2.42, bottom: 0.38, mid: 0.62, top: 0.68, lower: 0.72, shoulder: 1.04, deck: 0.72 },
    { z: -1.88, bottom: 0.34, mid: 0.72, top: 0.9, lower: 1.18, shoulder: 1.34, deck: 1.02 },
    { z: -0.72, bottom: 0.32, mid: 0.82, top: 1.0, lower: 1.28, shoulder: 1.42, deck: 1.14 },
    { z: 0.72, bottom: 0.32, mid: 0.78, top: 0.96, lower: 1.28, shoulder: 1.4, deck: 1.08 },
    { z: 1.72, bottom: 0.35, mid: 0.7, top: 0.82, lower: 1.18, shoulder: 1.32, deck: 0.96 },
    { z: 2.42, bottom: 0.42, mid: 0.62, top: 0.68, lower: 0.86, shoulder: 1.06, deck: 0.66 },
  ];
  const vertices = [];
  const indices = [];

  for (const section of sections) {
    vertices.push(
      -section.lower, section.bottom, section.z,
      section.lower, section.bottom, section.z,
      section.shoulder, section.mid, section.z,
      section.deck, section.top, section.z,
      -section.deck, section.top, section.z,
      -section.shoulder, section.mid, section.z,
    );
  }

  const ring = 6;
  for (let i = 0; i < sections.length - 1; i += 1) {
    const current = i * ring;
    const next = (i + 1) * ring;
    for (let j = 0; j < ring; j += 1) {
      const a = current + j;
      const b = current + ((j + 1) % ring);
      const c = next + j;
      const d = next + ((j + 1) % ring);
      indices.push(a, c, b, b, c, d);
    }
  }

  for (let j = 1; j < ring - 1; j += 1) indices.push(0, j, j + 1);
  const last = (sections.length - 1) * ring;
  for (let j = 1; j < ring - 1; j += 1) indices.push(last, last + j + 1, last + j);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addWheelArch(parent, side, z, material) {
  const arch = new THREE.Group();
  const segmentGeometry = new RoundedBoxGeometry(0.08, 0.075, 0.24, 3, 0.026);
  for (let i = 0; i < 7; i += 1) {
    const angle = THREE.MathUtils.degToRad(32 + i * 19);
    const segment = new THREE.Mesh(segmentGeometry, material);
    segment.position.set(
      side * 1.47,
      0.4 + Math.sin(angle) * 0.49,
      z + Math.cos(angle) * 0.54,
    );
    segment.rotation.x = -angle + Math.PI / 2;
    arch.add(segment);
  }
  parent.add(arch);
  return arch;
}

function createWheelModel(spin, steering, side, tireMaterial, rimMaterial, brakeMaterial, brakeDiscMaterial, blurMaterial, geometry, front) {
  const tire = new THREE.Mesh(geometry.tire, tireMaterial);
  tire.rotation.y = Math.PI / 2;
  spin.add(tire);

  const sidewall = new THREE.Mesh(geometry.sidewall, tireMaterial);
  sidewall.rotation.z = Math.PI / 2;
  spin.add(sidewall);

  const rimOuter = new THREE.Mesh(geometry.rimOuter, rimMaterial);
  rimOuter.rotation.z = Math.PI / 2;
  spin.add(rimOuter);

  const rimHub = new THREE.Mesh(geometry.rimHub, rimMaterial);
  rimHub.rotation.z = Math.PI / 2;
  spin.add(rimHub);

  for (let i = 0; i < 10; i += 1) {
    const spoke = new THREE.Mesh(geometry.spoke, rimMaterial);
    spoke.position.x = side * 0.035;
    spoke.rotation.x = (i / 10) * Math.PI;
    spin.add(spoke);
  }

  const brakeDisc = new THREE.Mesh(geometry.brakeDisc, brakeDiscMaterial);
  brakeDisc.rotation.z = Math.PI / 2;
  spin.add(brakeDisc);

  const caliper = new THREE.Mesh(geometry.caliper, brakeMaterial);
  caliper.position.set(side * 0.17, front ? 0.1 : -0.08, 0.18);
  caliper.rotation.x = front ? 0.2 : -0.24;
  steering.add(caliper);

  const blur = new THREE.Mesh(geometry.blur, blurMaterial.clone());
  blur.rotation.y = Math.PI / 2;
  blur.position.x = side * 0.18;
  blur.visible = false;
  spin.add(blur);
  spin.userData.blur = blur;
}

function createSmokeSystem() {
  const particles = [];
  let texture = makeSmokeTexture(getGraphicsProfile().smokeTextureSize);
  const baseMaterial = new THREE.SpriteMaterial({
    map: texture,
    color: 0xd7d8cf,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const group = new THREE.Group();
  world.add(group);

  function createParticle() {
    const sprite = new THREE.Sprite(baseMaterial.clone());
    sprite.visible = false;
    group.add(sprite);
    return {
      age: 99,
      life: 1,
      sprite,
      velocity: new THREE.Vector3(),
      startScale: 0.4,
      endScale: 1.4,
    };
  }

  function setTextureSize(size) {
    if (texture.image?.width === size) return;

    const previousTexture = texture;
    texture = makeSmokeTexture(size);
    for (const particle of particles) {
      particle.sprite.material.map = texture;
      particle.sprite.material.needsUpdate = true;
    }
    previousTexture.dispose();
  }

  function setBudget(count, textureSize) {
    setTextureSize(textureSize);

    while (particles.length < count) {
      particles.push(createParticle());
    }

    while (particles.length > count) {
      const particle = particles.pop();
      group.remove(particle.sprite);
      particle.sprite.material.dispose();
    }
  }

  setBudget(getGraphicsProfile().smokeParticles, getGraphicsProfile().smokeTextureSize);

  return {
    setBudget,
    clear() {
      for (const particle of particles) {
        particle.age = particle.life;
        particle.sprite.visible = false;
        particle.sprite.material.opacity = 0;
      }
    },
    emit(origin, tireVelocity, sideVector, slip) {
      if (!getGraphicsProfile().smoke || particles.length === 0) return;

      const particle = particles.find((item) => item.age >= item.life);
      if (!particle) return;

      const intensity = THREE.MathUtils.clamp(slip, 0, 1);
      const backward = tireVelocity.clone().multiplyScalar(-1);
      if (backward.lengthSq() < 0.01) backward.set(0, 0, -1);
      backward.normalize();

      particle.age = 0;
      particle.life = 0.62 + intensity * 0.42 + Math.random() * 0.16;
      particle.startScale = 0.18 + intensity * 0.16;
      particle.endScale = 0.62 + intensity * 0.72;
      particle.sprite.visible = true;
      particle.sprite.position.copy(origin);
      particle.sprite.position.y = 0.055 + Math.random() * 0.045;
      particle.sprite.scale.setScalar(particle.startScale);
      particle.sprite.material.opacity = 0.26 + intensity * 0.18;
      particle.sprite.material.rotation = Math.random() * Math.PI;
      particle.velocity
        .copy(backward)
        .multiplyScalar(0.62 + intensity * 0.86)
        .addScaledVector(sideVector, (Math.random() - 0.5) * 0.38);
      particle.velocity.y += 0.035 + intensity * 0.055;
    },
    update(delta) {
      for (const particle of particles) {
        if (particle.age >= particle.life) continue;

        particle.age += delta;
        const t = THREE.MathUtils.clamp(particle.age / particle.life, 0, 1);
        particle.sprite.position.addScaledVector(particle.velocity, delta);
        particle.sprite.position.y += delta * (0.018 + t * 0.04);
        particle.sprite.scale.setScalar(THREE.MathUtils.lerp(particle.startScale, particle.endScale, t));
        particle.sprite.material.opacity = Math.max(0, (1 - t) * (1 - t) * 0.42);
        particle.sprite.material.rotation += delta * 0.35;

        if (particle.age >= particle.life) particle.sprite.visible = false;
      }
    },
  };
}

function makeSmokeTexture(size = 128) {
  const smokeCanvas = document.createElement('canvas');
  smokeCanvas.width = size;
  smokeCanvas.height = size;
  const context = smokeCanvas.getContext('2d');
  const center = size * 0.5;
  const gradient = context.createRadialGradient(center, center, size * 0.04, center, center, size * 0.48);
  gradient.addColorStop(0, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.32, 'rgba(218,222,211,0.5)');
  gradient.addColorStop(0.68, 'rgba(150,157,149,0.16)');
  gradient.addColorStop(1, 'rgba(110,116,110,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(smokeCanvas);
}

function createSkidSystem() {
  const group = new THREE.Group();
  world.add(group);

  return {
    trails: [
      createTrailMesh(group, 0x050505),
      createTrailMesh(group, 0x050505),
    ],
    setBudget(points) {
      for (const trail of this.trails) trail.setBudget(points);
    },
    clear() {
      for (const trail of this.trails) trail.clear();
    },
    add(index, point, slip) {
      if (!getGraphicsProfile().skid) return;
      this.trails[index].add(point, THREE.MathUtils.clamp(slip, 0, 1));
    },
    update() {
      for (const trail of this.trails) trail.update();
    },
  };
}

function createTrailMesh(parent, color) {
  let maxPoints = 0;
  let points = [];
  let pointCount = 0;
  let positions;
  let colors;
  let positionAttribute;
  let colorAttribute;
  const width = 0.23;
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 1;
  parent.add(mesh);

  function configure(pointsLimit) {
    const nextMaxPoints = Math.max(2, pointsLimit);
    if (nextMaxPoints === maxPoints) return;

    const previous = points.slice(Math.max(0, pointCount - nextMaxPoints), pointCount);
    maxPoints = nextMaxPoints;
    points = Array.from({ length: maxPoints }, () => ({
      position: new THREE.Vector3(),
      strength: 0,
    }));
    pointCount = Math.min(previous.length, maxPoints);

    for (let i = 0; i < pointCount; i += 1) {
      points[i].position.copy(previous[i].position);
      points[i].strength = previous[i].strength;
    }

    positions = new Float32Array(maxPoints * 2 * 3);
    colors = new Float32Array(maxPoints * 2 * 3);
    const indices = new Uint16Array((maxPoints - 1) * 6);

    for (let i = 0; i < maxPoints - 1; i += 1) {
      const vertex = i * 2;
      const index = i * 6;
      indices[index] = vertex;
      indices[index + 1] = vertex + 1;
      indices[index + 2] = vertex + 2;
      indices[index + 3] = vertex + 1;
      indices[index + 4] = vertex + 3;
      indices[index + 5] = vertex + 2;
    }

    positionAttribute = new THREE.BufferAttribute(positions, 3);
    colorAttribute = new THREE.BufferAttribute(colors, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    colorAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('color', colorAttribute);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.setDrawRange(0, Math.max(0, pointCount - 1) * 6);
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 64);
  }

  function pushPoint(x, y, z, strength) {
    if (pointCount === maxPoints) {
      for (let i = 1; i < maxPoints; i += 1) {
        points[i - 1].position.copy(points[i].position);
        points[i - 1].strength = points[i].strength;
      }
      pointCount -= 1;
    }

    points[pointCount].position.set(x, y, z);
    points[pointCount].strength = strength;
    pointCount += 1;
  }

  configure(getGraphicsProfile().skidPoints);

  return {
    setBudget(pointsLimit) {
      configure(pointsLimit);
    },
    clear() {
      pointCount = 0;
      geometry.setDrawRange(0, 0);
    },
    add(point, slip) {
      const x = point.x;
      const y = 0.038;
      const z = point.z;
      const last = pointCount > 0 ? points[pointCount - 1] : null;
      if (last) {
        const distanceX = last.position.x - x;
        const distanceZ = last.position.z - z;
        if (distanceX * distanceX + distanceZ * distanceZ < 0.0121) return;
      }

      if (last) {
        const distanceX = x - last.position.x;
        const distanceZ = z - last.position.z;
        const distance = Math.hypot(distanceX, distanceZ);
        const steps = Math.min(5, Math.floor(distance / 0.16));
        for (let i = 1; i < steps; i += 1) {
          const t = i / steps;
          pushPoint(
            THREE.MathUtils.lerp(last.position.x, x, t),
            y,
            THREE.MathUtils.lerp(last.position.z, z, t),
            THREE.MathUtils.lerp(last.strength, slip, t),
          );
        }
      }

      pushPoint(x, y, z, slip);
    },
    update() {
      if (pointCount < 2) {
        geometry.setDrawRange(0, 0);
        return;
      }

      for (let i = 0; i < pointCount; i += 1) {
        const current = points[i];
        const previous = points[Math.max(0, i - 1)].position;
        const next = points[Math.min(pointCount - 1, i + 1)].position;
        let tangentX = next.x - previous.x;
        let tangentZ = next.z - previous.z;
        const tangentLengthSq = tangentX * tangentX + tangentZ * tangentZ;

        if (tangentLengthSq < 0.0001) {
          tangentX = 0;
          tangentZ = 1;
        } else {
          const inverseLength = 1 / Math.sqrt(tangentLengthSq);
          tangentX *= inverseLength;
          tangentZ *= inverseLength;
        }

        const halfWidth = width * (0.75 + current.strength * 0.35);
        const normalX = -tangentZ * halfWidth;
        const normalZ = tangentX * halfWidth;
        const vertexIndex = i * 6;
        positions[vertexIndex] = current.position.x + normalX;
        positions[vertexIndex + 1] = current.position.y;
        positions[vertexIndex + 2] = current.position.z + normalZ;
        positions[vertexIndex + 3] = current.position.x - normalX;
        positions[vertexIndex + 4] = current.position.y;
        positions[vertexIndex + 5] = current.position.z - normalZ;

        const shade = 0.018 + current.strength * 0.032;
        colors[vertexIndex] = shade;
        colors[vertexIndex + 1] = shade;
        colors[vertexIndex + 2] = shade;
        colors[vertexIndex + 3] = shade;
        colors[vertexIndex + 4] = shade;
        colors[vertexIndex + 5] = shade;
      }

      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;
      geometry.setDrawRange(0, (pointCount - 1) * 6);
    },
  };
}

function animate() {
  requestAnimationFrame(animate);

  const rawDelta = clock.getDelta();
  const delta = Math.min(rawDelta, 0.033);

  if (!state.paused) {
    state.elapsed += delta;
    updateVehicle(delta);
    updateCarVisuals(delta);
    updateEffects(delta);
  }

  smokeSystem.update(delta);
  skidSystem.update();
  renderer.render(scene, camera);
}

function updateVehicle(delta) {
  const vehicle = state.vehicle;
  const basis = getVehicleBasis(vehicle.yaw);
  const radial = vehicle.position.clone();
  radial.y = 0;
  if (radial.lengthSq() < 0.001) radial.set(1, 0, 0);
  radial.normalize();
  const inward = radial.clone().multiplyScalar(-1);
  const tangent = new THREE.Vector3(-radial.z, 0, radial.x);
  const desiredForward = tangent.clone().multiplyScalar(Math.cos(sim.driftAngle)).addScaledVector(inward, Math.sin(sim.driftAngle)).normalize();
  const desiredYaw = yawFromForward(desiredForward);
  const yawError = wrapAngle(desiredYaw - vehicle.yaw);

  const controls = getDriverControls(vehicle, basis, radial, tangent, yawError);
  vehicle.throttle = controls.throttle;
  vehicle.steer = THREE.MathUtils.lerp(vehicle.steer, controls.steer, 1 - Math.pow(0.0008, delta));

  const frontDir = basis.forward.clone().multiplyScalar(Math.cos(vehicle.steer)).addScaledVector(basis.right, Math.sin(vehicle.steer)).normalize();
  const frontSide = basis.right.clone().multiplyScalar(Math.cos(vehicle.steer)).addScaledVector(basis.forward, -Math.sin(vehicle.steer)).normalize();

  const frontContact = axleContact(vehicle, 0, sim.frontAxleZ);
  const rearContact = axleContact(vehicle, 0, sim.rearAxleZ);
  const frontVelocity = pointVelocity(vehicle, frontContact.relative);
  const rearVelocity = pointVelocity(vehicle, rearContact.relative);

  const frontLat = dotGround(frontVelocity, frontSide);
  const rearLat = dotGround(rearVelocity, basis.right);
  const frontLong = dotGround(frontVelocity, frontDir);
  const rearLong = dotGround(rearVelocity, basis.forward);

  const force = new THREE.Vector3();
  let torque = 0;

  const radiusError = vehicle.position.length() - sim.targetRadius;
  const radialSpeed = dotGround(vehicle.velocity, radial);
  const tangentSpeed = dotGround(vehicle.velocity, tangent);
  const driverCorrection = state.manual
    ? new THREE.Vector3()
    : tangent
      .clone()
      .multiplyScalar((sim.targetSpeed - tangentSpeed) * 1.75)
      .addScaledVector(radial, -radiusError * 8.8 - radialSpeed * 5.6);

  const frontLateralForce = THREE.MathUtils.clamp(-frontLat * sim.frontCornering, -sim.frontGrip, sim.frontGrip);
  const frontForce = frontSide.clone().multiplyScalar(frontLateralForce).add(driverCorrection.clampLength(0, 8.4));
  force.add(frontForce);
  torque += torqueFromForce(frontContact.relative, frontForce);

  const brakeForce = controls.brake * 9.5;
  const rearDriveForce = sim.driveForce * vehicle.throttle - Math.sign(rearLong || 1) * brakeForce;
  const rearSlipFromPower = THREE.MathUtils.clamp((Math.abs(rearDriveForce) - Math.abs(rearLong) * 0.65) / sim.driveForce, 0, 1);
  const rearGripLimit = THREE.MathUtils.lerp(sim.rearGrip, 1.65, rearSlipFromPower);
  const rearLateralForce = THREE.MathUtils.clamp(-rearLat * sim.rearCornering, -rearGripLimit, rearGripLimit);
  const rearForce = basis.right.clone().multiplyScalar(rearLateralForce).addScaledVector(basis.forward, rearDriveForce);
  force.add(rearForce);
  torque += torqueFromForce(rearContact.relative, rearForce);

  const yawControlTorque = state.manual ? -vehicle.yawRate * 0.28 : yawError * 22 - vehicle.yawRate * 1.05;
  torque += yawControlTorque;

  force.addScaledVector(vehicle.velocity, state.manual ? -0.44 : -0.72);
  vehicle.velocity.addScaledVector(force, delta / sim.mass);
  vehicle.velocity.clampLength(0, state.manual ? 9.2 : 7.4);
  vehicle.position.addScaledVector(vehicle.velocity, delta);

  vehicle.yawRate += (torque / sim.inertia) * delta;
  vehicle.yawRate = THREE.MathUtils.clamp(vehicle.yawRate, -2.4, 2.4);
  vehicle.yaw = wrapAngle(vehicle.yaw + vehicle.yawRate * delta);

  vehicle.frontSlip = THREE.MathUtils.clamp(Math.abs(frontLat) / 4.2 + Math.abs(vehicle.steer) * 0.15, 0, 1);
  vehicle.rearSlip = THREE.MathUtils.clamp(Math.abs(rearLat) / 2.5 + rearSlipFromPower * 0.9, 0, 1);
  vehicle.lateralG = THREE.MathUtils.clamp((frontLateralForce + rearLateralForce) / 18, -1.25, 1.25);
  vehicle.wheelSpinFront += Math.max(0.8, Math.abs(frontLong)) * delta * 2.8;
  vehicle.wheelSpinRear += (Math.max(1, Math.abs(rearLong)) * 3.2 + Math.abs(rearDriveForce) * 1.1 * vehicle.rearSlip) * delta;

  updateWheelContactData(vehicle);
}

function updateCarVisuals(delta) {
  const vehicle = state.vehicle;
  const speed = vehicle.velocity.length();
  const slipAngle = signedAngleOnGround(getVehicleBasis(vehicle.yaw).forward, vehicle.velocity.clone().normalize());
  const showWheelBlur = getGraphicsProfile().wheelBlur;

  car.root.position.copy(vehicle.position);
  car.root.rotation.y = vehicle.yaw;

  const rollTarget = -vehicle.lateralG * 0.09;
  const pitchTarget = -vehicle.throttle * vehicle.rearSlip * 0.035 + Math.sin(state.elapsed * 15) * vehicle.rearSlip * 0.008;
  car.sprung.rotation.z = THREE.MathUtils.lerp(car.sprung.rotation.z, rollTarget, 1 - Math.pow(0.002, delta));
  car.sprung.rotation.x = THREE.MathUtils.lerp(car.sprung.rotation.x, pitchTarget, 1 - Math.pow(0.002, delta));
  car.sprung.position.y = 0.03 + vehicle.rearSlip * 0.035 + Math.sin(state.elapsed * 18) * vehicle.rearSlip * 0.012;

  for (const wheel of car.wheels) {
    if (wheel.front) {
      wheel.steering.rotation.y = -vehicle.steer;
      wheel.spin.rotation.x = vehicle.wheelSpinFront;
      wheel.blur.visible = showWheelBlur && speed > 3.5;
      wheel.blur.material.opacity = 0.09 + vehicle.frontSlip * 0.09;
    } else {
      wheel.steering.rotation.y = 0;
      wheel.spin.rotation.x = vehicle.wheelSpinRear;
      wheel.blur.visible = showWheelBlur && vehicle.rearSlip > 0.25;
      wheel.blur.material.opacity = 0.18 + vehicle.rearSlip * 0.18;
    }
  }

  const lookAt = vehicle.position.clone().add(new THREE.Vector3(0, 0.82, 0));
  const narrowView = window.innerWidth < 560;
  const basis = getVehicleBasis(vehicle.yaw);
  const zoom = state.cameraZoom;
  const forwardCameraOffset = basis.forward.clone().multiplyScalar(narrowView ? -8.8 : -5.6);
  const sideCameraOffset = basis.right.clone().multiplyScalar(narrowView ? -5.2 : -7.2);
  const orbitOffset = forwardCameraOffset
    .add(sideCameraOffset)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), state.cameraAngle)
    .multiplyScalar(zoom);
  const cameraTarget = lookAt
    .clone()
    .add(orbitOffset)
    .add(new THREE.Vector3(0, (narrowView ? 7.6 : 5.3) * zoom * state.cameraHeight, 0));
  camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, delta));
  camera.lookAt(lookAt);

  speedEl.textContent = `${Math.round(speed * 10.8)} km/h`;
  angleEl.textContent = `${Math.round(Math.abs(slipAngle) * THREE.MathUtils.RAD2DEG)} deg`;
}

function getDriverControls(vehicle, basis, radial, tangent, yawError) {
  if (!state.manual) {
    return {
      throttle: 1,
      brake: 0,
      steer: THREE.MathUtils.clamp(signedAngleOnGround(basis.forward, tangent), -0.78, 0.78),
    };
  }

  const steerInput = Number(state.input.right) - Number(state.input.left);
  const forwardInput = Number(state.input.up);
  const reverseInput = Number(state.input.down);
  const forwardSpeed = dotGround(vehicle.velocity, basis.forward);
  const brakingBeforeReverse = reverseInput > 0 && forwardSpeed > 0.45;
  const speed = vehicle.velocity.length();
  const steerLimit = THREE.MathUtils.lerp(0.82, 0.5, THREE.MathUtils.clamp(speed / 9, 0, 1));

  return {
    throttle: forwardInput - (brakingBeforeReverse ? 0 : reverseInput * 0.62),
    brake: brakingBeforeReverse ? 1 : 0,
    steer: steerInput * steerLimit,
  };
}

function resetVehicle(manual) {
  const vehicle = state.vehicle;
  vehicle.position.set(manual ? 0 : 5.65, 0, manual ? 0 : 0);
  vehicle.velocity.set(manual ? 0 : 0, 0, manual ? -0.15 : 7.4);
  vehicle.yaw = manual ? Math.PI : 2.42;
  vehicle.yawRate = manual ? 0 : 0.72;
  vehicle.steer = 0;
  vehicle.throttle = manual ? 0 : 1;
  vehicle.wheelSpinFront = 0;
  vehicle.wheelSpinRear = 0;
  vehicle.rearSlip = 0;
  vehicle.frontSlip = 0;
  vehicle.lateralG = 0;
  updateWheelContactData(vehicle);
  state.smokeAccumulator = 0;
}

function startLevel(levelIndex) {
  state.screen = 'playing';
  state.level = levelIndex;
  state.manual = true;
  state.paused = false;
  modeToggle.textContent = 'Play auto';
  levelSystem.setLevel(levelIndex);
  smokeSystem.clear();
  skidSystem.clear();
  resetVehicle(true);
  updateStatusText();
  hud.hidden = false;
  menuOverlay.hidden = true;
  clearMovementInput();
}

function showMainMenu() {
  state.screen = 'menu';
  state.paused = true;
  state.manual = false;
  state.bindingTarget = null;
  modeToggle.textContent = 'Play manual';
  updateStatusText();
  hud.hidden = true;
  menuOverlay.hidden = false;
  showMenuPanel('main');
  clearMovementInput();
}

function showMenuPanel(name) {
  for (const [panelName, panel] of Object.entries(panels)) {
    panel.hidden = panelName !== name;
  }
}

function quitGame() {
  state.screen = 'quit';
  state.paused = true;
  state.manual = false;
  state.bindingTarget = null;
  hud.hidden = true;
  menuOverlay.hidden = false;
  showMenuPanel('quit');
  if (window.opener) window.close();
}

function setShadows(enabled) {
  graphicsSettings.shadows = enabled;
  state.shadows = enabled;
  saveGraphicsSettings();
  renderGraphicsSettings();
  applyGraphicsSettings();
}

function applyShadowSetting() {
  applyGraphicsSettings();
}

function loadGraphicsSettings() {
  const defaultPreset = smallMachine ? 'low' : 'medium';
  const fallback = graphicsPresets[defaultPreset];

  try {
    const saved = JSON.parse(localStorage.getItem(graphicsStorageKey) || '{}');
    const preset = graphicsPresets[saved.preset] ? saved.preset : defaultPreset;
    const profile = graphicsPresets[preset];
    return {
      preset,
      resolutionScale: THREE.MathUtils.clamp(
        Number.isFinite(saved.resolutionScale) ? saved.resolutionScale : profile.defaultResolutionScale,
        0,
        100,
      ),
      shadows: typeof saved.shadows === 'boolean' ? saved.shadows : profile.shadows,
    };
  } catch {
    return {
      preset: defaultPreset,
      resolutionScale: fallback.defaultResolutionScale,
      shadows: fallback.shadows,
    };
  }
}

function saveGraphicsSettings() {
  localStorage.setItem(graphicsStorageKey, JSON.stringify(graphicsSettings));
}

function getGraphicsProfile() {
  return graphicsPresets[graphicsSettings.preset] ?? graphicsPresets.medium;
}

function getTargetRenderHeight(scale) {
  return Math.round(THREE.MathUtils.lerp(240, 1080, THREE.MathUtils.clamp(scale, 0, 100) / 100));
}

function getCurrentLevelFogDensity() {
  return state.levelFogDensity * getGraphicsProfile().fogDensityMultiplier;
}

function renderGraphicsSettings() {
  const targetHeight = getTargetRenderHeight(graphicsSettings.resolutionScale);
  graphicsPresetSelect.value = graphicsSettings.preset;
  resolutionScaleInput.value = String(Math.round(graphicsSettings.resolutionScale));
  resolutionValueEl.textContent = `${targetHeight}p`;
  shadowsToggle.checked = graphicsSettings.shadows;
  shadowsToggle.disabled = !getGraphicsProfile().shadows;
}

function applyGraphicsSettings() {
  const profile = getGraphicsProfile();
  state.shadows = graphicsSettings.shadows && profile.shadows;

  renderer.setPixelRatio(getRenderPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = state.shadows;
  renderer.shadowMap.type = profile.shadowType;
  renderer.shadowMap.needsUpdate = true;

  if (keyLight) {
    keyLight.castShadow = state.shadows;
    keyLight.shadow.mapSize.set(profile.shadowMapSize, profile.shadowMapSize);
    keyLight.shadow.needsUpdate = true;
  }

  scene.fog.density = getCurrentLevelFogDensity();
  smokeSystem.setBudget(profile.smokeParticles, profile.smokeTextureSize);
  skidSystem.setBudget(profile.skidPoints);

  scene.traverse((child) => {
    if (child.userData.optionalLight) child.visible = profile.optionalLights;
    if (child.userData.levelLight) child.visible = profile.levelLights;
    if (child.isMesh) {
      if (child.userData.baseCastShadow === undefined) child.userData.baseCastShadow = child.castShadow;
      if (child.userData.baseReceiveShadow === undefined) child.userData.baseReceiveShadow = child.receiveShadow;
      child.castShadow = state.shadows && child.userData.baseCastShadow;
      child.receiveShadow = state.shadows && child.userData.baseReceiveShadow;
    }
  });
}

function updateStatusText() {
  if (state.paused) {
    statusEl.textContent = 'Paused';
    return;
  }

  statusEl.textContent = state.manual ? 'Manual' : 'Looping';
}

function startKeyBinding(action) {
  if (!movementActions.includes(action)) return;

  state.bindingTarget = action;
  clearMovementInput();
  renderKeyBindings(`Set ${actionLabels[action].toLowerCase()}`);
}

function captureKeyBinding(event) {
  event.preventDefault();
  event.stopPropagation();

  const action = state.bindingTarget;
  if (!action) return;

  if (event.key === 'Escape') {
    state.bindingTarget = null;
    renderKeyBindings('Cancelled');
    return;
  }

  const binding = normalizeKeyBinding(event);
  if (!binding) {
    renderKeyBindings('Choose a letter or number key');
    return;
  }

  const duplicateAction = movementActions.find((candidate) => (
    candidate !== action && matchesKeyBinding(event, state.keyBindings[candidate])
  ));
  if (duplicateAction) {
    renderKeyBindings(`${binding.label} is already ${actionLabels[duplicateAction].toLowerCase()}`);
    return;
  }

  state.keyBindings[action] = binding;
  state.bindingTarget = null;
  saveKeyBindings();
  renderKeyBindings();
}

function renderKeyBindings(message = '') {
  for (const button of keybindButtons) {
    const action = button.dataset.bindAction;
    const binding = state.keyBindings[action] ?? defaultKeyBindings[action];
    const isListening = state.bindingTarget === action;
    button.textContent = isListening ? 'Press key' : binding.label;
    button.classList.toggle('is-listening', isListening);
    button.setAttribute('aria-label', `${actionLabels[action]} key ${binding.label}`);
  }

  keybindStatusEl.textContent = message;
}

function loadKeyBindings() {
  try {
    const saved = JSON.parse(localStorage.getItem(keyBindingStorageKey));
    if (!saved || typeof saved !== 'object') return cloneDefaultKeyBindings();

    const bindings = cloneDefaultKeyBindings();
    for (const action of movementActions) {
      const binding = saved[action];
      if (isValidStoredBinding(binding)) bindings[action] = binding;
    }
    return bindings;
  } catch {
    return cloneDefaultKeyBindings();
  }
}

function saveKeyBindings() {
  try {
    localStorage.setItem(keyBindingStorageKey, JSON.stringify(state.keyBindings));
  } catch {
    keybindStatusEl.textContent = 'Controls saved for this session';
  }
}

function cloneDefaultKeyBindings() {
  return Object.fromEntries(
    Object.entries(defaultKeyBindings).map(([action, binding]) => [action, { ...binding }]),
  );
}

function isValidStoredBinding(binding) {
  return Boolean(
    binding
      && typeof binding.key === 'string'
      && typeof binding.code === 'string'
      && typeof binding.label === 'string',
  );
}

function normalizeKeyBinding(event) {
  if (
    event.key.startsWith('Arrow')
    || event.key === 'Shift'
    || event.key === 'Control'
    || event.key === 'Alt'
    || event.key === 'Meta'
    || event.key === 'CapsLock'
    || event.key === 'Tab'
  ) {
    return null;
  }

  return {
    key: event.key.toLowerCase(),
    code: event.code,
    label: formatKeyLabel(event),
  };
}

function formatKeyLabel(event) {
  if (event.code === 'Space') return 'Space';
  if (event.key.length === 1) return event.key.toUpperCase();
  return event.key;
}

function isMovementKey(event) {
  return getMovementDirection(event) !== null;
}

function setMovementInput(event, active) {
  const direction = getMovementDirection(event);
  if (!direction) return;
  state.input[direction] = active;
}

function clearMovementInput() {
  state.input.up = false;
  state.input.down = false;
  state.input.left = false;
  state.input.right = false;
}

function getMovementDirection(event) {
  const key = event.key.toLowerCase();
  const code = event.code;
  if (event.key === 'ArrowUp') return 'up';
  if (event.key === 'ArrowDown') return 'down';
  if (event.key === 'ArrowLeft') return 'left';
  if (event.key === 'ArrowRight') return 'right';

  for (const action of movementActions) {
    if (matchesKeyBinding({ key, code }, state.keyBindings[action])) return action;
  }

  return null;
}

function matchesKeyBinding(event, binding) {
  if (!binding) return false;
  return event.key.toLowerCase() === binding.key || event.code === binding.code;
}

function updateEffects(delta) {
  const vehicle = state.vehicle;
  const contacts = vehicle.contacts;
  if (!contacts) return;

  state.smokeAccumulator += delta * (14 + vehicle.rearSlip * 46);
  const emissions = Math.floor(state.smokeAccumulator);
  state.smokeAccumulator -= emissions;

  let rearIndex = 0;
  for (const contact of contacts) {
    if (contact.front) continue;

    const slip = contact.slip;
    if (slip > 0.18) skidSystem.add(rearIndex, contact.position, slip);

    if (slip > 0.24) {
      const count = Math.min(4, emissions);
      for (let n = 0; n < count; n += 1) {
        smokeSystem.emit(contact.position, contact.velocity, contact.side, slip);
      }
    }

    rearIndex += 1;
  }
}

function createWheelContactData() {
  return car.wheels.map((wheel) => ({
    front: wheel.front,
    sideSign: wheel.side,
    position: new THREE.Vector3(),
    relative: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    side: new THREE.Vector3(),
    slip: 0,
    longitudinal: 0,
  }));
}

function updateWheelContactData(vehicle) {
  const basis = getVehicleBasis(vehicle.yaw);
  const cosSteer = Math.cos(vehicle.steer);
  const sinSteer = Math.sin(vehicle.steer);

  for (let i = 0; i < car.wheels.length; i += 1) {
    const wheel = car.wheels[i];
    const data = vehicle.contacts[i];
    wheelContactInto(vehicle, wheel.localContact, basis, data.position, data.relative);
    pointVelocityInto(vehicle, data.relative, data.velocity);

    const wheelDirectionX = wheel.front
      ? basis.forward.x * cosSteer + basis.right.x * sinSteer
      : basis.forward.x;
    const wheelDirectionZ = wheel.front
      ? basis.forward.z * cosSteer + basis.right.z * sinSteer
      : basis.forward.z;
    const wheelSideX = wheel.front
      ? basis.right.x * cosSteer - basis.forward.x * sinSteer
      : basis.right.x;
    const wheelSideZ = wheel.front
      ? basis.right.z * cosSteer - basis.forward.z * sinSteer
      : basis.right.z;

    const lateral = Math.abs(data.velocity.x * wheelSideX + data.velocity.z * wheelSideZ);
    const longitudinal = Math.abs(data.velocity.x * wheelDirectionX + data.velocity.z * wheelDirectionZ);

    data.front = wheel.front;
    data.sideSign = wheel.side;
    data.side.set(wheelSideX * wheel.side, 0, wheelSideZ * wheel.side);
    data.slip = wheel.front
      ? THREE.MathUtils.clamp(lateral / 4.5, 0, 1)
      : THREE.MathUtils.clamp(lateral / 2.7 + vehicle.throttle * 0.58, 0, 1);
    data.longitudinal = longitudinal;
  }
}

function axleContact(vehicle, localX, localZ) {
  return wheelContact(vehicle, new THREE.Vector3(localX, 0.04, localZ));
}

function wheelContact(vehicle, local) {
  const basis = getVehicleBasis(vehicle.yaw);
  const relative = new THREE.Vector3();
  const position = new THREE.Vector3();
  wheelContactInto(vehicle, local, basis, position, relative);
  return { position, relative };
}

function wheelContactInto(vehicle, local, basis, position, relative) {
  relative
    .copy(basis.right)
    .multiplyScalar(local.x)
    .addScaledVector(basis.forward, -local.z);
  position.copy(vehicle.position).add(relative);
  position.y = 0.04;
}

function pointVelocityInto(vehicle, relative, target) {
  target.set(
    vehicle.velocity.x + vehicle.yawRate * relative.z,
    0,
    vehicle.velocity.z - vehicle.yawRate * relative.x,
  );
  return target;
}

function pointVelocity(vehicle, relative) {
  return pointVelocityInto(vehicle, relative, new THREE.Vector3());
}

function getVehicleBasis(yaw) {
  return {
    forward: new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize(),
    right: new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).normalize(),
  };
}

function torqueFromForce(relative, force) {
  return relative.z * force.x - relative.x * force.z;
}

function dotGround(a, b) {
  return a.x * b.x + a.z * b.z;
}

function signedAngleOnGround(from, to) {
  const a = from.clone();
  const b = to.clone();
  a.y = 0;
  b.y = 0;
  if (a.lengthSq() < 0.0001 || b.lengthSq() < 0.0001) return 0;
  a.normalize();
  b.normalize();
  return Math.atan2(a.x * b.z - a.z * b.x, dotGround(a, b));
}

function yawFromForward(forward) {
  return Math.atan2(-forward.x, -forward.z);
}

function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function normalizeCameraAngle(angle) {
  const normalized = wrapAngle(angle);
  return THREE.MathUtils.clamp(normalized, -Math.PI, Math.PI);
}

function disposeObjectTree(root) {
  const disposedMaterials = new WeakSet();
  const disposedGeometries = new WeakSet();

  root.traverse((child) => {
    if (child.geometry && !disposedGeometries.has(child.geometry)) {
      child.geometry.dispose();
      disposedGeometries.add(child.geometry);
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material || disposedMaterials.has(material)) continue;

      for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose();
      }

      material.dispose();
      disposedMaterials.add(material);
    }
  });
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.fov = getResponsiveFov();
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(getRenderPixelRatio());
  renderer.setSize(width, height);
}

function getRenderPixelRatio() {
  const targetHeight = getTargetRenderHeight(graphicsSettings.resolutionScale);
  const targetRatio = targetHeight / Math.max(1, window.innerHeight);
  return THREE.MathUtils.clamp(targetRatio, 0.22, 4);
}

function getResponsiveFov() {
  return window.innerWidth < 560 ? 58 : 48;
}
