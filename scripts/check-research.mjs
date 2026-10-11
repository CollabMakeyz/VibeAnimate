import { readFile, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const productionStates = new Set(['NOT IMPLEMENTED', 'PARTIAL', 'EXPERIMENTAL', 'DONE']);
const gateStates = new Set(['NOT STARTED', 'PARTIAL', 'REVIEWED']);
const sourceStates = new Set(['located', 'retrieved']);
const featureFields = ['id', 'feature', 'category', 'historicalBehavior', 'reference',
  'confidence', 'requiredParity', 'modernExtension', 'milestone',
  'implementationStatus', 'manualTest', 'knownDeviations'];

export function validateResearch({ sources, features, risks, gates }) {
  const errors = [];
  for (const [label, list] of Object.entries({ sources, features, risks })) {
    if (!Array.isArray(list) || list.length === 0) errors.push(`${label}: nonempty array required`);
  }
  if (errors.length) return errors;
  const ids = (rows, label) => {
    const seen = new Set();
    for (const row of rows) {
      if (!row || typeof row.id !== 'string' || !row.id.trim()) {
        errors.push(`${label}: missing id`);
        continue;
      }
      if (seen.has(row.id)) errors.push(`${label}: duplicate id ${row.id}`);
      seen.add(row.id);
    }
    return seen;
  };
  const sourceIds = ids(sources, 'source');
  ids(features, 'feature');
  ids(risks, 'risk');
  for (const source of sources) {
    if (!source) continue;
    if (!['A', 'B', 'C', 'D'].includes(source.classification)) errors.push(`${source.id}: invalid source classification`);
    if (!sourceStates.has(source.status)) errors.push(`${source.id}: invalid source status`);
    try {
      if (new URL(source.url).protocol !== 'https:') throw new Error('HTTPS required');
    } catch {
      errors.push(`${source.id}: invalid HTTPS source URL`);
    }
    if (!source.title || !source.version || !/^\d{4}-\d{2}-\d{2}$/.test(source.retrieved ?? '')) {
      errors.push(`${source.id}: title/version/retrieval date required`);
    }
  }
  const milestones = new Set();
  for (const feature of features) {
    if (!feature) continue;
    for (const field of featureFields) {
      if (typeof feature[field] !== 'string' || !feature[field].trim()) errors.push(`${feature.id}: missing ${field}`);
    }
    if (feature.reference !== 'PLAN' && !sourceIds.has(feature.reference)) errors.push(`${feature.id}: unknown reference ${feature.reference}`);
    if (!/^M([1-9]|10|11)$/.test(feature.milestone ?? '')) errors.push(`${feature.id}: invalid milestone`);
    milestones.add(feature.milestone);
    if (!productionStates.has(feature.implementationStatus)) errors.push(`${feature.id}: invalid implementation status`);
    const test = feature.automatedTest;
    if (!test || typeof test.id !== 'string' || !test.id.trim() || !['PLANNED', 'PASS', 'FAIL'].includes(test.status)) {
      errors.push(`${feature.id}: explicit test id/status required`);
    }
    if (feature.implementationStatus === 'DONE') {
      if (test?.status !== 'PASS' || !Array.isArray(feature.acceptanceEvidence) || feature.acceptanceEvidence.length === 0) {
        errors.push(`${feature.id}: DONE requires passed tests and acceptance evidence`);
      }
    }
  }
  for (let i = 1; i <= 11; i++) if (!milestones.has(`M${i}`)) errors.push(`missing milestone M${i}`);
  for (const risk of risks) {
    if (!risk) continue;
    for (const field of ['risk', 'likelihood', 'impact', 'mitigation', 'owner', 'trigger', 'status']) {
      if (typeof risk[field] !== 'string' || !risk[field].trim()) errors.push(`${risk.id}: missing ${field}`);
    }
  }
  if (!gates || !Array.isArray(gates.gates) || gates.gates.length === 0) {
    errors.push('research gates: nonempty array required');
  } else {
    ids(gates.gates, 'gate');
    for (const gate of gates.gates) {
      if (!gate) continue;
      if (!gateStates.has(gate.status)) errors.push(`${gate.id}: invalid gate status`);
      if (!Array.isArray(gate.evidence) || gate.evidence.length === 0 || !gate.next) errors.push(`${gate.id}: evidence and next action required`);
    }
    if (!['PARTIAL', 'COMPLETE'].includes(gates.status)) errors.push('invalid phase status');
    if (gates.status === 'COMPLETE' && gates.gates.some(g => g?.status !== 'REVIEWED')) {
      errors.push('Phase Zero cannot be COMPLETE with unreviewed gates');
    }
  }
  return errors;
}

export function resolveEvidencePath(base, value) {
  if (typeof value !== 'string' || !value || isAbsolute(value) || /^[A-Za-z]:/.test(value) || value.includes('\\') || value.includes('\0')) {
    throw new Error(`Invalid repository evidence path: ${String(value)}`);
  }
  const target = resolve(base, value);
  const local = relative(base, target);
  if (local === '..' || local.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(local) || !local) {
    throw new Error(`Evidence path escapes repository: ${value}`);
  }
  return target;
}

export async function loadResearch(base = root) {
  const names = { sources: 'sources', features: 'feature-matrix', risks: 'risks', gates: 'research-gates' };
  const entries = await Promise.all(Object.entries(names).map(async ([key, name]) => [key,
    JSON.parse(await readFile(resolve(base, 'docs', `${name}.json`), 'utf8'))]));
  return Object.fromEntries(entries);
}

export async function checkResearch(base = root, requireComplete = false) {
  const data = await loadResearch(base);
  const errors = validateResearch(data);
  const paths = new Set((data.gates?.gates ?? []).flatMap(g => Array.isArray(g?.evidence) ? g.evidence : []));
  for (const feature of data.features ?? []) {
    if (feature?.implementationStatus === 'DONE' && Array.isArray(feature.acceptanceEvidence)) {
      for (const path of feature.acceptanceEvidence) paths.add(path);
    }
  }
  for (const path of paths) {
    try {
      const info = await stat(resolveEvidencePath(base, path));
      if (!info.isFile() || info.size === 0) errors.push(`Evidence must be a nonempty file: ${path}`);
    } catch (error) {
      errors.push(`Evidence unavailable: ${path} (${error.message})`);
    }
  }
  if (requireComplete) errors.push(...phaseZeroExitErrors(data.gates));
  return { errors, data };
}

export function phaseZeroExitErrors(gates) {
  const errors = [];
  if (gates?.status !== 'COMPLETE') errors.push(`Phase Zero status is ${gates?.status ?? 'MISSING'}`);
  if (!Array.isArray(gates?.gates) || !gates.gates.length) errors.push('Phase Zero gate inventory is missing');
  for (const gate of gates?.gates ?? []) {
    if (gate?.status !== 'REVIEWED') errors.push(`Open gate ${gate?.id ?? 'UNKNOWN'}: ${gate?.next ?? 'Review missing record'}`);
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { errors, data } = await checkResearch(root, process.argv.includes('--gate'));
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
    } else {
      console.log(`Research records valid: ${data.features.length} features, ${data.sources.length} sources, ${data.risks.length} risks.`);
      console.log(`Phase Zero: ${data.gates.status}. Record validation does not establish production functionality or historical completeness.`);
    }
  } catch (error) {
    console.error(`Research validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
