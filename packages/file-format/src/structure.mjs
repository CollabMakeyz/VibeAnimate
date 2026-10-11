import Ajv2020 from 'ajv/dist/2020.js';
import { schema } from '../schema/v1.mjs';

const ajv = new Ajv2020({ strict: true, allErrors: false, coerceTypes: false, useDefaults: false,
  removeAdditional: false, ownProperties: true, validateFormats: true });
ajv.addFormat('utc-date-time', value => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const date = new Date(value); return Number.isFinite(date.getTime()) && date.toISOString() === value;
});
ajv.addSchema(schema);
const validators = Object.fromEntries(['DocumentDTO', 'ManifestDTO'].map(name => [name, ajv.getSchema(`${schema.$id}#/$defs/${name}`)]));

// This validates data shape only. It is not semantic graph validation or a loader.
export function validateStructure(kind, value, limits = {}) {
  const validator = Object.hasOwn(validators, kind) ? validators[kind] : undefined;
  if (!validator) throw new RangeError('Unknown contract kind');
  const maxDepth = limits.maxDepth ?? 64, maxNodes = limits.maxNodes ?? 2000000;
  if (![maxDepth, maxNodes].every(n => Number.isSafeInteger(n) && n > 0) || maxDepth > 128 || maxNodes > 4000000) throw new RangeError('Invalid structure budget');
  const active = new Set(), work = [{ value, depth: 0, path: '', exit: false }];
  let count = 0;
  while (work.length) {
    const item = work.pop();
    if (item.exit) { active.delete(item.value); continue; }
    if (++count > maxNodes) return { ok: false, path: item.path, reason: 'Structure node budget exceeded' };
    if (item.depth > maxDepth) return { ok: false, path: item.path, reason: 'Structure nesting budget exceeded' };
    const current = item.value, type = typeof current;
    if (current === null || type === 'string' || type === 'boolean') continue;
    if (type === 'number') { if (!Number.isFinite(current)) return { ok: false, path: item.path, reason: 'Nonfinite number' }; continue; }
    if (type !== 'object') return { ok: false, path: item.path, reason: 'Not JSON data' };
    if (active.has(current)) return { ok: false, path: item.path, reason: 'Cyclic runtime object' };
    const isArray = Array.isArray(current), proto = Object.getPrototypeOf(current);
    if (isArray && proto !== Array.prototype) return { ok: false, path: item.path, reason: 'Runtime array class is not a DTO' };
    if (!isArray && proto !== Object.prototype && proto !== null) return { ok: false, path: item.path, reason: 'Runtime class instance is not a DTO' };
    const keys = Reflect.ownKeys(current).filter(key => !(isArray && key === 'length'));
    if (keys.length + work.length + count > maxNodes) return { ok: false, path: item.path, reason: 'Structure node budget exceeded' };
    if (isArray && keys.length !== current.length) return { ok: false, path: item.path, reason: 'Sparse or decorated array' };
    active.add(current); work.push({ ...item, exit: true });
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (typeof key !== 'string' || !descriptor.enumerable || !('value' in descriptor) ||
          (isArray && !/^(0|[1-9]\d*)$/.test(key))) return { ok: false, path: item.path, reason: 'DTO fields must be enumerable data properties' };
      work.push({ value: descriptor.value, depth: item.depth + 1, path: `${item.path}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`, exit: false });
    }
  }
  if (validator(value)) return { ok: true };
  const error = validator.errors?.[0];
  return { ok: false, path: error?.instancePath ?? '', reason: error?.message ?? 'Invalid structure' };
}
