import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { root } from './check-research.mjs';
import { checkStage } from './e2e-stage.mjs';
import { checkWorkspace } from './e2e-workspace.mjs';

// This harness owns the process, isolated WebView profile and loopback debugger.
// It never attaches to a user's browser. Other native engines need their own
// driver; they must not silently count a browser surrogate as native coverage.
if (process.platform !== 'win32') throw new Error('Native E2E bootstrap currently requires Windows WebView2');
const server = createServer();
await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
const port = server.address().port;
await new Promise(ok => server.close(ok));
const results = resolve(root, 'test-results');
await mkdir(results, { recursive: true });
const profile = await mkdtemp(resolve(results, 'webview-profile-'));
const app = spawn(resolve(root, 'target/debug/vibeanimate-desktop.exe'), ['--e2e-port', String(port), '--e2e-profile', profile], {
  cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env },
});
let exited = false, output = '', ws, lastProbe = 'not attempted';
app.on('exit', () => { exited = true; });
app.on('error', error => { exited = true; output += error.message; });
app.stdout.on('data', data => { output += data; }); app.stderr.on('data', data => { output += data; });
async function until(probe, label) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (exited) throw Error(`App exited: ${output}`);
    const value = await probe(); if (value) return value;
    await delay(150);
  }
  throw Error(`Timed out: ${label}; last discovery: ${lastProbe}; native output: ${output}`);
}
const checks = [];
try {
  const page = await until(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1000) });
      const pages = await response.json();
      lastProbe = JSON.stringify(pages.map(p => ({ type: p.type, url: p.url })));
      return pages.find(p => p.type === 'page' && p.url === 'http://tauri.localhost/');
    } catch (error) { lastProbe = `${error.message}: ${error.cause?.code ?? ''}`; return null; }
  }, 'owned Tauri webview');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, fail) => { ws.addEventListener('open', ok, { once: true }); ws.addEventListener('error', fail, { once: true }); });
  const pending = new Map(); let serial = 0;
  ws.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    const entry = pending.get(response.id); if (!entry) return;
    pending.delete(response.id); clearTimeout(entry.timer);
    if (response.error) entry.fail(Error(JSON.stringify(response.error))); else entry.ok(response.result);
  });
  function send(method, params = {}) {
    return new Promise((ok, fail) => {
      const id = ++serial;
      const timer = setTimeout(() => { pending.delete(id); fail(Error(`CDP timeout: ${method}`)); }, 10000);
      pending.set(id, { ok, fail, timer }); ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression: `(async()=>(${expression}))()`, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await until(() => evaluate(`document.querySelector('#runtime-status')?.textContent.includes('confirmada')`), 'native handshake');
  assert.equal(await evaluate(`document.querySelectorAll('.loading').length`), 0);
  assert.equal(await evaluate(`document.querySelectorAll('.fact').length`), 10);
  checks.push('Packaged native startup, IPC handshake, capability rendering, loading cleanup');
  const before = await evaluate(`(await (await import('@tauri-apps/api/core')).invoke('read_logs')).split(String.fromCharCode(10)).filter(Boolean).length`);
  await evaluate(`(()=>{document.querySelector('#open-diagnostics').click();Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Atualizar diagnóstico').click();})()`);
  await until(async () => (await evaluate(`(await (await import('@tauri-apps/api/core')).invoke('read_logs')).split(String.fromCharCode(10)).filter(Boolean).length`)) > before, 'refresh persisted log');
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Consultar registro').click()`);
  await until(() => evaluate(`document.querySelector('.log-output')?.textContent.includes('diagnostics_requested')`), 'real log display');
  checks.push('Refresh action and persisted native diagnostic log displayed');
  assert.equal(await evaluate(`(async()=>{try{await (await import('@tauri-apps/api/core')).invoke('plugin:fs|read_file',{path:'Cargo.toml'});return false;}catch{return true;}})()`), true);
  assert.equal(await evaluate(`(async()=>{try{await (await import('@tauri-apps/api/core')).invoke('log_event',{event:{level:'info',code:'startup',message:'x'.repeat(513)}});return false;}catch{return true;}})()`), true);
  // CSP rejects this before a network request. The origin is reserved and never a service.
  assert.equal(await evaluate(`(async()=>{try{await fetch('https://blocked.invalid/');return false;}catch{return true;}})()`), true);
  checks.push('Unregistered filesystem IPC, oversize log input and external network denied');
  await evaluate(`(async()=>{const {h,render}=await import('preact');const {ErrorBoundary}=await import('./modules/apps/desktop/src/ui/error-boundary.js');let first=true;function Fault(){if(first){first=false;throw Error('E2E controlled render failure');}return h('p',{id:'recovered'},'Recovered');}const container=document.createElement('div');container.id='boundary-test';document.body.append(container);render(h(ErrorBoundary,null,h(Fault)),container);})()`);
  await until(() => evaluate(`!!document.querySelector('#boundary-test [role=alert]')`), 'error boundary');
  await evaluate(`document.querySelector('#boundary-test button').click()`);
  await until(() => evaluate(`document.querySelector('#recovered')?.textContent==='Recovered'`), 'boundary recovery');
  checks.push('Real render failure caught and panel recovered');
  await evaluate(`document.querySelector('#boundary-test').remove()`);
  await send('Page.reload');
  await until(() => evaluate(`document.querySelector('#runtime-status')?.textContent.includes('confirmada')`), 'reload');
  checks.push('Reload from embedded assets reconnects to native backend');
  await checkStage({ evaluate, send, until, checks });
  await checkWorkspace({ evaluate, send, until, checks });
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(resolve(results, 'native-e2e.png'), Buffer.from(screenshot.data, 'base64'));
  const report = { platform: process.platform, date: new Date().toISOString(), checks, page: page.url, profile };
  await writeFile(resolve(results, 'native-e2e.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(JSON.stringify({ completedChecks: checks, failure: String(error) }, null, 2));
  throw error;
} finally {
  ws?.close();
  if (!exited) app.kill();
  await writeFile(resolve(results, 'native-e2e-process.log'), output);
}
