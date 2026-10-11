import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { checkResearch, loadResearch, validateResearch, resolveEvidencePath, phaseZeroExitErrors, root } from '../../scripts/check-research.mjs';
import { renderMatrix } from '../../scripts/feature-matrix.mjs';
import { auditResearchDependencies, checkDependencyFreeManifest } from '../../scripts/check-licenses.mjs';

const baseline = await loadResearch();
const modified = callback => { const data = structuredClone(baseline); callback(data); return validateResearch(data); };

test('current research records and referenced files are structurally valid', async () => {
  const result = await checkResearch();
  assert.deepEqual(result.errors, []);
  assert.equal(result.data.features.length, 95);
});

test('production implementation is not inferred from research artifacts', () => {
  assert.ok(baseline.features.every(f => f.implementationStatus === 'NOT IMPLEMENTED'));
  assert.ok(baseline.features.every(f => f.automatedTest.status === 'PLANNED'));
});

test('reviewed Phase Zero inventory passes the exit gate', async () => {
  const { errors } = await checkResearch(root, true);
  assert.deepEqual(errors, []);
});

test('exit guard rejects partial, missing and unreviewed inventories with actionable diagnostics', () => {
  const gates = structuredClone(baseline.gates);
  gates.status = 'PARTIAL'; gates.gates[0].status = 'PARTIAL';
  const errors = phaseZeroExitErrors(gates);
  assert.ok(errors.some(e => e.includes('Phase Zero status is PARTIAL')));
  assert.ok(errors.some(e => e.includes(gates.gates[0].next)));
  assert.ok(phaseZeroExitErrors(null).length >= 2);
  assert.ok(phaseZeroExitErrors({status: 'COMPLETE', gates: []}).length >= 1);
});

test('duplicate feature IDs are rejected', () => {
  assert.ok(modified(d => d.features.push(structuredClone(d.features[0]))).some(e => e.includes('duplicate id')));
});

test('unresolved bibliography references are rejected', () => {
  assert.ok(modified(d => { d.features[0].reference = 'invented-source'; }).some(e => e.includes('unknown reference')));
});

test('invented source classification and invalid URL are rejected', () => {
  const errors = modified(d => { d.sources[0].classification = 'verified-by-memory'; d.sources[0].url = 'file:///secret'; });
  assert.ok(errors.some(e => e.includes('classification')));
  assert.ok(errors.some(e => e.includes('HTTPS')));
});

test('missing milestone or acceptance requirement is rejected', () => {
  const errors = modified(d => { d.features = d.features.filter(f => f.milestone !== 'M10'); delete d.features[0].requiredParity; });
  assert.ok(errors.some(e => e.includes('missing milestone M10')));
  assert.ok(errors.some(e => e.includes('missing requiredParity')));
});

test('DONE cannot rely on planned tests without acceptance evidence', () => {
  assert.ok(modified(d => { d.features[0].implementationStatus = 'DONE'; }).some(e => e.includes('DONE requires')));
});

test('phase cannot be marked complete while a gate remains partial', () => {
  assert.ok(modified(d => { d.gates.status = 'COMPLETE'; d.gates.gates[0].status = 'PARTIAL'; }).some(e => e.includes('unreviewed gates')));
});

test('risk mitigation, owner and trigger must be present', () => {
  const errors = modified(d => { delete d.risks[0].trigger; delete d.risks[0].owner; });
  assert.ok(errors.some(e => e.includes('missing trigger')));
  assert.ok(errors.some(e => e.includes('missing owner')));
});

test('null rows and absent tables produce errors rather than crash validation', () => {
  assert.ok(modified(d => { d.features.push(null); d.sources.push(null); d.risks.push(null); d.gates.gates.push(null); }).length >= 4);
  assert.ok(validateResearch({ sources: [], features: null, risks: [], gates: null }).length > 0);
});

test('evidence paths are bounded to the repository across host platforms', () => {
  for (const path of ['../outside.md', '/etc/passwd', 'C:/outside.md', 'C:\\outside.md', '\\\\server\\file', 'docs/../../outside', '.', 'docs/\0file']) {
    assert.throws(() => resolveEvidencePath(root, path), path);
  }
  assert.equal(resolveEvidencePath(root, 'docs/research.md'), resolve(root, 'docs/research.md'));
});

test('rendered feature matrix exactly matches its data source', async () => {
  const saved = (await readFile(join(root, 'docs/feature-matrix.md'), 'utf8')).replaceAll('\r\n', '\n');
  assert.equal(saved, renderMatrix(baseline.features));
});

test('Markdown table serialization escapes pipes and embedded newlines', () => {
  const features = structuredClone(baseline.features);
  features[0].feature = 'one | two\nthree';
  assert.ok(renderMatrix(features).includes('one \\| two three'));
});

test('research license audit passes only a dependency-free graph', async () => {
  // The historical guard must reject the Phase One graph, now audited separately.
  assert.ok((await auditResearchDependencies()).length > 0);
  for (const kind of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    assert.equal(checkDependencyFreeManifest({ [kind]: { unaudited: '1.0.0' } }).length, 1);
  }
  assert.equal(checkDependencyFreeManifest({ workspaces: ['packages/*'] }).length, 1);
});

test('audit finds nested manifests and Rust/unknown lockfile graphs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vibeanimate-audit-'));
  try {
    await mkdir(join(dir, 'nested'));
    await writeFile(join(dir, 'package.json'), '{}');
    await writeFile(join(dir, 'nested', 'package.json'), '{"dependencies":{"unreviewed":"1.0.0"}}');
    await writeFile(join(dir, 'Cargo.toml'), '[package]\nname="probe"');
    await writeFile(join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
    const errors = await auditResearchDependencies(dir);
    assert.equal(errors.length, 3);
    assert.ok(errors.some(e => e.includes('unreviewed')));
    assert.ok(errors.some(e => e.includes('Rust graph')));
  } finally {
    // This exact temporary directory was created above; no shell/path expansion.
    await rm(dir, { recursive: true, force: true });
  }
});
