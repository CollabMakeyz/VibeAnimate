export function seededRandom(seed) {
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffffffff) throw new RangeError('Seed must be a nonzero uint32');
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

// Nearest-rank percentiles, reported explicitly rather than interpolated silently.
export function summarize(samples) {
  if (!Array.isArray(samples) || samples.length === 0 || samples.some(x => !Number.isFinite(x) || x < 0)) {
    throw new RangeError('Timings must be a nonempty array of finite nonnegative values');
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = p => sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
  return { count: sorted.length, min: sorted[0], p50: rank(0.5), p95: rank(0.95), p99: rank(0.99), max: sorted.at(-1), method: 'nearest-rank' };
}
