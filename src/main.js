import './style.css';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCarPreviewSystem } from './carPreview.js';
import { buildRouteSVG } from './routePreview.js';

const canvas = document.querySelector('#scene');
const hud = document.querySelector('.hud');
const driftFeedbackEl = document.querySelector('.drift-feedback');
const impactFlashEl = document.querySelector('.impact-flash');
const scorePopupsEl = document.querySelector('.score-popups');
const driftGaugeEl = document.querySelector('.drift-gauge');
const driftGaugeNeedleEl = document.querySelector('.drift-gauge-needle');
const driftGaugeChipEl = document.querySelector('.drift-gauge-chip');
const scoreEl = document.querySelector('#score');
const comboEl = document.querySelector('#combo');
const timerEl = document.querySelector('#timer');
const bestScoreEl = document.querySelector('#best-score');
const speedEl = document.querySelector('#speed');
const angleEl = document.querySelector('#angle');
const statusEl = document.querySelector('#status');
const pauseButton = document.querySelector('#pause-button');
const restartButton = document.querySelector('#restart-button');
const modeToggle = document.querySelector('#mode-toggle');
const cameraZoom = document.querySelector('#camera-zoom');
const cameraAngle = document.querySelector('#camera-angle');
const menuOverlay = document.querySelector('.menu-overlay');
const playButton = document.querySelector('#play-button');
const optionsButton = document.querySelector('#options-button');
const quitButton = document.querySelector('#quit-button');
const carContinueButton = document.querySelector('#car-continue');
const carSelectButtons = [...document.querySelectorAll('[data-select-car]')];
const carCards = [...document.querySelectorAll('[data-car-card]')];
const levelBackButton = document.querySelector('#level-back-button');
const resultScoreEl = document.querySelector('#result-score');
const resultBestScoreEl = document.querySelector('#result-best-score');
const resultMaxComboEl = document.querySelector('#result-max-combo');
const resultDriftTimeEl = document.querySelector('#result-drift-time');
const resultNewBestEl = document.querySelector('#result-new-best');
const controlsHintEl = document.querySelector('.controls-hint');
const resultRestartButton = document.querySelector('#result-restart');
const resultLevelSelectButton = document.querySelector('#result-level-select');
const resultMainMenuButton = document.querySelector('#result-main-menu');
const resumeButton = document.querySelector('#resume-button');
const pauseRestartButton = document.querySelector('#pause-restart');
const pauseLevelSelectButton = document.querySelector('#pause-level-select');
const pauseMainMenuButton = document.querySelector('#pause-main-menu');
const graphicsPresetSelect = document.querySelector('#graphics-preset');
const resolutionScaleInput = document.querySelector('#resolution-scale');
const resolutionValueEl = document.querySelector('#resolution-value');
const frameRateLimitSelect = document.querySelector('#frame-rate-limit');
const shadowQualitySelect = document.querySelector('#shadow-quality');
const muteToggle = document.querySelector('#mute-toggle');
const keybindButtons = [...document.querySelectorAll('[data-bind-action]')];
const keybindStatusEl = document.querySelector('#keybind-status');
const resetBindingsButton = document.querySelector('#reset-bindings');
const panels = {
  main: document.querySelector('[data-panel="main"]'),
  cars: document.querySelector('[data-panel="cars"]'),
  levels: document.querySelector('[data-panel="levels"]'),
  pause: document.querySelector('[data-panel="pause"]'),
  options: document.querySelector('[data-panel="options"]'),
  quit: document.querySelector('[data-panel="quit"]'),
  result: document.querySelector('[data-panel="result"]'),
  webgl: document.querySelector('[data-panel="webgl"]'),
};

const movementActions = ['up', 'left', 'right', 'down', 'handbrake'];
const actionLabels = {
  up: 'Forward',
  left: 'Left',
  right: 'Right',
  down: 'Reverse',
  handbrake: 'Handbrake',
};
const keyBindingStorageKey = 'driftDonut.keyBindings.v1';
const bestScoreStorageKey = 'driftDonut.bestScore.v1';
const muteStorageKey = 'driftDonut.muted.v1';
const defaultKeyBindings = {
  up: { key: 'z', code: 'KeyW', label: 'Z' },
  left: { key: 'q', code: 'KeyA', label: 'Q' },
  right: { key: 'd', code: 'KeyD', label: 'D' },
  down: { key: 's', code: 'KeyS', label: 'S' },
  handbrake: { key: ' ', code: 'Space', label: 'Space' },
};
const carConfigs = [
  {
    id: 'porsche',
    name: 'Stuttgart RS',
    tagline: 'Fastback firecracker. Big power, big angles.',
    bay: 'Preview bay 01',
    stats: {
      power: 610,
      handling: 86,
      driftAngle: 92,
      grip: 74,
      weightKg: 1280,
    },
    handling: {
      driveForceScale: 1.06,
      rearGripScale: 0.96,
      steerScale: 0.97,
      yawDampingScale: 0.96,
    },
    visual: {
      body: 'porsche',
      paint: 0x9ba4aa,
      darkPaint: 0x222a31,
      accent: 0x5ce8ff,
      accentWarm: 0xffdd67,
      glass: 0x9edfff,
      rim: 0x1b1f22,
      brake: 0x5ce8ff,
      underglow: 0x5ce8ff,
      decal: 'APEX LABS',
      decalAlt: 'NIGHT RUN',
      lightStyle: 'round',
      cabin: [1.34, 0.5, 1.18],
      cabinPosition: [0, 1.12, 0.28],
      scale: [1.02, 0.92, 1.02],
      wheelOffset: 1.4,
      rearWingHeight: 0.9,
      rearWingWidth: 2.3,
      frontSplitter: 2.74,
    },
  },
  {
    id: 'e30',
    name: 'Bavaria E3',
    tagline: 'Boxy, light, and always ready to rotate.',
    bay: 'Preview bay 02',
    stats: {
      power: 420,
      handling: 90,
      driftAngle: 88,
      grip: 69,
      weightKg: 1120,
    },
    handling: {
      driveForceScale: 0.94,
      rearGripScale: 1.02,
      steerScale: 1.06,
      yawDampingScale: 1.05,
      maxSpeedScale: 0.96,
    },
    visual: {
      body: 'e30',
      paint: 0xd8202c,
      darkPaint: 0x2b090b,
      accent: 0xffdd67,
      accentWarm: 0x5ce8ff,
      glass: 0xa8d7ff,
      rim: 0x111416,
      brake: 0xffdd67,
      underglow: 0xff2e4c,
      decal: 'SIDEWAYS CO.',
      decalAlt: 'LOCK STOP',
      lightStyle: 'square',
      cabin: [1.5, 0.66, 1.16],
      cabinPosition: [0, 1.18, 0.28],
      scale: [0.98, 1, 0.98],
      wheelOffset: 1.35,
      rearWingHeight: 1.33,
      rearWingWidth: 2.46,
      frontSplitter: 2.34,
    },
  },
];

const statMeterRanges = [
  { key: 'power', label: 'Power', min: 300, max: 700, format: (value) => `${value} HP` },
  { key: 'handling', label: 'Handling', min: 60, max: 100, format: (value) => `${value}` },
  { key: 'driftAngle', label: 'Drift Angle', min: 60, max: 100, format: (value) => `${value}` },
  { key: 'grip', label: 'Grip', min: 50, max: 100, format: (value) => `${value}` },
  // Lighter is better, so the weight meter fills toward the light end.
  { key: 'weightKg', label: 'Weight', min: 1400, max: 900, format: (value) => `${value} kg` },
];

const smallMachine = (navigator.deviceMemory && navigator.deviceMemory <= 4)
  || navigator.hardwareConcurrency <= 4
  || window.matchMedia('(max-width: 640px)').matches;
