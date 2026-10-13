import assert from 'node:assert/strict';

export async function checkDocumentTabs({ evaluate, send, until, checks }) {
  const tabs = () => evaluate(`Array.from(document.querySelectorAll('.document-tabs [role="tab"]'),tab=>({id:tab.dataset.documentId,selected:tab.getAttribute('aria-selected')==='true',tabIndex:tab.tabIndex,focused:document.activeElement===tab}))`);
  const camera = () => evaluate(`Object.fromEntries(Object.entries(document.querySelector('#camera-status').dataset).map(([key,value])=>[key,value==='true'?true:value==='false'?false:Number(value)]))`);
  const matches = (actual, expected) => Object.entries(expected).every(([key, value]) => typeof value === 'number' ? Math.abs(actual[key] - value) < 1e-8 : actual[key] === value);
  async function key(key, code, windowsVirtualKeyCode, modifiers = 0) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode, modifiers });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode, modifiers });
  }
  // Flush two render frames after keyboard actions before exact-count assertions,
  // so a second handler cannot create/close an extra tab after the first match.
  const settle = () => evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))`);

  await until(() => evaluate(`document.querySelector('.stage-surface canvas')?.width > 100`), 'document Stage after workspace reset');
  await settle();
  assert.equal((await tabs()).length, 1);
  const initial = (await tabs())[0].id;
  await evaluate(`document.activeElement.blur()`);
  assert.equal(await evaluate(`document.activeElement===document.body`), true);
  await key('n', 'KeyN', 78, 2);
  await until(() => evaluate(`document.querySelectorAll('.document-tabs [role="tab"]').length>=2`), 'new document shortcut with body focus');
  await settle();
  assert.equal((await tabs()).length, 2, 'Window-level new shortcut must execute once with no control focused');
  assert.equal((await tabs())[1].selected, true);
  await evaluate(`document.querySelectorAll('.document-tabs .close-document')[1].click()`);
  await until(() => evaluate(`document.querySelectorAll('.document-tabs [role="tab"]').length===1`), 'close initial body-focus shortcut document');
  assert.equal((await tabs())[0].id, initial);
  checks.push('Native Primary+N works exactly once when initial focus is on the document body');
  await evaluate(`(()=>{document.querySelector('[data-command="view.fit"]').click();document.querySelector('[data-command="view.rotate-right"]').click();document.querySelector('[data-command="view.mirror-x"]').click();})()`);
  await until(() => evaluate(`Number(document.querySelector('#camera-status').dataset.rotation) > .2 && document.querySelector('#camera-status').dataset.mirrorX==='true'`), 'first document camera');
  const first = (await tabs())[0].id;
  const firstCamera = await camera();

  await evaluate(`document.querySelector('#new-document').click()`);
  await until(() => evaluate(`document.querySelectorAll('.document-tabs [role="tab"]').length===2 && document.querySelector('#camera-status').dataset.rotation==='0' && document.querySelector('#camera-status').dataset.mirrorX==='false'`), 'new document with independent camera');
  const second = (await tabs())[1].id;
  assert.notEqual(first, second);
  assert.equal((await tabs()).find(tab => tab.selected).id, second);
  await evaluate(`(()=>{document.querySelector('[data-command="view.actual"]').click();document.querySelector('[data-command="view.rotate-left"]').click();})()`);
  await until(() => evaluate(`Number(document.querySelector('#camera-status').dataset.zoom)===1 && Number(document.querySelector('#camera-status').dataset.rotation)>6`), 'second document camera');
  const secondCamera = await camera();
  await evaluate(`document.querySelectorAll('.document-tabs [role="tab"]')[0].click()`);
  await until(async () => matches(await camera(), firstCamera), 'first document camera restored');
  assert.equal((await tabs()).find(tab => tab.selected).id, first);
  await evaluate(`document.querySelectorAll('.document-tabs [role="tab"]')[1].click()`);
  await until(async () => matches(await camera(), secondCamera), 'second document camera restored');
  checks.push('New and selected document tabs retain independent zoom, rotation, mirror and translation');

  await evaluate(`document.querySelectorAll('.document-tabs [role="tab"]')[1].focus()`);
  await key('ArrowLeft', 'ArrowLeft', 37);
  await until(async () => (await tabs()).some(tab => tab.id === first && tab.selected && tab.focused && tab.tabIndex === 0), 'tab ArrowLeft selection and focus');
  assert.equal((await tabs()).filter(tab => tab.tabIndex === 0).length, 1);
  await key('End', 'End', 35);
  await until(async () => (await tabs()).some(tab => tab.id === second && tab.selected && tab.focused), 'tab End selection and focus');
  await key('Home', 'Home', 36);
  await until(async () => (await tabs()).some(tab => tab.id === first && tab.selected && tab.focused), 'tab Home selection and focus');
  await key('ArrowRight', 'ArrowRight', 39);
  await until(async () => (await tabs()).some(tab => tab.id === second && tab.selected && tab.focused), 'tab ArrowRight selection and focus');
  checks.push('Native tab-list arrow, Home and End keys move selection and roving focus');

  await evaluate(`document.querySelector('.stage-settings input').focus()`);
  assert.equal(await evaluate(`document.activeElement===document.querySelector('.stage-settings input')`), true);
  await key('n', 'KeyN', 78, 2);
  await until(() => evaluate(`document.querySelectorAll('.document-tabs [role="tab"]').length>=3`), 'new document shortcut from input');
  await settle();
  assert.equal((await tabs()).length, 3, 'Input shortcut must execute only once across Stage and Editor handlers');
  assert.equal((await tabs())[2].selected, true);
  await evaluate(`document.querySelector('.stage-surface').focus()`);
  await key('w', 'KeyW', 87, 2);
  await until(() => evaluate(`document.querySelectorAll('.document-tabs [role="tab"]').length<=2`), 'close document shortcut');
  await settle();
  assert.equal((await tabs()).length, 2, 'Close shortcut must execute only once across Stage and Editor handlers');
  assert.equal((await tabs()).find(tab => tab.selected).id, second);
  await until(async () => matches(await camera(), secondCamera), 'previous adjacent camera after closing last tab');
  checks.push('Native Primary+N in an input and Primary+W on Stage execute exactly once; close selects adjacent tab');

  await evaluate(`document.querySelectorAll('.document-tabs .close-document')[0].click()`);
  await until(() => evaluate(`document.querySelectorAll('.document-tabs [role="tab"]').length===1`), 'close inactive document');
  assert.equal((await tabs())[0].id, second);
  assert.equal((await tabs())[0].selected, true);
  assert.ok(matches(await camera(), secondCamera), 'Closing an inactive document must preserve the active camera');
  await evaluate(`document.querySelector('.document-tabs .close-document').click()`);
  await until(() => evaluate(`!!document.querySelector('.empty-workspace') && !document.querySelector('.stage-surface') && document.querySelectorAll('.document-tabs [role="tab"]').length===0`), 'last document closed');
  assert.equal(await evaluate(`document.activeElement===document.body`), true, 'Removing the focused Stage leaves body focus');
  await key('n', 'KeyN', 78, 2);
  await until(() => evaluate(`document.querySelectorAll('.document-tabs [role="tab"]').length>=1 && document.querySelector('.stage-surface canvas')?.width>100`), 'new document shortcut after last tab closes');
  await settle();
  assert.equal((await tabs()).length, 1, 'Body-focus shortcut must create exactly one tab after Stage unmount');
  checks.push('Native Primary+N still works after closing the last focused document returns focus to the body');
  await evaluate(`document.querySelector('.document-tabs .close-document').click()`);
  await until(() => evaluate(`!!document.querySelector('.empty-workspace') && !document.querySelector('.stage-surface')`), 'close shortcut-created document');
  await evaluate(`document.querySelector('.empty-workspace button').click()`);
  await until(() => evaluate(`document.querySelectorAll('.document-tabs [role="tab"]').length===1 && document.querySelector('.stage-surface canvas')?.width>100 && !document.querySelector('.empty-workspace')`), 'Stage remount after all tabs closed');
  await evaluate(`document.querySelector('.stage-surface').focus()`);
  await key('z', 'KeyZ', 90);
  await until(() => evaluate(`document.querySelector('[data-command="tool.zoom"]').getAttribute('aria-pressed')==='true'`), 'remounted tool command');
  await key('h', 'KeyH', 72);
  await until(() => evaluate(`document.querySelector('[data-command="tool.hand"]').getAttribute('aria-pressed')==='true'`), 'remounted hand command');
  await evaluate(`document.querySelector('[data-command="view.actual"]').click()`);
  await until(() => evaluate(`document.querySelector('#camera-status').dataset.zoom==='1'`), 'remounted camera command');
  assert.equal(await evaluate(`document.querySelectorAll('.stage-error, #document-viewport [role="alert"]').length`), 0);
  checks.push('Inactive close preserves active camera; closing all and creating again remounts Stage with working command registration');
  await evaluate(`document.querySelector('[data-command="view.fit"]').click()`);
}
