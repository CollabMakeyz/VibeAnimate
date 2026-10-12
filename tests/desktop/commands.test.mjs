import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandRegistry } from '../../apps/desktop/dist/modules/packages/command-system/src/registry.js';

function key(key, overrides = {}) { return { key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, isComposing: false, altGraphKey: false, ...overrides }; }
function command(id, shortcut, contexts = ['stage'], extra = {}) {
  return { id, label: id, contexts: new Set(contexts), defaultShortcuts: shortcut ? [shortcut] : [], enabled: () => true, checked: () => null, execute: () => {}, ...extra };
}
test('menus, palette and keyboard use current command enablement and checked state', () => {
  const registry = new CommandRegistry('windows');
  let enabled = true, checked = false, calls = 0;
  registry.register(command('view.grid', 'Primary+G', ['stage'], { enabled: () => enabled, checked: () => checked, execute: () => { checked = !checked; calls++; } }));
  assert.equal(registry.execute('view.grid', 'stage'), true);
  assert.equal(registry.list('stage')[0].checked, true);
  assert.equal(registry.handle(key('g', { ctrlKey: true }), 'stage').outcome, 'executed');
  assert.equal(registry.state('view.grid', 'stage').checked, false);
  enabled = false;
  assert.equal(registry.state('view.grid', 'stage').enabled, false);
  assert.equal(registry.execute('view.grid', 'stage'), false);
  assert.deepEqual(registry.handle(key('g', { ctrlKey: true }), 'stage'), { handled: true, commandId: 'view.grid', outcome: 'disabled' });
  assert.equal(calls, 2);
});
test('Primary maps to Meta on macOS and Control on Windows/Linux with exact modifiers', () => {
  for (const platform of ['mac', 'windows', 'linux']) {
    const registry = new CommandRegistry(platform);
    registry.register(command('edit.redo', 'Primary+Shift+Z'));
    const primary = platform === 'mac' ? { metaKey: true } : { ctrlKey: true };
    assert.equal(registry.handle(key('Z', { ...primary, shiftKey: true }), 'stage').outcome, 'executed');
    assert.equal(registry.handle(key('z', primary), 'stage').handled, false);
    assert.equal(registry.handle(key('Z', { ...primary, shiftKey: true, altKey: true }), 'stage').handled, false);
    assert.equal(registry.handle(key('Z', { metaKey: true, ctrlKey: true, shiftKey: true }), 'stage').handled, false);
  }
});
test('typing and modal contexts isolate global/tool shortcuts unless explicitly opted in', () => {
  const registry = new CommandRegistry('windows');
  let calls = 0;
  registry.register(command('tool.brush', 'B', ['stage'], { execute: () => calls++ }));
  registry.register(command('global.action', 'G', ['global'], { execute: () => calls++ }));
  registry.register(command('document.save', 'Primary+S', ['global', 'inputField', 'textEditing'], { execute: () => calls++ }));
  for (const context of ['inputField', 'textEditing', 'modal']) {
    for (const letter of ['b', 'g']) assert.equal(registry.handle(key(letter), context).handled, false);
    assert.equal(registry.execute('tool.brush', context), false);
  }
  for (const context of ['inputField', 'textEditing']) assert.equal(registry.handle(key('s', { ctrlKey: true }), context).outcome, 'executed');
  assert.equal(registry.handle(key('s', { ctrlKey: true }), 'modal').handled, false);
  assert.equal(calls, 2);
});
test('IME, dead keys and AltGr never dispatch commands', () => {
  const registry = new CommandRegistry('windows');
  registry.register(command('tool.pan', 'Space'));
  registry.register(command('action.alt', 'Ctrl+Alt+E'));
  for (const input of [key(' ', { isComposing: true }), key('e', { ctrlKey: true, altKey: true, altGraphKey: true }), key('Dead'), key('Process')]) {
    assert.deepEqual(registry.handle(input, 'stage'), { handled: false, commandId: null, outcome: 'suppressed' });
  }
});
test('specific context wins over global, including when disabled; unrelated contexts coexist', () => {
  const registry = new CommandRegistry('linux');
  let calls = 0;
  registry.register(command('global.delete', 'Delete', ['global'], { execute: () => calls++ }));
  registry.register(command('stage.delete', 'Delete', ['stage'], { enabled: () => false }));
  registry.register(command('timeline.delete', 'Delete', ['timeline']));
  assert.equal(registry.handle(key('Delete'), 'stage').outcome, 'disabled');
  assert.equal(calls, 0);
  assert.equal(registry.handle(key('Delete'), 'timeline').commandId, 'timeline.delete');
  assert.equal(registry.handle(key('Delete'), 'motionEditor').commandId, 'global.delete');
  assert.equal(calls, 1);
});
test('plus and Space names match logical keys without ambiguous modifier parsing', () => {
  const registry = new CommandRegistry('windows');
  registry.register(command('view.zoom', 'Primary+Shift+Plus'));
  registry.register(command('tool.pan', 'Space'));
  assert.equal(registry.handle(key('+', { ctrlKey: true, shiftKey: true }), 'stage').commandId, 'view.zoom');
  assert.equal(registry.handle(key(' '), 'stage').commandId, 'tool.pan');
});
test('repeat requires command opt-in', () => {
  const registry = new CommandRegistry('mac');
  let calls = 0;
  registry.register(command('view.zoom', '=', ['stage'], { allowRepeat: true, execute: () => calls++ }));
  registry.register(command('view.mirror', 'M', ['stage'], { execute: () => calls++ }));
  assert.equal(registry.handle(key('=', { repeat: true }), 'stage').outcome, 'executed');
  assert.equal(registry.handle(key('m', { repeat: true }), 'stage').outcome, 'suppressed');
  assert.equal(calls, 1);
});
test('conflicts and invalid registrations fail without modifying the registry', () => {
  const registry = new CommandRegistry('windows');
  registry.register(command('first.action', 'Primary+S'));
  assert.throws(() => registry.register(command('second.action', 'Ctrl+S')), /conflict/);
  assert.throws(() => registry.register(command('first.action', 'D')), /Duplicate command/);
  for (const shortcut of ['Ctrl++S', 'Ctrl+Ctrl+S', 'Primary+Meta+S', 'Super+S', 'F25', 'MissingKey', '']) {
    assert.throws(() => registry.register(command('invalid.action', null, ['stage'], { defaultShortcuts: [shortcut] })));
  }
  assert.throws(() => registry.register(command('invalid.action', 'S', [])));
  assert.throws(() => registry.register(command('invalid.action', 'S', ['text'])));
  assert.throws(() => registry.register(command('bad id', 'S')));
  assert.throws(() => registry.register(command('invalid.action', null, ['stage'], { defaultShortcuts: ['Primary+S', 'Ctrl+S'] })), /Duplicate shortcut/);
  assert.equal(registry.list('stage').length, 1);
});
test('shortcut remapping is atomic and can restore defaults', () => {
  const registry = new CommandRegistry('windows');
  registry.register(command('first.action', 'F1'));
  registry.register(command('second.action', 'F2'));
  assert.throws(() => registry.setShortcuts('first.action', ['F2']), /conflict/);
  assert.equal(registry.handle(key('F1'), 'stage').commandId, 'first.action');
  registry.setShortcuts('first.action', ['F3']);
  assert.equal(registry.handle(key('F1'), 'stage').handled, false);
  assert.equal(registry.handle(key('F3'), 'stage').commandId, 'first.action');
  registry.setShortcuts('first.action', []);
  assert.equal(registry.handle(key('F3'), 'stage').handled, false);
  registry.resetShortcuts('first.action');
  assert.equal(registry.handle(key('F1'), 'stage').commandId, 'first.action');
});
test('registration snapshots contexts/shortcuts and stale disposers cannot remove replacements', () => {
  const registry = new CommandRegistry('windows');
  const definition = command('tool.pan', 'Space');
  const dispose = registry.register(definition);
  definition.contexts.add('inputField'); definition.defaultShortcuts[0] = 'P';
  assert.equal(registry.handle(key(' '), 'stage').outcome, 'executed');
  assert.equal(registry.handle(key(' '), 'inputField').handled, false);
  registry.setShortcuts('tool.pan', ['P']); dispose();
  assert.equal(registry.list('stage').length, 0);
  registry.register(command('tool.pan', 'Space')); dispose();
  assert.equal(registry.list('stage').length, 1);
  assert.ok(Object.isFrozen(registry.state('tool.pan', 'stage').shortcuts));
});
test('unknown contexts/commands fail and execution errors reach the application boundary', () => {
  const registry = new CommandRegistry('windows');
  registry.register(command('failure.action', 'F1', ['stage'], { execute: () => { throw new Error('controlled failure'); } }));
  assert.throws(() => registry.execute('missing.action', 'stage'), /Unknown command/);
  assert.throws(() => registry.handle(key('F1'), 'unknown'), /Unknown keyboard/);
  assert.throws(() => registry.handle(key('F1'), 'stage'), /controlled failure/);
});