const graphicsStorageKey = 'driftDonut.graphics.v1';
const shadowQualities = {
  high: {
    enabled: true,
    mapSize: 1024,
    type: THREE.PCFSoftShadowMap,
  },
  medium: {
    enabled: true,
    mapSize: 768,
    type: THREE.PCFShadowMap,
  },
  low: {
    enabled: true,
    mapSize: 256,
    radius: 2,
    type: THREE.PCFShadowMap,
  },
  off: {
    enabled: false,
    mapSize: 128,
    type: THREE.BasicShadowMap,
  },
};
const graphicsPresets = {
  high: {
    defaultResolutionScale: 100,
    defaultFrameRateLimit: 60,
    defaultShadowQuality: 'high',
    antialias: true,
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
    defaultResolutionScale: smallMachine ? 52 : 70,
    defaultFrameRateLimit: 60,
    defaultShadowQuality: 'medium',
    antialias: !smallMachine,
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
    defaultResolutionScale: 28,
    defaultFrameRateLimit: 45,
    defaultShadowQuality: 'low',
    antialias: false,
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
    defaultResolutionScale: 0,
    defaultFrameRateLimit: 30,
    defaultShadowQuality: 'off',
    antialias: false,
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
let lastFrameAt = 0;
const runConfig = {
  duration: 90,
  minSpeed: 2.8,
  angleDisplaySpeed: 2.2,
  minAngle: THREE.MathUtils.degToRad(12),
  idealAngle: THREE.MathUtils.degToRad(46),
  maxAngle: THREE.MathUtils.degToRad(78),
  minRearSlip: 0.32,
  breakGrace: 0.45,
  basePointsPerSecond: 55,
  sustainRamp: 1.5,
  comboGain: 0.42,
  comboDecay: 1.8,
  comboSoftDecay: 0.35,
  maxCombo: 5,
};

const manualTuning = {
  steerLimitLowSpeed: 0.82,
  steerLimitHighSpeed: 0.42,
  steerFalloffSpeed: 8.2,
  throttleReverseScale: 0.58,
  brakingSpeedThreshold: 0.45,
  brakeForce: 9.2,
  linearDrag: 0.28,
  maxSpeed: 12.4,
  yawDamping: 0.52,
  spinStability: 0.74,
  steerResponse: 0.0045,
  launchAssistDuration: 10,
  launchDriveForceScale: 1.28,
  launchSteerScale: 1.04,
  launchYawDampingScale: 1.2,
};

let scene;
let camera;
let renderer;
let clock;
let world;
let levelSystem;
let car;
let menuPreviewSystem;
let carPreviewSystem;
let smokeSystem;
let skidSystem;
let audioEngine;
let activeColliders = [];
let activeRoad;

const state = {
  elapsed: 0,
  paused: true,
  manual: false,
  screen: 'menu',
  level: 0,
  selectedCar: 'porsche',
  levelBackPanel: 'main',
  shadows: getShadowQualitySettings().enabled,
  levelFogDensity: 0.022,
  muted: loadMutePreference(),
  cameraZoom: 1,
  cameraAngle: 0,
  cameraHeight: 1,
  bindingTarget: null,
  keyBindings: loadKeyBindings(),
  run: {
    duration: runConfig.duration,
    timeLeft: runConfig.duration,
    score: 0,
    bestScore: loadBestScore(),
    combo: 1,
    driftDuration: 0,
    driftTimeTotal: 0,
    maxCombo: 1,
    invalidTime: 0,
    driftValid: false,
    driftBlockReason: null,
    newBest: false,
    pointsPerSecond: 0,
    ended: false,
  },
  pointer: {
    active: false,
    lastX: 0,
    lastY: 0,
  },
  smokeAccumulator: 0,
  feedback: {
    driftIntensity: 0,
    shake: 0,
    impact: 0,
    impactFlash: 0,
    popupBank: 0,
    popupCooldown: 0,
    comboPulse: 0,
    lastComboStep: 1,
  },
  input: {
    up: false,
    down: false,
    left: false,
    right: false,
    handbrake: false,
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
    handbrake: 0,
    rearSlip: 0,
    frontSlip: 0,
    lateralG: 0,
    offRoadTime: 0,
    roadFrame: null,
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
  rearGrip: 3.35,
  frontCornering: 12.5,
  rearCornering: 5.05,
};

const carCollisionSamples = [
  { x: 0, z: -1.55, radius: 0.78 },
  { x: 0, z: 0, radius: 0.92 },
  { x: 0, z: 1.45, radius: 0.78 },
];

const levelConfigs = [
  {
    name: 'Urban Night Loop',
    description: 'Neon sweepers, an underpass exit, and a forgiving parking pad.',
    difficulty: 1,
    recommendedCar: 'porsche',
    road: {
      points: [
        [-30, -8], [-20, -22], [-2, -24], [14, -18],
        [26, -6], [22, 8], [8, 12], [-4, 8],
        [-14, 16], [-28, 12], [-34, 2], [-30, -8],
      ],
      closed: true,
      width: 7.5,
      shoulderWidth: 0.75,
      laneColor: 0x5ce8ff,
      edgeColor: 0xff4eb8,
      asphalt: 0x34383b,
      targetSpeed: 9.4,
      driftAngle: THREE.MathUtils.degToRad(59),
      spawn: [-28, -10],
      spawnLookAt: [-20, -22],
      resetEvery: 3,
      extraWidths: [
        { pointIndex: 8, radius: 8.5, width: 10 },
      ],
      scoringZones: [
        { pointIndex: 2, radius: 6.5, multiplier: 1.2, label: 'Entry sweeper' },
        { pointIndex: 5, radius: 6, multiplier: 1.3, label: 'Underpass exit' },
        { pointIndex: 8, radius: 7, multiplier: 1.15, label: 'Parking pad' },
      ],
    },
    handling: {
      driveForceScale: 1,
      frontGripScale: 1,
      rearGripScale: 1,
      frontCorneringScale: 1,
      rearCorneringScale: 1,
      rearPowerGrip: 1.65,
      yawDampingScale: 1,
      dragScale: 1,
      maxSpeedScale: 1,
      steerScale: 1,
    },
    scoring: {
      driftRewardMultiplier: 1,
    },
    visual: {
      background: 0x06070c,
      fog: 0x070713,
      fogDensity: 0.022,
      ground: 0x1b2223,
      gridMain: 0x2b555d,
      terrain: 0x182427,
      guardrail: 0x8fa7ad,
      sceneryAccent: 0xff4eb8,
    },
    props: createUrbanNightProps,
  },
  {
    name: 'Mountain Touge',
    description: 'Low-grip hairpins and switchbacks. Commit to every flick.',
    difficulty: 3,
    recommendedCar: 'e30',
    road: {
      points: [
        [-26, 20], [-14, 24], [-4, 18], [-10, 8],
        [-26, 4], [-30, -10], [-16, -20], [0, -16],
        [10, -6], [4, 6], [14, 18], [28, 14],
        [30, 0], [18, -10], [6, -2], [-4, 10],
      ],
      closed: true,
      width: 6.4,
      shoulderWidth: 0.65,
      laneColor: 0xf7f0d2,
      edgeColor: 0xffdd67,
      asphalt: 0x3a3d3a,
      targetSpeed: 8.7,
      driftAngle: THREE.MathUtils.degToRad(64),
      spawnIndex: 6,
      resetEvery: 4,
      extraWidths: [
        { pointIndex: 4, radius: 6, width: 8.5 },
        { pointIndex: 12, radius: 6.5, width: 8.5 },
      ],
      scoringZones: [
        { pointIndex: 4, radius: 6.2, multiplier: 1.35, label: 'Downhill hairpin' },
        { pointIndex: 8, radius: 6, multiplier: 1.25, label: 'Transition ridge' },
        { pointIndex: 13, radius: 6.2, multiplier: 1.35, label: 'Final switchback' },
      ],
    },
    handling: {
      driveForceScale: 1.08,
      frontGripScale: 0.92,
      rearGripScale: 0.72,
      frontCorneringScale: 0.92,
      rearCorneringScale: 0.78,
      rearPowerGrip: 1.25,
      yawDampingScale: 0.84,
      dragScale: 0.86,
      maxSpeedScale: 1.02,
      steerScale: 0.94,
    },
    scoring: {
      driftRewardMultiplier: 1.25,
    },
    visual: {
      background: 0x0b1012,
      fog: 0x0b1012,
      fogDensity: 0.028,
      ground: 0x263525,
      gridMain: 0x466c52,
      terrain: 0x2f4a30,
      guardrail: 0xb9c2ba,
      sceneryAccent: 0xd3b36b,
    },
    props: createMountainTougeProps,
  },
  {
    name: 'Industrial Dock Route',
    description: 'Wide dock straights feeding a tight container chicane.',
    difficulty: 2,
    recommendedCar: 'porsche',
    road: {
      points: [
        [-32, -18], [-16, -24], [8, -22], [26, -12],
        [30, 4], [16, 14], [0, 10], [-10, 0],
        [-2, -8], [12, -2], [20, 10], [8, 24],
        [-18, 22], [-34, 8], [-32, -18],
      ],
      closed: true,
      width: 8,
      shoulderWidth: 0.8,
      laneColor: 0xffdd67,
      edgeColor: 0x5ce8ff,
      asphalt: 0x333635,
      targetSpeed: 9.6,
      driftAngle: THREE.MathUtils.degToRad(61),
      spawnIndex: 0,
      resetEvery: 3,
      extraWidths: [
        { pointIndex: 11, radius: 8.5, width: 12 },
      ],
      scoringZones: [
        { pointIndex: 2, radius: 7, multiplier: 1.22, label: 'Dock entry' },
        { pointIndex: 7, radius: 5.5, multiplier: 1.4, label: 'Container chicane' },
        { pointIndex: 11, radius: 8, multiplier: 1.12, label: 'Practice pad' },
      ],
    },
    handling: {
      driveForceScale: 1.12,
      frontGripScale: 1,
      rearGripScale: 0.96,
      frontCorneringScale: 1,
      rearCorneringScale: 0.96,
      rearPowerGrip: 1.58,
      yawDampingScale: 0.98,
      dragScale: 0.96,
      maxSpeedScale: 1.12,
      steerScale: 1.02,
    },
    scoring: {
      driftRewardMultiplier: 1.15,
    },
    visual: {
      background: 0x07090a,
      fog: 0x07090a,
      fogDensity: 0.024,
      ground: 0x20251f,
      gridMain: 0x657166,
      terrain: 0x20261f,
      guardrail: 0xaeb7b4,
      sceneryAccent: 0xffc067,
    },
    props: createIndustrialDockProps,
  },
];

initializeGame();

function initializeGame() {
  if (!hasWebGLSupport()) {
    showWebGLFallback();
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090a);
  scene.fog = new THREE.FogExp2(0x07090a, 0.022);

  camera = new THREE.PerspectiveCamera(getResponsiveFov(), window.innerWidth / window.innerHeight, 0.1, 260);
  camera.position.set(-9, 7, 12);

  try {
    renderer = createRenderer();
  } catch (error) {
    showWebGLFallback(error);
    return;
  }

  clock = new THREE.Clock();
  world = new THREE.Group();
  scene.add(world);

  // Image-based lighting: a prefiltered studio environment gives the car
  // paint, glass, and rims real reflections. Generated once at startup.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
  pmrem.dispose();

  setupLights();
  levelSystem = createGround();
  car = createCar(getSelectedCarConfig());
  world.add(car.root);
  menuPreviewSystem = createMenuPreviewSystem();
  world.add(menuPreviewSystem.root);
  carPreviewSystem = createCarPreviewSystem({ carConfigs, createCar, lowPower: smallMachine });
  smokeSystem = createSmokeSystem();
  skidSystem = createSkidSystem();
  state.vehicle.contacts = createWheelContactData();
  levelSystem.setLevel(0);
  renderGraphicsSettings();
  applyGraphicsSettings();

  // Level cards must exist before setupEventListeners binds [data-level].
  renderLevelCards();
  setupEventListeners();
  muteToggle.checked = state.muted;
  renderKeyBindings();
  renderCarCards();
  renderCarSelection();
  showMainMenu();
  animate();
}

function createRenderer() {
  const shadowQuality = getShadowQualitySettings();
  const webglRenderer = new THREE.WebGLRenderer({
    antialias: getGraphicsProfile().antialias,
    canvas,
    powerPreference: 'high-performance',
  });
  webglRenderer.setPixelRatio(getRenderPixelRatio());
  webglRenderer.setSize(window.innerWidth, window.innerHeight);
  webglRenderer.shadowMap.enabled = shadowQuality.enabled;
  webglRenderer.shadowMap.type = shadowQuality.type;
  webglRenderer.outputColorSpace = THREE.SRGBColorSpace;
  webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  webglRenderer.toneMappingExposure = 1.1;
  return webglRenderer;
}

function hasWebGLSupport() {
  if (new URLSearchParams(window.location.search).has('force-no-webgl')) return false;
  if (!window.WebGLRenderingContext) return false;

  const probeCanvas = document.createElement('canvas');
  try {
    return Boolean(
      probeCanvas.getContext('webgl2')
        || probeCanvas.getContext('webgl')
        || probeCanvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

function showWebGLFallback(error) {
  document.body.classList.add('webgl-unavailable');
  hud.hidden = true;
  menuOverlay.hidden = false;
  canvas.setAttribute('aria-hidden', 'true');

  for (const control of document.querySelectorAll('button, input, select')) {
    control.disabled = true;
  }

  showMenuPanel('webgl');

  if (error) {
    console.warn('WebGL renderer initialization failed.', error);
  }
}

function setupEventListeners() {
  canvas.addEventListener('pointerdown', (event) => {
    if (state.screen !== 'playing') return;
    unlockAudio();
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
    showCarSelect();
  });

  optionsButton.addEventListener('click', () => {
    showMenuPanel('options');
  });

  quitButton.addEventListener('click', () => {
    quitGame();
  });

  pauseButton.addEventListener('click', () => {
    showPauseMenu();
  });

  restartButton.addEventListener('click', () => {
    restartCurrentRun();
  });

  resultRestartButton.addEventListener('click', () => {
    restartCurrentRun();
  });

  resultLevelSelectButton.addEventListener('click', () => {
    showLevelSelect('main');
  });

  resultMainMenuButton.addEventListener('click', () => {
    showMainMenu();
  });

  resumeButton.addEventListener('click', () => {
    resumeCurrentRun();
  });

  pauseRestartButton.addEventListener('click', () => {
    restartCurrentRun();
  });

  pauseLevelSelectButton.addEventListener('click', () => {
    showLevelSelect('main');
  });

  pauseMainMenuButton.addEventListener('click', () => {
    showMainMenu();
  });

  for (const button of document.querySelectorAll('[data-level]')) {
    button.addEventListener('click', () => {
      startLevel(Number(button.dataset.level));
    });
  }

  for (const button of carSelectButtons) {
    button.addEventListener('click', () => {
      selectCar(button.dataset.selectCar);
    });
  }

  for (const card of carCards) {
    card.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      selectCar(card.dataset.carCard);
    });
  }

  carContinueButton.addEventListener('click', () => {
    showLevelSelect('cars');
  });

  levelBackButton.addEventListener('click', () => {
    if (state.levelBackPanel === 'cars') {
      showCarSelect();
      return;
    }
    showMainMenu();
  });

  for (const button of document.querySelectorAll('[data-back-menu]')) {
    button.addEventListener('click', () => {
      showMainMenu();
    });
  }

  graphicsPresetSelect.addEventListener('change', () => {
    const preset = graphicsPresets[graphicsPresetSelect.value] ? graphicsPresetSelect.value : 'medium';
    const profile = graphicsPresets[preset];
    graphicsSettings = {
      preset,
      resolutionScale: profile.defaultResolutionScale,
      frameRateLimit: profile.defaultFrameRateLimit,
      shadowQuality: profile.defaultShadowQuality,
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

  frameRateLimitSelect.addEventListener('change', () => {
    graphicsSettings.frameRateLimit = Number(frameRateLimitSelect.value);
    saveGraphicsSettings();
    renderGraphicsSettings();
  });

  shadowQualitySelect.addEventListener('change', () => {
    setShadowQuality(shadowQualitySelect.value);
  });

  muteToggle.addEventListener('change', () => {
    setMuted(muteToggle.checked);
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

  modeToggle.addEventListener('click', () => {
    unlockAudio();
    state.manual = !state.manual;
    modeToggle.textContent = state.manual ? 'Play auto' : 'Play manual';
    resetVehicle(state.manual);
    state.run.driftDuration = 0;
    state.run.invalidTime = runConfig.breakGrace;
    state.run.driftValid = false;
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
      if (state.screen === 'playing' && state.paused) {
        resumeCurrentRun();
      } else if (state.screen === 'playing') {
        showPauseMenu();
      } else if (state.screen === 'menu' && !panels.main.hidden) {
        showMainMenu();
      } else if (state.screen === 'menu') {
        showMainMenu();
      }
      return;
    }

    if (event.key.toLowerCase() === 'r' && (state.screen === 'playing' || state.screen === 'result')) {
      event.preventDefault();
      unlockAudio();
      restartCurrentRun();
      return;
    }

    if (!isMovementKey(event)) return;
    // Only capture driving keys during play; in menus Space/letters must keep
    // their normal behavior (e.g. activating the focused button).
    if (state.screen !== 'playing') return;
    event.preventDefault();
    unlockAudio();
    setMovementInput(event, true);
  });

  window.addEventListener('keyup', (event) => {
    if (!isMovementKey(event)) return;
    if (state.screen !== 'playing') {
      clearMovementInput();
      return;
    }
    event.preventDefault();
    setMovementInput(event, false);
  });

  window.addEventListener('resize', onResize);
}

function setupLights() {
  const hemi = new THREE.HemisphereLight(0xd8f5ff, 0x263124, 1.9);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff0cd, 4.2);
  key.position.set(-10, 15, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(getShadowQualitySettings().mapSize, getShadowQualitySettings().mapSize);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 96;
  key.shadow.camera.left = -48;
  key.shadow.camera.right = 48;
  key.shadow.camera.top = 48;
  key.shadow.camera.bottom = -48;
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
    new THREE.PlaneGeometry(164, 164),
    new THREE.MeshStandardMaterial({
      color: 0x20261f,
      roughness: 0.9,
      metalness: 0.01,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  const grid = new THREE.GridHelper(154, 154, 0x5d6c62, 0x323c35);
  grid.position.y = 0.012;
  grid.material.transparent = true;
  grid.material.opacity = 0.2;
  world.add(grid);

  return {
    setLevel(index) {
      const level = getLevelConfig(index);
      const { visual } = level;
      scene.background = new THREE.Color(visual.background);
      scene.fog.color.setHex(visual.fog);
      state.levelFogDensity = visual.fogDensity;
      scene.fog.density = getCurrentLevelFogDensity();
      ground.material.color.setHex(visual.ground);
      grid.material.color?.setHex(visual.gridMain);

      disposeObjectTree(levelDecor);
      levelDecor.clear();
      activeColliders = [];
      activeRoad = createRoadLayout(levelDecor, level);
      level.props(levelDecor, activeRoad);
      applyGraphicsSettings();
    },
    setMenuPresentation(active) {
      levelDecor.visible = !active;
      ground.visible = !active;
      grid.visible = !active;
    },
  };
}

function createMenuPreviewSystem() {
  const root = new THREE.Group();
  root.visible = false;

  const floorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x2a3134,
    map: makeGarageFloorTexture(),
    roughness: 0.34,
    metalness: 0.18,
    clearcoat: 0.7,
    clearcoatRoughness: 0.24,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x11171a,
    roughness: 0.62,
    metalness: 0.12,
  });
  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0d0f,
    roughness: 0.42,
    metalness: 0.32,
  });
  const blueNeon = createNeonMaterial(0x5ce8ff, 0.85);
  const amberNeon = createNeonMaterial(0xffdd67, 0.72);
  const pinkNeon = createNeonMaterial(0xff2e72, 0.62);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.018, -2.6);
  floor.receiveShadow = true;
  root.add(floor);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 5.2, 0.28), wallMaterial);
  backWall.position.set(0, 2.56, -7.2);
  backWall.receiveShadow = true;
  root.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.2, 12), wallMaterial);
  leftWall.position.set(-8.9, 2.56, -2.3);
  root.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.2, 12), wallMaterial);
  rightWall.position.set(8.9, 2.56, -2.3);
  root.add(rightWall);

  for (const [x, material] of [[-3.15, blueNeon], [3.15, amberNeon], [0, pinkNeon]]) {
    addMesh(root, new RoundedBoxGeometry(2.9, 0.08, 0.08, 2, 0.02), material, [x, 3.65, -7.02]);
  }

  for (let i = 0; i < 9; i += 1) {
    const mark = addMesh(
      root,
      new RoundedBoxGeometry(1.4 + (i % 3) * 0.25, 0.012, 0.08, 2, 0.01),
      carbonMaterial,
      [-6.3 + i * 1.55, 0.006, -0.2 - (i % 2) * 0.7],
      [0, 0.34 + i * 0.21, 0],
    );
    mark.material = mark.material.clone();
    mark.material.transparent = true;
    mark.material.opacity = 0.62;
  }

  addGaragePoster(root, 'NIGHT RUN', [-5.7, 2.45, -7.03], blueNeon);
  addGaragePoster(root, 'SIDEWAYS CO.', [0, 2.35, -7.03], amberNeon);
  addGaragePoster(root, 'APEX LABS', [5.7, 2.45, -7.03], pinkNeon);
  addGarageProps(root, carbonMaterial, blueNeon, amberNeon);

  const previewSlots = new Map();
  const slotData = [
    { config: carConfigs[0], position: [-1.28, 0, -3.48], rotation: -0.34 },
    { config: carConfigs[1], position: [1.28, 0, -3.48], rotation: 0.34 },
  ];

  for (const slot of slotData) {
    const group = new THREE.Group();
    group.position.set(...slot.position);
    group.rotation.y = slot.rotation;

    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d1113,
      roughness: 0.36,
      metalness: 0.54,
      emissive: slot.config.visual.accent,
      emissiveIntensity: 0.08,
    });
    const platform = new THREE.Mesh(new RoundedBoxGeometry(4.9, 0.08, 3, 4, 0.08), platformMaterial);
    platform.position.y = 0.02;
    platform.receiveShadow = true;
    group.add(platform);

    const glow = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.08, 64),
      new THREE.MeshBasicMaterial({
        color: slot.config.visual.accent,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.08;
    group.add(glow);

    // The platforms used to sit empty; park each car on its showcase spot.
    const showcase = createCar(slot.config);
    showcase.root.position.y = 0.07;
    showcase.root.scale.multiplyScalar(0.78);
    showcase.root.traverse((child) => {
      if (child.isPointLight) {
        child.userData.optionalLight = true;
        child.intensity *= 0.5;
      }
    });
    group.add(showcase.root);

    root.add(group);
    previewSlots.set(slot.config.id, { group, glow, platform });
  }

  const garageLight = new THREE.PointLight(0x5ce8ff, 36, 12, 2.4);
  garageLight.position.set(-4.2, 3.2, -2.6);
  root.add(garageLight);
  const warmLight = new THREE.PointLight(0xffdd67, 26, 11, 2.4);
  warmLight.position.set(4.2, 2.8, -2.2);
  root.add(warmLight);

  const hazeSprites = [];
  if (!smallMachine) {
    const hazeMaterial = new THREE.SpriteMaterial({
      map: makeSmokeTexture(96),
      color: 0x8fb4c4,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
    });
    for (let i = 0; i < 5; i += 1) {
      const sprite = new THREE.Sprite(hazeMaterial.clone());
      sprite.position.set(-5.5 + i * 2.6, 0.9 + (i % 2) * 0.8, -4.6 + (i % 3) * 1.2);
      sprite.scale.setScalar(3.4 + (i % 3) * 1.3);
      sprite.userData.basePhase = i * 1.7;
      root.add(sprite);
      hazeSprites.push(sprite);
    }
  }

  return {
    root,
    setVisible(visible) {
      root.visible = visible;
    },
    setSelected(carId) {
      for (const [id, slot] of previewSlots) {
        const selected = id === carId;
        slot.glow.material.opacity = selected ? 0.48 : 0.16;
        slot.platform.material.emissiveIntensity = selected ? 0.18 : 0.05;
      }
    },
    update(delta) {
      if (!root.visible) return;
      root.userData.time = (root.userData.time ?? 0) + delta;
      const time = root.userData.time;
      for (const [id, slot] of previewSlots) {
        const selected = id === state.selectedCar;
        const targetY = selected ? 0.07 : 0;
        slot.group.position.y = THREE.MathUtils.lerp(slot.group.position.y, targetY, 1 - Math.pow(0.03, delta));
        slot.group.rotation.y += Math.sin(time * 0.7 + (id === 'e30' ? 1.2 : 0)) * delta * 0.035;
      }

      const hazeVisible = getGraphicsProfile().smoke;
      for (const sprite of hazeSprites) {
        sprite.visible = hazeVisible;
        if (!hazeVisible) continue;
        const phase = time * 0.16 + sprite.userData.basePhase;
        sprite.position.x += Math.sin(phase) * delta * 0.12;
        sprite.position.y += Math.cos(phase * 0.7) * delta * 0.05;
        sprite.material.opacity = 0.035 + (Math.sin(phase * 0.9) + 1) * 0.02;
      }
    },
  };
}

function createNeonMaterial(color, intensity = 0.7) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.24,
    metalness: 0.1,
  });
}

function addGaragePoster(parent, text, position, frameMaterial) {
  const poster = new THREE.Group();
  poster.position.set(...position);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(2.35, 0.9, 0.08, 3, 0.025), frameMaterial);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.12, 0.7),
    makePosterMaterial(text),
  );
  face.position.z = 0.052;
  poster.add(frame, face);
  parent.add(poster);
}

function makePosterMaterial(text) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 512;
  textureCanvas.height = 192;
  const context = textureCanvas.getContext('2d');
  context.fillStyle = '#07090a';
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.fillStyle = '#f4f6f0';
  context.font = '900 54px Inter, Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, textureCanvas.width / 2, textureCanvas.height / 2);
  context.strokeStyle = '#5ce8ff';
  context.lineWidth = 5;
  context.strokeRect(18, 18, textureCanvas.width - 36, textureCanvas.height - 36);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture });
}

function addGarageProps(parent, carbonMaterial, blueNeon, amberNeon) {
  for (const [x, z, color] of [[-7, -4.9, 0x2a3034], [-6.2, -4.92, 0x30383c], [6.9, -4.8, 0x2c3035]]) {
    const toolbox = new THREE.Mesh(
      new RoundedBoxGeometry(0.9, 0.52, 0.56, 3, 0.04),
      new THREE.MeshStandardMaterial({ color, roughness: 0.56, metalness: 0.35 }),
    );
    toolbox.position.set(x, 0.26, z);
    toolbox.castShadow = true;
    parent.add(toolbox);
  }

  for (const [x, z] of [[-7.2, -1.1], [-6.7, -0.62], [7.05, -1.06], [6.6, -0.52]]) {
    const spare = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.12, 14, 32), carbonMaterial);
    spare.position.set(x, 0.38, z);
    spare.rotation.set(Math.PI / 2, 0.25, 0);
    spare.castShadow = true;
    parent.add(spare);
  }

  addMesh(parent, new RoundedBoxGeometry(0.14, 2.6, 0.14, 3, 0.03), blueNeon, [-7.8, 1.35, -6.35]);
  addMesh(parent, new RoundedBoxGeometry(0.14, 2.6, 0.14, 3, 0.03), amberNeon, [7.8, 1.35, -6.35]);

  // Tyre stacks in the back corners
  const tyreGeometry = new THREE.TorusGeometry(0.36, 0.15, 12, 28);
  for (const [x, z, lean] of [[-7.6, -5.6, 0.08], [-6.6, -5.9, -0.1], [7.5, -5.5, 0.12]]) {
    for (let level = 0; level < 3; level += 1) {
      const tyre = new THREE.Mesh(tyreGeometry, carbonMaterial);
      tyre.position.set(x + level * 0.03, 0.16 + level * 0.3, z);
      tyre.rotation.set(Math.PI / 2 + lean * level, level * 0.7, 0);
      tyre.castShadow = true;
      parent.add(tyre);
    }
  }

  // Work cones and a floor cable near the bays
  const coneGeometry = new THREE.ConeGeometry(0.16, 0.42, 12);
  const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xd96a1f, roughness: 0.6, metalness: 0.05 });
  for (const [x, z] of [[-3.4, -1.2], [3.5, -1.4], [4.4, -2.6]]) {
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(x, 0.21, z);
    cone.castShadow = true;
    parent.add(cone);
  }
  addMesh(parent, new RoundedBoxGeometry(5.4, 0.025, 0.1, 2, 0.012), carbonMaterial, [-2.4, 0.012, -1.9], [0, 0.5, 0]);
}

function makeGarageFloorTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#565e62';
  ctx.fillRect(0, 0, size, size);

  // Concrete blotches
  for (let i = 0; i < 130; i += 1) {
    const shade = 70 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgba(${shade}, ${shade + 4}, ${shade + 6}, ${0.16 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      3 + Math.random() * 22,
      2 + Math.random() * 14,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Expansion joints
  ctx.strokeStyle = 'rgba(28, 32, 34, 0.5)';
  ctx.lineWidth = 2;
  for (const offset of [size * 0.25, size * 0.5, size * 0.75]) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(size, offset);
    ctx.stroke();
  }

  // Old tyre arcs
  ctx.strokeStyle = 'rgba(16, 18, 19, 0.4)';
  ctx.lineWidth = 5;
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    const arcX = Math.random() * size;
    const arcY = Math.random() * size;
    const radius = 26 + Math.random() * 60;
    const start = Math.random() * Math.PI * 2;
    ctx.arc(arcX, arcY, radius, start, start + 0.6 + Math.random() * 1.1);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

function createRoadLayout(parent, level) {
  const road = buildRoadData(level.road);
  parent.add(createRoadMesh(road, level.road.asphalt));
  createRoadShoulders(parent, road, level.visual);
  createRoadMarkings(parent, road, level.road);
  createRoadEdges(parent, road, level.visual);
  createScoringZoneMarkers(parent, road, level.road);
  return road;
}

function buildRoadData(config) {
  const rawPoints = normalizeRoadPoints(config.points, config.closed);
  const curvePoints = rawPoints.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(curvePoints, config.closed, 'catmullrom', 0.42);
  const sampleCount = config.samples ?? Math.max(144, curvePoints.length * 16);
  const samples = [];

  for (let i = 0; i <= sampleCount; i += 1) {
    const t = config.closed ? (i % sampleCount) / sampleCount : i / sampleCount;
    const position = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).setY(0);
    if (tangent.lengthSq() < 0.0001) tangent.set(0, 0, -1);
    tangent.normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const width = getRoadWidthAt(position, config, rawPoints);
    samples.push({ position, tangent, normal, width, t, index: i });
  }

  const resetPoints = createResetPoints(config, curve, rawPoints);
  const scoringZones = (config.scoringZones ?? []).map((zone) => ({
    ...zone,
    center: pointFromRoadIndex(rawPoints, zone.pointIndex),
  }));
  const spawn = getRoadSpawn(config, curve);

  return {
    config,
    curve,
    points: rawPoints,
    samples,
    sampleCount,
    resetPoints,
    scoringZones,
    spawn,
    maxWidth: Math.max(...samples.map((sample) => sample.width)),
  };
}

function normalizeRoadPoints(points, closed) {
  const normalized = points.map(([x, z]) => [x, z]);
  if (!closed || normalized.length < 2) return normalized;
  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.001) normalized.pop();
  return normalized;
}

function getRoadWidthAt(position, config, roadPoints) {
  let width = config.width;
  for (const pad of config.extraWidths ?? []) {
    const center = pointFromRoadIndex(roadPoints, pad.pointIndex);
    const distance = Math.hypot(position.x - center.x, position.z - center.z);
    if (distance >= pad.radius) continue;
    const influence = 1 - THREE.MathUtils.smoothstep(distance / pad.radius, 0, 1);
    width = Math.max(width, THREE.MathUtils.lerp(config.width, pad.width, influence));
  }
  return width;
}

function pointFromRoadIndex(roadPoints, index) {
  const point = roadPoints[((index % roadPoints.length) + roadPoints.length) % roadPoints.length];
  return new THREE.Vector3(point[0], 0, point[1]);
}

function getRoadSpawn(config, curve) {
  if (!config.spawn || !config.spawnLookAt) {
    const index = config.spawnIndex ?? 0;
    const point = curve.points?.[index % curve.points.length]?.clone()
      ?? new THREE.Vector3(config.points[0][0], 0, config.points[0][1]);
    const next = curve.points?.[(index + 1) % curve.points.length]?.clone()
      ?? new THREE.Vector3(config.points[1][0], 0, config.points[1][1]);
    const tangent = next.sub(point).setY(0);
    if (tangent.lengthSq() < 0.001) tangent.copy(curve.getTangentAt(0));
    tangent.normalize();
    return {
      position: point,
      yaw: yawFromForward(tangent),
      tangent,
    };
  }

  const spawnPoint = new THREE.Vector3(config.spawn[0], 0, config.spawn[1]);
  const lookAt = new THREE.Vector3(config.spawnLookAt[0], 0, config.spawnLookAt[1]);
  const tangent = lookAt.clone().sub(spawnPoint);
  if (tangent.lengthSq() < 0.001) tangent.copy(curve.getTangentAt(0));
  tangent.y = 0;
  tangent.normalize();
  return {
    position: spawnPoint,
    yaw: yawFromForward(tangent),
    tangent,
  };
}

function createRoadMesh(road, asphaltColor) {
  const vertices = [];
  const indices = [];
  const colors = [];
  const color = new THREE.Color(asphaltColor);

  for (const sample of road.samples) {
    const half = sample.width / 2;
    const left = sample.position.clone().addScaledVector(sample.normal, half);
    const right = sample.position.clone().addScaledVector(sample.normal, -half);
    vertices.push(left.x, 0.034, left.z, right.x, 0.034, right.z);
    for (let side = 0; side < 2; side += 1) colors.push(color.r, color.g, color.b);
  }

  for (let i = 0; i < road.samples.length - 1; i += 1) {
    const vertex = i * 2;
    indices.push(vertex, vertex + 2, vertex + 1, vertex + 1, vertex + 2, vertex + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
    vertexColors: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createRoadShoulders(parent, road, visual) {
  const material = new THREE.MeshStandardMaterial({
    color: visual.terrain,
    roughness: 0.94,
    metalness: 0,
  });
  for (let side = -1; side <= 1; side += 2) {
    const vertices = [];
    const indices = [];
    for (const sample of road.samples) {
      const inner = sample.position.clone().addScaledVector(sample.normal, side * sample.width / 2);
      const outer = sample.position.clone().addScaledVector(
        sample.normal,
        side * (sample.width / 2 + road.config.shoulderWidth),
      );
      vertices.push(inner.x, 0.026, inner.z, outer.x, 0.026, outer.z);
    }
    for (let i = 0; i < road.samples.length - 1; i += 1) {
      const vertex = i * 2;
      indices.push(vertex, vertex + 2, vertex + 1, vertex + 1, vertex + 2, vertex + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const shoulder = new THREE.Mesh(geometry, material);
    shoulder.receiveShadow = true;
    parent.add(shoulder);
  }
}

function createRoadMarkings(parent, road, config) {
  const centerMaterial = new THREE.MeshBasicMaterial({ color: config.laneColor });
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: config.edgeColor });
  const dashLength = 1.45;
  const dashWidth = 0.12;

  for (let i = 0; i < road.samples.length - 5; i += 6) {
    const sample = road.samples[i];
    addFlatRoadBox(parent, sample.position, sample.tangent, dashLength, dashWidth, 0.052, centerMaterial);
  }

  for (let i = 0; i < road.samples.length - 4; i += 4) {
    const sample = road.samples[i];
    for (const side of [-1, 1]) {
      const edge = sample.position.clone().addScaledVector(sample.normal, side * (sample.width / 2 - 0.32));
      addFlatRoadBox(parent, edge, sample.tangent, 1.2, 0.08, 0.054, edgeMaterial);
    }
  }
}

function createRoadEdges(parent, road, visual) {
  const railMaterial = new THREE.MeshStandardMaterial({
    color: visual.guardrail,
    roughness: 0.45,
    metalness: 0.5,
  });
  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0x252a2c,
    roughness: 0.62,
    metalness: 0.28,
  });

  for (let i = 0; i < road.samples.length - 2; i += 2) {
    const current = road.samples[i];
    const next = road.samples[Math.min(i + 2, road.samples.length - 1)];
    for (const side of [-1, 1]) {
      const offsetA = current.width / 2 + road.config.shoulderWidth + 0.28;
      const offsetB = next.width / 2 + road.config.shoulderWidth + 0.28;
      const a = current.position.clone().addScaledVector(current.normal, side * offsetA);
      const b = next.position.clone().addScaledVector(next.normal, side * offsetB);
      const center = a.clone().add(b).multiplyScalar(0.5);
      const direction = b.clone().sub(a);
      const length = direction.length();
      if (length < 0.05) continue;
      if (isRoadEdgeBlockingNearbyRoad(road, center, i)) continue;
      direction.normalize();
      const rotation = -Math.atan2(direction.z, direction.x);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.46, 0.22), railMaterial);
      rail.position.set(center.x, 0.38, center.z);
      rail.rotation.y = rotation;
      rail.castShadow = true;
      rail.receiveShadow = true;
      parent.add(rail);
      registerBoxCollider(center.x, center.z, length, 0.44, rotation, {
        bounce: 0.16,
        friction: 0.74,
        kind: 'guardrail',
      });

      if (i % 8 === 0) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.16), postMaterial);
        post.position.set(a.x, 0.36, a.z);
        post.castShadow = true;
        parent.add(post);
      }
    }
  }
}

function isRoadEdgeBlockingNearbyRoad(road, center, sourceIndex) {
  const neighborWindow = 10;
  for (let i = 0; i < road.samples.length; i += 1) {
    const cyclicDistance = Math.min(
      Math.abs(i - sourceIndex),
      road.samples.length - Math.abs(i - sourceIndex),
    );
    if (cyclicDistance <= neighborWindow) continue;

    const sample = road.samples[i];
    const dx = center.x - sample.position.x;
    const dz = center.z - sample.position.z;
    const distance = Math.hypot(dx, dz);
    const clearWidth = sample.width / 2 + road.config.shoulderWidth + 0.65;
    if (distance < clearWidth) return true;
  }

  return false;
}

function createScoringZoneMarkers(parent, road, config) {
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: config.edgeColor,
    emissive: config.edgeColor,
    emissiveIntensity: 0.42,
    roughness: 0.38,
  });
  const coneGeometry = new THREE.ConeGeometry(0.2, 0.62, 12);

  for (const zone of road.scoringZones) {
    const frame = getRoadFrame(zone.center, road);
    const side = zone.pointIndex % 2 === 0 ? 1 : -1;
    const markerBase = frame.nearest
      .clone()
      .addScaledVector(frame.normal, side * (frame.width / 2 - 0.7));

    for (let i = 0; i < 3; i += 1) {
      const marker = new THREE.Mesh(coneGeometry, markerMaterial);
      marker.position.copy(markerBase).addScaledVector(frame.tangent, (i - 1) * 0.95);
      marker.position.y = 0.31;
      marker.castShadow = true;
      parent.add(marker);
    }
  }
}

function addFlatRoadBox(parent, center, tangent, length, width, y, material) {
  const direction = tangent.clone().setY(0);
  if (direction.lengthSq() < 0.001) direction.set(1, 0, 0);
  direction.normalize();
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(length, 0.012, width), material);
  stripe.position.set(center.x, y, center.z);
  stripe.rotation.y = -Math.atan2(direction.z, direction.x);
  stripe.renderOrder = 2;
  parent.add(stripe);
  return stripe;
}

function createResetPoints(config, curve, roadPoints) {
  const points = [];
  const step = Math.max(1, config.resetEvery ?? 3);
  for (let i = 0; i < roadPoints.length; i += step) {
    const point = pointFromRoadIndex(roadPoints, i);
    const next = pointFromRoadIndex(roadPoints, i + 1);
    const tangent = next.sub(point).setY(0);
    if (tangent.lengthSq() < 0.001) tangent.copy(curve.getTangentAt(i / roadPoints.length));
    tangent.normalize();
    points.push({
      position: point,
      yaw: yawFromForward(tangent),
      index: i,
    });
  }
  return points;
}

function getRoadFrame(position, road = activeRoad) {
  if (!road) {
    return {
      nearest: position.clone(),
      tangent: new THREE.Vector3(0, 0, -1),
      normal: new THREE.Vector3(1, 0, 0),
      signedDistance: 0,
      distance: 0,
      width: 8,
      inside: true,
      sampleIndex: 0,
    };
  }

  let best = road.samples[0];
  let bestIndex = 0;
  let bestDistanceSq = Infinity;
  for (let i = 0; i < road.samples.length; i += 1) {
    const sample = road.samples[i];
    const dx = position.x - sample.position.x;
    const dz = position.z - sample.position.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq < bestDistanceSq) {
      best = sample;
      bestIndex = i;
      bestDistanceSq = distanceSq;
    }
  }

  const offset = position.clone().sub(best.position);
  const signedDistance = dotGround(offset, best.normal);
  const distance = Math.sqrt(bestDistanceSq);
  return {
    nearest: best.position.clone(),
    tangent: best.tangent.clone(),
    normal: best.normal.clone(),
    signedDistance,
    distance,
    width: best.width,
    inside: Math.abs(signedDistance) <= best.width / 2 + road.config.shoulderWidth,
    sampleIndex: bestIndex,
  };
}

function isVehicleOnRoad(position) {
  return getRoadFrame(position).inside;
}

function roadOffsetPoint(road, pointIndex, side, distance, along = 0) {
  const base = pointFromRoadIndex(road.points, pointIndex);
  const frame = getRoadFrame(base, road);
  return frame.nearest
    .clone()
    .addScaledVector(frame.normal, side * distance)
    .addScaledVector(frame.tangent, along);
}

function placePropsAroundRoad(road, placements, clearance, callback) {
  for (const placement of placements) {
    const frame = getRoadFrame(pointFromRoadIndex(road.points, placement.pointIndex), road);
    const distance = clearance + frame.width / 2 + (placement.offset ?? 0);
    const position = frame.nearest
      .clone()
      .addScaledVector(frame.normal, placement.side * distance)
      .addScaledVector(frame.tangent, placement.along ?? 0);
    callback(position, frame, placement);
  }
}

function createUrbanNightProps(parent, road) {
  const buildingMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x202832, roughness: 0.68, metalness: 0.04 }),
    new THREE.MeshStandardMaterial({ color: 0x18232a, roughness: 0.72, metalness: 0.04 }),
    new THREE.MeshStandardMaterial({ color: 0x2a2230, roughness: 0.66, metalness: 0.04 }),
  ];
  const concrete = new THREE.MeshStandardMaterial({ color: 0x31383c, roughness: 0.72, metalness: 0.08 });
  const neonBlue = new THREE.MeshStandardMaterial({
    color: 0x5ce8ff,
    emissive: 0x2ed6ff,
    emissiveIntensity: 0.65,
    roughness: 0.3,
  });
  const neonPink = new THREE.MeshStandardMaterial({
    color: 0xff4eb8,
    emissive: 0xff268a,
    emissiveIntensity: 0.65,
    roughness: 0.3,
  });

  placePropsAroundRoad(road, [
    { pointIndex: 1, side: -1, offset: 4, along: -1 },
    { pointIndex: 2, side: -1, offset: 5, along: 2 },
    { pointIndex: 4, side: 1, offset: 4 },
    { pointIndex: 6, side: 1, offset: 5, along: 2 },
    { pointIndex: 8, side: -1, offset: 7 },
    { pointIndex: 10, side: -1, offset: 4 },
  ], 3.2, (position, frame, placement) => {
    const width = 3.8 + (placement.pointIndex % 3) * 1.2;
    const depth = 3.2 + (placement.pointIndex % 2) * 1.4;
    const height = 4 + (placement.pointIndex % 4) * 1.35;
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      buildingMaterials[placement.pointIndex % buildingMaterials.length],
    );
    building.position.set(position.x, height / 2, position.z);
    building.rotation.y = -Math.atan2(frame.tangent.z, frame.tangent.x) + 0.25 * placement.side;
    building.castShadow = true;
    building.receiveShadow = true;
    parent.add(building);
    registerBoxCollider(position.x, position.z, width + 0.6, depth + 0.6, building.rotation.y, {
      bounce: 0.12,
      friction: 0.78,
      kind: 'building',
    });
  });

  for (const pointIndex of [4, 5]) {
    const left = roadOffsetPoint(road, pointIndex, -1, road.maxWidth / 2 + 3.2);
    const right = roadOffsetPoint(road, pointIndex, 1, road.maxWidth / 2 + 3.2);
    const center = left.clone().add(right).multiplyScalar(0.5);
    const frame = getRoadFrame(center, road);
    const pillarGap = 5.2;
    for (const offset of [-pillarGap, pillarGap]) {
      const pillarPosition = center.clone().addScaledVector(frame.normal, offset);
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.4, 0.7), concrete);
      pillar.position.set(pillarPosition.x, 1.7, pillarPosition.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      parent.add(pillar);
      registerBoxCollider(pillarPosition.x, pillarPosition.z, 1, 1, 0, {
        bounce: 0.12,
        friction: 0.7,
        kind: 'underpass-pillar',
      });
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(16, 0.45, 4.8), concrete);
    deck.position.set(center.x, 3.58, center.z);
    deck.rotation.y = -Math.atan2(frame.tangent.z, frame.tangent.x);
    deck.castShadow = true;
    parent.add(deck);
  }

  for (let i = 0; i < 10; i += 1) {
    const sample = road.samples[(i * 17) % (road.samples.length - 1)];
    const side = i % 2 === 0 ? 1 : -1;
    const position = sample.position.clone().addScaledVector(sample.normal, side * (sample.width / 2 + 2.2));
    addLevelLamp(parent, position.x, position.z, 0, i % 2 === 0 ? 0x5ce8ff : 0xff4eb8, 20, 13, 4.2, concrete);
  }

  for (const [pointIndex, side, material] of [[0, 1, neonBlue], [5, -1, neonPink], [8, 1, neonBlue]]) {
    const frame = getRoadFrame(pointFromRoadIndex(road.points, pointIndex), road);
    const position = frame.nearest.clone().addScaledVector(frame.normal, side * (frame.width / 2 + 1.1));
    addFlatRoadBox(parent, position, frame.tangent, 3.4, 0.16, 0.12, material);
  }
}

