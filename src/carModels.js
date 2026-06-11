import * as THREE from 'three';

// Real-car GLB pipeline. Models load in the background after the game is
// already running; cars referencing a model drive a procedural fallback body
// until the asset is ready, then swap in place. A failed or offline load
// simply leaves the fallback - the game never depends on the network.
//
// Each model is normalized once into a template Group in the game's frame
// (+y up, nose toward -z, front/rear axles at z = -1.42 / +1.38, ground at
// y = 0) and cloned per use. Clones share geometries, materials, and
// textures, so GPU memory holds a single copy.

const modelManifest = {
  s15: {
    file: 'models/s15.glb',
    // The four named wheel pivots carry true wheel-center translations;
    // their world z positions give the wheelbase for exact axle alignment.
    // Anchored + underscore-tolerant: GLTFLoader sanitizes node names
    // (spaces become underscores), and unanchored patterns over-match the
    // caliper MESH names. The original name survives in userData.name.
    frontWheelPattern: /^calliper[_\s]front/i,
    rearWheelPattern: /^calliper[_\s]rear/i,
    // The entire wheel/caliper/disc assembly hangs under this node; the
    // game's animated wheels replace it.
    hiddenNodes: ['Wheels_F_00'],
  },
};

const registry = new Map();

export function getCarModelStatus(modelId) {
  return registry.get(modelId)?.status ?? 'loading';
}

export function cloneCarModel(modelId) {
  const entry = registry.get(modelId);
  if (!entry || entry.status !== 'ready') return null;
  return entry.template.clone();
}

export async function loadCarModels(onModelReady) {
  let GLTFLoader;
  try {
    ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
  } catch (error) {
    console.warn('Car model loader unavailable; keeping procedural bodies.', error);
    for (const id of Object.keys(modelManifest)) registry.set(id, { status: 'failed' });
    return;
  }

  const loader = new GLTFLoader();
  await Promise.all(Object.entries(modelManifest).map(async ([id, manifest]) => {
    try {
      const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}${manifest.file}`);
      const template = normalizeCarModel(gltf.scene, manifest);
      registry.set(id, { status: 'ready', template });
      onModelReady?.(id);
    } catch (error) {
      console.warn(`Car model "${id}" failed to load; keeping procedural body.`, error);
      registry.set(id, { status: 'failed' });
    }
  }));
}

// Normalize an arbitrary car scene into the game frame using a wrapper
// Group - source geometry is never mutated, so every clone stays shared.
function normalizeCarModel(sourceScene, manifest) {
  sourceScene.updateWorldMatrix(true, true);

  // 1. Find the wheel pivots and measure the model in its own world space.
  const frontWheels = [];
  const rearWheels = [];
  sourceScene.traverse((node) => {
    const sourceName = node.userData.name ?? node.name;
    if (manifest.frontWheelPattern.test(sourceName)) frontWheels.push(node);
    else if (manifest.rearWheelPattern.test(sourceName)) rearWheels.push(node);
  });

  const worldPosition = new THREE.Vector3();
  const averageZ = (nodes) => nodes.reduce(
    (sum, node) => sum + node.getWorldPosition(worldPosition).z,
    0,
  ) / nodes.length;

  const bounds = new THREE.Box3().setFromObject(sourceScene);
  const size = bounds.getSize(new THREE.Vector3());

  let scale;
  let axleMidpointZ;
  let noseTowardPositiveZ;
  if (frontWheels.length && rearWheels.length) {
    const frontZ = averageZ(frontWheels);
    const rearZ = averageZ(rearWheels);
    // Match the game's 2.8 m wheelbase exactly so the model's arches land on
    // the game's animated wheels at z = -1.42 / +1.38.
    scale = 2.8 / Math.abs(frontZ - rearZ);
    axleMidpointZ = (frontZ + rearZ) / 2;
    noseTowardPositiveZ = frontZ > rearZ;
  } else {
    // Fallback: scale by overall length, assume glTF +z-forward convention.
    scale = 4.8 / Math.max(size.z, 0.001);
    axleMidpointZ = bounds.getCenter(new THREE.Vector3()).z;
    noseTowardPositiveZ = true;
  }

  // 2. Hide the model's own wheels (the game supplies animated ones) and
  //    prepare materials/meshes for this renderer.
  const hidden = new Set(manifest.hiddenNodes ?? []);
  const seenMaterials = new Set();
  sourceScene.traverse((node) => {
    if (hidden.has(node.userData.name ?? node.name) || hidden.has(node.name)) node.visible = false;
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    // Shared-asset marker: disposeObjectTree skips these so destroying one
    // clone (car rebuild) cannot nuke the textures of the others.
    node.userData.sharedAsset = true;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material || seenMaterials.has(material)) continue;
      seenMaterials.add(material);
      // Transmission triggers an extra full scene render pass in three.js;
      // plain alpha transparency reads the same at game scale for free.
      if (material.transmission > 0) {
        material.transmission = 0;
        material.transparent = true;
        material.opacity = Math.min(material.opacity ?? 1, 0.55);
        material.depthWrite = false;
      }
    }
  });

  // 3. Bake orientation, scale, and grounding into a wrapper Group.
  const wrapper = new THREE.Group();
  wrapper.add(sourceScene);
  sourceScene.rotation.y = noseTowardPositiveZ ? Math.PI : 0;
  sourceScene.scale.setScalar(scale);
  sourceScene.updateWorldMatrix(true, true);

  const placed = new THREE.Box3().setFromObject(sourceScene);
  const center = placed.getCenter(new THREE.Vector3());
  // Wheel pivots flipped with the body; recompute the axle midpoint in the
  // wrapper frame so it lands on the game's (-1.42 + 1.38) / 2.
  const gameAxleMidpoint = (-1.42 + 1.38) / 2;
  const placedAxleMidpointZ = (noseTowardPositiveZ ? -1 : 1) * axleMidpointZ * scale;
  sourceScene.position.set(
    -center.x,
    -placed.min.y,
    gameAxleMidpoint - placedAxleMidpointZ,
  );

  wrapper.userData.realCarModel = true;
  return wrapper;
}
