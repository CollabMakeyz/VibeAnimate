import { spawnSync } from 'node:child_process';
import { platform, arch, release } from 'node:os';

const tools = ['git', 'rustc', 'cargo'];
console.log(JSON.stringify({ node: process.version, platform: platform(), arch: arch(), release: release() }));
for (const tool of tools) {
  const result = spawnSync(tool, ['--version'], { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) {
    console.log(`${tool}: UNAVAILABLE (${result.error?.code ?? result.stderr.trim()})`);
  } else console.log(result.stdout.trim());
}
console.log('Research harness: npm run check; npm run benchmark:research.');
console.log('Desktop app: NOT IMPLEMENTED. Native build additionally requires the platform prerequisites in docs/sources.json (TAURI-PREREQ).');