function createMountainTougeProps(parent, road) {
  const rock = new THREE.MeshStandardMaterial({ color: 0x4b514a, roughness: 0.92, metalness: 0 });
  const cliff = new THREE.MeshStandardMaterial({ color: 0x394035, roughness: 0.95, metalness: 0 });
  const trunk = new THREE.MeshStandardMaterial({ color: 0x4b3224, roughness: 0.88 });
  const pine = new THREE.MeshStandardMaterial({ color: 0x18351f, roughness: 0.82 });
  const viewpoint = new THREE.MeshStandardMaterial({ color: 0x6f7469, roughness: 0.8, metalness: 0.04 });

  placePropsAroundRoad(road, [
    { pointIndex: 4, side: -1, offset: 2 },
    { pointIndex: 5, side: -1, offset: 3 },
    { pointIndex: 12, side: 1, offset: 2 },
    { pointIndex: 13, side: 1, offset: 3 },
  ], 3.6, (position, frame, placement) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 2.4 + (placement.pointIndex % 2), 1.4),
      cliff,
    );
    wall.position.set(position.x, wall.geometry.parameters.height / 2, position.z);
    wall.rotation.y = -Math.atan2(frame.tangent.z, frame.tangent.x) + 0.12 * placement.side;
    wall.castShadow = true;
    wall.receiveShadow = true;
    parent.add(wall);
    registerBoxCollider(position.x, position.z, 7.8, 1.8, wall.rotation.y, {
      bounce: 0.08,
      friction: 0.82,
      kind: 'cliff-wall',
    });
  });

  const treePlacements = [];
  for (let i = 0; i < 28; i += 1) {
    treePlacements.push({
      pointIndex: i % road.points.length,
      side: i % 3 === 0 ? -1 : 1,
      offset: 5 + seededWave(i, 0.3) * 5,
      along: (seededWave(i, 0.8) - 0.5) * 5,
    });
  }
  placePropsAroundRoad(road, treePlacements, 3.4, (position) => {
    addPineTree(parent, position.x, position.z, trunk, pine);
  });

  for (const [pointIndex, side] of [[1, 1], [8, -1], [14, 1]]) {
    const frame = getRoadFrame(pointFromRoadIndex(road.points, pointIndex), road);
    const position = frame.nearest.clone().addScaledVector(frame.normal, side * (frame.width / 2 + 4.8));
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 + pointIndex * 0.03, 0), rock);
    boulder.position.set(position.x, 0.8, position.z);
    boulder.rotation.set(0.4, pointIndex, -0.2);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    parent.add(boulder);
    registerCircleCollider(position.x, position.z, 1.35, { bounce: 0.1, friction: 0.8, kind: 'rock' });
  }

  const overlook = roadOffsetPoint(road, 11, 1, road.maxWidth / 2 + 5.8);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.28, 3.1), viewpoint);
  deck.position.set(overlook.x, 0.2, overlook.z);
  deck.castShadow = true;
  deck.receiveShadow = true;
  parent.add(deck);
}

function createIndustrialDockProps(parent, road) {
  const warehouse = new THREE.MeshStandardMaterial({ color: 0x38454d, roughness: 0.74, metalness: 0.12 });
  const warehouseDoor = new THREE.MeshStandardMaterial({ color: 0x22272a, roughness: 0.65, metalness: 0.2 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x2c3334, roughness: 0.5, metalness: 0.22 });
  const flood = new THREE.MeshStandardMaterial({
    color: 0xffbf52,
    emissive: 0xff8a18,
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });
  const containerMaterials = [0x1f6f8b, 0xa43f2b, 0xd19d32, 0x38454d].map((color) => (
    new THREE.MeshStandardMaterial({ color, roughness: 0.74, metalness: 0.18 })
  ));

  placePropsAroundRoad(road, [
    { pointIndex: 1, side: -1, offset: 5 },
    { pointIndex: 3, side: 1, offset: 4 },
    { pointIndex: 6, side: -1, offset: 4 },
    { pointIndex: 12, side: 1, offset: 5 },
  ], 3.6, (position, frame, placement) => {
    const width = 7.5;
    const depth = 4.2;
    const height = 3.2;
    const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), warehouse);
    building.position.set(position.x, height / 2, position.z);
    building.rotation.y = -Math.atan2(frame.tangent.z, frame.tangent.x);
    building.castShadow = true;
    building.receiveShadow = true;
    parent.add(building);
    registerBoxCollider(position.x, position.z, width + 0.7, depth + 0.7, building.rotation.y, {
      bounce: 0.12,
      friction: 0.76,
      kind: 'warehouse',
    });
    const doorPosition = position.clone().addScaledVector(frame.normal, -placement.side * (depth / 2 + 0.04));
    addFlatRoadBox(parent, doorPosition, frame.tangent, 2.5, 0.16, 1.05, warehouseDoor);
  });

  const containerPlacements = [
    { pointIndex: 0, side: 1, offset: 4, count: 2 },
    { pointIndex: 4, side: -1, offset: 4, count: 2 },
    { pointIndex: 7, side: 1, offset: 3.5, count: 1 },
    { pointIndex: 8, side: -1, offset: 4, count: 2 },
    { pointIndex: 13, side: -1, offset: 4, count: 3 },
  ];
  placePropsAroundRoad(road, containerPlacements, 3.1, (position, frame, placement) => {
    addContainerStack(
      parent,
      position.x,
      position.z,
      -Math.atan2(frame.tangent.z, frame.tangent.x) + 0.08 * placement.side,
      placement.count,
      containerMaterials,
      placement.pointIndex,
    );
  });

  for (const pointIndex of [2, 10]) {
    const frame = getRoadFrame(pointFromRoadIndex(road.points, pointIndex), road);
    const position = frame.nearest.clone().addScaledVector(frame.normal, (pointIndex === 2 ? -1 : 1) * (frame.width / 2 + 5.2));
    addDockCrane(parent, position.x, position.z, -Math.atan2(frame.tangent.z, frame.tangent.x), steel, flood);
  }

  const drumMaterial = new THREE.MeshStandardMaterial({ color: 0x44515a, roughness: 0.5, metalness: 0.42 });
  for (const pointIndex of [7, 8, 11, 12]) {
    const frame = getRoadFrame(pointFromRoadIndex(road.points, pointIndex), road);
    const position = frame.nearest.clone().addScaledVector(frame.normal, (pointIndex % 2 ? 1 : -1) * (frame.width / 2 + 1.8));
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.72, 18), drumMaterial);
    drum.position.set(position.x, 0.36, position.z);
    drum.castShadow = true;
    drum.receiveShadow = true;
    parent.add(drum);
    registerCircleCollider(position.x, position.z, 0.58, { bounce: 0.35, friction: 0.48, kind: 'drum' });
  }

  for (let i = 0; i < 8; i += 1) {
    const sample = road.samples[(i * 21) % (road.samples.length - 1)];
    const side = i % 2 === 0 ? 1 : -1;
    const position = sample.position.clone().addScaledVector(sample.normal, side * (sample.width / 2 + 2.4));
    addLevelLamp(parent, position.x, position.z, 0, 0xffc067, 24, 15, 4.6, steel);
  }
}

function addPineTree(parent, x, z, trunkMaterial, leafMaterial) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.1, 7), trunkMaterial);
  trunk.position.set(x, 0.55, z);
  trunk.castShadow = true;
  parent.add(trunk);

  for (let i = 0; i < 3; i += 1) {
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.85 - i * 0.15, 1.1, 8), leafMaterial);
    leaves.position.set(x, 1.25 + i * 0.48, z);
    leaves.castShadow = true;
    parent.add(leaves);
  }
}

function addContainerStack(parent, x, z, rotation, count, materials, materialOffset = 0) {
  const geometry = new THREE.BoxGeometry(4.4, 1.25, 1.35);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;

  for (let i = 0; i < count; i += 1) {
    const box = new THREE.Mesh(geometry, materials[(i + materialOffset) % materials.length]);
    box.position.y = 0.62 + i * 1.22;
    box.position.x = i % 2 === 0 ? 0 : 0.18;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
  }

  parent.add(group);
  registerBoxCollider(x, z, 4.6, 1.58, rotation, {
    bounce: 0.18,
    friction: 0.62,
    kind: 'container',
  });
  return group;
}

function addBarrier(parent, x, z, rotation, material, width, height, depth) {
  const barrier = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  barrier.position.set(x, height / 2, z);
  barrier.rotation.y = rotation;
  barrier.castShadow = true;
  barrier.receiveShadow = true;
  parent.add(barrier);
  registerBoxCollider(x, z, width + 0.22, depth + 0.18, rotation, {
    bounce: 0.32,
    friction: 0.58,
    kind: 'barrier',
  });
  return barrier;
}

function addPaintStripe(parent, x, z, length, width, rotation, color, opacity) {
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.012, width),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  stripe.position.set(x, 0.032, z);
  stripe.rotation.y = rotation;
  stripe.renderOrder = 0;
  parent.add(stripe);
  return stripe;
}

function addDockCrane(parent, x, z, rotation, steelMaterial, lampMaterial) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  const legGeometry = new THREE.BoxGeometry(0.42, 5.8, 0.42);
  const beamGeometry = new THREE.BoxGeometry(7.2, 0.36, 0.42);
  for (const legX of [-2.2, 2.2]) {
    const leg = new THREE.Mesh(legGeometry, steelMaterial);
    leg.position.set(legX, 2.9, 0);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
    const worldLeg = localPoint2D(x, z, rotation, legX, 0);
    registerBoxCollider(worldLeg.x, worldLeg.z, 0.72, 0.72, rotation, {
      bounce: 0.26,
      friction: 0.62,
      kind: 'crane-leg',
    });
  }
  const beam = new THREE.Mesh(beamGeometry, steelMaterial);
  beam.position.set(0, 5.75, 0);
  beam.castShadow = true;
  beam.receiveShadow = true;
  group.add(beam);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.52, 0.08), lampMaterial);
  sign.position.set(0, 4.6, -0.28);
  group.add(sign);
  parent.add(group);
  return group;
}

function addTerminalGate(parent, x, z, rotation, mastMaterial, panelMaterial) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  const postGeometry = new THREE.BoxGeometry(0.42, 2.7, 0.42);
  for (const localZ of [-1.35, 1.35]) {
    const post = new THREE.Mesh(postGeometry, mastMaterial);
    post.position.set(0, 1.35, localZ);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
    const worldPost = localPoint2D(x, z, rotation, 0, localZ);
    registerBoxCollider(worldPost.x, worldPost.z, 0.72, 0.72, rotation, {
      bounce: 0.24,
      friction: 0.66,
      kind: 'gate-post',
    });
  }
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 3.4), panelMaterial);
  panel.position.set(0, 1.55, 0);
  panel.castShadow = true;
  panel.receiveShadow = true;
  group.add(panel);
  parent.add(group);
  registerBoxCollider(x, z, 0.56, 3.7, rotation, {
    bounce: 0.22,
    friction: 0.62,
    kind: 'gate',
  });
}

function addFlyoverColumn(parent, x, z, concreteMaterial, glowMaterial) {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.9, 4.8, 18), concreteMaterial);
  base.position.set(x, 2.4, z);
  base.castShadow = true;
  base.receiveShadow = true;
  parent.add(base);
  registerCircleCollider(x, z, 1.05, { bounce: 0.22, friction: 0.7, kind: 'flyover-column' });

  const crown = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.42, 1.2), concreteMaterial);
  crown.position.set(x, 4.95, z);
  crown.castShadow = true;
  parent.add(crown);

  const neon = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), glowMaterial);
  neon.position.set(x, 3.35, z + 0.74);
  parent.add(neon);
}

function addMarketStall(parent, x, z, rotation, stallMaterial, awningMaterial) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.05, 1.55), stallMaterial);
  body.position.y = 0.52;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  const awning = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.16, 1.85), awningMaterial);
  awning.position.y = 1.2;
  awning.castShadow = true;
  group.add(awning);
  parent.add(group);
  registerBoxCollider(x, z, 2.8, 1.9, rotation, {
    bounce: 0.2,
    friction: 0.64,
    kind: 'market-stall',
  });
}

function addLevelLamp(parent, x, z, angle, color, intensity, distance, height, poleMaterial) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, height, 10), poleMaterial);
  const lamp = new THREE.PointLight(color, intensity, distance, 2.2);
  pole.position.set(x, height / 2, z);
  lamp.position.copy(pole.position).add(new THREE.Vector3(0, 1.7, 0));
  lamp.userData.levelLight = true;
  pole.rotation.y = angle;
  pole.castShadow = true;
  parent.add(pole, lamp);
  registerCircleCollider(x, z, 0.34, { bounce: 0.28, friction: 0.38, kind: 'lamp' });
}

function localPoint2D(originX, originZ, rotation, localX, localZ) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: originX + localX * cos + localZ * sin,
    z: originZ - localX * sin + localZ * cos,
  };
}

function seededWave(index, salt = 0) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function registerBoxCollider(x, z, width, depth, rotation = 0, options = {}) {
  activeColliders.push({
    type: 'box',
    x,
    z,
    halfX: width / 2,
    halfZ: depth / 2,
    rotation,
    bounce: options.bounce ?? 0.24,
    friction: options.friction ?? 0.52,
    kind: options.kind ?? 'box',
  });
}

function registerCircleCollider(x, z, radius, options = {}) {
  activeColliders.push({
    type: 'circle',
    x,
    z,
    radius,
    bounce: options.bounce ?? 0.28,
    friction: options.friction ?? 0.44,
    kind: options.kind ?? 'circle',
  });
}

