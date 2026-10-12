import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCapabilities } from '../../apps/desktop/dist/modules/apps/desktop/src/platform/capabilities.js';

function host({ gl = null, canvas = null, throws = false, pointer = undefined, ratio = 1 } = {}) {
  return { document: { createElement: () => ({ getContext(type) { if (throws) throw Error('Disabled by policy'); return type === 'webgl2' ? gl : canvas; } }) }, PointerEvent: pointer, devicePixelRatio: ratio };
}
test('GPU detection creates and releases a context without claiming tablet support', () => {
  let released = 0;
  const report = detectCapabilities(host({ gl: { getExtension: () => ({ loseContext: () => released++ }) }, ratio: 2 }));
  assert.equal(report.graphics, 'webgl2'); assert.equal(released, 1);
  assert.equal(report.devicePixelRatio, 2); assert.equal(report.hardwarePen, 'unverified');
  assert.ok(Object.isFrozen(report));
});
test('falls back to Canvas2D and reports unavailable when both contexts fail', () => {
  assert.equal(detectCapabilities(host({ canvas: {} })).graphics, 'canvas2d');
  assert.equal(detectCapabilities(host({ throws: true })).graphics, 'unavailable');
});
test('pointer API availability is distinct from absent optional methods', () => {
  class Pointer { getCoalescedEvents() { return []; } }
  const report = detectCapabilities(host({ pointer: Pointer }));
  assert.equal(report.pointerEvents, true); assert.equal(report.coalescedEvents, true);
  assert.equal(report.predictedEvents, false); assert.equal(report.pointerRawUpdate, false);
  assert.equal(report.workerApi, false); assert.equal(report.offscreenCanvasApi, false);
});
test('invalid display scales fall back to one', () => {
  for (const ratio of [NaN, Infinity, 0, -1]) assert.equal(detectCapabilities(host({ ratio })).devicePixelRatio, 1);
});
