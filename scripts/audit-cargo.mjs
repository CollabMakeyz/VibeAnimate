import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { parse } from 'smol-toml';
import { selectedLicenses } from './spdx.mjs';
import { nativeEnvironment } from './native-environment.mjs';

export const cargoSource = 'registry+https://github.com/rust-lang/crates.io-index';
export const cargoKey = p => `${p.name}@${p.version}|${p.source ?? 'workspace'}`;
const sorted = list => [...list].sort();
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const textHash = text => createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex');

export function parseCargoLock(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > 16 * 1024 * 1024) throw new Error('Cargo lock exceeds review limit');
  const lock = parse(text);
  if (lock.version !== 4 || !Array.isArray(lock.package)) throw new Error('Expected complete Cargo lockfile v4');
  if (Object.keys(lock).some(key => !['version', 'package'].includes(key))) throw new Error('Unreviewed Cargo lockfile section');
  return lock;
}

// Pure complete-graph check: every lock record, including foreign-target crates,
// must occur in Cargo metadata and in the reviewed inventory. No platform filter.
export function auditCargoGraph(lock, metadata, inventory, approvals = []) {
  const errors = [];
  if (lock?.version !== 4 || !Array.isArray(lock.package) || metadata?.version !== 1 || !Array.isArray(metadata.packages) || !Array.isArray(metadata.workspace_members) || !Array.isArray(inventory)) return ['Missing complete Cargo lock, metadata or inventory'];
  const locked = new Map(), packages = new Map(), reviewed = new Map();
  for (const [label, list, map] of [['lock', lock.package, locked], ['metadata', metadata.packages, packages], ['inventory', inventory, reviewed]]) {
    for (const pkg of list) {
      if (!pkg || typeof pkg.name !== 'string' || typeof pkg.version !== 'string') { errors.push(`${label}: malformed package identity`); continue; }
      const key = cargoKey(pkg); if (map.has(key)) errors.push(`${label}: duplicate ${key}`); else map.set(key, pkg);
    }
  }
  const workspace = new Set(metadata.workspace_members);
  for (const [key, pkg] of locked) {
    const meta = packages.get(key); packages.delete(key);
    if (!meta) { errors.push(`${key}: missing metadata (including target-specific packages)`); continue; }
    if (!pkg.source) {
      if (!workspace.has(meta.id)) errors.push(`${key}: unreviewed local/path dependency`);
      if (pkg.checksum) errors.push(`${key}: local package has registry checksum`);
      continue;
    }
    const record = reviewed.get(key); reviewed.delete(key);
    if (!record) { errors.push(`${key}: missing reviewed Cargo inventory`); continue; }
    if (pkg.source !== cargoSource || !/^[a-f0-9]{64}$/.test(pkg.checksum ?? '')) errors.push(`${key}: unapproved source or checksum`);
    if (record.checksum !== pkg.checksum || record.license !== meta.license) errors.push(`${key}: checksum/license drift`);
    if (!equal(sorted(record.dependencies ?? []), sorted(pkg.dependencies ?? []))) errors.push(`${key}: dependency-edge drift`);
    for (const field of ['purpose', 'relationship', 'repository', 'reason', 'replacementDifficulty', 'bundledLicenseReview']) if (typeof record[field] !== 'string' || !record[field].trim()) errors.push(`${key}: missing ${field}`);
    if (!['runtime', 'build', 'development', 'mixed'].includes(record.scope)) errors.push(`${key}: missing audited scope`);
    if (record.reviewStatus !== 'reviewed') errors.push(`${key}: final adoption review pending`);
    const resolvedNode = metadata.resolve?.nodes?.find(node => node.id === meta.id);
    if (!Array.isArray(record.enabledFeatures) || !resolvedNode || !equal(sorted(record.enabledFeatures), sorted(resolvedNode.features ?? []))) errors.push(`${key}: resolved feature drift`);
    if (!Array.isArray(record.notices) || !record.notices.length) errors.push(`${key}: retained license evidence missing`);
    if (!Array.isArray(record.additionalTerms)) errors.push(`${key}: bundled terms review missing`);
    let approvedTerms = [];
    const approval = approvals.find(a => a.decision === 'approved' && a.key === key && a.checksum === pkg.checksum && a.license === meta.license && a.scope === record.scope && a.evidence === record.approval && equal(a.noticeHashes, (record.notices ?? []).map(n => n.sha256)) && equal(a.additionalTerms, record.additionalTerms));
    if (approval) approvedTerms = approval.allowedTerms ?? [];
    if ((record.approval || record.additionalTerms?.length) && !approval) errors.push(`${key}: exact bundled-term approval missing`);
    let expression = meta.license;
    if (record.normalizedLicense !== expression) {
      // Only a specifically reviewed legacy slash spelling can normalize here.
      const legacy = typeof expression === 'string' && /^[A-Za-z0-9.+-]+(?:\s*\/\s*[A-Za-z0-9.+-]+)+$/.test(expression);
      if (!legacy || !record.normalizationEvidence || record.normalizedLicense !== expression.split('/').map(s => s.trim()).join(' OR ')) errors.push(`${key}: unreviewed license normalization`);
      else expression = record.normalizedLicense;
    }
    try {
      if (!equal(selectedLicenses(expression, approvedTerms), record.selectedLicenses)) errors.push(`${key}: selected license branch differs`);
    } catch (error) { errors.push(`${key}: ${error.message}`); }
  }
  for (const [key, pkg] of locked) {
    for (const dependency of pkg.dependencies ?? []) {
      if (typeof dependency !== 'string') { errors.push(`${key}: malformed dependency edge`); continue; }
      const match = /^([A-Za-z0-9_-]+)(?: ([0-9][A-Za-z0-9.+-]*))?(?: \(([^)]+)\))?$/.exec(dependency);
      if (!match) { errors.push(`${key}: unsupported dependency identity`); continue; }
      const matches = lock.package.filter(p => p.name === match[1] && (!match[2] || p.version === match[2]) && (!match[3] || p.source === match[3]));
      if (matches.length !== 1) errors.push(`${key}: unresolved or ambiguous dependency ${dependency}`);
    }
  }
  for (const key of packages.keys()) errors.push(`${key}: metadata package missing from lockfile`);
  for (const key of reviewed.keys()) errors.push(`${key}: stale inventory package`);
  return errors;
}

