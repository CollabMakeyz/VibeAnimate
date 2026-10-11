import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { auditLock, auditDependencies, selectedLicenses } from '../../scripts/audit-dependencies.mjs';
import { root } from '../../scripts/check-research.mjs';

const [lock, inventory, manifest, approvals] = await Promise.all(['package-lock.json', 'docs/dependencies.json', 'package.json', 'docs/licensing/approvals.json'].map(async p => JSON.parse(await readFile(resolve(root, p), 'utf8'))));
function changed(change) {
  const data = structuredClone({ lock, inventory, manifest, approvals }); change(data);
  return auditLock(data.lock, data.inventory, data.manifest, data.approvals);
}
test('reviewed graph and retained notices match the pinned packages', async () => {
  assert.deepEqual(await auditDependencies(), []);
  assert.equal(inventory.length, 6);
});
test('SPDX parser selects allowed OR branches and requires every AND branch', () => {
  assert.deepEqual(selectedLicenses('GPL-3.0-only OR MIT'), ['MIT']);
  assert.deepEqual(selectedLicenses('(MIT OR Apache-2.0) AND BSD-3-Clause'), ['BSD-3-Clause', 'MIT']);
  assert.deepEqual(selectedLicenses('MIT AND MIT'), ['MIT']);
  assert.deepEqual(selectedLicenses('Apache-2.0 WITH LLVM-exception OR MIT'), ['MIT']);
  assert.throws(() => selectedLicenses('Apache-2.0 WITH LLVM-exception AND MIT'));
  assert.throws(() => selectedLicenses('Apache-2.0 WITH OR MIT'));
  for (const value of ['', 'not-MIT', 'MIT AND GPL-3.0-only', 'MIT WITH exception', '(MIT', 'MIT OR', 'MIT;Apache-2.0', 'MIT Apache-2.0', 'OR MIT', 'MIT)']) assert.throws(() => selectedLicenses(value), value);
});
test('unknown, stale and duplicate inventory entries are rejected', () => {
  assert.ok(changed(d => d.inventory.pop()).some(e => e.includes('unreviewed')));
  assert.ok(changed(d => delete d.lock.packages['node_modules/fast-uri']).some(e => e.includes('stale')));
  assert.ok(changed(d => d.inventory.push(d.inventory[0])).some(e => e.includes('duplicate')));
});
test('version, source, integrity and license drift cannot pass review', () => {
  for (const key of ['version', 'resolved', 'integrity', 'license']) assert.ok(changed(d => d.lock.packages['node_modules/ajv'][key] = 'changed').some(e => e.includes(key)));
  assert.ok(changed(d => { d.lock.packages['node_modules/ajv'].resolved = d.inventory[0].resolved = 'http://registry.npmjs.org/ajv/-/ajv.tgz'; }).some(e => e.includes('unapproved source')));
});
test('missing transitives are caught even when their inventory is also removed', () => {
  const errors = changed(d => { delete d.lock.packages['node_modules/fast-uri']; d.inventory = d.inventory.filter(r => r.name !== 'fast-uri'); });
  assert.ok(errors.some(e => e.includes('missing transitive fast-uri')));
  assert.ok(changed(d => delete d.lock.packages['node_modules/ajv'].dependencies['fast-uri']).some(e => e.includes('edges differ')));
});
test('compiler bundled exception is bound to exact version, integrity, scope and notices', () => {
  assert.ok(changed(d => d.approvals = []).some(e => e.includes('approval missing')));
  for (const key of ['version', 'integrity', 'scope', 'evidence']) assert.ok(changed(d => d.approvals[0][key] = 'changed').some(e => e.includes('approval missing')));
  assert.ok(changed(d => d.approvals[0].noticeHashes.pop()).some(e => e.includes('approval missing')));
  assert.ok(changed(d => d.inventory.find(r => r.name === 'typescript').approval = null).some(e => e.includes('approval missing')));
  assert.ok(changed(d => d.approvals[0].additionalTerms = []).some(e => e.includes('approval missing')));
});
test('new runtime, lifecycle, workspace and unresolved graph forms fail closed', () => {
  for (const mutate of [d => d.manifest.workspaces = ['packages/*'], d => d.lock.packages['node_modules/ajv'].hasInstallScript = true,
    d => d.lock.packages['node_modules/ajv'].dev = false, d => d.lock.packages['node_modules/ajv'].link = true,
    d => d.lock.packages['node_modules/ajv'].peerDependencies = { other: '*' }]) assert.ok(changed(mutate).length > 0);
});
test('direct dependencies require exact versions and root manifest agreement', () => {
  assert.ok(changed(d => d.manifest.devDependencies.ajv = '^8.20.0').some(e => e.includes('exact locked')));
  assert.ok(changed(d => delete d.manifest.devDependencies.ajv).some(e => e.includes('Root devDependencies')));
  assert.deepEqual(auditLock({ lockfileVersion: 2 }, [], {}), ['Expected npm lockfile v3 with root package']);
});
