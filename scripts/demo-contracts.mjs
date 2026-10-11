import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './check-research.mjs';
import { validateStructure } from '../packages/file-format/src/structure.mjs';

const file = 'examples/contracts/rectangle.document.json';
const dto = JSON.parse(await readFile(resolve(root, file), 'utf8'));
const valid = validateStructure('DocumentDTO', dto);
if (!valid.ok) { console.error(valid); process.exitCode = 1; }
else {
  console.log(`${file}: v1 document structure accepted (${dto.graphs[0].edges.length} edges, ${dto.layers.length} layer, ${dto.timelines[0].duration} frames).`);
  dto.graphs[0].edges[0].segment = { kind: 'quadratic' };
  const invalid = validateStructure('DocumentDTO', dto);
  if (invalid.ok) { console.error('Invalid quadratic was incorrectly accepted'); process.exitCode = 1; }
  else console.log('Missing quadratic control point correctly rejected. This is a contract demo, not a native package or runnable editor.');
}
