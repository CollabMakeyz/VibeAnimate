import test from 'node:test';
import assert from 'node:assert/strict';
import { signedArea, convex, mesh, inside, referenceCoverage, referenceUnionCoverage, coverageError } from '../../experiments/rendering/geometry.mjs';
const square = [[2, 2], [6, 2], [6, 6], [2, 6]];
test('convex normalization accepts reverse winding without modifying input', () => {
  const input = square.toReversed(), saved = structuredClone(input), normalized = convex(input);
  assert.equal(signedArea(normalized), 16); assert.deepEqual(input, saved);
});
test('convex experiment rejects concavity, degeneracy, nonfinite and star input', () => {
  for (const points of [[], [[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 0], [0, 0]],
    [[0, 0], [Infinity, 2], [0, 2]], [[0, 0], [4, 0], [1, 1], [4, 4], [0, 4]],
    [[0, -5], [3, 4], [-5, -1], [5, -1], [-3, 4]]]) assert.throws(() => convex(points), RangeError);
});
test('plain and fringe triangulation preserve specified interior and finite coverage', () => {
  const plain = mesh(square), fringe = mesh(square, true);
  assert.equal(plain.length / 9, 2); assert.equal(fringe.length / 9, 10);
  assert.deepEqual(Array.from(fringe.slice(0, 9)), [2.5, 2.5, 1, 5.5, 2.5, 1, 5.5, 5.5, 1]);
  for (let i = 0; i < fringe.length; i += 3) {
    assert.ok(Number.isFinite(fringe[i])); assert.ok([0, 1].includes(fringe[i + 2]));
    assert.ok(fringe[i] >= 1.5 && fringe[i] <= 6.5);
  }
});
test('fringe rejects crossed thin insets instead of generating a false fill', () => {
  assert.throws(() => mesh([[0, 0], [4, 0], [4, 0.3], [0, 0.3]], true), RangeError);
  assert.throws(() => mesh([[0, 0], [100, 0], [0.01, 0.01]], true), RangeError);
});
test('analytic coverage reference gets integral rectangle and half pixel edges', () => {
  const data = referenceCoverage(square, 8, 8, 4);
  assert.equal(data.reduce((a, b) => a + b), 16); assert.equal(data[2 * 8 + 2], 1); assert.equal(data[0], 0);
  const half = referenceCoverage([[0.5, 0], [2.5, 0], [2.5, 2], [0.5, 2]], 4, 2, 4);
  assert.deepEqual(Array.from(half), [0.5, 1, 0.5, 0, 0.5, 1, 0.5, 0]);
  assert.equal(inside([4, 4], square), true); assert.equal(inside([1, 4], square), false);
});
test('coverage metric detects bias and retains edge error without empty-area dilution', () => {
  const rgba = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 0]);
  assert.deepEqual(coverageError(rgba, [1, 0]), { meanAbsolute: 0, rootMeanSquared: 0, maximum: 0,
    edgeMeanAbsolute: 0, edgePixels: 0, areaBiasPixels: 0 });
  const result = coverageError(rgba, [0.5, 0]);
  assert.equal(result.meanAbsolute, 0.25); assert.equal(result.edgeMeanAbsolute, 0.5); assert.equal(result.areaBiasPixels, 0.5);
  assert.throws(() => coverageError(rgba, [1]), RangeError);
  assert.throws(() => referenceCoverage(square, 2048, 8), RangeError);
});
test('union oracle does not double count overlap or introduce a shared-edge seam', () => {
  const split = [[square[0], square[1], square[2]], [square[0], square[2], square[3]]];
  const expected = referenceCoverage(square, 8, 8, 4);
  assert.deepEqual(referenceUnionCoverage(split, 8, 8, 4), expected);
  assert.deepEqual(referenceUnionCoverage([square, square], 8, 8, 4), expected);
  assert.throws(() => referenceUnionCoverage([], 8, 8), RangeError);
});
test('decomposed ring reference preserves a real hole', () => {
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const ring = [rect(1, 1, 7, 2), rect(1, 6, 7, 7), rect(1, 2, 2, 6), rect(6, 2, 7, 6)];
  const coverage = referenceUnionCoverage(ring, 8, 8, 4);
  assert.equal(coverage.reduce((a, b) => a + b), 20);
  assert.equal(coverage[3 * 8 + 3], 0); assert.equal(coverage[1 * 8 + 3], 1);
});
