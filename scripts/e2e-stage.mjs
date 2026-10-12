import assert from 'node:assert/strict';

export async function checkStage({ evaluate, send, until, checks }) {
  await evaluate(`document.querySelector('#open-stage').click()`);
  await until(() => evaluate(`document.querySelector('.stage-surface canvas')?.width > 100 && Number(document.querySelector('#camera-status')?.dataset.zoom) > 0`), 'native Stage startup');
  const render = await evaluate(`(async()=>{
    const {StageSurface}=await import('./modules/apps/desktop/src/stage/surface.js');
    const {buildStageBackdrop}=await import('./modules/packages/renderer-core/src/stage-backdrop.js');
    const {createCamera}=await import('./modules/packages/renderer-core/src/camera.js');
    const {createBlankDocument}=await import('./modules/packages/document-model/src/create-document.js');
    const host=document.createElement('div');document.body.append(host);
    const frame=buildStageBackdrop({stage:{...createBlankDocument('render-test','Render',100,50).stage,background:[.25,.5,.75,1]},camera:createCamera({translation:[50,25]}),size:{width:200,height:100},pasteboard:[.1,.1,.1,1],gridColor:[0,0,0,.2],gridSize:16,showGrid:false});
    const results=[];
    try { for(const backend of ['webgl2','canvas2d']) {
      const surface=new StageSurface(host,()=>{},backend);
      try { for(const dpr of [1,2]) {
        surface.draw(frame,dpr);
        const canvas=host.querySelector('canvas');const gl=canvas.getContext('webgl2');
        const sample=(x,y)=>{if(gl){const pixel=new Uint8Array(4);gl.readPixels(x*dpr,canvas.height-1-y*dpr,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return Array.from(pixel);}return Array.from(canvas.getContext('2d').getImageData(x*dpr,y*dpr,1,1).data);};
        results.push({requested:backend,actual:surface.backend,dpr,inside:sample(100,50),outside:sample(5,5)});
      }} finally {surface.dispose();}
    }} finally {host.remove();}
    return results;
  })()`);
  assert.equal(render.length, 4);
  for (const entry of render) {
    assert.equal(entry.actual, entry.requested);
    for (const [sample, expected] of [[entry.inside, [64, 128, 191, 255]], [entry.outside, [26, 26, 26, 255]]]) {
      sample.forEach((channel, i) => assert.ok(Math.abs(channel - expected[i]) <= 1, JSON.stringify(entry)));
    }
  }
  checks.push('Real WebGL2 and Canvas2D pixel readback: Stage/pasteboard colors at DPR 1 and 2');

  const camera = () => evaluate(`Object.fromEntries(Object.entries(document.querySelector('#camera-status').dataset).map(([key,value])=>[key,value==='true'?true:value==='false'?false:Number(value)]))`);
  const rect = await evaluate(`(()=>{const r=document.querySelector('.stage-surface').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()`);
  // MouseEvent client coordinates can be quantized by the native WebView. Request
  // whole CSS pixels and record the delivered wheel point for the anchor oracle.
  const x = Math.round(rect.x + rect.width * .4), y = Math.round(rect.y + rect.height * .4);
  const before = await camera();
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + 48, y: y + 24, button: 'left', buttons: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + 48, y: y + 24, button: 'left', clickCount: 1 });
  await until(async () => Math.abs((await camera()).x - before.x - 48) < .01, 'pointer pan');
  const panned = await camera();
  assert.ok(Math.abs(panned.y - before.y - 24) < .01);
  await evaluate(`document.querySelector('.stage-surface').addEventListener('wheel',event=>{const host=event.currentTarget;const r=host.getBoundingClientRect();host.dataset.testWheelPoint=JSON.stringify([event.clientX-r.left,event.clientY-r.top]);},{capture:true,once:true})`);
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: -100, modifiers: 2 });
  await until(async () => (await camera()).zoom > panned.zoom, 'cursor zoom');
  const zoomed = await camera();
  const anchor = await evaluate(`JSON.parse(document.querySelector('.stage-surface').dataset.testWheelPoint)`);
  const world = [(anchor[0] - panned.x) / panned.zoom, (anchor[1] - panned.y) / panned.zoom];
  assert.ok(Math.abs((anchor[0] - zoomed.x) / zoomed.zoom - world[0]) < .01, JSON.stringify({ anchor, panned, zoomed, rect }));
  assert.ok(Math.abs((anchor[1] - zoomed.y) / zoomed.zoom - world[1]) < .01, JSON.stringify({ anchor, panned, zoomed, rect }));
  await evaluate(`document.querySelector('[data-command="view.rotate-right"]').click()`);
  await until(async () => (await camera()).rotation > .2, 'rotate command');
  await evaluate(`document.querySelector('[data-command="view.mirror-x"]').click()`);
  await until(() => evaluate(`document.querySelector('#camera-status').dataset.mirrorX==='true'`), 'mirror command');
  await evaluate(`document.querySelector('[data-command="view.grid"]').click()`);
  await until(() => evaluate(`document.querySelector('[data-command="view.grid"]').getAttribute('aria-pressed')==='true'`), 'grid command');
  checks.push('Native pointer pan, cursor-anchored wheel zoom, rotation, mirror and grid commands');

  await evaluate(`document.querySelector('.stage-settings input').focus()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90 });
  assert.equal(await evaluate(`document.querySelector('[data-command="tool.hand"]').getAttribute('aria-pressed')`), 'true');
  await evaluate(`document.querySelector('.stage-surface').focus()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90 });
  await until(() => evaluate(`document.querySelector('[data-command="tool.zoom"]').getAttribute('aria-pressed')==='true'`), 'Stage tool shortcut');
  checks.push('Native keyboard uses shared registry and protects text input');

  const retained = await camera();
  assert.equal(await evaluate(`(()=>{const gl=document.querySelector('.stage-surface canvas').getContext('webgl2');const ext=gl?.getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;})()`), true);
  await until(() => evaluate(`document.querySelector('.stage-surface canvas')?.dataset.backend==='canvas2d'`), 'context-loss Canvas2D recovery');
  assert.deepEqual(await camera(), retained);
  await evaluate(`(()=>{const select=document.querySelector('.stage-settings select');select.value='webgl2';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await until(() => evaluate(`document.querySelector('.stage-surface canvas')?.dataset.backend==='webgl2'`), 'WebGL retry');
  assert.deepEqual(await camera(), retained);
  checks.push('Actual WebGL context loss falls back to Canvas2D; explicit retry preserves camera');
  await evaluate(`(()=>{document.querySelector('[data-command="view.reset-rotation"]').click();document.querySelector('[data-command="view.fit"]').click();})()`);
}
