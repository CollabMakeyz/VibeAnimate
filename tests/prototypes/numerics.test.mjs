import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, subdivide, intersectLineQuadratic } from '../../experiments/numerics/quadratic.mjs';
import { worldToScreen, screenToWorld, zoomAt } from '../../experiments/numerics/camera.mjs';
import { seededRandom, summarize } from '../../experiments/numerics/measure.mjs';

const close = (a, b, epsilon = 1e-8) => assert.ok(Math.abs(a - b) <= epsilon, `${a} differs from ${b}`);
const pointClose = (a, b, epsilon = 1e-8) => { close(a.x, b.x, epsilon); close(a.y, b.y, epsilon); };
const parabola = [{ x: -1, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 1 }];
const horizontal = (y, start = -2, end = 2) => intersectLineQuadratic({ x: start, y }, { x: end, y }, parabola);

test('quadratic has exact known endpoints and middle', () => {
  assert.deepEqual(evaluate(parabola, 0), parabola[0]);
  assert.deepEqual(evaluate(parabola, 1), parabola[2]);
  pointClose(evaluate(parabola, 0.5), { x: 0, y: 0 });
});

test('seeded subdivision preserves the original curve on both parameter ranges', () => {
  const random = seededRandom(1835);
  for (let n = 0; n < 1000; n++) {
    const curve = Array.from({ length: 3 }, () => ({ x: random() * 20000 - 10000, y: random() * 20000 - 10000 }));
    const snapshot = structuredClone(curve);
    const split = random();
    const [left, right] = subdivide(curve, split);
    assert.deepEqual(curve, snapshot);
    for (const t of [0, 0.125, 0.5, 0.875, 1]) {
      pointClose(evaluate(left, t), evaluate(curve, split * t));
      pointClose(evaluate(right, t), evaluate(curve, split + (1 - split) * t));
    }
    pointClose(left[2], right[0]);
  }
});

test('splitting at boundaries preserves a full branch and one point branch', () => {
  const [point, full] = subdivide(parabola, 0);
  assert.deepEqual(full, parabola);
  point.forEach(p => assert.deepEqual(p, parabola[0]));
  assert.deepEqual(subdivide(parabola, 1)[0], parabola);
});

test('subdivision results do not alias source or opposite branch endpoint', () => {
  const source = structuredClone(parabola);
  const [left, right] = subdivide(source, 0.5);
  left[2].x = 18;
  left[0].x = 42;
  assert.deepEqual(source, parabola);
  close(right[0].x, 0);
});

test('intersection yields both analytic roots and finite segment positions', () => {
  const result = horizontal(0.25);
  assert.equal(result.kind, 'points');
  assert.equal(result.points.length, 2);
  close(result.points[0].t, 0.25);
  close(result.points[1].t, 0.75);
  pointClose(result.points[0].point, { x: -0.5, y: 0.25 });
  pointClose(result.points[1].point, { x: 0.5, y: 0.25 });
});

test('tangent occurs once and a separated line has no crossing', () => {
  assert.equal(horizontal(0).points.length, 1);
  close(horizontal(0).points[0].t, 0.5);
  assert.equal(horizontal(-0.1).points.length, 0);
});

test('near-tangent crossings are not collapsed using spatial tolerance', () => {
  const result = horizontal(1e-10);
  assert.equal(result.points.length, 2);
  close(result.points[0].point.x, -1e-5, 1e-9);
  close(result.points[1].point.x, 1e-5, 1e-9);
});

test('finite line clipping rejects roots outside segment', () => {
  assert.equal(horizontal(0.25, -0.25, 0.25).points.length, 0);
  assert.equal(horizontal(0.25, 0, 1).points.length, 1);
  assert.equal(horizontal(1, -1, 1).points.length, 2);
});

test('intersection is invariant under line reversal with opposite u', () => {
  const a = horizontal(0.25);
  const b = horizontal(0.25, 2, -2);
  a.points.forEach((p, i) => {
    close(p.t, b.points[i].t);
    close(p.u, 1 - b.points[i].u);
  });
});

