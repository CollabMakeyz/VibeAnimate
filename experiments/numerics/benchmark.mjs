import { performance } from 'node:perf_hooks';
import { platform, arch } from 'node:os';
import { evaluate, subdivide } from './quadratic.mjs';
import { screenToWorld, zoomAt } from './camera.mjs';
import { seededRandom, summarize } from './measure.mjs';

const seed = 0x56494245;
const random = seededRandom(seed);
const count = 20000;
const curves = Array.from({ length: count }, () => Array.from({ length: 3 }, () => ({ x: random() * 4000 - 2000, y: random() * 4000 - 2000 })));
const parameters = Array.from({ length: count }, () => random());
const cursor = { x: 853, y: 319 };
const camera = { x: 123, y: -47, zoom: 1.5, rotation: 0.7, mirrorX: true, mirrorY: false };
let maxSplitError = 0;
let maxAnchorError = 0;
let checksum = 0;
const splitTimes = [];
const cameraTimes = [];
for (let repeat = 0; repeat < 12; repeat++) {
  const start = performance.now();
  for (let i = 0; i < count; i++) {
    const t = parameters[i];
    const [left, right] = subdivide(curves[i], t);
    const half = evaluate(left, 0.5);
    const expected = evaluate(curves[i], t * 0.5);
    maxSplitError = Math.max(maxSplitError, Math.hypot(half.x - expected.x, half.y - expected.y));
    checksum += half.x + right[1].y;
  }
  if (repeat >= 2) splitTimes.push(performance.now() - start);
  const anchorStart = performance.now();
  const before = screenToWorld(camera, cursor);
  for (let i = 0; i < count; i++) {
    const next = zoomAt(camera, cursor, 0.08 + parameters[i] * 19.92);
    const after = screenToWorld(next, cursor);
    maxAnchorError = Math.max(maxAnchorError, Math.hypot(before.x - after.x, before.y - after.y));
    checksum += next.x;
  }
  if (repeat >= 2) cameraTimes.push(performance.now() - anchorStart);
}
if (!Number.isFinite(checksum) || maxSplitError > 1e-8 || maxAnchorError > 1e-8) {
  throw new Error(`Numerical correctness failed: split=${maxSplitError}, anchor=${maxAnchorError}, checksum=${checksum}`);
}
console.log(JSON.stringify({
  kind: 'Phase Zero numerical research; NOT an editor/GPU benchmark',
  seed, casesPerBatch: count, warmupBatches: 2, measuredBatches: 10,
  environment: { node: process.version, platform: platform(), arch: arch() },
  batchMilliseconds: { subdivisionWithValidation: summarize(splitTimes), anchoredZoomWithValidation: summarize(cameraTimes) },
  correctness: { maxSplitError, maxAnchorError, checksum },
}, null, 2));
