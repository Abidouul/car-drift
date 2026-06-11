import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Live 3D previews for the car selection cards. One small shared WebGL
// renderer draws each car's studio scene, then blits into that card's 2D
// canvas. Runs only while the cars panel is visible; the preview renderer
// keeps its own pixel ratio so the gameplay resolution-scale setting never
// degrades the cards.
export function createCarPreviewSystem({ carConfigs, createCar, lowPower = false }) {
  const canvases = [...document.querySelectorAll('canvas[data-preview-car]')];
  if (!canvases.length) return null;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
  let renderer = null;
  let failed = false;
  let frameToggle = 0;
  let selectedId = null;

  const entries = canvases.map((canvas) => {
    const config = carConfigs.find((item) => item.id === canvas.dataset.previewCar);
    if (!config) return null;

    const scene = new THREE.Scene();

    const stage = new THREE.Group();
    scene.add(stage);

    const turntable = new THREE.Group();
    turntable.rotation.y = config.id === 'e30' ? 2.35 : 2.95;
    stage.add(turntable);

    const car = createCar(config);
    car.root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
      // The factory's point lights are tuned for the night track; in the
      // small studio scene they blow out the paint.
      if (child.isPointLight) child.intensity *= 0.3;
    });
    car.root.position.y = 0.06;
    turntable.add(car.root);

    const accent = new THREE.Color(config.visual.accent);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.55, 2.7, 0.14, 48),
      new THREE.MeshStandardMaterial({ color: 0x0c0f11, roughness: 0.32, metalness: 0.6 }),
    );
    platform.position.y = -0.07;
    stage.add(platform);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.58, 2.76, 64),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.32, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    stage.add(ring);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 4.6),
      new THREE.MeshBasicMaterial({ map: makeContactShadowTexture(), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    turntable.add(shadow);

    scene.add(new THREE.HemisphereLight(0xcfdde6, 0x14181c, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.55);
    key.position.set(3.4, 5.2, 2.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(accent, 0.6);
    rim.position.set(-3.2, 2.4, -4.2);
    scene.add(rim);

    const bounds = new THREE.Box3().setFromObject(car.root);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    const distance = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 0.92;
    camera.position.set(
      Math.sin(0.72) * distance * Math.cos(0.3),
      sphere.center.y + Math.sin(0.3) * distance,
      Math.cos(0.72) * distance * Math.cos(0.3),
    );
    camera.lookAt(sphere.center.x, sphere.center.y - 0.04, sphere.center.z);

    canvas.classList.add('is-live');

    return {
      id: config.id,
      canvas,
      ctx: canvas.getContext('2d'),
      scene,
      camera,
      turntable,
      ring,
      width: 0,
      height: 0,
    };
  }).filter(Boolean);

  const resizeObserver = new ResizeObserver(() => syncSize());
  for (const entry of entries) resizeObserver.observe(entry.canvas);
  syncSize();

  function ensureRenderer() {
    if (renderer || failed) return renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      markFailed();
      return null;
    }
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      markFailed();
    });

    // Studio reflections for the showcase paint and glass.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    for (const entry of entries) {
      entry.scene.environment = environment;
      entry.scene.environmentIntensity = 0.85;
    }
    pmrem.dispose();
    return renderer;
  }

  function markFailed() {
    failed = true;
    for (const entry of entries) entry.canvas.classList.remove('is-live');
  }

  function syncSize() {
    for (const entry of entries) {
      const width = Math.round(entry.canvas.clientWidth * pixelRatio);
      const height = Math.round(entry.canvas.clientHeight * pixelRatio);
      if (!width || !height || (width === entry.width && height === entry.height)) continue;
      entry.width = width;
      entry.height = height;
      entry.canvas.width = width;
      entry.canvas.height = height;
      entry.camera.aspect = width / height;
      entry.camera.updateProjectionMatrix();
    }
  }

  function renderEntry(entry) {
    if (!entry.width || !entry.height) return;
    const size = renderer.getSize(new THREE.Vector2());
    if (size.x !== entry.width || size.y !== entry.height) {
      renderer.setSize(entry.width, entry.height, false);
    }
    renderer.render(entry.scene, entry.camera);
    entry.ctx.clearRect(0, 0, entry.width, entry.height);
    entry.ctx.drawImage(renderer.domElement, 0, 0);
  }

  return {
    setSelected(carId) {
      selectedId = carId;
      for (const entry of entries) {
        entry.ring.material.opacity = entry.id === carId ? 0.6 : 0.18;
      }
    },
    syncSize,
    update(delta, visible) {
      if (!visible || failed || !entries.length) return;
      if (!ensureRenderer()) return;
      syncSizeIfPending();
      frameToggle = (frameToggle + 1) % entries.length;
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        const spinRate = entry.id === selectedId ? 0.55 : 0.4;
        entry.turntable.rotation.y += delta * spinRate;
        if (lowPower && i !== frameToggle) continue;
        renderEntry(entry);
      }
    },
  };

  // Canvases report 0x0 while their panel is hidden; retry sizing once they
  // become visible.
  function syncSizeIfPending() {
    if (entries.some((entry) => !entry.width || !entry.height)) syncSize();
  }
}

function makeContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
  gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(64, 64, 60, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
