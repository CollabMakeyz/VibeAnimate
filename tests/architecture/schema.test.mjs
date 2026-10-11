import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStructure } from '../../packages/file-format/src/structure.mjs';
import { minimalDocument, manifest, elementBase, sample, brush } from './fixtures.mjs';

test('explicit v1 document and manifest structures validate without mutation', () => {
  for (const [kind, value] of [['DocumentDTO', minimalDocument()], ['ManifestDTO', manifest()]]) {
    const saved = structuredClone(value); assert.deepEqual(validateStructure(kind, value), { ok: true }); assert.deepEqual(value, saved);
  }
});
test('future versions, missing required fields and unknown fields are rejected without coercion', () => {
  for (const mutate of [d => d.formatVersion = 2, d => delete d.graphs, d => d.fps.numerator = '24',
    d => d.selection = [], d => d.camera = {}, d => d.renderCache = {}, d => d.layers[0].kind = 'imagined']) {
    const doc = minimalDocument(); mutate(doc); const before = structuredClone(doc);
    assert.equal(validateStructure('DocumentDTO', doc).ok, false); assert.deepEqual(doc, before);
  }
});
test('numeric units, tuples and record bounds cannot admit nonfinite or out of range values', () => {
  for (const mutate of [d => d.stage.width = 0, d => d.stage.width = 65537, d => d.fps.denominator = 0,
    d => d.fills[0].color[3] = 1.1, d => d.graphs[0].vertices[0].position = [1],
    d => d.graphs[0].vertices[0].position[0] = Infinity, d => d.graphs[0].vertices[0].position[1] = NaN]) {
    const doc = minimalDocument(); mutate(doc); assert.equal(validateStructure('DocumentDTO', doc).ok, false);
  }
});
test('confirmed editable ink persists but speculative samples and pointer state are rejected', () => {
  const doc = minimalDocument();
  doc.elements = [{ ...elementBase, kind: 'ink', samples: [structuredClone(sample)], brush: structuredClone(brush), fillId: 'fill-main', paintMode: 'normal', fitGraphId: null }];
  assert.equal(validateStructure('DocumentDTO', doc).ok, true);
  doc.elements[0].samples[0].kind = 'predicted'; assert.equal(validateStructure('DocumentDTO', doc).ok, false);
  doc.elements[0].samples[0].kind = 'confirmed'; doc.elements[0].samples[0].pointerId = 9;
  assert.equal(validateStructure('DocumentDTO', doc).ok, false);
});
test('container entry paths reject traversal, aliases, backslashes and executable extensions', () => {
  for (const path of ['../document.json', '/document.json', 'C:/document.json', 'assets/../document.json', 'assets\\a', 'document.json\0', 'scripts/test.exe', 'DOCUMENT.JSON', 'metadata//x.json']) {
    const value = manifest(); value.entries[0].path = path; assert.equal(validateStructure('ManifestDTO', value).ok, false, path);
  }
});
test('manifest timestamps and integrity descriptors are exact', () => {
  for (const date of ['2026-02-30T00:00:00.000Z', '2026-10-11', '2026-10-11T00:00:00Z', 'invalid']) {
    const value = manifest(); value.createdAt = date; assert.equal(validateStructure('ManifestDTO', value).ok, false);
  }
  const value = manifest(); value.entries[0].sha256 = 'checksum'; assert.equal(validateStructure('ManifestDTO', value).ok, false);
});
test('runtime classes, cycles, accessors and sparse arrays are rejected before schema execution', () => {
  let invoked = false;
  const getter = {}; Object.defineProperty(getter, 'value', { enumerable: true, get() { invoked = true; return 1; } });
  const cycle = {}; cycle.self = cycle;
  class RuntimeArray extends Array {}
  for (const value of [new Date(), new RuntimeArray(), getter, cycle, [1, , 3], { fn() {} }, { big: 1n }]) assert.equal(validateStructure('DocumentDTO', value).ok, false);
  assert.equal(invoked, false);
});
test('validation work and nesting have explicit bounds', () => {
  assert.equal(validateStructure('DocumentDTO', minimalDocument(), { maxNodes: 10 }).ok, false);
  let value = {}; for (let i = 0; i < 70; i++) value = { child: value };
  assert.match(validateStructure('DocumentDTO', value).reason, /nesting/);
  assert.throws(() => validateStructure('DocumentDTO', {}, { maxDepth: -1 }), RangeError);
  assert.throws(() => validateStructure('ImaginaryDTO', {}), RangeError);
  assert.throws(() => validateStructure('constructor', {}), RangeError);
  assert.throws(() => validateStructure('toString', {}), RangeError);
});
test('structural validation does not falsely claim semantic reference validation', () => {
  const doc = minimalDocument(); doc.scenes[0].timelineId = 'timeline-missing';
  assert.equal(validateStructure('DocumentDTO', doc).ok, true);
  // A later semantic validator must reject this before constructing DocumentModel.
});

