import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './check-research.mjs';

export function renderMatrix(features) {
  const cell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  const status = features.every(f => f.implementationStatus === 'NOT IMPLEMENTED')
    ? '**Every production feature is NOT IMPLEMENTED.**'
    : 'Implementation and test states are recorded separately in each row.';
  const header = `# Feature matrix\n\nStatus: research inventory. ${status} Test IDs\nmarked PLANNED are acceptance plans, not executable test evidence. Bibliography IDs\nresolve in \`sources.json\`; PLAN refers to the supplied \`MASTER PLAN.md\`.\n\n`;
  const columns = '| Feature | Category | Historical behavior / required modern behavior | Reference | Confidence | Required parity | Modern extension | Milestone | Implementation status | Automated test | Manual test | Known deviations |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n';
  return header + columns + features.map(f => '| ' + [f.feature, f.category,
    f.historicalBehavior, f.reference, f.confidence, f.requiredParity,
    f.modernExtension, f.milestone, f.implementationStatus,
    `${f.automatedTest.id} (${f.automatedTest.status})`, f.manualTest,
    f.knownDeviations].map(cell).join(' | ') + ' |').join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const data = JSON.parse(await readFile(resolve(root, 'docs/feature-matrix.json'), 'utf8'));
  const output = resolve(root, 'docs/feature-matrix.md');
  const expected = renderMatrix(data);
  if (process.argv.includes('--check')) {
    const actual = (await readFile(output, 'utf8')).replaceAll('\r\n', '\n');
    if (actual !== expected) {
      console.error('Feature matrix differs from its JSON source. Run npm run generate:matrix.');
      process.exitCode = 1;
    } else console.log(`Feature matrix synchronized: ${data.length} rows.`);
  } else {
    await writeFile(output, expected, 'utf8');
    console.log(`Generated ${data.length} feature rows.`);
  }
}
