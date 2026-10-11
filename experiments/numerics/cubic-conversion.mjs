// Original disposable investigation of bounded cubic -> quadratic conversion.
// No external implementation used. Canonical production geometry is not here.
const point = p => Array.isArray(p) && p.length === 2 && p.every(v => Number.isFinite(v) && Math.abs(v) <= 1e9);
const midpoint = (a, b) => [a[0] / 2 + b[0] / 2, a[1] / 2 + b[1] / 2];

export function evaluateCubic(control, t) {
  if (!Array.isArray(control) || control.length !== 4 || !control.every(point) || !Number.isFinite(t) || t < 0 || t > 1) {
    throw new RangeError('Expected four finite bounded points and parameter in [0,1]');
  }
  const u = 1 - t;
  return [0, 1].map(axis => u ** 3 * control[0][axis] + 3 * u * u * t * control[1][axis] +
    3 * u * t * t * control[2][axis] + t ** 3 * control[3][axis]);
}

export function approximateCubic(control, tolerance, { maxDepth = 20, maxSegments = 65536 } = {}) {
  evaluateCubic(control, 0);
  if (!Number.isFinite(tolerance) || tolerance <= 0 || !Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 24 ||
      !Number.isInteger(maxSegments) || maxSegments < 1 || maxSegments > 65536) throw new RangeError('Invalid conversion budget');
  const magnitude = Math.max(1, ...control.flat().map(Math.abs));
  // Conservative floating-point allowance, not a formal interval-arithmetic proof.
  const roundoff = 64 * Number.EPSILON * magnitude * (maxDepth + 1);
  if (tolerance <= roundoff) throw new RangeError('Tolerance below supported floating-point resolution');
  const stack = [{ control: control.map(p => [...p]), t0: 0, t1: 1, depth: 0 }], result = [];
  while (stack.length) {
    const current = stack.pop(), [a, b, c, d] = current.control;
    // Average the two quadratic controls implied by degree-elevating each side.
    // Translation-relative arithmetic avoids the largest cancellation terms.
    const q = [0, 1].map(i => a[i] + (3 * (b[i] - a[i]) + 3 * (c[i] - a[i]) - (d[i] - a[i])) / 4);
    const residual1 = [0, 1].map(i => b[i] - (a[i] / 3 + q[i] * (2 / 3)));
    const residual2 = [0, 1].map(i => c[i] - (q[i] * (2 / 3) + d[i] / 3));
    // In exact arithmetic residual2 = -residual1. The cubic difference is
    // 3t(1-t)(1-2t)*residual1, whose absolute scalar maximum is sqrt(3)/6.
    // Include non-antipodal numerical residue and accumulated roundoff explicitly.
    const bound = Math.hypot(...residual1) * Math.sqrt(3) / 6 +
      Math.hypot(residual1[0] + residual2[0], residual1[1] + residual2[1]) + roundoff;
    if (bound <= tolerance) {
      result.push({ quadratic: [[...a], q, [...d]], t0: current.t0, t1: current.t1, errorBound: bound });
      continue;
    }
    if (current.depth >= maxDepth || result.length + stack.length + 2 > maxSegments) {
      throw new RangeError('Conversion budget exhausted before tolerance was met');
    }
    const ab = midpoint(a, b), bc = midpoint(b, c), cd = midpoint(c, d);
    const abc = midpoint(ab, bc), bcd = midpoint(bc, cd), center = midpoint(abc, bcd);
    const tm = (current.t0 + current.t1) / 2, depth = current.depth + 1;
    stack.push({ control: [center, bcd, cd, d], t0: tm, t1: current.t1, depth });
    stack.push({ control: [a, ab, abc, center], t0: current.t0, t1: tm, depth });
  }
  return result;
}
