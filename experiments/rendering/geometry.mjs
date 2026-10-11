// Disposable convex-only AA research. Never use this as the document tessellator.
export function signedArea(points) {
  return points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0) / 2;
}

export function convex(points) {
  if (!Array.isArray(points) || points.length < 3 || points.length > 256 ||
      points.some(p => !Array.isArray(p) || p.length !== 2 ||
        p.some(v => !Number.isFinite(v) || Math.abs(v) > 1e6))) {
    throw new RangeError('Expected 3..256 finite bounded convex vertices');
  }
  const result = points.map(p => [...p]);
  if (signedArea(result) < 0) result.reverse();
  for (let i = 0; i < result.length; i++) {
    const a = result[i], b = result[(i + 1) % result.length], c = result[(i + 2) % result.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (cross <= 1e-9) throw new RangeError('Strict convexity required; no duplicate/collinear vertices');
    // Every vertex must be inside every directed edge, also rejecting star polygons.
    for (const p of result) {
      if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) < -1e-9) {
        throw new RangeError('Strict convexity required');
      }
    }
  }
  return result;
}

function offset(points, distance) {
  return points.map((p, i) => {
    const before = points[(i + points.length - 1) % points.length];
    const after = points[(i + 1) % points.length];
    const first = [p[1] - before[1], before[0] - p[0]];
    const second = [after[1] - p[1], p[0] - after[0]];
    const a = Math.hypot(...first), b = Math.hypot(...second);
    const n = first.map(v => v / a), m = second.map(v => v / b);
    const denominator = 1 + n[0] * m[0] + n[1] * m[1];
    if (denominator < 0.01) throw new RangeError('Acute fringe exceeds research miter limit');
    return [p[0] + distance * (n[0] + m[0]) / denominator,
      p[1] + distance * (n[1] + m[1]) / denominator];
  });
}

export function mesh(points, fringe = false) {
  const boundary = convex(points);
  const inner = fringe ? offset(boundary, -0.5) : boundary;
  // Insetting a thin polygon may remain convex after crossing. Require each new
  // corner to remain on the inward side of every original edge by half a pixel.
  if (fringe) for (const p of inner) for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i], b = boundary[(i + 1) % boundary.length];
    const distance = ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) /
      Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (distance < 0.5 - 1e-7) throw new RangeError('Shape too thin for this fringe experiment');
  }
  convex(inner);
  const values = [];
  const vertex = (p, coverage) => values.push(p[0], p[1], coverage);
  for (let i = 1; i < inner.length - 1; i++) {
    vertex(inner[0], 1); vertex(inner[i], 1); vertex(inner[i + 1], 1);
  }
  if (fringe) {
    const outer = offset(boundary, 0.5);
    for (let i = 0; i < inner.length; i++) {
      const j = (i + 1) % inner.length;
      vertex(inner[i], 1); vertex(outer[i], 0); vertex(outer[j], 0);
      vertex(inner[i], 1); vertex(outer[j], 0); vertex(inner[j], 1);
    }
  }
  return new Float32Array(values);
}

export function inside(point, polygon) {
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    if ((b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]) < 0) return false;
  }
  return true;
}

export function referenceCoverage(points, width, height, samples = 16) {
  return referenceUnionCoverage([points], width, height, samples);
}

export function referenceUnionCoverage(shapes, width, height, samples = 16) {
  if (![width, height, samples].every(v => Number.isInteger(v) && v > 0) ||
      width > 1024 || height > 1024 || samples > 32) throw new RangeError('Reference budget exceeded');
  if (!Array.isArray(shapes) || shapes.length < 1 || shapes.length > 16) throw new RangeError('Expected 1..16 convex shapes');
  const polygons = shapes.map(convex), result = new Float32Array(width * height), points = polygons.flat();
  const xmin = Math.max(0, Math.floor(Math.min(...points.map(p => p[0]))));
  const xmax = Math.min(width, Math.ceil(Math.max(...points.map(p => p[0]))));
  const ymin = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
  const ymax = Math.min(height, Math.ceil(Math.max(...points.map(p => p[1]))));
  for (let y = ymin; y < ymax; y++) for (let x = xmin; x < xmax; x++) {
    let count = 0;
    for (let sy = 0; sy < samples; sy++) for (let sx = 0; sx < samples; sx++) {
      if (polygons.some(polygon => inside([x + (sx + 0.5) / samples, y + (sy + 0.5) / samples], polygon))) count++;
    }
    result[y * width + x] = count / (samples * samples);
  }
  return result;
}

export function coverageError(rgba, expected) {
  if (rgba.length !== expected.length * 4) throw new RangeError('Image sizes differ');
  let absolute = 0, squared = 0, maximum = 0, edgeCount = 0, edgeAbsolute = 0, areaBias = 0;
  for (let i = 0; i < expected.length; i++) {
    const actual = rgba[i * 4 + 3] / 255, error = actual - expected[i];
    absolute += Math.abs(error); squared += error * error; maximum = Math.max(maximum, Math.abs(error));
    areaBias += error;
    if ((expected[i] > 0 && expected[i] < 1) || (actual > 0 && actual < 1) || Math.abs(error) > 0) {
      edgeCount++; edgeAbsolute += Math.abs(error);
    }
  }
  return { meanAbsolute: absolute / expected.length, rootMeanSquared: Math.sqrt(squared / expected.length),
    maximum, edgeMeanAbsolute: edgeCount ? edgeAbsolute / edgeCount : 0, edgePixels: edgeCount, areaBiasPixels: areaBias };
}
