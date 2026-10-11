import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { root } from './check-research.mjs';

const allowed = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause']);
export function selectedLicenses(expression) {
  if (typeof expression !== 'string' || expression.length > 512) throw new Error('Missing or oversized SPDX expression');
  const tokens = expression.match(/[A-Za-z0-9.+-]+|[()]/g) ?? [];
  if (tokens.join('') !== expression.replace(/\s/g, '')) throw new Error('Invalid SPDX syntax');
  let at = 0;
  function atom() {
    const value = tokens[at++];
    if (value === '(') { const result = or(); if (tokens[at++] !== ')') throw new Error('Unclosed SPDX group'); return result; }
    if (!value || ['AND', 'OR', 'WITH', ')'].includes(value)) throw new Error('Invalid SPDX operand');
    if (tokens[at] === 'WITH') {
      at++;
      const exception = tokens[at++];
      if (!exception || ['AND', 'OR', 'WITH', '(', ')'].includes(exception)) throw new Error('Invalid SPDX exception');
      // A qualified license is not its unqualified base. No exception is globally
      // approved, but an independent allowed OR branch can still be selected.
      return null;
    }
    return allowed.has(value) ? [value] : null;
  }
  function and() { let result = atom(); while (tokens[at] === 'AND') { at++; const next = atom(); result = result && next ? [...result, ...next] : null; } return result; }
  function or() { let result = and(); while (tokens[at] === 'OR') { at++; const next = and(); result ??= next; } return result; }
  const result = or();
  if (at !== tokens.length || !result) throw new Error('SPDX expression has no allowed branch or unsupported exception');
  return [...new Set(result)].sort();
}

