import test from 'node:test';
import assert from 'node:assert/strict';
import { PANEL_IDS, PRESETS, presetLayout, validateDockLayout, parseDockLayout, serializeDockLayout, selectPanel, closePanel, collapseGroup, placeGroup, movePanel, reorderGroup, recoverFloatingPanels } from '../../apps/desktop/dist/modules/packages/workspace/src/dock-layout.js';
import { WorkspaceStore } from '../../apps/desktop/dist/modules/packages/workspace/src/workspace-store.js';

const floating = { kind: 'float', bounds: { x: 800, y: 500, width: 340, height: 300 } };
function home(layout, panel) { return layout.groups.find(group => group.panels.includes(panel)); }
function invariant(layout) {
  assert.deepEqual(layout.groups.flatMap(group => group.panels).sort(), [...PANEL_IDS].sort());
  for (const group of layout.groups) {
    const visible = group.panels.filter(id => !layout.closed.includes(id));
    assert.equal(group.active === null, visible.length === 0);
    if (group.active !== null) assert.ok(visible.includes(group.active));
  }
  assert.deepEqual(parseDockLayout(serializeDockLayout(layout)), layout);
}
function storage() {
  let value = null;
  return { read: () => value, write: next => { value = next; } };
}
test('three original presets round trip, own immutable state and carry every panel exactly once', () => {
  const serialized = new Set();
  for (const preset of PRESETS) {
    const layout = presetLayout(preset);
    invariant(layout); serialized.add(serializeDockLayout(layout));
    assert.ok(Object.isFrozen(layout)); assert.ok(Object.isFrozen(layout.groups));
    assert.ok(Object.isFrozen(layout.groups[0].panels));
    assert.throws(() => { layout.groups[0].placement.size = 2; }, TypeError);
  }
  assert.equal(serialized.size, 3);
});
test('closing and restoring tabs retains home/order and selects visible adjacent content', () => {
  const initial = presetLayout('Essentials');
  let layout = closePanel(initial, 'properties');
  assert.equal(home(layout, 'properties').active, 'library');
  layout = closePanel(layout, 'library');
  assert.equal(home(layout, 'library').active, null);
  layout = collapseGroup(layout, 'inspectors', true);
  layout = selectPanel(layout, 'properties');
  assert.equal(home(layout, 'properties').active, 'properties');
  assert.equal(home(layout, 'properties').collapsed, false);
  assert.deepEqual(home(layout, 'properties').panels, ['properties', 'library']);
  assert.deepEqual(initial.closed, []);
  for (const id of PANEL_IDS) layout = closePanel(layout, id);
  invariant(layout);
  for (const id of PANEL_IDS) layout = selectPanel(layout, id);
  invariant(layout);
  assert.deepEqual(layout.closed, []);
});
test('dock, float, group, reorder, resize and restore preserve panel identity', () => {
  let layout = presetLayout('Essentials');
  layout = movePanel(layout, 'library', { kind: 'new', groupId: 'floating-library', placement: floating, index: 0 });
  assert.equal(layout.groups[0].id, 'floating-library');
  assert.equal(home(layout, 'library').placement.kind, 'float');
  layout = placeGroup(layout, 'floating-library', { kind: 'dock', edge: 'top', size: 240 });
  layout = movePanel(layout, 'library', { kind: 'tab', groupId: 'inspectors', index: 0 });
  assert.deepEqual(home(layout, 'library').panels, ['library', 'properties']);
  assert.equal(layout.groups.some(group => group.id === 'floating-library'), false);
  layout = movePanel(layout, 'library', { kind: 'tab', groupId: 'inspectors', index: 1 });
  assert.deepEqual(home(layout, 'library').panels, ['properties', 'library']);
  layout = placeGroup(layout, 'inspectors', { kind: 'dock', edge: 'left', size: 370 });
  assert.equal(home(layout, 'library').placement.size, 370);
  layout = reorderGroup(layout, 'timeline', 0);
  assert.equal(layout.groups[0].id, 'timeline');
  layout = closePanel(layout, 'timeline');
  layout = movePanel(layout, 'timeline', { kind: 'tab', groupId: 'inspectors', index: 2 });
  assert.equal(home(layout, 'timeline').active, 'timeline');
  assert.equal(layout.closed.includes('timeline'), false);
  invariant(layout);
});
test('panel edge restrictions apply to every tab and failed moves leave the original untouched', () => {
  const layout = presetLayout('Essentials');
  const before = serializeDockLayout(layout);
  assert.throws(() => placeGroup(layout, 'tools', { kind: 'dock', edge: 'top', size: 100 }), /cannot dock/);
  assert.throws(() => movePanel(layout, 'tools', { kind: 'tab', groupId: 'timeline', index: 0 }), /cannot dock/);
  assert.throws(() => movePanel(layout, 'library', { kind: 'tab', groupId: 'inspectors', index: 8 }), /index/);
  assert.throws(() => movePanel(layout, 'library', { kind: 'new', groupId: 'tools', placement: floating, index: 0 }), /already exists/);
  assert.throws(() => movePanel(layout, 'library', { kind: 'tab', groupId: 'missing', index: 0 }), /Unknown/);
  assert.throws(() => reorderGroup(layout, 'tools', -1), /index/);
  assert.equal(serializeDockLayout(layout), before);
});
test('float recovery brings oversized and offscreen panes entirely inside the new viewport', () => {
  let layout = presetLayout('Essentials');
  layout = placeGroup(layout, 'inspectors', { kind: 'float', bounds: { x: -10000, y: 10000, width: 1600, height: 900 } });
  const recovered = recoverFloatingPanels(layout, 640, 480);
  assert.deepEqual(home(recovered, 'library').placement.bounds, { x: 0, y: 0, width: 640, height: 480 });
  assert.deepEqual(home(recovered, 'tools'), home(layout, 'tools'));
  assert.deepEqual(recoverFloatingPanels(recovered, 640, 480), recovered);
  assert.throws(() => recoverFloatingPanels(layout, NaN, 100));
});
test('workspace decoder rejects corruption, future versions and unknown payloads', () => {
  const mutations = [
    value => { value.version = 2; },
    value => { value.document = {}; },
    value => { value.groups[0].panels.push('library'); },
    value => { value.groups[1].panels.pop(); },
    value => { value.groups[0].active = 'properties'; },
    value => { value.closed.push('tools'); },
    value => { value.closed.push('library', 'library'); },
    value => { value.groups[0].placement.edge = 'center'; },
    value => { value.groups[0].placement.size = Infinity; },
    value => { value.groups[0].id = value.groups[1].id; },
    value => { value.groups[0].panels.push('scripts'); },
    value => { value.groups[0].collapsed = 'yes'; },
    value => { delete value.groups[0]; },
    value => { delete value.groups[0].panels[0]; },
    value => { value.closed = new Array(1); },
    value => { Object.defineProperty(value.groups[0], 'collapsed', { get() { throw new Error('Getter must not run'); }, enumerable: true }); },
    value => { value.groups[0].placement = { kind: 'float', bounds: { x: 0, y: 0, width: -1, height: 100 } }; },
  ];
  for (const mutate of mutations) {
    const data = JSON.parse(serializeDockLayout(presetLayout('Essentials'))); mutate(data);
    assert.throws(() => validateDockLayout(data));
  }
  assert.throws(() => parseDockLayout('{bad JSON'));
  assert.throws(() => parseDockLayout(' '.repeat(16385)), /budget/);
});
test('workspace storage persists working layout and named snapshots across independent instances', () => {
  const backing = storage();
  const store = new WorkspaceStore(backing);
  assert.equal(backing.read(), null);
  store.setLayout(placeGroup(store.state.current, 'inspectors', floating));
  store.saveNew('custom-ink', '  Ink room  ');
  assert.equal(store.state.custom[0].name, 'Ink room');
  store.setLayout(closePanel(store.state.current, 'properties'));
  const reopened = new WorkspaceStore(backing);
  assert.equal(reopened.state.active, 'custom-ink');
  assert.deepEqual(reopened.state.current.closed, ['properties']);
  assert.deepEqual(reopened.state.custom[0].layout.closed, []);
  reopened.reset();
  assert.deepEqual(reopened.state.current.closed, []);
  assert.equal(home(reopened.state.current, 'library').placement.kind, 'float');
  reopened.setLayout(closePanel(reopened.state.current, 'library'));
  reopened.overwrite('custom-ink');
  reopened.selectPreset('Animator');
  reopened.select('custom-ink');
  assert.deepEqual(reopened.state.current.closed, ['library']);
  reopened.rename('custom-ink', 'Drawing');
  assert.equal(new WorkspaceStore(backing).state.custom[0].name, 'Drawing');
  reopened.delete('custom-ink');
  assert.equal(reopened.state.active, 'preset:Essentials');
  assert.equal(reopened.state.custom.length, 0);
});
test('factory presets reset after movement and deleting inactive custom preserves current layout', () => {
  const store = new WorkspaceStore(storage());
  store.saveNew('custom-one', 'One');
  store.selectPreset('Designer');
  store.setLayout(closePanel(store.state.current, 'tools'));
  store.delete('custom-one');
  assert.deepEqual(store.state.current.closed, ['tools']);
  store.reset();
  assert.deepEqual(store.state.current, presetLayout('Designer'));
  for (const method of ['rename', 'delete', 'overwrite']) assert.throws(() => store[method]('preset:Designer', 'Other'));
});
test('duplicate names, malformed data, over-budget settings and write failures never replace good state', () => {
  const backing = storage();
  const store = new WorkspaceStore(backing);
  store.saveNew('custom-one', 'One');
  const before = store.state, json = backing.read();
  for (const label of ['One', 'oNE', 'Essentials', '\n', 'x'.repeat(65), 'name\u0000']) assert.throws(() => store.saveNew('custom-two', label));
  assert.throws(() => store.saveNew('custom-one', 'Other'));
  assert.throws(() => store.select('missing'));
  assert.equal(store.state, before); assert.equal(backing.read(), json);
  const failing = new WorkspaceStore({ read: () => json, write: () => { throw new Error('quota exceeded'); } });
  const original = failing.state;
  assert.throws(() => failing.rename('custom-one', 'Renamed'), /quota/);
  assert.equal(failing.state, original);
  for (const bad of ['{', ' '.repeat(131073), JSON.stringify({ ...before, active: 'custom-missing' }), JSON.stringify({ ...before, version: 2 })]) assert.throws(() => new WorkspaceStore({ read: () => bad, write() {} }));
  for (let i = 2; i <= 20; i++) store.saveNew(`custom-${i}`, `Workspace ${i}`);
  assert.throws(() => store.saveNew('custom-21', 'Too many'), /Too many/);
});
test('hundreds of mixed panel operations remain serializable without dropping or duplicating panels', () => {
  let layout = presetLayout('Essentials');
  for (let i = 0; i < 400; i++) {
    const id = PANEL_IDS[i % PANEL_IDS.length];
    if (i % 5 === 0) layout = closePanel(layout, id);
    else if (i % 5 === 1) layout = selectPanel(layout, id);
    else if (i % 5 === 2) layout = movePanel(layout, id, { kind: 'new', groupId: `floating-${i}`, placement: floating, index: 0 });
    else if (i % 5 === 3) layout = movePanel(layout, id, { kind: 'tab', groupId: home(layout, 'tools').id, index: 0 });
    else layout = collapseGroup(layout, home(layout, id).id, i % 2 === 0);
    invariant(layout);
  }
});
