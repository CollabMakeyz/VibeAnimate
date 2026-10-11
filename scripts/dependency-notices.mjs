import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './check-research.mjs';

const rows = JSON.parse(await readFile(resolve(root, 'docs/dependencies.json'), 'utf8'));
const cargo = JSON.parse(await readFile(resolve(root, 'docs/cargo-dependencies.json'), 'utf8'));
const content = '# Third-party notices\n\n' +
  'Generated from the npm and Cargo inventories. Scope and selected license grants\n' +
  'are recorded per package. The complete cross-platform graph includes packages\n' +
  'not compiled on every target. Original notices are retained below. No compiler\n' +
  'is included in the application. Official manuals are referenced, not bundled.\n\n' +
  rows.map(row => `## ${row.name} ${row.version}\n\n` +
    `Source: [${row.name}](${row.source}). Package license: ${row.license}.\n` +
    `Scope: ${row.scope}; ${row.relationship}. ${row.purpose}.\n\n` +
    row.notices.map(n => `- [${n.file}](${n.saved}) — retained upstream text.\n`).join('') +
    (row.approval ? `\nBundled additional terms have a [version-specific user approval](${row.approval});\nthis does not approve other packages or later versions.\n` : '')).join('\n') +
  '\n# Rust dependencies\n\nMPL-covered crates are unmodified. Exact corresponding source archives are\n' +
  'linked below and copied into `license-sources/` in the frontend distribution.\n\n' +
  cargo.map(row => `## ${row.name} ${row.version}\n\nSelected: ${row.selectedLicenses.join(' AND ')}. Scope: ${row.scope}.\n` +
    `Source: [exact crate archive](https://static.crates.io/crates/${row.name}/${row.name}-${row.version}.crate). SHA-256: \`${row.checksum}\`.\n\n` +
    row.notices.map(n => `- [${n.file}](${n.saved})\n`).join('') +
    (row.approval ? `\n[Exact approval](${row.approval}).\n` : '') +
    (row.excludedBundledComponents ? '\nVendored D-Bus code is excluded; only the reviewed system-library feature set is allowed.\n' : '')).join('\n');
const target = resolve(root, 'THIRD_PARTY_NOTICES.md');
if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')).replaceAll('\r\n', '\n') !== content) { console.error('Third-party notices are out of date'); process.exitCode = 1; }
} else await writeFile(target, content);
