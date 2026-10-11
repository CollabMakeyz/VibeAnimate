const allowed = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause']);
export function selectedLicenses(expression, approvedTerms = []) {
  if (typeof expression !== 'string' || expression.length > 512) throw new Error('Missing or oversized SPDX expression');
  const tokens = expression.match(/[A-Za-z0-9.+-]+|[()]/g) ?? [];
  const permitted = new Set([...allowed, ...approvedTerms]);
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
      const qualified = `${value} WITH ${exception}`;
      return permitted.has(qualified) ? [qualified] : null;
    }
    return permitted.has(value) ? [value] : null;
  }
  function and() { let result = atom(); while (tokens[at] === 'AND') { at++; const next = atom(); result = result && next ? [...result, ...next] : null; } return result; }
  function or() { let result = and(); while (tokens[at] === 'OR') { at++; const next = and(); result ??= next; } return result; }
  const result = or();
  if (at !== tokens.length || !result) throw new Error('SPDX expression has no allowed branch or unsupported exception');
  return [...new Set(result)].sort();
}
