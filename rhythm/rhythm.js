(function (root) {
  'use strict';
  const patterns = [
    { id: 'steady', title: 'Four steady taps', subtitle: 'A gentle place to begin', beats: [0, 1, 2, 3], description: 'Four taps, with the same space between each. Listen for a steady, unhurried pulse.' },
    { id: 'skip', title: 'A little syncopation', subtitle: 'Find the shorter gap', beats: [0, 1, 1.5, 3], description: 'Two taps come closer together in the middle. Leave a longer pause before the last tap.' },
    { id: 'five', title: 'Five little footsteps', subtitle: 'Give the pattern a twist', beats: [0, 0.5, 1.5, 2, 3], description: 'Five taps across four beats. Listen for the alternating short and long spaces.' }
  ];
  function targets(pattern, bpm) { return pattern.beats.map(beat => beat * 60000 / bpm); }
  function analyze(pattern, bpm, taps) {
    const expected = targets(pattern, bpm);
    if (!Array.isArray(taps) || taps.some((v, i) => !Number.isFinite(v) || v < 0 || (i > 0 && v < taps[i - 1]))) throw new Error('Taps must be ordered nonnegative milliseconds.');
    const normalized = taps.length ? taps.map(t => t - taps[0]) : [];
    const countMatches = normalized.length === expected.length;
    const deltas = countMatches ? normalized.map((t, i) => t - expected[i]) : [];
    const intervals = countMatches ? normalized.slice(1).map((t, i) => ({ from: i + 1, to: i + 2, expected: expected[i + 1] - expected[i], actual: t - normalized[i], error: (t - normalized[i]) - (expected[i + 1] - expected[i]) })) : [];
    const meanIntervalError = intervals.length ? Math.round(intervals.reduce((sum, v) => sum + Math.abs(v.error), 0) / intervals.length) : null;
    const worst = intervals.length ? intervals.reduce((a, b) => Math.abs(a.error) >= Math.abs(b.error) ? a : b) : null;
    return { expected, taps: normalized, countMatches, missing: Math.max(0, expected.length - normalized.length), extra: Math.max(0, normalized.length - expected.length), deltas, intervals, meanIntervalError, worst };
  }
  const api = { patterns, targets, analyze };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CopyTryRhythm = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
