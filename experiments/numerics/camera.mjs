function validate(camera, point) {
  for (const key of ['x', 'y', 'zoom', 'rotation']) {
    if (!Number.isFinite(camera[key])) throw new TypeError(`Camera ${key} must be finite`);
  }
  if (camera.zoom <= 0) throw new RangeError('Zoom must be positive');
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new TypeError('Point must be finite');
}

export function worldToScreen(camera, point) {
  validate(camera, point);
  const x = point.x * (camera.mirrorX ? -1 : 1) * camera.zoom;
  const y = point.y * (camera.mirrorY ? -1 : 1) * camera.zoom;
  const c = Math.cos(camera.rotation);
  const s = Math.sin(camera.rotation);
  return { x: camera.x + c * x - s * y, y: camera.y + s * x + c * y };
}

export function screenToWorld(camera, point) {
  validate(camera, point);
  const x = point.x - camera.x;
  const y = point.y - camera.y;
  const c = Math.cos(camera.rotation);
  const s = Math.sin(camera.rotation);
  return {
    x: (c * x + s * y) / camera.zoom * (camera.mirrorX ? -1 : 1),
    y: (-s * x + c * y) / camera.zoom * (camera.mirrorY ? -1 : 1),
  };
}

export function zoomAt(camera, cursor, zoom) {
  const world = screenToWorld(camera, cursor);
  const next = { ...camera, zoom };
  const mapped = worldToScreen(next, world);
  return { ...next, x: next.x + cursor.x - mapped.x, y: next.y + cursor.y - mapped.y };
}
