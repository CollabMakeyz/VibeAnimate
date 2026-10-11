import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './check-research.mjs';

// Phase Zero has no third-party dependencies. Fail closed if that changes;
// the production SPDX/Cargo inventory audit must be implemented before adoption.
export function checkDependencyFreeManifest(manifest) {
  const errors = [];
  for (const kind of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const name of Object.keys(manifest[kind] ?? {})) errors.push(`${kind}: ${name} needs a pinned license inventory before adoption`);
  }
  if (manifest.workspaces) errors.push('Workspaces need a recursive dependency/license audit before adoption');
  return errors;
}

export async function auditResearchDependencies(base = root) {
  const errors = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'target', 'dist', 'work'].includes(entry.name)) continue;
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.name === 'package.json') {
        const pkg = JSON.parse(await readFile(path, 'utf8'));
        errors.push(...checkDependencyFreeManifest(pkg).map(e => `${path}: ${e}`));
      } else if (entry.name === 'Cargo.toml' || entry.name === 'Cargo.lock') {
        errors.push(`${path}: Rust graph requires full pinned Cargo license audit; not covered by research audit`);
      } else if (entry.name === 'package-lock.json') {
        const lock = JSON.parse(await readFile(path, 'utf8'));
        if (!lock.packages || Object.keys(lock.packages).some(k => k !== '')) errors.push(`${path}: installed graph exceeds dependency-free research scope`);
      } else if (['pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb'].includes(entry.name)) {
        errors.push(`${path}: lockfile format needs a complete inventory audit before adoption`);
      }
    }
  }
  await visit(base);
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const errors = await auditResearchDependencies();
    if (errors.length) {
      errors.forEach(e => console.error(e));
      process.exitCode = 1;
    } else console.log('Research dependency audit passed: no third-party npm/Cargo dependencies. This is not the future production license audit.');
  } catch (error) {
    console.error(`License audit failed: ${error.message}`);
    process.exitCode = 1;
  }
}
