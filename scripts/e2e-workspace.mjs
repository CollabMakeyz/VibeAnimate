import assert from 'node:assert/strict';

export async function checkWorkspace({ evaluate, send, until, checks }) {
  await evaluate(`document.querySelector('[data-restore-panel="library"]').click()`);
  await until(() => evaluate(`!!document.querySelector('[data-panel="library"]')`), 'Library panel selection');
  assert.ok((await evaluate(`document.querySelector('[data-panel="library"]').textContent`)).includes('0 símbolos'));
  await evaluate(`(()=>{const group=document.querySelector('[data-panel="library"]').closest('.dock-group');group.querySelector('details').open=true;Array.from(group.querySelectorAll('button')).find(button=>button.textContent==='Flutuar').click();})()`);
  await until(() => evaluate(`!!document.querySelector('.floating [data-panel="library"]')`), 'floating panel');
  const rect = await evaluate(`(()=>{const group=document.querySelector('.floating');const r=group.querySelector('.dock-handle').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),left:parseFloat(group.style.left),top:parseFloat(group.style.top)};})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x + 40, y: rect.y + 10, button: 'left', buttons: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x + 40, y: rect.y + 10, button: 'left', clickCount: 1 });
  await until(() => evaluate(`parseFloat(document.querySelector('.floating').style.left)===64`), 'floating pointer movement');
  assert.equal(await evaluate(`document.querySelector('.floating').classList.contains('collapsed')`), false);
  const resize = await evaluate(`(()=>{const group=document.querySelector('.floating');const r=group.querySelector('.dock-resizer').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),width:parseFloat(group.style.width)};})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: resize.x, y: resize.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: resize.x + 25, y: resize.y, button: 'left', buttons: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: resize.x + 25, y: resize.y, button: 'left', clickCount: 1 });
  await until(async () => (await evaluate(`parseFloat(document.querySelector('.floating').style.width)`)) === resize.width + 25, 'floating pointer resize');
  checks.push('Real pointer movement and resize of a floating panel without accidental collapse');

  // Exercise the application drop route in the real WebView; this is a DOM DnD
  // integration check, separate from the actual mouse/capture tests above.
  await evaluate(`(()=>{const data=new DataTransfer();data.setData('application/x-vibeanimate-panel','library');document.querySelector('[data-panel-group="timeline"]').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:data}));})()`);
  await until(() => evaluate(`!!document.querySelector('[data-panel-group="timeline"] [data-panel="library"]')`), 'tab grouping drop');
  await evaluate(`(()=>{const group=document.querySelector('[data-panel-group="timeline"]');group.querySelector('details').open=true;Array.from(group.querySelectorAll('button')).find(button=>button.textContent==='Fechar painel').click();})()`);
  await until(() => evaluate(`JSON.parse(localStorage.getItem('vibeanimate.workspace.v1')).current.closed.includes('library')`), 'closed panel persisted');
  await evaluate(`document.querySelector('[data-restore-panel="library"]').click()`);
  await until(() => evaluate(`!!document.querySelector('[data-panel-group="timeline"] [data-panel="library"]')`), 'restore original group');
  checks.push('DOM drag/drop groups tabs; close and restore retain panel identity and home');

  await evaluate(`(()=>{document.querySelector('.workspace-menu').open=true;const input=document.querySelector('[aria-label="Nome do workspace"]');input.value='M2 native workspace';input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await until(() => evaluate(`!document.querySelector('[data-workspace-action="save"]').disabled`), 'workspace name');
  await evaluate(`document.querySelector('[data-workspace-action="save"]').click()`);
  await until(() => evaluate(`JSON.parse(localStorage.getItem('vibeanimate.workspace.v1')).active.startsWith('custom-')`), 'custom workspace saved');
  const saved = await evaluate(`JSON.parse(localStorage.getItem('vibeanimate.workspace.v1'))`);
  assert.equal(saved.custom[0].name, 'M2 native workspace');
  await send('Page.reload');
  await until(() => evaluate(`!!document.querySelector('.floating [data-panel="properties"]') && !!document.querySelector('[data-panel-group="timeline"] [data-panel="library"]')`), 'workspace restored after reload');
  assert.deepEqual(await evaluate(`JSON.parse(localStorage.getItem('vibeanimate.workspace.v1'))`), saved);
  await evaluate(`(()=>{document.querySelector('.workspace-menu').open=true;const input=document.querySelector('[aria-label="Nome do workspace"]');input.value='Renamed workspace';input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await until(() => evaluate(`!document.querySelector('[data-workspace-action="rename"]').disabled`), 'workspace rename enablement');
  await evaluate(`document.querySelector('[data-workspace-action="rename"]').click()`);
  await until(() => evaluate(`JSON.parse(localStorage.getItem('vibeanimate.workspace.v1')).custom[0].name==='Renamed workspace'`), 'workspace renamed');
  await evaluate(`document.querySelector('[data-workspace-action="delete"]').click()`);
  await until(() => evaluate(`JSON.parse(localStorage.getItem('vibeanimate.workspace.v1')).active==='preset:Essentials' && !document.querySelector('.floating')`), 'workspace deletion and factory fallback');
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('vibeanimate.workspace.v1')).custom.length`), 0);
  checks.push('Named workspace save, native reload restore, rename and delete use durable settings');
}
