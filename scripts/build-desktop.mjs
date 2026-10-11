import { cp, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from './check-research.mjs';
import { auditDependencies } from './audit-dependencies.mjs';

const errors = await auditDependencies();
if (errors.length) throw new Error(errors.join('\n'));
const output = resolve(root, 'apps/desktop/dist');
if (output !== resolve(root) + '/apps/desktop/dist' && output !== resolve(root) + '\\apps\\desktop\\dist') throw new Error('Unsafe generated output path');
await rm(output, { recursive: true, force: true });
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'apps/desktop/tsconfig.json'], { cwd: root, stdio: 'inherit', windowsHide: true });
await mkdir(resolve(output, 'vendor/tauri/external/tslib'), { recursive: true });
for (const file of ['index.html', 'styles.css']) await copyFile(resolve(root, 'apps/desktop', file), resolve(output, file));
await copyFile(resolve(root, 'node_modules/preact/dist/preact.mjs'), resolve(output, 'vendor/preact.mjs'));
await copyFile(resolve(root, 'node_modules/@tauri-apps/api/core.js'), resolve(output, 'vendor/tauri/core.js'));
await copyFile(resolve(root, 'node_modules/@tauri-apps/api/external/tslib/tslib.es6.js'), resolve(output, 'vendor/tauri/external/tslib/tslib.es6.js'));
await copyFile(resolve(root, 'THIRD_PARTY_NOTICES.md'), resolve(output, 'THIRD_PARTY_NOTICES.md'));
await cp(resolve(root, 'docs/licensing'), resolve(output, 'docs/licensing'), { recursive: true });
const crates = JSON.parse(await readFile(resolve(root, 'docs/cargo-dependencies.json'), 'utf8'));
await mkdir(resolve(output, 'license-sources'), { recursive: true });
const sourceCache = resolve(root, 'work/license-sources');
await mkdir(sourceCache, { recursive: true });
await Promise.all(crates.filter(c => c.selectedLicenses.includes('MPL-2.0')).map(async crate => {
  const filename = `${crate.name}-${crate.version}.crate`;
  const cached = resolve(sourceCache, filename);
  let bytes;
  try { bytes = await readFile(cached); } catch {
    const response = await fetch(`https://static.crates.io/crates/${crate.name}/${filename}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Source archive unavailable: ${filename}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (createHash('sha256').update(bytes).digest('hex') !== crate.checksum) throw new Error(`Source archive integrity mismatch: ${filename}`);
  await writeFile(cached, bytes);
  await writeFile(resolve(output, 'license-sources', filename), bytes);
}));
console.log('Desktop frontend compiled; local ESM modules and retained notices copied.');