function createCar(config = carConfigs[0]) {
  const visual = config.visual;
  const isE30 = visual.body === 'e30';
  const root = new THREE.Group();
  const sprung = new THREE.Group();
  const wheels = [];
  root.add(sprung);
  root.userData.carId = config.id;

  const paint = new THREE.MeshPhysicalMaterial({
    color: visual.paint,
    roughness: 0.24,
    metalness: 0.52,
    clearcoat: 0.9,
    clearcoatRoughness: 0.16,
  });
  const darkPaint = new THREE.MeshPhysicalMaterial({
    color: visual.darkPaint,
    roughness: 0.3,
    metalness: 0.42,
    clearcoat: 0.68,
    clearcoatRoughness: 0.2,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: visual.glass,
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
    color: visual.rim,
    roughness: isE30 ? 0.28 : 0.2,
    metalness: isE30 ? 0.72 : 0.86,
  });
  const brake = new THREE.MeshStandardMaterial({
    color: visual.brake,
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
    tire: new THREE.TorusGeometry(isE30 ? 0.35 : 0.34, isE30 ? 0.125 : 0.13, 14, 42),
    sidewall: new THREE.CylinderGeometry(0.4, 0.4, isE30 ? 0.34 : 0.27, 36, 1, true),
    rimOuter: new THREE.CylinderGeometry(isE30 ? 0.27 : 0.24, isE30 ? 0.27 : 0.24, isE30 ? 0.38 : 0.3, 28),
    rimHub: new THREE.CylinderGeometry(0.09, 0.09, isE30 ? 0.4 : 0.34, 18),
    spoke: new THREE.BoxGeometry(0.035, 0.055, isE30 ? 0.42 : 0.34),
    brakeDisc: new THREE.CylinderGeometry(0.18, 0.18, 0.035, 28),
    caliper: new RoundedBoxGeometry(0.06, 0.12, 0.24, 3, 0.02),
    blur: new THREE.CircleGeometry(0.33, 28),
  };

  addMesh(sprung, makeCarHullGeometry(visual.body), paint);
  addMesh(sprung, new RoundedBoxGeometry(isE30 ? 2.62 : 2.76, 0.18, isE30 ? 4.2 : 4.44, 5, isE30 ? 0.035 : 0.08), carbon, [0, 0.43, 0.08]);
  addMesh(sprung, new RoundedBoxGeometry(0.07, 0.08, 4.08, 3, 0.025), carbon, [-1.42, 0.5, 0.05]);
  addMesh(sprung, new RoundedBoxGeometry(0.07, 0.08, 4.08, 3, 0.025), carbon, [1.42, 0.5, 0.05]);

  // Greenhouse: inset glass volume, a body-color roof panel sitting flush on
  // top of it, and painted A-pillars (plus C-pillars on the three-box E3).
  const cabin = addMesh(sprung, new RoundedBoxGeometry(...visual.cabin, 7, isE30 ? 0.04 : 0.16), glass, visual.cabinPosition);
  cabin.scale.set(0.97, 1, isE30 ? 0.96 : 0.95);
  const cabinTop = visual.cabinPosition[1] + visual.cabin[1] / 2;
  addMesh(sprung, new RoundedBoxGeometry(isE30 ? 1.46 : 1.3, 0.07, isE30 ? 0.86 : 0.9, 5, 0.03), paint, [0, cabinTop + 0.02, 0.32]);
  addMesh(sprung, new RoundedBoxGeometry(isE30 ? 1.34 : 1.26, 0.035, isE30 ? 0.6 : 0.68, 5, 0.025), glass, [0, 1.12, -0.56], [-0.38, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(isE30 ? 1.22 : 1.18, 0.035, 0.54, 5, 0.025), glass, [0, 1.08, 0.95], [0.32, 0, 0]);
  for (const side of [-1, 1]) {
    addMesh(
      sprung,
      new RoundedBoxGeometry(0.07, isE30 ? 0.58 : 0.52, 0.1, 3, 0.03),
      paint,
      [side * (visual.cabin[0] / 2 - 0.07), cabinTop - 0.22, visual.cabinPosition[2] - visual.cabin[2] * 0.46],
      [isE30 ? -0.5 : -0.62, 0, side * 0.06],
    );
    if (isE30) {
      addMesh(
        sprung,
        new RoundedBoxGeometry(0.09, 0.56, 0.12, 3, 0.03),
        paint,
        [side * (visual.cabin[0] / 2 - 0.08), cabinTop - 0.22, visual.cabinPosition[2] + visual.cabin[2] * 0.44],
        [0.34, 0, side * -0.05],
      );
    }
  }

  for (const side of [-1, 1]) {
    addMesh(sprung, new RoundedBoxGeometry(0.035, 0.34, 0.76, 5, 0.025), glass, [side * 0.78, 1.2, 0.18], [0, 0, side * 0.12]);
    addMesh(sprung, new RoundedBoxGeometry(0.06, 0.34, 1.3, 4, 0.045), paint, [side * 1.34, 0.76, 0.03], [0, 0, side * 0.04]);
    addMesh(sprung, new RoundedBoxGeometry(0.035, 0.03, 0.34, 2, 0.014), carbon, [side * 1.39, 0.86, -0.2], [0, 0, side * 0.04]);
    addMesh(sprung, new RoundedBoxGeometry(0.038, 0.04, 0.52, 2, 0.014), black, [side * 1.39, 0.78, 0.55], [0, 0, side * 0.04]);
    addMesh(sprung, new RoundedBoxGeometry(0.08, 0.07, 0.22, 3, 0.025), carbon, [side * 1.12, 1.03, -0.64], [0.04, side * 0.48, 0.04]);
    addMesh(sprung, new RoundedBoxGeometry(0.18, 0.08, 0.22, 4, 0.04), paint, [side * 1.27, 0.98, -0.75], [0, side * 0.38, 0]);

    for (const z of [sim.frontAxleZ, sim.rearAxleZ]) {
      addMesh(sprung, new RoundedBoxGeometry(isE30 ? 0.26 : 0.3, 0.4, isE30 ? 0.92 : 1.02, 5, isE30 ? 0.045 : 0.1), paint, [side * 1.24, 0.68, z]);
      addMesh(sprung, new RoundedBoxGeometry(0.06, 0.26, isE30 ? 0.78 : 0.84, 4, 0.055), carbon, [side * 1.45, 0.62, z]);
      addWheelArch(sprung, side, z, carbon);
    }
  }

  addMesh(sprung, new RoundedBoxGeometry(visual.frontSplitter, 0.1, 0.26, 4, 0.045), carbon, [0, 0.48, -2.34], [-0.05, 0, 0]);
  addMesh(sprung, new RoundedBoxGeometry(2.16, 0.14, 0.24, 4, 0.04), carbon, [0, 0.56, isE30 ? 2.42 : 2.25], [0.08, 0, 0]);

  // Integrated bumpers: chrome blades on the E3, body-color wraps on the RS.
  if (isE30) {
    addMesh(sprung, new RoundedBoxGeometry(2.42, 0.13, 0.2, 3, 0.05), brakeDisc, [0, 0.6, -2.42], [-0.05, 0, 0]);
    addMesh(sprung, new RoundedBoxGeometry(2.38, 0.13, 0.2, 3, 0.05), brakeDisc, [0, 0.6, 2.46], [0.05, 0, 0]);
  } else {
    addMesh(sprung, new RoundedBoxGeometry(2.46, 0.2, 0.3, 4, 0.09), paint, [0, 0.58, -2.32], [-0.08, 0, 0]);
    addMesh(sprung, new RoundedBoxGeometry(2.3, 0.18, 0.28, 4, 0.08), paint, [0, 0.66, 2.3], [0.08, 0, 0]);
  }

  if (isE30) {
    // High strut-mounted box wing over the trunk step
    addMesh(sprung, new RoundedBoxGeometry(2.38, 0.08, 0.12, 4, 0.035), carbon, [0, 1.27, 2.17], [0.08, 0, 0]);
    addMesh(sprung, new RoundedBoxGeometry(0.12, 0.42, 0.08, 3, 0.025), carbon, [-0.98, 1.05, 2.08], [0.08, 0, 0]);
    addMesh(sprung, new RoundedBoxGeometry(0.12, 0.42, 0.08, 3, 0.025), carbon, [0.98, 1.05, 2.08], [0.08, 0, 0]);
    addMesh(sprung, new RoundedBoxGeometry(visual.rearWingWidth, 0.08, 0.28, 4, 0.04), carbon, [0, visual.rearWingHeight, 2.26], [0.03, 0, 0]);
  } else {
    // Whale-tail: wide flat tray low on the fastback decklid with upturned end plates
    addMesh(sprung, new RoundedBoxGeometry(visual.rearWingWidth, 0.05, 0.66, 4, 0.022), carbon, [0, visual.rearWingHeight, 2.02], [0.12, 0, 0]);
    addMesh(sprung, new RoundedBoxGeometry(visual.rearWingWidth - 0.3, 0.04, 0.22, 3, 0.016), darkPaint, [0, visual.rearWingHeight + 0.05, 2.24], [0.34, 0, 0]);
    for (const x of [-1, 1]) {
      addMesh(sprung, new RoundedBoxGeometry(0.14, 0.12, 0.5, 3, 0.02), carbon, [x * (visual.rearWingWidth / 2 - 0.1), visual.rearWingHeight + 0.05, 2.06], [0.12, 0, x * -0.18]);
    }
  }

  if (isE30) {
    addMesh(sprung, new RoundedBoxGeometry(2.32, 0.12, 0.1, 3, 0.02), carbon, [0, 0.7, -2.46]);
    addMesh(sprung, new RoundedBoxGeometry(0.12, 0.28, 0.08, 3, 0.02), carbon, [-1.05, 0.6, -2.43]);
    addMesh(sprung, new RoundedBoxGeometry(0.12, 0.28, 0.08, 3, 0.02), carbon, [1.05, 0.6, -2.43]);
    addMesh(sprung, new RoundedBoxGeometry(1.9, 0.03, 0.08, 2, 0.012), black, [0, 0.92, -2.17]);
    // Kidney-grille hint between the quad lights
    addMesh(sprung, new RoundedBoxGeometry(0.22, 0.14, 0.06, 3, 0.02), black, [-0.13, 0.78, -2.33], [-0.08, 0, 0]);
    addMesh(sprung, new RoundedBoxGeometry(0.22, 0.14, 0.06, 3, 0.02), black, [0.13, 0.78, -2.33], [-0.08, 0, 0]);
  } else {
    for (const x of [-0.42, 0.42]) {
      addMesh(sprung, new RoundedBoxGeometry(0.16, 0.025, 0.78, 2, 0.012), black, [x, 0.95, -1.25], [-0.1, 0, 0]);
    }
    addMesh(sprung, new RoundedBoxGeometry(2.24, 0.045, 0.08, 3, 0.02), carbon, [0, 0.58, -2.54], [-0.1, 0, 0]);
  }

  for (const side of [-1, 1]) {
    if (visual.lightStyle === 'square') {
      addMesh(sprung, new RoundedBoxGeometry(0.42, 0.12, 0.08, 3, 0.018), lightLens, [side * 0.46, 0.79, -2.29], [-0.08, side * 0.04, 0]);
      addMesh(sprung, new RoundedBoxGeometry(0.28, 0.12, 0.08, 3, 0.018), lightLens, [side * 0.84, 0.79, -2.24], [-0.08, side * 0.04, 0]);
    } else {
      // Raised round fender headlights on a long fender hump
      addMesh(sprung, new RoundedBoxGeometry(0.28, 0.13, 0.95, 4, 0.06), paint, [side * 1.07, 0.83, -1.62], [-0.07, 0, side * 0.05]);
      addMesh(sprung, new THREE.CylinderGeometry(0.14, 0.16, 0.24, 24), paint, [side * 1.06, 0.84, -2.08], [-1.16, 0, 0]);
      addMesh(sprung, new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24), lightLens, [side * 1.06, 0.9, -2.17], [-1.16, 0, 0]);
    }
    addMesh(sprung, new RoundedBoxGeometry(isE30 ? 0.42 : 0.34, 0.08, 0.07, 4, 0.025), tailLens, [side * 0.76, 0.78, isE30 ? 2.4 : 2.28], [0.04, side * -0.08, 0]);
    addMesh(sprung, new RoundedBoxGeometry(0.36, 0.05, 0.07, 3, 0.02), lightLens, [side * 1.08, 0.7, -2.08], [0, side * -0.25, 0]);
    addMesh(sprung, new THREE.CylinderGeometry(0.075, 0.075, 0.34, 18), carbon, [side * 0.52, 0.48, 2.42], [Math.PI / 2, 0, 0]);
  }

  addMesh(sprung, new RoundedBoxGeometry(0.05, 0.035, 2.75, 2, 0.018), black, [-0.72, 1.01, 0.1]);
  addMesh(sprung, new RoundedBoxGeometry(0.05, 0.035, 2.75, 2, 0.018), black, [0.72, 1.01, 0.1]);
  addMesh(sprung, new RoundedBoxGeometry(1.04, 0.03, 0.045, 2, 0.015), black, [0, isE30 ? 0.9 : 0.86, -1.54]);
  addMesh(sprung, new RoundedBoxGeometry(1.02, 0.03, 0.045, 2, 0.015), black, [0, isE30 ? 0.93 : 0.82, 1.83]);

  const wheelPositions = [
    [-visual.wheelOffset, 0.39, sim.frontAxleZ, true],
    [visual.wheelOffset, 0.39, sim.frontAxleZ, true],
    [-visual.wheelOffset, 0.39, sim.rearAxleZ, false],
    [visual.wheelOffset, 0.39, sim.rearAxleZ, false],
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
      localContact: new THREE.Vector3(Math.sign(x) * 1.35, 0.04, z),
    });
  }

  addCarDecals(sprung, visual, isE30);
  addRollCage(sprung, carbon, isE30);
  root.scale.set(...visual.scale);

  const underglow = new THREE.PointLight(visual.underglow, 2.8, 4.2, 3);
  underglow.position.set(0, 0.35, 0.35);
  root.add(underglow);

  const headGlow = new THREE.PointLight(0xffe2a6, 1.9, 5.8, 2.1);
  headGlow.position.set(0, 0.68, -2.5);
  root.add(headGlow);

  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });

  return { root, sprung, wheels };
}

function addCarDecals(parent, visual, isE30) {
  const primaryDecal = makeDecalMaterial(visual.decal, visual.accent);
  const secondaryDecal = makeDecalMaterial(visual.decalAlt, visual.accentWarm);
  const numberDecal = makeDecalMaterial(isE30 ? '30' : '71', 0xf4f6f0, 'rgba(0, 0, 0, 0.55)');

  for (const side of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.24), primaryDecal);
    door.position.set(side * 1.475, 0.86, 0.02);
    door.rotation.set(0, side * Math.PI / 2, 0);
    parent.add(door);

    const quarter = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.2), secondaryDecal);
    quarter.position.set(side * 1.48, 0.76, 1.14);
    quarter.rotation.set(0, side * Math.PI / 2, 0);
    parent.add(quarter);

    const raceNumber = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.32), numberDecal);
    raceNumber.position.set(side * 1.49, 0.95, -0.82);
    raceNumber.rotation.set(0, side * Math.PI / 2, 0);
    parent.add(raceNumber);
  }

  const hoodDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.2), secondaryDecal);
  hoodDecal.position.set(0, isE30 ? 0.94 : 0.92, -1.34);
  hoodDecal.rotation.set(-Math.PI / 2 - 0.08, 0, 0);
  parent.add(hoodDecal);
}

function makeDecalMaterial(text, color, background = 'rgba(5, 6, 7, 0.42)') {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 512;
  textureCanvas.height = 160;
  const context = textureCanvas.getContext('2d');
  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.fillStyle = background;
  context.fillRect(0, 34, textureCanvas.width, 92);
  context.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
  context.lineWidth = 6;
  context.strokeRect(8, 42, textureCanvas.width - 16, 76);
  context.fillStyle = '#f4f6f0';
  context.font = '900 52px Inter, Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, textureCanvas.width / 2, textureCanvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function addRollCage(parent, material, isE30) {
  const barGeometry = new THREE.CylinderGeometry(0.025, 0.025, isE30 ? 1.16 : 1.04, 8);
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(barGeometry, material);
    pillar.position.set(side * 0.42, 1.13, 0.26);
    pillar.rotation.z = side * 0.26;
    parent.add(pillar);

    const rearBrace = new THREE.Mesh(barGeometry, material);
    rearBrace.position.set(side * 0.45, 1.05, 0.78);
    rearBrace.rotation.set(0.72, 0, side * 0.18);
    parent.add(rearBrace);
  }

  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.92, 8), material);
  cross.position.set(0, 1.32, 0.34);
  cross.rotation.z = Math.PI / 2;
  parent.add(cross);
}