export function auditLock(lock, inventory, manifest, approvals = []) {
  const errors = [];
  if (lock.lockfileVersion !== 3 || !lock.packages?.['']) return ['Expected npm lockfile v3 with root package'];
  if (!Array.isArray(inventory)) return ['Missing adopted dependency inventory'];
  if (manifest.workspaces || lock.packages[''].workspaces) errors.push('Workspaces require recursive lock-root audit');
  const records = new Map();
  for (const item of inventory) {
    if (!item?.path || records.has(item.path)) errors.push('Missing or duplicate inventory path');
    else records.set(item.path, item);
  }
  for (const [path, pkg] of Object.entries(lock.packages)) {
    if (!path) continue;
    const record = records.get(path); records.delete(path);
    if (!record) { errors.push(`${path}: unreviewed dependency`); continue; }
    if (path !== `node_modules/${record.name}`) errors.push(`${path}: nested or aliased package requires separate resolver review`);
    for (const key of ['version', 'resolved', 'integrity', 'license']) {
      if (!pkg[key] || record[key] !== pkg[key]) errors.push(`${path}: inventory ${key} differs`);
    }
    if (!/^https:\/\/registry\.npmjs\.org\/[^?#]+\.tgz$/.test(pkg.resolved ?? '') || !/^sha512-[A-Za-z0-9+/]+=*$/.test(pkg.integrity ?? '')) errors.push(`${path}: unapproved source or missing integrity`);
    if (pkg.link || pkg.hasInstallScript) errors.push(`${path}: links/install scripts require separate review`);
    for (const key of ['name', 'purpose', 'relationship', 'source', 'reason', 'replacementDifficulty']) if (!record[key]) errors.push(`${path}: missing ${key}`);
    if (!record.bundledLicenseReview || !Array.isArray(record.notices) || !record.notices.length) errors.push(`${path}: bundled license/notice review missing`);
    if (record.scope !== 'development' || pkg.dev !== true) errors.push(`${path}: runtime adoption requires separate review`);
    if (JSON.stringify(Object.entries(pkg.dependencies ?? {}).sort()) !== JSON.stringify(Object.entries(record.dependencies ?? {}).sort())) errors.push(`${path}: dependency edges differ from reviewed inventory`);
    for (const name of Object.keys(pkg.dependencies ?? {})) if (!lock.packages[`node_modules/${name}`]) errors.push(`${path}: missing transitive ${name}`);
    if (Object.keys(pkg.optionalDependencies ?? {}).length || Object.keys(pkg.peerDependencies ?? {}).length || pkg.bundledDependencies?.length) errors.push(`${path}: optional/peer/bundled graph needs explicit resolver review`);
    if (!Array.isArray(record.additionalTerms)) errors.push(`${path}: additional bundled terms review missing`);
    if ((record.approval || record.additionalTerms?.length) && !approvals.some(a => a.decision === 'approved' && a.name === record.name && a.version === record.version && a.integrity === record.integrity && a.scope === record.scope && a.evidence === record.approval && JSON.stringify(a.additionalTerms) === JSON.stringify(record.additionalTerms) && JSON.stringify(a.noticeHashes) === JSON.stringify((record.notices ?? []).map(n => n.sha256)))) errors.push(`${path}: exact bundled-license approval missing`);
    try { if (JSON.stringify(selectedLicenses(pkg.license)) !== JSON.stringify(record.selectedLicenses)) errors.push(`${path}: selected license branch differs`); }
    catch (error) { errors.push(`${path}: ${error.message}`); }
  }
  for (const path of records.keys()) errors.push(`${path}: stale inventory record`);
  for (const kind of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const direct = manifest[kind] ?? {};
    if (JSON.stringify(Object.entries(direct).sort()) !== JSON.stringify(Object.entries(lock.packages[''][kind] ?? {}).sort())) errors.push(`Root ${kind} differs from lockfile`);
    for (const [name, version] of Object.entries(direct)) {
      if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(version) || lock.packages[`node_modules/${name}`]?.version !== version) errors.push(`${name}: direct dependency must match an exact locked version`);
    }
  }
  return errors;
}

export async function auditDependencies(base = root) {
  const [lock, inventory, manifest, approvals] = await Promise.all(['package-lock.json', 'docs/dependencies.json', 'package.json', 'docs/licensing/approvals.json'].map(async p => JSON.parse(await readFile(resolve(base, p), 'utf8'))));
  const errors = auditLock(lock, inventory, manifest, approvals);
  for (const row of inventory) {
    if (row.approval) {
      if (!/^docs\/licensing\/[A-Za-z0-9_.-]+\.md$/.test(row.approval)) errors.push(`${row.name}: invalid approval evidence path`);
      else try { if (!(await readFile(resolve(base, row.approval), 'utf8')).trim()) errors.push(`${row.name}: empty approval evidence`); } catch { errors.push(`${row.name}: missing approval evidence`); }
    }
    for (const notice of row.notices ?? []) {
      if (!/^docs\/licensing\/[A-Za-z0-9_.-]+$/.test(notice.saved) || !/^[A-Za-z0-9_.-]+$/.test(notice.file)) { errors.push(`${row.name}: unsafe notice path`); continue; }
      try {
        const content = (await readFile(resolve(base, notice.saved), 'utf8')).replaceAll('\r\n', '\n');
        if (createHash('sha256').update(content).digest('hex') !== notice.sha256) errors.push(`${row.name}: reviewed notice hash differs`);
        if (process.argv.includes('--installed')) {
          const installed = (await readFile(resolve(base, row.path, notice.file), 'utf8')).replaceAll('\r\n', '\n');
          if (installed !== content) errors.push(`${row.name}: installed notice differs`);
        }
      } catch { errors.push(`${row.name}: missing notice file`); }
    }
  }
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'dist', 'target', 'work'].includes(entry.name)) continue;
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (['Cargo.toml', 'Cargo.lock', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb'].includes(entry.name)) errors.push(`${path}: graph requires an implemented format-specific license audit`);
      else if (entry.name === 'package.json' && path !== resolve(base, 'package.json')) {
        const nested = JSON.parse(await readFile(path, 'utf8'));
        if (['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'].some(k => Object.keys(nested[k] ?? {}).length)) errors.push(`${path}: workspace dependencies require recursive lock-root audit`);
      }
    }
  }
  await visit(base);
  return errors;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { const errors = await auditDependencies(); errors.forEach(e => console.error(e)); if (errors.length) process.exitCode = 1; else console.log('Pinned development npm inventory, notices and scoped approvals verified; runtime/Cargo adoption remains gated.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