export async function verifyCargoNotices(base, inventory) {
  const errors = [];
  for (const row of inventory) {
    if (row.approval) {
      if (!/^docs\/licensing\/[A-Za-z0-9_-]+\.md$/.test(row.approval)) errors.push(`${cargoKey(row)}: unsafe approval path`);
      else try { if (!(await readFile(resolve(base, row.approval), 'utf8')).trim()) errors.push(`${cargoKey(row)}: empty approval evidence`); } catch { errors.push(`${cargoKey(row)}: missing approval evidence`); }
    }
    for (const notice of row.notices ?? []) {
      if (!/^docs\/licensing\/cargo\/[a-f0-9]{64}\.txt$/.test(notice.saved) || !/^[a-f0-9]{64}$/.test(notice.sha256)) { errors.push(`${cargoKey(row)}: unsafe notice path/hash`); continue; }
      try { if (textHash(await readFile(resolve(base, notice.saved), 'utf8')) !== notice.sha256) errors.push(`${cargoKey(row)}: retained notice hash differs`); }
      catch { errors.push(`${cargoKey(row)}: retained notice missing`); }
    }
  }
  return errors;
}

export async function auditCargoProject(base, { live = false, features = [] } = {}) {
  const [inventory, approvals, metadata, workspace] = await Promise.all(['docs/cargo-dependencies.json', 'docs/licensing/cargo-approvals.json', 'docs/cargo-metadata.json', 'docs/cargo-workspace.json'].map(async p => JSON.parse(await readFile(resolve(base, p), 'utf8'))));
  const lock = parseCargoLock(await readFile(resolve(base, 'Cargo.lock'), 'utf8'));
  const errors = [...auditCargoGraph(lock, metadata, inventory, approvals), ...await verifyCargoNotices(base, inventory)];
  for (const item of workspace.manifests) {
    if (!['Cargo.toml', 'apps/desktop/src-tauri/Cargo.toml'].includes(item.path)) { errors.push('Unreviewed Cargo workspace manifest'); continue; }
    if (textHash(await readFile(resolve(base, item.path), 'utf8')) !== item.sha256) errors.push(`${item.path}: workspace dependency declaration changed; review required`);
  }
  if (workspace.manifests.length !== 2 || new Set(workspace.manifests.map(p => p.path)).size !== 2) errors.push('Incomplete Cargo workspace review');
  if (!errors.length && live) {
    // Metadata resolves sources but does not execute crate build scripts. The
    // complete all-target graph is checked before any build is started.
    const args = ['metadata', '--locked', '--format-version', '1'];
    if (features.length) args.push('--features', features.join(','));
    const actual = JSON.parse(execFileSync('cargo', args, { cwd: base, env: nativeEnvironment(), windowsHide: true, maxBuffer: 16 * 1024 * 1024 }));
    errors.push(...auditCargoGraph(lock, actual, inventory, approvals));
  }
  return errors;
}

// Candidate review CLI accepts explicit inputs and never grants approvals or
// installs/builds crates. Product integration follows a reviewed Cargo adoption.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [lockPath, metadataPath, inventoryPath, approvalsPath] = process.argv.slice(2);
  try {
    if (!lockPath || !metadataPath || !inventoryPath) throw new Error('Usage: node scripts/audit-cargo.mjs Cargo.lock metadata.json inventory.json [approvals.json]');
    const lock = parseCargoLock(await readFile(lockPath, 'utf8'));
    const [metadata, inventory, approvals] = await Promise.all([metadataPath, inventoryPath, approvalsPath].map(async p => p ? JSON.parse(await readFile(p, 'utf8')) : []));
    const errors = auditCargoGraph(lock, metadata, inventory, approvals);
    errors.forEach(e => console.error(e));
    if (errors.length) process.exitCode = 1;
    else console.log('Complete Cargo graph metadata matches review. Retained notice and installed-source verification are separate required checks.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
