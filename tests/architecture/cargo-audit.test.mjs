import test from 'node:test';
import assert from 'node:assert/strict';
import { auditCargoGraph, cargoSource, parseCargoLock, cargoKey } from '../../scripts/audit-cargo.mjs';

function fixture() {
  const root = { name: 'vibeanimate', version: '0.0.0', dependencies: ['native 1.0.0', 'foreign 2.0.0'] };
  const native = { name: 'native', version: '1.0.0', source: cargoSource, checksum: 'a'.repeat(64) };
  const foreign = { name: 'foreign', version: '2.0.0', source: cargoSource, checksum: 'b'.repeat(64) };
  const metadata = { version: 1, workspace_members: ['local-root'], packages: [{ ...root, id: 'local-root' }, { ...native, license: 'MIT' }, { ...foreign, license: 'Unicode-3.0' }] };
  const inventory = [native, foreign].map(p => ({ ...p, license: p.name === 'native' ? 'MIT' : 'Unicode-3.0', normalizedLicense: p.name === 'native' ? 'MIT' : 'Unicode-3.0', selectedLicenses: [p.name === 'native' ? 'MIT' : 'Unicode-3.0'], dependencies: [], purpose: 'test review', relationship: 'direct', repository: 'https://example.test/source', reason: 'fixture only', replacementDifficulty: 'low', bundledLicenseReview: 'test review', scope: 'mixed', notices: [{ saved: `docs/licensing/cargo/${'c'.repeat(64)}.txt`, sha256: 'c'.repeat(64) }], additionalTerms: [], approval: null }));
  const record = inventory[1]; record.approval = 'docs/licensing/cargo-review.md';
  const approval = { key: cargoKey(foreign), checksum: foreign.checksum, license: 'Unicode-3.0', scope: 'mixed', evidence: record.approval, decision: 'approved', noticeHashes: ['c'.repeat(64)], additionalTerms: [], allowedTerms: ['Unicode-3.0'] };
  metadata.packages.forEach(p => p.id ??= cargoKey(p));
  metadata.resolve = { nodes: metadata.packages.map(p => ({ id: p.id, features: [] })) };
  inventory.forEach(p => { p.reviewStatus = 'reviewed'; p.enabledFeatures = []; });
  return { lock: { version: 4, package: [root, native, foreign] }, metadata, inventory, approvals: [approval] };
}
function run(mutate = () => {}) { const d = fixture(); mutate(d); return auditCargoGraph(d.lock, d.metadata, d.inventory, d.approvals); }
test('complete Cargo graph includes foreign-target records and exact scoped approvals', () => {
  assert.deepEqual(run(), []);
  assert.ok(run(d => d.metadata.packages.pop()).some(e => e.includes('target-specific')));
  assert.ok(run(d => d.inventory.pop()).some(e => e.includes('missing reviewed')));
});
test('TOML reader requires full lock v4, rejects duplicates and unknown sections', () => {
  const lock = parseCargoLock('version = 4\n[[package]]\nname = "probe"\nversion = "1.0.0"\n');
  assert.equal(lock.package[0].name, 'probe');
  for (const input of ['version=3\npackage=[]', 'version=4\npackage=[]\nversion=4', 'version=4\npackage=[]\n[metadata]\na=1', 'not valid toml']) assert.throws(() => parseCargoLock(input));
});
test('approval cannot authorize other checksums, licenses, scopes or notice text', () => {
  assert.ok(run(d => d.approvals = []).some(e => e.includes('approval missing')));
  for (const field of ['checksum', 'license', 'scope', 'evidence']) assert.ok(run(d => d.approvals[0][field] = 'changed').some(e => e.includes('approval missing')));
  assert.ok(run(d => d.approvals[0].noticeHashes = []).some(e => e.includes('approval missing')));
  assert.ok(run(d => d.approvals[0].allowedTerms = []).some(e => e.includes('no allowed branch')));
});
test('lock and metadata cannot silently omit a direct or transitive dependency', () => {
  const errors = run(d => { d.lock.package.pop(); d.metadata.packages.pop(); d.inventory.pop(); });
  assert.ok(errors.some(e => e.includes('unresolved or ambiguous dependency')));
  assert.ok(run(d => d.lock.package[1].dependencies = ['missing']).some(e => e.includes('dependency-edge drift')));
});
test('registry identity, duplicate records and unknown local dependencies fail closed', () => {
  assert.ok(run(d => d.lock.package.push(d.lock.package[1])).some(e => e.includes('duplicate')));
  assert.ok(run(d => d.lock.package[1].source = 'git+https://example.test').length);
  assert.ok(run(d => d.metadata.workspace_members = []).some(e => e.includes('local/path')));
  assert.ok(run(d => d.inventory[0].checksum = 'd'.repeat(64)).some(e => e.includes('drift')));
  assert.ok(run(d => d.inventory[0].notices = []).some(e => e.includes('license evidence')));
  assert.ok(run(d => d.inventory[0].reviewStatus = 'candidate').some(e => e.includes('review pending')));
  assert.ok(run(d => d.metadata.resolve.nodes[1].features.push('vendored')).some(e => e.includes('feature drift')));
});
test('legacy slash expressions require explicit evidence and exact normalization', () => {
  assert.deepEqual(run(d => { d.metadata.packages[1].license = d.inventory[0].license = 'MIT/Apache-2.0'; d.inventory[0].normalizedLicense = 'MIT OR Apache-2.0'; d.inventory[0].normalizationEvidence = 'Retained upstream dual-license grants'; }), []);
  assert.ok(run(d => { d.metadata.packages[1].license = d.inventory[0].license = 'MIT/Apache-2.0'; }).some(e => e.includes('unreviewed license normalization')));
  assert.ok(run(d => d.inventory[0].normalizedLicense = 'MIT OR GPL-3.0-only').some(e => e.includes('unreviewed license normalization')));
});
