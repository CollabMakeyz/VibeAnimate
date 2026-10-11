import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './check-research.mjs';

const rows = JSON.parse(await readFile(resolve(root, 'docs/dependencies.json'), 'utf8'));
const content = '# Third-party notices\n\n' +
  'Generated from `docs/dependencies.json`. These pinned packages support development\n' +
  'verification. Their original license/notice texts are retained at the links below.\n' +
  'No compiler is included in an editor distribution. Runtime and Cargo dependencies\n' +
  'require separate adoption reviews. Official manuals are referenced, not bundled.\n\n' +
  rows.map(row => `## ${row.name} ${row.version}\n\n` +
    `Source: [${row.name}](${row.source}). Package license: ${row.license}.\n` +
    `Scope: ${row.scope}; ${row.relationship}. ${row.purpose}.\n\n` +
    row.notices.map(n => `- [${n.file}](${n.saved}) — retained upstream text.\n`).join('') +
    (row.approval ? `\nBundled additional terms have a [version-specific user approval](${row.approval});\nthis does not approve other packages or later versions.\n` : '')).join('\n');
const target = resolve(root, 'THIRD_PARTY_NOTICES.md');
if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')).replaceAll('\r\n', '\n') !== content) { console.error('Third-party notices are out of date'); process.exitCode = 1; }
} else await writeFile(target, content);