test('linear quadratic and collinear cases remain explicit', () => {
  const line = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }];
  const result = intersectLineQuadratic({ x: 0, y: 1 }, { x: 2, y: 1 }, line);
  assert.equal(result.points.length, 1);
  close(result.points[0].t, 0.5);
  assert.equal(intersectLineQuadratic(line[0], line[2], line).kind, 'collinear');
  // Collinearity does not manufacture overlap when the finite segments are apart.
  assert.equal(intersectLineQuadratic({ x: 5, y: 5 }, { x: 6, y: 6 }, line).kind, 'collinear');
});

test('intersections survive translated/scaled examples within the probe domain', () => {
  for (const scale of [0.001, 1, 1000]) {
    const map = p => ({ x: p.x * scale + 1e6, y: p.y * scale - 1e6 });
    const result = intersectLineQuadratic(map({ x: -2, y: 0.25 }), map({ x: 2, y: 0.25 }), parabola.map(map));
    assert.equal(result.points.length, 2);
    close(result.points[0].t, 0.25, 1e-6);
    close(result.points[1].t, 0.75, 1e-6);
  }
});

test('invalid geometry and parameters fail explicitly', () => {
  for (const t of [NaN, Infinity, -0.01, 1.01]) assert.throws(() => evaluate(parabola, t));
  assert.throws(() => evaluate([{ x: 0, y: NaN }, ...parabola.slice(1)], 0.5));
  assert.throws(() => evaluate([{ x: 1e308, y: 0 }, ...parabola.slice(1)], 0.5));
  assert.throws(() => subdivide([], 0.5));
  assert.throws(() => intersectLineQuadratic({ x: 0, y: 0 }, { x: 0, y: 0 }, parabola));
  assert.throws(() => intersectLineQuadratic({ x: 0, y: 0 }, { x: 1, y: 0 }, parabola, { distance: -1 }));
});

test('camera mapping agrees with a known 90 degree rotation and mirror', () => {
  const camera = { x: 10, y: 20, zoom: 2, rotation: Math.PI / 2, mirrorX: true, mirrorY: false };
  pointClose(worldToScreen(camera, { x: 3, y: 4 }), { x: 2, y: 14 });
  pointClose(screenToWorld(camera, { x: 2, y: 14 }), { x: 3, y: 4 });
});

test('anchored zoom preserves cursor world position for seeded transforms and mirrors', () => {
  const random = seededRandom(5678);
  for (let i = 0; i < 1000; i++) {
    const camera = { x: random() * 4000, y: random() * 4000, zoom: 0.08 + random() * 20,
      rotation: random() * Math.PI * 2, mirrorX: i % 2 === 0, mirrorY: i % 3 === 0 };
    const before = structuredClone(camera);
    const cursor = { x: random() * 2000, y: random() * 1000 };
    const world = screenToWorld(camera, cursor);
    const next = zoomAt(camera, cursor, 0.08 + random() * 20);
    pointClose(screenToWorld(next, cursor), world);
    pointClose(worldToScreen(next, world), cursor);
    assert.deepEqual(camera, before);
  }
});

test('camera rejects singular zoom and nonfinite values', () => {
  const camera = { x: 0, y: 0, zoom: 1, rotation: 0 };
  for (const zoom of [0, -1, NaN, Infinity]) assert.throws(() => zoomAt(camera, { x: 0, y: 0 }, zoom));
  assert.throws(() => screenToWorld({ ...camera, rotation: NaN }, { x: 0, y: 0 }));
});

test('benchmark percentiles use nearest rank without modifying measurements', () => {
  const samples = [10, 1, 5, 3, 2];
  assert.deepEqual(summarize(samples), { count: 5, min: 1, p50: 3, p95: 10, p99: 10, max: 10, method: 'nearest-rank' });
  assert.deepEqual(samples, [10, 1, 5, 3, 2]);
  assert.equal(summarize(Array.from({ length: 100 }, (_, i) => i + 1)).p95, 95);
});

test('benchmark measurement inputs cannot silently create misleading reports', () => {
  for (const input of [[], [NaN], [Infinity], [-1]]) assert.throws(() => summarize(input));
  for (const seed of [0, -1, NaN, 0.5, 4294967296]) assert.throws(() => seededRandom(seed));
  const a = seededRandom(173);
  const b = seededRandom(173);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});
