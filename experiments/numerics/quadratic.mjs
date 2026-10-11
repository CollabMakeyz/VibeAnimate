export const tolerance = Object.freeze({ distance: 1e-8, relative: 1e-12, parameter: 1e-10 });

function requirePoint(point) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new TypeError('Point coordinates must be finite');
  if (Math.abs(point.x) > 1e12 || Math.abs(point.y) > 1e12) throw new RangeError('Research probe coordinate magnitude is limited to 1e12');
}
function requireCurve(curve) {
  if (!Array.isArray(curve) || curve.length !== 3) throw new TypeError('A quadratic has exactly three points');
  curve.forEach(requirePoint);
}
function requireParameter(t) {
  if (!Number.isFinite(t) || t < 0 || t > 1) throw new RangeError('Curve parameter must be in [0,1]');
}
const mix = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function evaluate(curve, t) {
  requireCurve(curve);
  requireParameter(t);
  const s = 1 - t;
  return {
    x: s * s * curve[0].x + 2 * s * t * curve[1].x + t * t * curve[2].x,
    y: s * s * curve[0].y + 2 * s * t * curve[1].y + t * t * curve[2].y,
  };
}

export function subdivide(curve, t) {
  requireCurve(curve);
  requireParameter(t);
  const a = mix(curve[0], curve[1], t);
  const b = mix(curve[1], curve[2], t);
  const mid = mix(a, b, t);
  return [[{ ...curve[0] }, a, mid], [{ ...mid }, b, { ...curve[2] }]];
}

export function intersectLineQuadratic(start, end, curve, policy = tolerance) {
  requirePoint(start);
  requirePoint(end);
  requireCurve(curve);
  for (const key of ['distance', 'relative', 'parameter']) {
    if (!Number.isFinite(policy[key]) || policy[key] <= 0) throw new RangeError(`Invalid ${key} tolerance`);
  }
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length <= policy.distance) throw new RangeError('Line must have nonzero finite length');
  const nx = dx / length;
  const ny = dy / length;
  const distances = curve.map(p => (p.x - start.x) * ny - (p.y - start.y) * nx);
  const a = distances[0] - 2 * distances[1] + distances[2];
  const b = 2 * (distances[1] - distances[0]);
  const c = distances[0];
  const epsilon = policy.distance + policy.relative * Math.max(...distances.map(Math.abs));
  let roots;
  if (Math.abs(a) <= epsilon) {
    if (Math.abs(b) <= epsilon) {
      // Collinearity is not a proof of overlap with this finite segment.
      return Math.abs(c) <= epsilon ? { kind: 'collinear', points: [] } : { kind: 'points', points: [] };
    }
    roots = [-c / b];
  } else {
    const discriminant = b * b - 4 * a * c;
    // Discriminant rounding is not the spatial weld tolerance: using distance
    // here collapses distinct near-tangent crossings into a fabricated tangent.
    const error = Number.EPSILON * 16 * (b * b + Math.abs(4 * a * c));
    if (discriminant < -error) return { kind: 'points', points: [] };
    if (Math.abs(discriminant) <= error) roots = [-b / (2 * a)];
    else {
      const q = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(discriminant));
      roots = q === 0 ? [-b / (2 * a)] : [q / a, c / q];
    }
  }
  const points = [];
  for (const root of roots.sort((x, y) => x - y)) {
    if (!Number.isFinite(root) || root < -policy.parameter || root > 1 + policy.parameter) continue;
    const t = Math.max(0, Math.min(1, root));
    if (points.some(p => Math.abs(p.t - t) <= policy.parameter)) continue;
    const point = evaluate(curve, t);
    const u = ((point.x - start.x) * nx + (point.y - start.y) * ny) / length;
    if (u < -policy.parameter || u > 1 + policy.parameter) continue;
    points.push({ t, u: Math.max(0, Math.min(1, u)), point });
  }
  return { kind: 'points', points };
}
