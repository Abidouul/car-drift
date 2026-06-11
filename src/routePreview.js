import * as THREE from 'three';

// Builds a top-down SVG preview of a level's road spline. Sampled from the
// same Catmull-Rom curve (tension 0.42) that buildRoadData drives in game,
// so the preview matches the track the player will actually drive.
export function buildRouteSVG(levelConfig) {
  const road = levelConfig.road;
  const width = 150;
  const height = 96;
  const padding = 12;

  const controlPoints = road.points.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(controlPoints, road.closed, 'catmullrom', 0.42);
  const samples = curve.getPoints(160);

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const point of samples) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
  }

  const scale = Math.min(
    (width - padding * 2) / Math.max(maxX - minX, 1),
    (height - padding * 2) / Math.max(maxZ - minZ, 1),
  );
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const mapX = (x) => ((x - centerX) * scale + width / 2).toFixed(1);
  const mapZ = (z) => ((z - centerZ) * scale + height / 2).toFixed(1);

  const pathData = samples
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${mapX(point.x)} ${mapZ(point.z)}`)
    .join(' ') + (road.closed ? ' Z' : '');

  const laneColor = `#${road.laneColor.toString(16).padStart(6, '0')}`;
  const edgeColor = `#${road.edgeColor.toString(16).padStart(6, '0')}`;
  const roadStroke = Math.max(3.4, road.width * scale);

  const zoneMarks = (road.scoringZones ?? [])
    .map((zone) => {
      const [x, z] = road.points[zone.pointIndex] ?? road.points[0];
      return `<circle cx="${mapX(x)}" cy="${mapZ(z)}" r="${Math.max(3, zone.radius * scale * 0.55).toFixed(1)}" fill="none" stroke="${edgeColor}" stroke-opacity="0.55" stroke-width="1.4" stroke-dasharray="2.6 2" />`;
    })
    .join('');

  const spawnPoint = road.spawn ?? road.points[road.spawnIndex ?? 0];
  const spawnMark = `<circle cx="${mapX(spawnPoint[0])}" cy="${mapZ(spawnPoint[1])}" r="3.1" fill="${edgeColor}" stroke="rgba(8,9,11,0.9)" stroke-width="1.4" />`;

  return [
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">`,
    `<path d="${pathData}" fill="none" stroke="rgba(8,9,11,0.85)" stroke-width="${(roadStroke + 2.4).toFixed(1)}" stroke-linejoin="round" stroke-linecap="round" />`,
    `<path d="${pathData}" fill="none" stroke="rgba(244,246,240,0.16)" stroke-width="${roadStroke.toFixed(1)}" stroke-linejoin="round" stroke-linecap="round" />`,
    `<path d="${pathData}" fill="none" stroke="${laneColor}" stroke-opacity="0.85" stroke-width="1.6" stroke-dasharray="5 4" stroke-linejoin="round" />`,
    zoneMarks,
    spawnMark,
    '</svg>',
  ].join('');
}
