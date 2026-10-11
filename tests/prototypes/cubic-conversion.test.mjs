import test from 'node:test';
import assert from 'node:assert/strict';
import { approximateCubic, evaluateCubic } from '../../experiments/numerics/cubic-conversion.mjs';

const quadraticAt = (p, t) => [0, 1].map(i => (1 - t) ** 2 * p[0][i] + 2 * (1 - t) * t * p[1][i] + t * t * p[2][i]);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const curved = [[0, 0], [2, 7], [8, -9], [11, 0]];

test('degree-elevated quadratic converts to one segment with exact endpoints', () => {
  const original = [[0, 0], [2, 4], [4, 4], [6, 0]];
  const result = approximateCubic(original, 1e-8);
  assert.equal(result.length, 1); assert.deepEqual(result[0].quadratic, [[0, 0], [3, 6], [6, 0]]);
  assert.deepEqual(original, [[0, 0], [2, 4], [4, 4], [6, 0]]);
});
test('adaptation preserves coverage of [0,1], joins, endpoints and measured tolerance', () => {
  for (const tolerance of [0.5, 0.05, 0.005, 0.0005]) {
    const result = approximateCubic(curved, tolerance);
    assert.deepEqual(result[0].quadratic[0], curved[0]); assert.deepEqual(result.at(-1).quadratic[2], curved[3]);
    assert.equal(result[0].t0, 0); assert.equal(result.at(-1).t1, 1);
    for (let index = 0; index < result.length; index++) {
      const segment = result[index]; assert.ok(segment.errorBound <= tolerance);
      if (index) { assert.equal(result[index - 1].t1, segment.t0); assert.deepEqual(result[index - 1].quadratic[2], segment.quadratic[0]); }
      for (let j = 0; j <= 64; j++) {
        const local = j / 64, global = segment.t0 + (segment.t1 - segment.t0) * local;
        assert.ok(distance(quadraticAt(segment.quadratic, local), evaluateCubic(curved, global)) <= segment.errorBound);
      }
    }
  }
});
test('seeded random curves satisfy bounds against independent Bernstein evaluation', () => {
  let seed = 0x56494245;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2 ** 32; };
  for (let k = 0; k < 200; k++) {
    const curve = Array.from({ length: 4 }, () => [random() * 200 - 100, random() * 200 - 100]);
    const tolerance = 0.001 + random() * 0.1;
    for (const segment of approximateCubic(curve, tolerance)) for (const t of [0, 0.1, (3 - Math.sqrt(3)) / 6, 0.5, (3 + Math.sqrt(3)) / 6, 0.9, 1]) {
      assert.ok(distance(quadraticAt(segment.quadratic, t), evaluateCubic(curve, segment.t0 + t * (segment.t1 - segment.t0))) <= segment.errorBound);
    }
  }
});
test('constant, translated and reversed curves are finite and deterministic', () => {
  const constant = Array.from({ length: 4 }, () => [42, -7]);
  assert.equal(approximateCubic(constant, 0.001).length, 1);
  const moved = curved.map(([x, y]) => [x + 1e7, y - 1e7]);
  const result = approximateCubic(moved, 0.001);
  assert.deepEqual(approximateCubic(moved, 0.001), result);
  assert.deepEqual(approximateCubic(curved.toReversed(), 0.01)[0].quadratic[0], curved[3]);
  for (const s of result) for (let j = 0; j <= 32; j++) {
    const t = j / 32;
    assert.ok(distance(quadraticAt(s.quadratic, t), evaluateCubic(moved, s.t0 + t * (s.t1 - s.t0))) <= s.errorBound);
  }
});
test('precision and work budgets fail explicitly rather than returning a false accepted fit', () => {
  assert.throws(() => approximateCubic(curved, 1e-20), /resolution/);
  assert.throws(() => approximateCubic(curved, 1e-5, { maxDepth: 0 }), /budget exhausted/);
  assert.throws(() => approximateCubic(curved, 1e-5, { maxSegments: 1 }), /budget exhausted/);
  for (const value of [0, -1, NaN, Infinity]) assert.throws(() => approximateCubic(curved, value), RangeError);
  assert.throws(() => approximateCubic([[0, 0], [0, 0], [0, 0], [Infinity, 0]], 1), RangeError);
});
