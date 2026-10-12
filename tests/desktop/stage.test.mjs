import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlankDocument } from '../../apps/desktop/dist/modules/packages/document-model/src/create-document.js';
import { createCamera, screenToWorld, worldToScreen, MAX_ZOOM } from '../../apps/desktop/dist/modules/packages/renderer-core/src/camera.js';
import { buildStageBackdrop, packBackdropTriangles, clipSurfacePolygon } from '../../apps/desktop/dist/modules/packages/renderer-core/src/stage-backdrop.js';
import { CameraNavigation } from '../../apps/desktop/dist/modules/packages/input/src/navigation.js';
import { validateStructure } from '../../packages/file-format/src/structure.mjs';

const doc = createBlankDocument('document-test');
const options = { stage: doc.stage, camera: createCamera(), size: { width: 800, height: 600 }, pasteboard: [.1, .1, .1, 1], gridColor: [.5, .5, .5, .3], gridSize: 32, showGrid: false };
const near = (a, b) => a.forEach((n, i) => assert.ok(Math.abs(n - b[i]) < 1e-7, `${a} != ${b}`));
test('blank document is schema-valid, immutable and has a real empty first-frame exposure', () => {
  assert.deepEqual(validateStructure('DocumentDTO', doc), { ok: true });
  assert.equal(doc.scenes[0].timelineId, doc.timelines[0].id);
  assert.equal(doc.timelines[0].layerIds[0], doc.layers[0].id);
  assert.equal(doc.layers[0].exposures[0].contentId, null);
  assert.deepEqual(doc.elements, []); assert.deepEqual(doc.graphs, []);
  assert.throws(() => { doc.stage.width = 1; });
  assert.deepEqual(validateStructure('DocumentDTO', createBlankDocument('document-maximum', 'Large', 65536, 65536)), { ok: true });
  for (const args of [['bad'], ['document-ok', '', 1, 1], ['document-ok', 'Bad', 0, 1], ['document-ok', 'Bad', 1, Infinity]]) assert.throws(() => createBlankDocument(...args));
});
test('Stage backdrop clips zoomed/rotated geometry in CSS coordinates before float32 upload', () => {
  for (const zoom of [1, MAX_ZOOM]) for (const rotationRadians of [0, .2, Math.PI / 2]) for (const mirrorX of [false, true]) {
    const frame = buildStageBackdrop({ ...options, camera: createCamera({ translation: [400, 300], zoom, rotationRadians, mirrorX }) });
    for (const polygon of frame.polygons) for (const [x, y] of polygon.points) assert.ok(x >= -1e-7 && x <= 800 + 1e-7 && y >= -1e-7 && y <= 600 + 1e-7);
    const packed = packBackdropTriangles(frame);
    assert.equal(packed.length % 18, 0);
    assert.ok(packed.every(Number.isFinite));
    for (let i = 0; i < packed.length; i += 6) { assert.ok(packed[i] >= -1e-7 && packed[i] <= 800 + 1e-7); assert.ok(packed[i + 1] >= -1e-7 && packed[i + 1] <= 600 + 1e-7); }
  }
});
test('convex clipping handles inside, outside and viewport-covering Stage polygons', () => {
  const size = { width: 100, height: 80 };
  assert.deepEqual(clipSurfacePolygon([[10, 10], [20, 10], [20, 20]], size), [[10, 10], [20, 10], [20, 20]]);
  assert.deepEqual(clipSurfacePolygon([[-20, 10], [-10, 10], [-10, 20]], size), []);
  const clipped = clipSurfacePolygon([[-100, -100], [200, -100], [200, 200], [-100, 200]], size);
  assert.equal(clipped.length, 4);
  assert.deepEqual(new Set(clipped.map(p => p.join(','))), new Set(['0,0', '100,0', '100,80', '0,80']));
});
test('adaptive grid stays bounded, aligned to snap spacing, and disappears with offscreen Stage', () => {
  for (const zoom of [1 / 65536, .001, .1, 1, 256]) {
    const frame = buildStageBackdrop({ ...options, showGrid: true, gridSize: 1, camera: createCamera({ zoom }) });
    assert.ok(frame.displayedGridSize * zoom >= 12);
    assert.equal(Math.log2(frame.displayedGridSize) % 1, 0);
    assert.ok(frame.polygons.length < 300);
  }
  const offscreen = buildStageBackdrop({ ...options, showGrid: true, camera: createCamera({ translation: [10000, 10000] }) });
  assert.equal(offscreen.polygons.length, 0);
  assert.equal(buildStageBackdrop(options).displayedGridSize, null);
});
test('backdrop rejects invalid dimensions, grid spacing and colors', () => {
  for (const change of [{ size: { width: 0, height: 100 } }, { gridSize: 0 }, { gridSize: NaN }, { stage: { ...doc.stage, width: 65537 } }, { pasteboard: [0, 0, 0, .5] }, { gridColor: [0, 0, 0, Infinity] }]) assert.throws(() => buildStageBackdrop({ ...options, ...change }));
});
test('single-pointer pan follows CSS deltas independent of camera rotation/DPR', () => {
  const nav = new CameraNavigation(createCamera({ rotationRadians: 1, zoom: 3, dpr: 2, mirrorX: true }));
  nav.begin(10, [100, 100]);
  near(nav.move(10, [140, 80]).translation, [40, -20]);
  nav.end(10); assert.equal(nav.move(10, [500, 500]), null);
  assert.equal(nav.pointerCount, 0);
});
test('two-pointer pan/pinch/rotation preserve both touched world points', () => {
  const nav = new CameraNavigation(createCamera({ translation: [20, 30], rotationRadians: .4, mirrorY: true, zoom: 2 }));
  const first = screenToWorld(nav.camera, [100, 100]), second = screenToWorld(nav.camera, [200, 100]);
  nav.begin(1, [100, 100]); nav.begin(2, [200, 100]);
  nav.move(1, [70, 110]); nav.move(2, [230, 160]);
  near(worldToScreen(nav.camera, first), [70, 110]);
  near(worldToScreen(nav.camera, second), [230, 160]);
  nav.end(1); nav.move(2, [240, 170]);
  near(worldToScreen(nav.camera, second), [240, 170]);
});
test('gesture transitions reject a third pointer and recover after cancellation or coincident contacts', () => {
  const nav = new CameraNavigation(createCamera());
  assert.equal(nav.begin(1, [10, 10]), true); assert.equal(nav.begin(1, [12, 12]), false);
  assert.equal(nav.begin(2, [10, 10]), true); assert.equal(nav.begin(3, [50, 50]), false);
  const nearCoincident = nav.move(1, [11, 11]);
  assert.equal(nearCoincident.zoom, 1); assert.ok(nearCoincident.translation.every(Number.isFinite));
  nav.cancel(); assert.equal(nav.pointerCount, 0);
  nav.setCamera(createCamera({ zoom: 4 }));
  nav.begin(4, [0, 0]); near(nav.move(4, [10, 10]).translation, [10, 10]);
  assert.throws(() => nav.begin(5, [Infinity, 0]));
  assert.throws(() => nav.move(4, [NaN, 0]));
});
