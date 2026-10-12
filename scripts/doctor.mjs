import { spawnSync } from 'node:child_process';
import { platform, arch, release } from 'node:os';
import { nativeEnvironment } from './native-environment.mjs';

const tools = ['git', 'rustc', 'cargo'];
const env = nativeEnvironment();
console.log(JSON.stringify({ node: process.version, platform: platform(), arch: arch(), release: release() }));
for (const tool of tools) {
  const result = spawnSync(tool, ['--version'], { encoding: 'utf8', windowsHide: true, env, timeout: 10000 });
  if (result.error || result.status !== 0) {
    console.log(`${tool}: UNAVAILABLE (${result.error?.code ?? result.stderr.trim()})`);
  } else console.log(result.stdout.trim());
}
console.log('Contracts and research: npm run check; npm run demo:contracts; npm run benchmark:research.');
console.log('Desktop foundation: npm start. Native build requires platform prerequisites described in docs/desktop-development.md.');