test('curve segment variants require their actual control points and exclude foreign fields', () => {
  for (const segment of [{ kind: 'line' }, { kind: 'quadratic', control: [50, -40] }, { kind: 'cubic', control1: [20, -40], control2: [80, 40] }]) {
    const doc = minimalDocument(); doc.graphs[0].edges[0].segment = structuredClone(segment);
    assert.equal(validateStructure('DocumentDTO', doc).ok, true);
    doc.graphs[0].edges[0].segment.foreign = 1;
    assert.equal(validateStructure('DocumentDTO', doc).ok, false);
  }
  const doc = minimalDocument(); doc.graphs[0].edges[0].segment = { kind: 'quadratic' };
  assert.equal(validateStructure('DocumentDTO', doc).ok, false);
});

test('four tween families preserve distinct authoring data and reject mixed discriminants', () => {
  const ease = { kind: 'linear' };
  const variants = [
    { kind: 'motion', targetElementId: 'element-main', tracks: [{ id: 'track-main', property: 'x', filterId: null, keys: [{ id: 'key-main', frame: 0, value: 10, ease, tangent: 'corner', incoming: null, outgoing: null, roving: false }] }], pathGraphId: null, orientToPath: false, rotationTurns: 0 },
    { kind: 'classic', startElementId: 'element-start', endElementId: 'element-end', ease, guideLayerId: null, orientToPath: false, rotationTurns: 0, synchronize: false },
    { kind: 'shape', startGraphId: 'graph-start', endGraphId: 'graph-end', ease, hints: [{ label: 'a', startEdgeId: 'edge-start', startParameter: 0.5, endEdgeId: 'edge-end', endParameter: 0.2 }], blend: 'angular' },
    { kind: 'pose', armatureId: 'armature-main', keys: [{ id: 'pose-main', frame: 0, bones: [{ boneId: 'bone-main', rotationDegrees: 15, translation: [0, 0] }], ease }] },
  ];
  for (const variant of variants) {
    const doc = minimalDocument(); doc.layers[0].tweens = [{ id: 'tween-main', start: 0, end: 24, ...structuredClone(variant) }];
    assert.equal(validateStructure('DocumentDTO', doc).ok, true, variant.kind);
    doc.layers[0].tweens[0].kind = variant.kind === 'motion' ? 'shape' : 'motion';
    assert.equal(validateStructure('DocumentDTO', doc).ok, false);
  }
});

test('all eight element families are explicit and cannot hide runtime payloads', () => {
  const variants = [
    { kind: 'drawing', graphId: 'graph-main' }, { kind: 'group', children: ['element-child'] },
    { kind: 'primitive', primitive: { kind: 'rectangle', width: 100, height: 80, radii: [0, 0, 0, 0] }, fillId: 'fill-main', strokeId: null },
    { kind: 'ink', samples: [sample], brush, fillId: 'fill-main', paintMode: 'normal', fitGraphId: null },
    { kind: 'text', runs: [{ text: 'Vibe', fontFamily: 'Test', fontStyle: 'Regular', fontAssetId: null, size: 18, color: [0, 0, 0, 1], tracking: 0, kerning: true, baseline: 'normal', underline: false, link: null }], layout: { mode: 'static', orientation: 'horizontal', width: 200, height: 30, autoSize: 'height', alignment: 'left', lineHeight: 22, leftMargin: 0, rightMargin: 0, indent: 0, wrap: true, multiline: true, selectable: false, scrollable: false, maxCharacters: 0 }, instanceName: '' },
    { kind: 'symbol', symbolId: 'symbol-main', playback: { mode: 'loop', firstFrame: 0, epochFrame: 0, buttonEnabled: false }, colorEffect: { multiplier: [1, 1, 1, 1], offset: [0, 0, 0, 0] }, instanceName: '' },
    { kind: 'bitmap', assetId: 'asset-main', smoothing: true },
    { kind: 'procedural', generator: { kind: 'spray', symbolId: null, seed: 123, path: [[0, 0], [20, 30]], radius: 10, density: 1, scaleRange: [0.5, 1.5], rotationRange: [-30, 30] }, generatedElementIds: [] },
  ];
  for (const variant of variants) {
    const doc = minimalDocument(); doc.elements = [{ ...structuredClone(elementBase), ...structuredClone(variant) }];
    assert.equal(validateStructure('DocumentDTO', doc).ok, true, variant.kind);
    doc.elements[0].runtime = { textureHandle: 42 };
    assert.equal(validateStructure('DocumentDTO', doc).ok, false);
  }
});