function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function makeCarHullGeometry(style = 'porsche') {
  // Three-box E30 silhouette: flat hood plateau, raised beltline through the
  // cabin, a distinct trunk step, then a near-vertical Kamm tail (last two
  // rings share heights). Porsche is a fastback: the top line falls
  // continuously from the cabin to a rounded tail with no rear plateau.
  const sections = style === 'e30'
    ? [
      { z: -2.3, bottom: 0.4, mid: 0.62, top: 0.7, lower: 0.86, shoulder: 1.1, deck: 0.84 },
      { z: -1.96, bottom: 0.36, mid: 0.74, top: 0.86, lower: 1.18, shoulder: 1.34, deck: 1.14 },
      { z: -0.92, bottom: 0.34, mid: 0.8, top: 0.88, lower: 1.24, shoulder: 1.36, deck: 1.16 },
      { z: -0.58, bottom: 0.34, mid: 0.82, top: 0.98, lower: 1.25, shoulder: 1.36, deck: 1.18 },
      { z: 0.7, bottom: 0.34, mid: 0.82, top: 0.98, lower: 1.25, shoulder: 1.36, deck: 1.18 },
      { z: 1.3, bottom: 0.36, mid: 0.8, top: 0.9, lower: 1.22, shoulder: 1.36, deck: 1.12 },
      { z: 2.2, bottom: 0.4, mid: 0.76, top: 0.9, lower: 1.16, shoulder: 1.34, deck: 1.06 },
      { z: 2.34, bottom: 0.44, mid: 0.74, top: 0.88, lower: 1.1, shoulder: 1.3, deck: 1.02 },
    ]
    : [
      { z: -2.42, bottom: 0.38, mid: 0.6, top: 0.64, lower: 0.72, shoulder: 1.06, deck: 0.7 },
      { z: -1.95, bottom: 0.34, mid: 0.7, top: 0.78, lower: 1.16, shoulder: 1.38, deck: 0.92 },
      { z: -1.25, bottom: 0.32, mid: 0.78, top: 0.88, lower: 1.24, shoulder: 1.42, deck: 1.04 },
      { z: -0.65, bottom: 0.32, mid: 0.82, top: 1.0, lower: 1.28, shoulder: 1.44, deck: 1.1 },
      { z: 0.45, bottom: 0.32, mid: 0.8, top: 1.0, lower: 1.28, shoulder: 1.44, deck: 1.08 },
      { z: 1.3, bottom: 0.34, mid: 0.74, top: 0.88, lower: 1.22, shoulder: 1.4, deck: 0.96 },
      { z: 1.95, bottom: 0.38, mid: 0.68, top: 0.76, lower: 1.1, shoulder: 1.3, deck: 0.82 },
      { z: 2.42, bottom: 0.44, mid: 0.6, top: 0.64, lower: 0.86, shoulder: 1.1, deck: 0.62 },
    ];
  const smooth = subdivideHullSections(sections, 3);
  const vertices = [];
  const indices = [];

  // Eight-point ring: floor pair, wheel-arch flanks, tumblehome belt, roof
  // edge pair. The belt point rounds the doors instead of a flat slab side.
  for (const section of smooth) {
    const belt = THREE.MathUtils.lerp(section.shoulder, section.deck, 0.42);
    const beltY = THREE.MathUtils.lerp(section.mid, section.top, 0.62);
    vertices.push(
      -section.lower, section.bottom, section.z,
      section.lower, section.bottom, section.z,
      section.shoulder, section.mid, section.z,
      belt, beltY, section.z,
      section.deck, section.top, section.z,
      -section.deck, section.top, section.z,
      -belt, beltY, section.z,
      -section.shoulder, section.mid, section.z,
    );
  }

  const ring = 8;
  for (let i = 0; i < smooth.length - 1; i += 1) {
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
  const last = (smooth.length - 1) * ring;
  for (let j = 1; j < ring - 1; j += 1) indices.push(last, last + j + 1, last + j);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Catmull-Rom interpolation across the authored cross-sections so the
// silhouette flows like pressed steel instead of stepping between rings.
function subdivideHullSections(sections, stepsPerGap) {
  const keys = ['z', 'bottom', 'mid', 'top', 'lower', 'shoulder', 'deck'];
  const result = [];

  const sampleAt = (index) => sections[THREE.MathUtils.clamp(index, 0, sections.length - 1)];
  const catmull = (p0, p1, p2, p3, t) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (
      2 * p1
      + (-p0 + p2) * t
      + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
      + (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
  };

  for (let i = 0; i < sections.length - 1; i += 1) {
    for (let step = 0; step < stepsPerGap; step += 1) {
      const t = step / stepsPerGap;
      const blended = {};
      for (const key of keys) {
        blended[key] = catmull(
          sampleAt(i - 1)[key],
          sampleAt(i)[key],
          sampleAt(i + 1)[key],
          sampleAt(i + 2)[key],
          t,
        );
      }
      result.push(blended);
    }
  }
  result.push({ ...sections[sections.length - 1] });
  return result;
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

function makeSmokeTexture(size) {
  const smokeCanvas = document.createElement('canvas');
  smokeCanvas.width = size;
  smokeCanvas.height = size;
  const context = smokeCanvas.getContext('2d');
  const center = size / 2;
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
    color: 0xffffff,
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

  configure(getGraphicsProfile().skidPoints);

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

function animate(now = 0) {
  requestAnimationFrame(animate);

  const frameInterval = getFrameInterval();
  if (frameInterval > 0 && lastFrameAt > 0 && now - lastFrameAt < frameInterval) return;
  lastFrameAt = now;

  const rawDelta = clock.getDelta();
  const delta = Math.min(rawDelta, 0.033);
  let telemetry = getVehicleTelemetry(state.vehicle);

  if (!state.paused) {
    state.elapsed += delta;
    updateVehicle(delta);
    telemetry = getVehicleTelemetry(state.vehicle);
    updateFeedbackState(delta, telemetry);
    updateCarVisuals(delta, telemetry);
    updateEffects(delta);
    updateRun(delta, telemetry);
  } else {
    updateFeedbackState(delta, telemetry);
  }

  updateMenuPresentationScene(delta);
  carPreviewSystem?.update(delta, isCarSelectVisible());
  updateFeedbackVisuals(delta);
  updateAudioFeedback(delta, telemetry);
  smokeSystem.update(delta);
  skidSystem.update();
  renderer.render(scene, camera);
}

function updateVehicle(delta) {
  const vehicle = state.vehicle;
  const level = getActiveLevelConfig();
  const roadConfig = level.road;
  const handling = getActiveHandling(level);
  const basis = getVehicleBasis(vehicle.yaw);
  const roadFrame = getRoadFrame(vehicle.position);
  const tangent = roadFrame.tangent;
  const correctionNormal = roadFrame.normal.clone().multiplyScalar(-Math.sign(roadFrame.signedDistance || 1));
  const desiredForward = tangent
    .clone()
    .multiplyScalar(Math.cos(roadConfig.driftAngle))
    .addScaledVector(correctionNormal, Math.sin(roadConfig.driftAngle) * 0.65)
    .normalize();
  const desiredYaw = yawFromForward(desiredForward);
  const yawError = wrapAngle(desiredYaw - vehicle.yaw);

  const controls = getDriverControls(vehicle, basis, roadFrame.normal, tangent, yawError, handling);
  vehicle.throttle = controls.throttle;
  vehicle.steer = THREE.MathUtils.lerp(
    vehicle.steer,
    controls.steer,
    1 - Math.pow(state.manual ? manualTuning.steerResponse : 0.0008, delta),
  );

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

  const centerError = roadFrame.signedDistance;
  const lateralSpeed = dotGround(vehicle.velocity, roadFrame.normal);
  const tangentSpeed = dotGround(vehicle.velocity, tangent);
  const driverCorrection = state.manual
    ? new THREE.Vector3()
    : tangent
      .clone()
      .multiplyScalar((roadConfig.targetSpeed - tangentSpeed) * 1.75)
      .addScaledVector(roadFrame.normal, -centerError * 7.8 - lateralSpeed * 5.2);

  // Handbrake: smooth engagement so locking the rears never snaps the car.
  // While held it cuts rear lateral grip, kills drive, and drags the rear
  // axle's longitudinal speed toward zero - the classic drift-initiation tool.
  const handbrakeHeld = state.manual && state.input.handbrake;
  vehicle.handbrake = THREE.MathUtils.lerp(
    vehicle.handbrake,
    handbrakeHeld ? 1 : 0,
    1 - Math.pow(handbrakeHeld ? 0.0001 : 0.002, delta),
  );
  const handbrake = vehicle.handbrake;

  const frontCornering = sim.frontCornering * handling.frontCorneringScale;
  const rearCornering = sim.rearCornering * handling.rearCorneringScale * (1 - handbrake * 0.62);
  const frontGrip = sim.frontGrip * handling.frontGripScale;
  const rearGrip = sim.rearGrip * handling.rearGripScale * (1 - handbrake * 0.55);
  const frontLateralForce = THREE.MathUtils.clamp(-frontLat * frontCornering, -frontGrip, frontGrip);
  const frontForce = frontSide.clone().multiplyScalar(frontLateralForce).add(driverCorrection.clampLength(0, 8.4));
  force.add(frontForce);
  torque += torqueFromForce(frontContact.relative, frontForce);

  const brakeForce = controls.brake * manualTuning.brakeForce;
  const driveForce = sim.driveForce * handling.driveForceScale;
  const rearDriveForce = driveForce * vehicle.throttle * (1 - handbrake * 0.85)
    - Math.sign(rearLong || 1) * brakeForce
    - rearLong * handbrake * 2.4;
  const rearSlipFromPower = THREE.MathUtils.clamp((Math.abs(rearDriveForce) - Math.abs(rearLong) * 0.65) / driveForce, 0, 1);
  const rearGripLimit = THREE.MathUtils.lerp(rearGrip, handling.rearPowerGrip, rearSlipFromPower);
  const rearLateralForce = THREE.MathUtils.clamp(-rearLat * rearCornering, -rearGripLimit, rearGripLimit);
  const rearForce = basis.right.clone().multiplyScalar(rearLateralForce).addScaledVector(basis.forward, rearDriveForce);
  force.add(rearForce);
  torque += torqueFromForce(rearContact.relative, rearForce);

  const speed = vehicle.velocity.length();
  const slipAngle = speed < runConfig.angleDisplaySpeed ? 0 : signedAngleOnGround(basis.forward, vehicle.velocity);
  const spinStabilityTorque = state.manual
    ? -vehicle.yawRate
      * manualTuning.spinStability
      * THREE.MathUtils.clamp((speed - 5.2) / 5.6, 0, 1)
      * Math.max(
        THREE.MathUtils.clamp((Math.abs(vehicle.yawRate) - 1.05) / 1.15, 0, 1),
        THREE.MathUtils.clamp(
          (Math.abs(slipAngle) - THREE.MathUtils.degToRad(56)) / THREE.MathUtils.degToRad(28),
          0,
          1,
        ),
      )
    : 0;
  const yawControlTorque = state.manual
    ? -vehicle.yawRate * manualTuning.yawDamping * handling.yawDampingScale
    : yawError * 22 - vehicle.yawRate * 1.05;
  torque += yawControlTorque + spinStabilityTorque;

  force.addScaledVector(vehicle.velocity, state.manual ? -manualTuning.linearDrag * handling.dragScale : -0.72);
  vehicle.velocity.addScaledVector(force, delta / sim.mass);
  vehicle.velocity.clampLength(0, state.manual ? manualTuning.maxSpeed * handling.maxSpeedScale : 7.4);
  vehicle.position.addScaledVector(vehicle.velocity, delta);

  vehicle.yawRate += (torque / sim.inertia) * delta;
  vehicle.yawRate = THREE.MathUtils.clamp(
    vehicle.yawRate,
    state.manual ? -1.95 : -2.4,
    state.manual ? 1.95 : 2.4,
  );
  vehicle.yaw = wrapAngle(vehicle.yaw + vehicle.yawRate * delta);
  const impact = resolveVehicleCollisions(vehicle, delta);
  updateRoadAdherence(vehicle, delta);

  vehicle.frontSlip = THREE.MathUtils.clamp(
    Math.abs(frontLat) / (4.2 * handling.frontGripScale) + Math.abs(vehicle.steer) * 0.15 + impact * 0.1,
    0,
    1,
  );
  vehicle.rearSlip = THREE.MathUtils.clamp(
    Math.abs(rearLat) / (2.5 * handling.rearGripScale)
      + rearSlipFromPower * 0.9
      + impact * 0.16
      + handbrake * THREE.MathUtils.clamp(speed / 4.5, 0, 1) * 0.5,
    0,
    1,
  );
  vehicle.lateralG = THREE.MathUtils.clamp((frontLateralForce + rearLateralForce) / 18, -1.25, 1.25);
  vehicle.wheelSpinFront += Math.max(0.8, Math.abs(frontLong)) * delta * 2.8;
  // Locked rears stop spinning while the handbrake is on.
  vehicle.wheelSpinRear += (Math.max(1, Math.abs(rearLong)) * 3.2 + Math.abs(rearDriveForce) * 1.1 * vehicle.rearSlip)
    * delta * (1 - handbrake * 0.92);

  updateWheelContactData(vehicle);
  vehicle.roadFrame = getRoadFrame(vehicle.position);
}

function updateMenuPresentationScene(delta) {
  const menuActive = ['menu', 'result', 'quit'].includes(state.screen);
  if (!menuActive) return;

  menuPreviewSystem?.update(delta);
  const target = new THREE.Vector3(0, 0.58, -3.25);
  const cameraPosition = new THREE.Vector3(0, 2.75, 4.1);
  camera.position.lerp(cameraPosition, 1 - Math.pow(0.002, delta));
  camera.lookAt(target);
}

function updateRoadAdherence(vehicle, delta) {
  const frame = getRoadFrame(vehicle.position);
  if (frame.inside) {
    vehicle.offRoadTime = 0;
    return;
  }

  vehicle.offRoadTime += delta;
  vehicle.velocity.multiplyScalar(Math.pow(0.08, delta));
  vehicle.yawRate *= Math.pow(0.15, delta);

  if (vehicle.offRoadTime > 2) {
    resetVehicleToRoad(vehicle);
  }
}

function resetVehicleToRoad(vehicle) {
  const reset = getNearestResetPoint(vehicle.position);
  vehicle.position.copy(reset.position);
  vehicle.velocity.copy(getVehicleBasis(reset.yaw).forward).multiplyScalar(0.25);
  vehicle.yaw = reset.yaw;
  vehicle.yawRate = 0;
  vehicle.steer = 0;
  vehicle.offRoadTime = 0;
  state.run.invalidTime = runConfig.breakGrace + 0.35;
  state.run.driftDuration = 0;
  state.run.combo = Math.max(1, state.run.combo - 0.55);
  updateWheelContactData(vehicle);
}

function getNearestResetPoint(position) {
  const fallback = activeRoad?.spawn ?? { position: new THREE.Vector3(), yaw: Math.PI };
  if (!activeRoad?.resetPoints?.length) return fallback;

  let nearest = activeRoad.resetPoints[0];
  let nearestDistanceSq = Infinity;
  for (const reset of activeRoad.resetPoints) {
    const dx = position.x - reset.position.x;
    const dz = position.z - reset.position.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq < nearestDistanceSq) {
      nearest = reset;
      nearestDistanceSq = distanceSq;
    }
  }
  return nearest;
}

function resolveVehicleCollisions(vehicle, delta) {
  if (activeColliders.length === 0) return 0;

  let strongestImpact = 0;
  let solvedContacts = 0;
  let strongestContact = null;
  let strongestNormal = null;

  for (let pass = 0; pass < 2; pass += 1) {
    const basis = getVehicleBasis(vehicle.yaw);

    for (const sample of carCollisionSamples) {
      const contact = vehicle.position
        .clone()
        .addScaledVector(basis.right, sample.x)
        .addScaledVector(basis.forward, -sample.z);

      for (const collider of activeColliders) {
        const hit = testColliderContact(contact, sample.radius, collider);
        if (!hit) continue;

        const push = Math.min(hit.depth + 0.012, 0.55);
        vehicle.position.addScaledVector(hit.normal, push);
        solvedContacts += 1;

        const velocityIntoSurface = dotGround(vehicle.velocity, hit.normal);
        const impactSpeed = Math.max(0, -velocityIntoSurface);
        const impactStrength = impactSpeed * (0.55 + hit.depth);
        if (impactStrength > strongestImpact) {
          strongestImpact = impactStrength;
          strongestContact = contact.clone();
          strongestNormal = hit.normal.clone();
        }

        if (velocityIntoSurface < 0) {
          vehicle.velocity.addScaledVector(hit.normal, -velocityIntoSurface * (1 + collider.bounce));
        }

        const remainingNormalSpeed = dotGround(vehicle.velocity, hit.normal);
        const tangent = vehicle.velocity.clone().addScaledVector(hit.normal, -remainingNormalSpeed);
        vehicle.velocity.addScaledVector(tangent, -Math.min(0.45, collider.friction * 0.22));

        const yawKick = (hit.normal.x * basis.forward.z - hit.normal.z * basis.forward.x)
          * (0.045 + impactSpeed * 0.032);
        vehicle.yawRate = THREE.MathUtils.clamp(vehicle.yawRate + yawKick, -2.05, 2.05);
      }
    }
  }

  if (strongestImpact > 0.05 || solvedContacts > 0) {
    const impact = THREE.MathUtils.clamp(strongestImpact / 5.4 + solvedContacts * 0.03, 0, 1);
    state.feedback.impact = Math.max(state.feedback.impact, impact);
    state.feedback.shake = Math.max(state.feedback.shake, impact * 0.58);

    if (impact > 0.18) {
      state.feedback.impactFlash = Math.max(state.feedback.impactFlash, impact);
      if (strongestContact && smokeSystem) {
        // emit() drifts particles opposite this velocity, so point it into
        // the wall to puff the smoke back out along the contact normal.
        const puffVelocity = strongestNormal.clone().multiplyScalar(-1.6).addScaledVector(vehicle.velocity, -0.25);
        for (let n = 0; n < 4; n += 1) {
          smokeSystem.emit(strongestContact, puffVelocity, strongestNormal, 0.6 + impact * 0.4);
        }
      }
    }

    if (state.manual && impact > 0.22) {
      state.run.invalidTime = Math.max(state.run.invalidTime, runConfig.breakGrace + impact * 0.18);
      state.run.driftDuration = 0;
      state.run.combo = Math.max(1, state.run.combo - impact * 0.42 * Math.max(1, delta * 10));
    }

    return impact;
  }

  return 0;
}

function testColliderContact(point, radius, collider) {
  if (collider.type === 'circle') return testCircleColliderContact(point, radius, collider);
  return testBoxColliderContact(point, radius, collider);
}

function testCircleColliderContact(point, radius, collider) {
  const dx = point.x - collider.x;
  const dz = point.z - collider.z;
  const minDistance = radius + collider.radius;
  const distanceSq = dx * dx + dz * dz;
  if (distanceSq >= minDistance * minDistance) return null;

  if (distanceSq < 0.0001) {
    return {
      normal: new THREE.Vector3(1, 0, 0),
      depth: minDistance,
    };
  }

  const distance = Math.sqrt(distanceSq);
  return {
    normal: new THREE.Vector3(dx / distance, 0, dz / distance),
    depth: minDistance - distance,
  };
}

function testBoxColliderContact(point, radius, collider) {
  const cos = Math.cos(-collider.rotation);
  const sin = Math.sin(-collider.rotation);
  const dx = point.x - collider.x;
  const dz = point.z - collider.z;
  const localX = dx * cos + dz * sin;
  const localZ = -dx * sin + dz * cos;
  const closestX = THREE.MathUtils.clamp(localX, -collider.halfX, collider.halfX);
  const closestZ = THREE.MathUtils.clamp(localZ, -collider.halfZ, collider.halfZ);
  const diffX = localX - closestX;
  const diffZ = localZ - closestZ;
  const outsideDistanceSq = diffX * diffX + diffZ * diffZ;

  if (outsideDistanceSq > 0.000001) {
    if (outsideDistanceSq >= radius * radius) return null;
    const outsideDistance = Math.sqrt(outsideDistanceSq);
    return {
      normal: rotateLocalNormal(diffX / outsideDistance, diffZ / outsideDistance, collider.rotation),
      depth: radius - outsideDistance,
    };
  }

  const distanceToX = collider.halfX - Math.abs(localX);
  const distanceToZ = collider.halfZ - Math.abs(localZ);
  if (distanceToX < distanceToZ) {
    return {
      normal: rotateLocalNormal(Math.sign(localX || 1), 0, collider.rotation),
      depth: radius + distanceToX,
    };
  }

  return {
    normal: rotateLocalNormal(0, Math.sign(localZ || 1), collider.rotation),
    depth: radius + distanceToZ,
  };
}

function rotateLocalNormal(x, z, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return new THREE.Vector3(x * cos + z * sin, 0, -x * sin + z * cos).normalize();
}

function updateCarVisuals(delta, telemetry = getVehicleTelemetry(state.vehicle)) {
  const vehicle = state.vehicle;
  const { speed, slipAngle } = telemetry;

  car.root.position.copy(vehicle.position);
  car.root.rotation.y = vehicle.yaw;

  const rollTarget = -vehicle.lateralG * 0.09;
  const pitchTarget = -vehicle.throttle * vehicle.rearSlip * 0.035 + Math.sin(state.elapsed * 15) * vehicle.rearSlip * 0.008;
  car.sprung.rotation.z = THREE.MathUtils.lerp(car.sprung.rotation.z, rollTarget, 1 - Math.pow(0.002, delta));
  car.sprung.rotation.x = THREE.MathUtils.lerp(car.sprung.rotation.x, pitchTarget, 1 - Math.pow(0.002, delta));
  car.sprung.position.y = 0.03 + vehicle.rearSlip * 0.035 + Math.sin(state.elapsed * 18) * vehicle.rearSlip * 0.012;

  for (const wheel of car.wheels) {
    const showWheelBlur = getGraphicsProfile().wheelBlur;
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
  const speedFactor = THREE.MathUtils.clamp(speed / 12, 0, 1);
  const targetFov = getResponsiveFov() + speedFactor * (narrowView ? 5 : 7) + state.feedback.comboPulse * 3;
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.pow(0.02, delta));
  camera.updateProjectionMatrix();

  const forwardCameraOffset = basis.forward.clone().multiplyScalar(
    narrowView ? -9.2 - speedFactor * 1.7 : -7.2 - speedFactor * 2.8,
  );
  const orbitOffset = forwardCameraOffset
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), state.cameraAngle)
    .multiplyScalar(zoom);
  const cameraTarget = lookAt
    .clone()
    .add(orbitOffset)
    .add(new THREE.Vector3(
      0,
      (narrowView ? 7.2 : 5.6 - speedFactor * 0.7) * zoom * state.cameraHeight,
      0,
    ));
  const shake = state.feedback.shake;
  const shakeOffset = new THREE.Vector3();
  if (shake > 0.001) {
    const jitterA = Math.sin(state.elapsed * 58.7) * 0.5 + Math.sin(state.elapsed * 91.3) * 0.5;
    const jitterB = Math.cos(state.elapsed * 64.1) * 0.5 + Math.sin(state.elapsed * 43.9) * 0.5;
    const amplitude = shake * 0.034;
    shakeOffset
      .copy(basis.right)
      .multiplyScalar(jitterA * amplitude)
      .add(new THREE.Vector3(0, jitterB * amplitude * 0.55, 0));
    cameraTarget.add(shakeOffset);
  }
  // Lead the camera gently into the drift so the player sees where the
  // car is sliding toward rather than where its nose points.
  const lateralLead = THREE.MathUtils.clamp(slipAngle * 0.6, -1, 1) * speedFactor;
  const cameraLookAt = lookAt
    .clone()
    .addScaledVector(basis.forward, speedFactor * 0.9)
    .addScaledVector(basis.right, lateralLead);
  camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, delta));
  camera.lookAt(cameraLookAt.addScaledVector(shakeOffset, 0.3));

  speedEl.textContent = `${Math.round(speed * 13.8)} km/h`;
  angleEl.textContent = `${Math.round(speed < runConfig.angleDisplaySpeed ? 0 : Math.abs(slipAngle) * THREE.MathUtils.RAD2DEG)} deg`;
  return telemetry;
}

