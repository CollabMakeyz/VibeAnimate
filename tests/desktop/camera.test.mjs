import test from 'node:test';
import assert from 'node:assert/strict';
import { createCamera, cameraMatrix, worldToScreen, screenToWorld, panCamera, orientCameraAt, zoomCameraAt, centerCamera, fitCamera, resizeCamera, MIN_ZOOM, MAX_ZOOM } from '../../apps/desktop/dist/modules/packages/renderer-core/src/camera.js';

function near(actual, expected, tolerance = 1e-8) {
  actual.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) <= tolerance, `${actual} != ${expected} (tolerance ${tolerance})`));
}
const stage = { minX: 0, minY: 0, maxX: 1920, maxY: 1080 };

test('camera mirrors world axes before rotation, then applies screen translation', () => {
  const camera = createCamera({ translation: [100, 200], zoom: 2, rotationRadians: Math.PI / 2, mirrorX: true });
  near(worldToScreen(camera, [10, 20]), [60, 180]);
  near(screenToWorld(camera, [60, 180]), [10, 20]);
  near(cameraMatrix(camera), [0, -2, -2, 0, 100, 200]);
});
test('camera owns immutable state and normalizes rotations', () => {
  const translation = [12, 34];
  const camera = createCamera({ translation, rotationRadians: -Math.PI / 2 });
  translation[0] = 500;
  assert.equal(camera.translation[0], 12);
  assert.equal(camera.rotationRadians, 1.5 * Math.PI);
  assert.ok(Object.isFrozen(camera)); assert.ok(Object.isFrozen(camera.translation));
  assert.throws(() => { camera.translation[0] = 0; }, TypeError);
  let copy = createCamera({ rotationRadians: .4 });
  for (let i = 0; i < 1000; i++) copy = createCamera(copy);
  assert.equal(copy.rotationRadians, .4);
});
test('all mirror combinations, rotations and zoom scales round trip without DPR contamination', () => {
  for (const mirrorX of [false, true]) for (const mirrorY of [false, true]) {
    for (const rotationRadians of [0, .4, Math.PI / 2, Math.PI, -Math.PI / 3]) {
      for (const zoom of [MIN_ZOOM, .01, 1, 5.5, MAX_ZOOM]) {
        for (const dpr of [1, 1.25, 2, 3]) {
          const camera = createCamera({ translation: [571, -135], mirrorX, mirrorY, rotationRadians, zoom, dpr });
          const world = [-300.25, 65536];
          near(screenToWorld(camera, worldToScreen(camera, world)), world, 1e-7);
          const logical = cameraMatrix(camera), device = cameraMatrix(camera, true);
          near(device, logical.map(value => value * dpr));
          near(worldToScreen(camera, world), worldToScreen(createCamera({ ...camera, dpr: 1 }), world));
        }
      }
    }
  }
});
test('cursor anchor remains fixed through deterministic mixed pan/zoom/rotation/mirror gestures', () => {
  let seed = 0x5eed;
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; }
  let camera = createCamera();
  for (let i = 0; i < 1200; i++) {
    const anchor = [random() * 1400, random() * 900];
    const world = screenToWorld(camera, anchor);
    const changed = orientCameraAt(camera, anchor, { zoom: .125 + random() * 8, rotationRadians: random() * 12 - 6, mirrorX: random() > .5, mirrorY: random() > .5 });
    near(screenToWorld(changed, anchor), world, 1e-6);
    near(worldToScreen(changed, world), anchor, 1e-6);
    camera = panCamera(changed, [random() * 20 - 10, random() * 20 - 10]);
  }
});
test('zoom clamps to supported endpoints while retaining anchor', () => {
  const camera = createCamera({ translation: [400, 250], mirrorY: true, rotationRadians: .7 });
  for (const [requested, expected] of [[1e-12, MIN_ZOOM], [1e20, MAX_ZOOM]]) {
    const next = zoomCameraAt(camera, [430, 215], requested);
    assert.equal(next.zoom, expected);
    near(screenToWorld(next, [430, 215]), screenToWorld(camera, [430, 215]), 1e-7);
  }
});
test('fit keeps every rotated/mirrored Stage corner inside padded viewport', () => {
  const size = { width: 900, height: 600 };
  for (const mirrorX of [false, true]) for (const mirrorY of [false, true]) for (let angle = 0; angle < 6.3; angle += .1) {
    const next = fitCamera(createCamera({ rotationRadians: angle, mirrorX, mirrorY }), stage, size, 32);
    near(worldToScreen(next, [960, 540]), [450, 300]);
    for (const corner of [[0, 0], [1920, 0], [0, 1080], [1920, 1080]]) {
      const [x, y] = worldToScreen(next, corner);
      assert.ok(x >= 32 - 1e-8 && x <= 868 + 1e-8 && y >= 32 - 1e-8 && y <= 568 + 1e-8);
    }
  }
  const maximum = fitCamera(createCamera(), { minX: 0, minY: 0, maxX: 65536, maxY: 65536 }, { width: 64, height: 64 }, 8);
  near(worldToScreen(maximum, [0, 0]), [8, 8]);
  near(worldToScreen(maximum, [65536, 65536]), [56, 56]);
});
test('pan, center and resize preserve orientation and world-space focus', () => {
  const camera = createCamera({ zoom: 2, rotationRadians: .6, mirrorX: true, translation: [200, 100] });
  const size = { width: 800, height: 500 }, nextSize = { width: 421, height: 318 };
  const centered = centerCamera(camera, stage, size);
  near(worldToScreen(centered, [960, 540]), [400, 250]);
  assert.equal(centered.zoom, camera.zoom);
  near(worldToScreen(panCamera(camera, [35, -12]), [10, 20]), worldToScreen(camera, [10, 20]).map((v, i) => v + [35, -12][i]));
  const resized = resizeCamera(camera, size, nextSize);
  near(screenToWorld(resized, [421 / 2, 318 / 2]), screenToWorld(camera, [400, 250]));
});
test('invalid transforms, viewport and arithmetic overflow fail explicitly', () => {
  for (const options of [{ zoom: 0 }, { zoom: -1 }, { zoom: Infinity }, { zoom: MIN_ZOOM / 2 }, { dpr: 0 }, { rotationRadians: NaN }, { translation: [0, Infinity] }, { mirrorX: 1 }]) assert.throws(() => createCamera(options));
  const camera = createCamera();
  for (const zoom of [0, -1, NaN, Infinity]) assert.throws(() => zoomCameraAt(camera, [0, 0], zoom));
  assert.throws(() => worldToScreen(camera, [Infinity, 0]));
  assert.throws(() => worldToScreen(createCamera({ zoom: MAX_ZOOM }), [Number.MAX_VALUE, 0]));
  assert.throws(() => cameraMatrix(createCamera({ dpr: Number.MAX_VALUE, zoom: MAX_ZOOM }), true));
  assert.throws(() => fitCamera(camera, stage, { width: 40, height: 20 }));
  assert.throws(() => centerCamera(camera, stage, { width: 0, height: 500 }));
  assert.throws(() => fitCamera(camera, { ...stage, maxX: 0 }, { width: 900, height: 600 }));
  assert.throws(() => resizeCamera(camera, { width: 900, height: 600 }, { width: NaN, height: 600 }));
});