function getVehicleTelemetry(vehicle) {
  const speed = vehicle.velocity.length();
  const slipAngle = speed < runConfig.angleDisplaySpeed
    ? 0
    : signedAngleOnGround(getVehicleBasis(vehicle.yaw).forward, vehicle.velocity);
  return { speed, slipAngle };
}

function getLevelConfig(index) {
  return levelConfigs[index] ?? levelConfigs[0];
}

function getActiveLevelConfig() {
  return getLevelConfig(state.level);
}

function getActiveHandling(level = getActiveLevelConfig()) {
  const launchAssist = state.manual
    ? 1 - THREE.MathUtils.clamp(
      (state.run.duration - state.run.timeLeft) / manualTuning.launchAssistDuration,
      0,
      1,
    )
    : 0;

  // Per-car character on top of the level baseline: gentle multipliers
  // (within ±8%) derived from the selected car's stat sheet.
  const merged = { ...level.handling };
  const carHandling = getSelectedCarConfig().handling ?? {};
  for (const [key, scale] of Object.entries(carHandling)) {
    if (typeof merged[key] === 'number') merged[key] *= scale;
  }

  return {
    ...merged,
    driveForceScale: merged.driveForceScale * THREE.MathUtils.lerp(1, manualTuning.launchDriveForceScale, launchAssist),
    steerScale: merged.steerScale * THREE.MathUtils.lerp(1, manualTuning.launchSteerScale, launchAssist),
    yawDampingScale: merged.yawDampingScale * THREE.MathUtils.lerp(1, manualTuning.launchYawDampingScale, launchAssist),
  };
}

function getDriverControls(vehicle, basis, radial, tangent, yawError, handling = getActiveHandling()) {
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
  const brakingBeforeReverse = reverseInput > 0 && forwardSpeed > manualTuning.brakingSpeedThreshold;
  const speed = vehicle.velocity.length();
  const steerLimit = THREE.MathUtils.lerp(
    manualTuning.steerLimitLowSpeed,
    manualTuning.steerLimitHighSpeed,
    THREE.MathUtils.clamp(speed / manualTuning.steerFalloffSpeed, 0, 1),
  ) * handling.steerScale;

  return {
    throttle: forwardInput - (brakingBeforeReverse ? 0 : reverseInput * manualTuning.throttleReverseScale),
    brake: brakingBeforeReverse ? 1 : 0,
    steer: steerInput * steerLimit,
  };
}

function resetVehicle(manual) {
  const vehicle = state.vehicle;
  const spawn = activeRoad?.spawn ?? getRoadSpawn(getActiveLevelConfig().road, activeRoad?.curve ?? new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]));
  const basis = getVehicleBasis(spawn.yaw);
  vehicle.position.copy(spawn.position);
  vehicle.velocity.copy(basis.forward).multiplyScalar(manual ? 0.15 : getActiveLevelConfig().road.targetSpeed * 1.05);
  vehicle.yaw = spawn.yaw;
  vehicle.yawRate = manual ? 0 : 0.72;
  vehicle.steer = 0;
  vehicle.throttle = manual ? 0 : 1;
  vehicle.wheelSpinFront = 0;
  vehicle.wheelSpinRear = 0;
  vehicle.handbrake = 0;
  vehicle.rearSlip = 0;
  vehicle.frontSlip = 0;
  vehicle.lateralG = 0;
  vehicle.offRoadTime = 0;
  vehicle.roadFrame = getRoadFrame(vehicle.position);
  updateWheelContactData(vehicle);
  state.smokeAccumulator = 0;
}

function resetRun() {
  state.run.duration = runConfig.duration;
  state.run.timeLeft = runConfig.duration;
  state.run.score = 0;
  state.run.combo = 1;
  state.run.driftDuration = 0;
  state.run.driftTimeTotal = 0;
  state.run.maxCombo = 1;
  state.run.invalidTime = runConfig.breakGrace;
  state.run.driftValid = false;
  state.run.driftBlockReason = null;
  state.run.newBest = false;
  state.run.pointsPerSecond = 0;
  state.run.ended = false;
  state.feedback.popupBank = 0;
  state.feedback.popupCooldown = 0;
  state.feedback.impact = 0;
  state.feedback.shake = 0;
  state.feedback.driftIntensity = 0;
  state.feedback.comboPulse = 0;
  state.feedback.lastComboStep = 1;
  scorePopupsEl.replaceChildren();
  updateHud();
}

function resetCameraControls() {
  state.cameraZoom = 1;
  state.cameraAngle = 0;
  state.cameraHeight = 1;
  cameraZoom.value = '1.00';
  cameraAngle.value = '0';
}

function startLevel(levelIndex) {
  unlockAudio();
  state.screen = 'playing';
  state.level = levelConfigs[levelIndex] ? levelIndex : 0;
  state.manual = true;
  state.paused = false;
  modeToggle.textContent = 'Play auto';
  levelSystem.setLevel(state.level);
  smokeSystem.clear();
  skidSystem.clear();
  resetCameraControls();
  resetVehicle(true);
  resetRun();
  updateStatusText();
  hud.hidden = false;
  menuOverlay.hidden = true;
  updateScenePresentationVisibility();
  clearMovementInput();
  maybeShowControlsHint();
}

const controlsHintStorageKey = 'driftDonut.controlsHint.v1';
let controlsHintTimer = 0;

function maybeShowControlsHint() {
  if (!controlsHintEl) return;
  try {
    if (window.localStorage.getItem(controlsHintStorageKey)) return;
  } catch {
    return;
  }

  for (const kbd of controlsHintEl.querySelectorAll('[data-hint-key]')) {
    const action = kbd.dataset.hintKey;
    kbd.textContent = (state.keyBindings[action] ?? defaultKeyBindings[action]).label;
  }
  controlsHintEl.hidden = false;
  controlsHintTimer = 7;
}

function dismissControlsHint() {
  if (!controlsHintEl || controlsHintEl.hidden) return;
  controlsHintEl.hidden = true;
  try {
    window.localStorage.setItem(controlsHintStorageKey, '1');
  } catch {
    // Private browsing: the hint will simply show again next session.
  }
}

function updateControlsHint(delta) {
  if (!controlsHintEl || controlsHintEl.hidden) return;
  if (state.screen !== 'playing') {
    controlsHintEl.hidden = true;
    return;
  }
  controlsHintTimer -= delta;
  if (controlsHintTimer <= 0) dismissControlsHint();
}

function restartCurrentRun() {
  if (state.screen !== 'playing' && state.screen !== 'result') return;
  startLevel(state.level);
}

function showPauseMenu() {
  if (state.screen !== 'playing' || state.run.ended) return;
  state.paused = true;
  state.bindingTarget = null;
  state.pointer.active = false;
  clearMovementInput();
  updateStatusText();
  hud.hidden = false;
  menuOverlay.hidden = false;
  showMenuPanel('pause');
}

function resumeCurrentRun() {
  if (state.screen !== 'playing' || state.run.ended) return;
  unlockAudio();
  state.paused = false;
  state.bindingTarget = null;
  clearMovementInput();
  updateStatusText();
  hud.hidden = false;
  menuOverlay.hidden = true;
}

function showCarSelect() {
  state.screen = 'menu';
  state.paused = true;
  state.manual = false;
  state.bindingTarget = null;
  modeToggle.textContent = 'Play manual';
  updateStatusText();
  hud.hidden = true;
  menuOverlay.hidden = false;
  state.levelBackPanel = 'cars';
  renderCarSelection();
  showMenuPanel('cars');
  requestAnimationFrame(() => carPreviewSystem?.syncSize());
  clearMovementInput();
}

function showLevelSelect(backPanel = 'main') {
  state.screen = 'menu';
  state.paused = true;
  state.manual = false;
  state.bindingTarget = null;
  modeToggle.textContent = 'Play manual';
  updateStatusText();
  hud.hidden = true;
  menuOverlay.hidden = false;
  state.levelBackPanel = backPanel;
  showMenuPanel('levels');
  clearMovementInput();
}

function showMainMenu() {
  state.screen = 'menu';
  state.paused = true;
  state.manual = false;
  state.bindingTarget = null;
  modeToggle.textContent = 'Play manual';
  updateStatusText();
  updateHud();
  hud.hidden = true;
  menuOverlay.hidden = false;
  state.levelBackPanel = 'main';
  showMenuPanel('main');
  clearMovementInput();
}

function showMenuPanel(name) {
  for (const [panelName, panel] of Object.entries(panels)) {
    panel.hidden = panelName !== name;
  }
  menuOverlay.dataset.screen = name;
  updateScenePresentationVisibility();
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

function selectCar(carId) {
  if (!getCarConfig(carId) || state.selectedCar === carId) {
    renderCarSelection();
    return;
  }

  state.selectedCar = carId;
  rebuildGameplayCar();
  renderCarSelection();
}

function renderLevelCards() {
  const host = document.querySelector('.level-list');
  if (!host) return;
  host.textContent = '';

  levelConfigs.forEach((level, index) => {
    const card = document.createElement('button');
    card.className = 'level-card';
    card.type = 'button';
    card.dataset.level = String(index);

    const route = document.createElement('span');
    route.className = 'level-route';
    route.innerHTML = buildRouteSVG(level);
    card.append(route);

    const info = document.createElement('span');
    info.className = 'level-card-info';

    const title = document.createElement('span');
    title.className = 'level-name';
    title.textContent = level.name;
    info.append(title);

    const description = document.createElement('small');
    description.textContent = level.description ?? '';
    info.append(description);

    const meta = document.createElement('span');
    meta.className = 'level-meta';

    const difficulty = document.createElement('span');
    difficulty.className = 'level-difficulty';
    const pips = document.createElement('span');
    pips.className = 'level-pips';
    for (let pip = 1; pip <= 3; pip += 1) {
      const dot = document.createElement('i');
      dot.classList.toggle('is-filled', pip <= (level.difficulty ?? 1));
      pips.append(dot);
    }
    difficulty.append(pips);
    difficulty.append(['Casual', 'Spicy', 'Expert'][(level.difficulty ?? 1) - 1]);
    meta.append(difficulty);

    const recommended = getCarConfig(level.recommendedCar);
    if (recommended) {
      const fit = document.createElement('span');
      fit.className = 'level-recommended';
      fit.textContent = `Best fit: ${recommended.name}`;
      meta.append(fit);
    }

    info.append(meta);
    card.append(info);
    host.append(card);
  });
}

function renderCarCards() {
  for (const card of carCards) {
    const config = getCarConfig(card.dataset.carCard);
    if (!config) continue;

    const accent = `#${config.visual.accent.toString(16).padStart(6, '0')}`;
    card.style.setProperty('--car-accent', accent);

    const title = card.querySelector('h3');
    if (title) title.textContent = config.name;
    const tagline = card.querySelector('.car-tagline');
    if (tagline) tagline.textContent = config.tagline ?? '';
    const bay = card.querySelector('.car-preview-panel span');
    if (bay) bay.textContent = config.bay;

    const statsHost = card.querySelector('[data-car-stats]');
    if (!statsHost) continue;
    statsHost.textContent = '';
    for (const { key, label, min, max, format } of statMeterRanges) {
      const value = config.stats[key];
      if (value === undefined) continue;
      const fill = THREE.MathUtils.clamp((value - min) / (max - min), 0.04, 1);

      const row = document.createElement('div');
      row.className = 'stat-row';

      const labelEl = document.createElement('span');
      labelEl.className = 'stat-label';
      labelEl.textContent = label;
      row.append(labelEl);

      const valueEl = document.createElement('span');
      valueEl.className = 'stat-value';
      valueEl.textContent = format(value);
      row.append(valueEl);

      const meter = document.createElement('span');
      meter.className = 'stat-meter';
      meter.setAttribute('role', 'img');
      meter.setAttribute('aria-label', `${label}: ${format(value)}`);
      const meterFill = document.createElement('i');
      meterFill.style.width = `${Math.round(fill * 100)}%`;
      meter.append(meterFill);
      row.append(meter);

      statsHost.append(row);
    }
  }
}

function renderCarSelection() {
  for (const card of carCards) {
    const selected = card.dataset.carCard === state.selectedCar;
    card.classList.toggle('is-selected', selected);
    card.setAttribute('aria-selected', String(selected));
  }

  for (const button of carSelectButtons) {
    const selected = button.dataset.selectCar === state.selectedCar;
    button.classList.toggle('secondary-button', !selected);
    button.textContent = selected ? 'Selected' : 'Select Car';
  }

  menuPreviewSystem?.setSelected(state.selectedCar);
  carPreviewSystem?.setSelected(state.selectedCar);
}

function rebuildGameplayCar() {
  if (!car?.root || !world) return;
  world.remove(car.root);
  disposeObjectTree(car.root);
  car = createCar(getSelectedCarConfig());
  world.add(car.root);
  updateWheelContactData(state.vehicle);
  updateScenePresentationVisibility();
}

function getCarConfig(carId) {
  return carConfigs.find((config) => config.id === carId) ?? null;
}

function getSelectedCarConfig() {
  return getCarConfig(state.selectedCar) ?? carConfigs[0];
}

function isCarSelectVisible() {
  return state.screen === 'menu' && !menuOverlay.hidden && !panels.cars.hidden;
}

function updateScenePresentationVisibility() {
  const menuActive = ['menu', 'result', 'quit'].includes(state.screen);
  if (car?.root) car.root.visible = !menuActive;
  menuPreviewSystem?.setVisible(menuActive);
  levelSystem?.setMenuPresentation(menuActive);
}

function updateRun(delta, telemetry) {
  const run = state.run;
  if (run.ended) return;

  const activeDelta = Math.min(delta, run.timeLeft);
  if (activeDelta <= 0) {
    finishRun();
    return;
  }

  updateScoring(activeDelta, telemetry);
  run.timeLeft = Math.max(0, run.timeLeft - activeDelta);
  updateHud();
  updateStatusText();

  if (run.timeLeft <= 0) finishRun();
}

function updateScoring(delta, telemetry) {
  const run = state.run;
  const speed = telemetry.speed;
  const angle = Math.abs(telemetry.slipAngle);
  const rearSlip = state.vehicle.rearSlip;
  const roadFrame = getRoadFrame(state.vehicle.position);
  const onRoad = roadFrame.inside;
  const validDrift = state.manual
    && onRoad
    && speed >= runConfig.minSpeed
    && angle >= runConfig.minAngle
    && angle <= runConfig.maxAngle
    && rearSlip >= runConfig.minRearSlip;

  run.driftValid = validDrift;

  // Surface the first failed predicate so the HUD can tell the player why
  // the score is not counting right now.
  if (validDrift) {
    run.driftBlockReason = null;
  } else if (!state.manual) {
    run.driftBlockReason = 'auto';
  } else if (!onRoad) {
    run.driftBlockReason = 'offroad';
  } else if (speed < runConfig.minSpeed) {
    run.driftBlockReason = 'speed';
  } else if (angle < runConfig.minAngle) {
    run.driftBlockReason = 'angle-low';
  } else if (angle > runConfig.maxAngle) {
    run.driftBlockReason = 'angle-high';
  } else {
    run.driftBlockReason = 'grip';
  }

  if (!validDrift) {
    run.invalidTime += delta;
    run.pointsPerSecond = 0;
    state.feedback.lastComboStep = Math.max(1, Math.floor(run.combo));
    if (run.invalidTime > runConfig.breakGrace) {
      run.driftDuration = 0;
      run.combo = Math.max(1, run.combo - runConfig.comboDecay * delta);
    } else {
      run.combo = Math.max(1, run.combo - runConfig.comboSoftDecay * delta);
    }
    return;
  }

  run.invalidTime = 0;
  run.driftDuration += delta;
  run.driftTimeTotal += delta;

  const speedFactor = Math.max(
    0.35,
    THREE.MathUtils.clamp((speed - runConfig.minSpeed) / (8.5 - runConfig.minSpeed), 0, 1),
  );
  const angleFactor = Math.max(
    0.3,
    THREE.MathUtils.clamp((angle - runConfig.minAngle) / (runConfig.idealAngle - runConfig.minAngle), 0, 1),
  );
  const slipFactor = Math.max(
    0.35,
    THREE.MathUtils.clamp((rearSlip - runConfig.minRearSlip) / (1 - runConfig.minRearSlip), 0, 1),
  );
  const sustainFactor = THREE.MathUtils.clamp(run.driftDuration / runConfig.sustainRamp, 0.45, 1);
  const levelMultiplier = getActiveLevelConfig().scoring.driftRewardMultiplier * getActiveScoringZoneMultiplier();
  const previousComboStep = Math.floor(run.combo);

  run.combo = Math.min(
    runConfig.maxCombo,
    run.combo + runConfig.comboGain * (0.75 + angleFactor + slipFactor) * delta,
  );
  run.maxCombo = Math.max(run.maxCombo, run.combo);
  run.pointsPerSecond = runConfig.basePointsPerSecond
    * speedFactor
    * angleFactor
    * slipFactor
    * sustainFactor
    * run.combo
    * levelMultiplier;
  const earned = run.pointsPerSecond * delta;
  run.score += earned;
  state.feedback.popupBank += earned;

  const comboStep = Math.floor(run.combo);
  if (comboStep > previousComboStep && comboStep > state.feedback.lastComboStep && comboStep >= 2) {
    state.feedback.comboPulse = 0.45;
    state.feedback.lastComboStep = comboStep;
    createScorePopup(`x${run.combo.toFixed(1)}`, true);
  }

  if (state.feedback.popupBank >= 75 && state.feedback.popupCooldown <= 0) {
    createScorePopup(`+${Math.floor(state.feedback.popupBank)}`);
    state.feedback.popupBank = 0;
    state.feedback.popupCooldown = 0.65;
  }
}

function getActiveScoringZoneMultiplier() {
  if (!activeRoad?.scoringZones?.length) return 1;

  let multiplier = 1;
  for (const zone of activeRoad.scoringZones) {
    const dx = state.vehicle.position.x - zone.center.x;
    const dz = state.vehicle.position.z - zone.center.z;
    const distance = Math.hypot(dx, dz);
    if (distance > zone.radius) continue;
    const influence = 1 - THREE.MathUtils.smoothstep(distance / zone.radius, 0, 1);
    multiplier = Math.max(multiplier, THREE.MathUtils.lerp(1, zone.multiplier, influence));
  }
  return multiplier;
}

function finishRun() {
  const run = state.run;
  run.timeLeft = 0;
  run.ended = true;
  run.driftValid = false;
  run.pointsPerSecond = 0;
  state.screen = 'result';
  state.paused = true;
  clearMovementInput();

  const finalScore = Math.floor(run.score);
  run.newBest = finalScore > run.bestScore && finalScore > 0;
  if (run.newBest) {
    run.bestScore = finalScore;
    saveBestScore(finalScore);
  }

  updateHud();
  updateResultPanel();
  updateStatusText();
  hud.hidden = true;
  menuOverlay.hidden = false;
  showMenuPanel('result');
}

function updateHud() {
  scoreEl.textContent = String(Math.floor(state.run.score));
  comboEl.textContent = `x${state.run.combo.toFixed(1)}`;
  timerEl.textContent = String(Math.ceil(state.run.timeLeft));
  bestScoreEl.textContent = String(state.run.bestScore);
}

function updateResultPanel() {
  resultScoreEl.textContent = String(Math.floor(state.run.score));
  resultBestScoreEl.textContent = String(state.run.bestScore);
  resultMaxComboEl.textContent = `x${state.run.maxCombo.toFixed(1)}`;
  resultDriftTimeEl.textContent = `${state.run.driftTimeTotal.toFixed(1)}s`;
  resultNewBestEl.hidden = !state.run.newBest;
}

function updateFeedbackState(delta, telemetry) {
  const targetIntensity = state.screen === 'playing' && !state.paused
    ? getDriftIntensity(telemetry)
    : 0;
  const follow = targetIntensity > state.feedback.driftIntensity ? 0.002 : 0.035;
  state.feedback.driftIntensity = THREE.MathUtils.lerp(
    state.feedback.driftIntensity,
    targetIntensity,
    1 - Math.pow(follow, delta),
  );

  const targetShake = Math.max(
    THREE.MathUtils.clamp((state.feedback.driftIntensity - 0.42) / 0.58, 0, 1),
    state.feedback.impact,
  );
  state.feedback.shake = THREE.MathUtils.lerp(
    state.feedback.shake,
    targetShake,
    1 - Math.pow(0.018, delta),
  );
  state.feedback.impact = Math.max(0, state.feedback.impact - delta * 2.6);
}

function updateFeedbackVisuals(delta) {
  const intensity = state.feedback.driftIntensity;
  const speedIntensity = THREE.MathUtils.clamp((state.vehicle.velocity.length() - 5.4) / 6.2, 0, 1);
  driftFeedbackEl.style.setProperty('--drift-intensity', intensity.toFixed(3));
  driftFeedbackEl.style.setProperty('--speed-intensity', speedIntensity.toFixed(3));
  driftFeedbackEl.classList.toggle('is-active', intensity > 0.34);
  driftFeedbackEl.classList.toggle('is-strong', intensity > 0.68);
  hud.classList.toggle('is-drifting', state.run.driftValid);
  updateDriftGauge();
  updateControlsHint(delta);

  state.feedback.impactFlash = Math.max(0, state.feedback.impactFlash - delta * 2.2);
  impactFlashEl.style.setProperty('--impact-flash', state.feedback.impactFlash.toFixed(3));

  state.feedback.popupCooldown = Math.max(0, state.feedback.popupCooldown - delta);
  state.feedback.comboPulse = Math.max(0, state.feedback.comboPulse - delta);
  comboEl.classList.toggle('is-pulsing', state.feedback.comboPulse > 0);

  const run = state.run;
  const playing = state.screen === 'playing' && !state.paused;
  comboEl.style.setProperty('--combo-progress', (run.combo % 1).toFixed(3));
  comboEl.classList.toggle('is-decaying', playing && !run.driftValid && run.combo > 1.02);
}

const driftBlockLabels = {
  auto: 'Auto pilot',
  offroad: 'Off road!',
  speed: 'Too slow',
  'angle-low': 'More angle',
  'angle-high': 'Too much angle',
  grip: 'More throttle',
};

function updateDriftGauge() {
  if (!driftGaugeEl) return;
  const active = state.screen === 'playing' && state.manual && !state.paused;
  driftGaugeEl.hidden = !active;
  if (!active) return;

  const run = state.run;
  const telemetry = getVehicleTelemetry(state.vehicle);
  const angleDeg = Math.abs(telemetry.slipAngle) * THREE.MathUtils.RAD2DEG;
  const fraction = THREE.MathUtils.clamp(angleDeg / 90, 0, 1);
  driftGaugeNeedleEl.style.setProperty('--needle-position', fraction.toFixed(3));
  // The angle readout itself (#angle) is written by updateCarVisuals.

  driftGaugeEl.classList.toggle('is-valid', run.driftValid);
  if (run.driftValid) {
    driftGaugeChipEl.textContent = `+${Math.max(1, Math.round(run.pointsPerSecond))}/s ×${run.combo.toFixed(1)}`;
  } else {
    driftGaugeChipEl.textContent = driftBlockLabels[run.driftBlockReason] ?? 'Drift to score';
  }
}

function getDriftIntensity(telemetry) {
  const speedFactor = THREE.MathUtils.clamp((telemetry.speed - 2.2) / 5.8, 0, 1);
  const rearSlipFactor = THREE.MathUtils.clamp((state.vehicle.rearSlip - 0.18) / 0.68, 0, 1);
  const angleFactor = THREE.MathUtils.clamp(
    (Math.abs(telemetry.slipAngle) - THREE.MathUtils.degToRad(8)) / THREE.MathUtils.degToRad(46),
    0,
    1,
  );
  const validBonus = state.run.driftValid ? 0.18 : 0;
  return THREE.MathUtils.clamp((rearSlipFactor * 0.58 + angleFactor * 0.42) * speedFactor + validBonus, 0, 1);
}

function createScorePopup(text, combo = false) {
  if (!scorePopupsEl) return;
  const popup = document.createElement('span');
  popup.className = combo ? 'score-popup score-popup-combo' : 'score-popup';
  popup.textContent = text;
  scorePopupsEl.append(popup);
  window.setTimeout(() => popup.remove(), 900);
}

function unlockAudio() {
  if (state.muted || !window.AudioContext && !window.webkitAudioContext) return;
  if (!audioEngine) audioEngine = createAudioEngine();
  audioEngine?.resume();
}

function updateAudioFeedback(delta, telemetry) {
  if (!audioEngine) return;
  audioEngine.update(delta, telemetry, {
    playing: state.screen === 'playing' && !state.paused,
    muted: state.muted,
    throttle: state.vehicle.throttle,
    rearSlip: state.vehicle.rearSlip,
    driftIntensity: state.feedback.driftIntensity,
  });
}

function setMuted(muted) {
  state.muted = muted;
  muteToggle.checked = muted;
  saveMutePreference(muted);

  if (muted) {
    audioEngine?.setMuted(true);
    return;
  }

  audioEngine?.setMuted(false);
  if (state.screen === 'playing') unlockAudio();
}

function createAudioEngine() {
  const Context = window.AudioContext || window.webkitAudioContext;
  const context = new Context();
  const masterGain = context.createGain();
  const engineGain = context.createGain();
  const engineFilter = context.createBiquadFilter();
  const engineOsc = context.createOscillator();
  const engineSubOsc = context.createOscillator();
  const tireGain = context.createGain();
  const tireFilter = context.createBiquadFilter();
  const tireSource = context.createBufferSource();

  masterGain.gain.value = 0;
  engineGain.gain.value = 0;
  tireGain.gain.value = 0;
  engineFilter.type = 'lowpass';
  engineFilter.frequency.value = 340;
  engineFilter.Q.value = 0.7;
  tireFilter.type = 'bandpass';
  tireFilter.frequency.value = 1600;
  tireFilter.Q.value = 5.4;

  engineOsc.type = 'sawtooth';
  engineSubOsc.type = 'triangle';
  engineOsc.frequency.value = 90;
  engineSubOsc.frequency.value = 45;

  engineOsc.connect(engineFilter);
  engineSubOsc.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(masterGain);

  tireSource.buffer = createNoiseBuffer(context);
  tireSource.loop = true;
  tireSource.connect(tireFilter);
  tireFilter.connect(tireGain);
  tireGain.connect(masterGain);
  masterGain.connect(context.destination);

  engineOsc.start();
  engineSubOsc.start();
  tireSource.start();

  return {
    resume() {
      if (context.state === 'suspended') context.resume();
    },
    setMuted(muted) {
      const now = context.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(muted ? 0 : masterGain.gain.value, now, 0.025);
      if (muted && context.state === 'running') {
        window.setTimeout(() => {
          if (state.muted && context.state === 'running') context.suspend();
        }, 80);
      }
    },
    update(delta, telemetry, audioState) {
      if (context.state !== 'running') return;

      const now = context.currentTime;
      const speedFactor = THREE.MathUtils.clamp(telemetry.speed / 9.5, 0, 1);
      const throttle = Math.abs(audioState.throttle);
      const rearSlip = THREE.MathUtils.clamp(audioState.rearSlip, 0, 1);
      const active = audioState.playing && !audioState.muted;
      const engineLevel = active ? (0.035 + speedFactor * 0.055 + throttle * 0.05) : 0;
      const tireLevel = active
        ? Math.max(0, rearSlip - 0.24) * (0.12 + audioState.driftIntensity * 0.18)
        : 0;
      const baseFrequency = 65 + speedFactor * 135 + throttle * 55 + rearSlip * 22;

      masterGain.gain.setTargetAtTime(active ? 0.78 : 0, now, 0.08);
      engineGain.gain.setTargetAtTime(engineLevel, now, 0.06);
      tireGain.gain.setTargetAtTime(tireLevel, now, 0.035);
      engineOsc.frequency.setTargetAtTime(baseFrequency, now, 0.05);
      engineSubOsc.frequency.setTargetAtTime(baseFrequency * 0.5, now, 0.05);
      engineFilter.frequency.setTargetAtTime(260 + speedFactor * 720 + throttle * 260, now, 0.08);
      tireFilter.frequency.setTargetAtTime(1200 + rearSlip * 1800 + Math.sin(state.elapsed * 18) * 90, now, 0.04);

      if (delta > 0.1) {
        engineGain.gain.setTargetAtTime(0, now, 0.02);
        tireGain.gain.setTargetAtTime(0, now, 0.02);
      }
    },
  };
}

function createNoiseBuffer(context) {
  const length = Math.floor(context.sampleRate * 0.75);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let last = 0;

  for (let i = 0; i < length; i += 1) {
    last = last * 0.78 + (Math.random() * 2 - 1) * 0.22;
    samples[i] = last;
  }

  return buffer;
}

function setShadowQuality(value) {
  graphicsSettings.shadowQuality = normalizeShadowQuality(value, getGraphicsProfile().defaultShadowQuality);
  saveGraphicsSettings();
  renderGraphicsSettings();
  applyGraphicsSettings();
}

function applyShadowSetting() {
  applyGraphicsSettings();
}

function loadGraphicsSettings() {
  const defaultPreset = smallMachine ? 'low' : 'high';
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
      frameRateLimit: normalizeFrameRateLimit(saved.frameRateLimit, profile.defaultFrameRateLimit),
      shadowQuality: normalizeShadowQuality(
        saved.shadowQuality,
        typeof saved.shadows === 'boolean'
          ? (saved.shadows ? profile.defaultShadowQuality : 'off')
          : profile.defaultShadowQuality,
      ),
    };
  } catch {
    return {
      preset: defaultPreset,
      resolutionScale: fallback.defaultResolutionScale,
      frameRateLimit: fallback.defaultFrameRateLimit,
      shadowQuality: fallback.defaultShadowQuality,
    };
  }
}

function saveGraphicsSettings() {
  try {
    localStorage.setItem(graphicsStorageKey, JSON.stringify(graphicsSettings));
  } catch {
    // Graphics settings remain active for the current session when storage is blocked.
  }
}

function getGraphicsProfile() {
  return graphicsPresets[graphicsSettings.preset] ?? graphicsPresets.medium;
}

function getShadowQualitySettings() {
  const quality = normalizeShadowQuality(graphicsSettings.shadowQuality, getGraphicsProfile().defaultShadowQuality);
  return shadowQualities[quality];
}

function getTargetRenderHeight(scale) {
  return Math.round(THREE.MathUtils.lerp(240, 1080, THREE.MathUtils.clamp(scale, 0, 100) / 100));
}

function normalizeFrameRateLimit(value, fallback) {
  const limit = Number(value);
  return [0, 30, 45, 60].includes(limit) ? limit : fallback;
}

function normalizeShadowQuality(value, fallback) {
  return shadowQualities[value] ? value : fallback;
}

function getCurrentLevelFogDensity() {
  return state.levelFogDensity * getGraphicsProfile().fogDensityMultiplier;
}

function renderGraphicsSettings() {
  const targetHeight = getTargetRenderHeight(graphicsSettings.resolutionScale);
  graphicsPresetSelect.value = graphicsSettings.preset;
  resolutionScaleInput.value = String(Math.round(graphicsSettings.resolutionScale));
  resolutionValueEl.textContent = `${targetHeight}p`;
  frameRateLimitSelect.value = String(normalizeFrameRateLimit(
    graphicsSettings.frameRateLimit,
    getGraphicsProfile().defaultFrameRateLimit,
  ));
  shadowQualitySelect.value = normalizeShadowQuality(
    graphicsSettings.shadowQuality,
    getGraphicsProfile().defaultShadowQuality,
  );
}

function applyGraphicsSettings() {
  const profile = getGraphicsProfile();
  const shadowQuality = getShadowQualitySettings();
  state.shadows = shadowQuality.enabled;

  renderer.setPixelRatio(getRenderPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = state.shadows;
  renderer.shadowMap.type = shadowQuality.type;
  renderer.shadowMap.needsUpdate = true;

  if (keyLight) {
    keyLight.castShadow = state.shadows;
    if (keyLight.shadow.map && keyLight.shadow.mapSize.x !== shadowQuality.mapSize) {
      keyLight.shadow.map.dispose();
      keyLight.shadow.map = null;
    }
    keyLight.shadow.mapSize.set(shadowQuality.mapSize, shadowQuality.mapSize);
    keyLight.shadow.radius = shadowQuality.radius ?? 1;
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
  if (state.screen === 'result') {
    statusEl.textContent = 'Finished';
    return;
  }

  if (state.paused) {
    statusEl.textContent = 'Paused';
    return;
  }

  if (!state.manual) {
    statusEl.textContent = 'Auto demo';
    return;
  }

  if (state.run.driftValid) {
    statusEl.textContent = 'Drifting';
    return;
  }

  if (!isVehicleOnRoad(state.vehicle.position)) {
    statusEl.textContent = 'Off road';
    return;
  }

  if (state.run.invalidTime <= runConfig.breakGrace && state.run.combo > 1.05) {
    statusEl.textContent = 'Linking';
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

function loadBestScore() {
  try {
    const saved = Number(localStorage.getItem(bestScoreStorageKey));
    return Number.isFinite(saved) && saved > 0 ? Math.floor(saved) : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    localStorage.setItem(bestScoreStorageKey, String(score));
  } catch {
    // Best score remains available in memory when storage is blocked.
  }
}

function loadMutePreference() {
  try {
    return localStorage.getItem(muteStorageKey) === 'true';
  } catch {
    return false;
  }
}

function saveMutePreference(muted) {
  try {
    localStorage.setItem(muteStorageKey, String(muted));
  } catch {
    // Mute still applies for the current session when storage is blocked.
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
  if (active) dismissControlsHint();
  state.input[direction] = active;
}

function clearMovementInput() {
  state.input.up = false;
  state.input.down = false;
  state.input.left = false;
  state.input.right = false;
  state.input.handbrake = false;
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

  state.smokeAccumulator += delta * (14 + vehicle.rearSlip * 46) * (0.8 + state.feedback.driftIntensity * 0.6);
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
      : THREE.MathUtils.clamp(
        lateral / 2.7
          + vehicle.throttle * 0.58
          // Locked rears dragged across the asphalt smoke and mark on their own.
          + vehicle.handbrake * THREE.MathUtils.clamp(longitudinal / 3.5, 0, 1) * 0.7,
        0,
        1,
      );
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

function getResponsiveFov() {
  return window.innerWidth < 560 ? 58 : 48;
}

function getRenderPixelRatio() {
  const targetHeight = getTargetRenderHeight(graphicsSettings.resolutionScale);
  const targetRatio = targetHeight / Math.max(1, window.innerHeight);
  return THREE.MathUtils.clamp(targetRatio, 0.22, 4);
}

function getFrameInterval() {
  const limit = normalizeFrameRateLimit(graphicsSettings.frameRateLimit, getGraphicsProfile().defaultFrameRateLimit);
  return limit > 0 ? 1000 / limit : 0;
}
