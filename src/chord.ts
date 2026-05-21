/**
 * Chord root detection for auto just-intonation key selection.
 *
 * For each candidate root (must be one of the played pitch-classes),
 * we score how well the other notes behave as chord tones above it,
 * using the acoustic/harmonic weight of each interval:
 *
 *  P5  (7)  = 5  – strongest root indicator
 *  P4  (5)  = 4  – inversion of P5
 *  M3  (4)  = 3
 *  m3  (3)  = 3
 *  m7  (10) = 2  – dominant 7th
 *  M6  (9)  = 2
 *  m6  (8)  = 2
 *  M7  (11) = 2
 *  M2  (2)  = 1
 *  m2  (1)  = -1 – dissonant
 *  TT  (6)  = -2 – tritone
 */
const INTERVAL_WEIGHT: Readonly<Record<number, number>> = {
  0: 0, 1: -1, 2: 1, 3: 3, 4: 3, 5: 4,
  6: -2, 7: 5, 8: 2, 9: 2, 10: 2, 11: 2,
};

/**
 * Returns the most likely root pitch-class (0-11) from a set of
 * simultaneously played pitch-classes, or null if the set is empty.
 */
export function detectRoot(pitchClasses: number[]): number | null {
  if (pitchClasses.length === 0) return null;

  // Deduplicate
  const pcs = [...new Set(pitchClasses)];
  if (pcs.length === 1) return pcs[0];

  let bestRoot = pcs[0];
  let bestScore = -Infinity;

  for (const root of pcs) {
    let score = 0;
    for (const pc of pcs) {
      if (pc === root) continue;
      const interval = (pc - root + 12) % 12;
      score += INTERVAL_WEIGHT[interval] ?? 0;
    }
    if (score > bestScore) {
      bestScore = score;
      bestRoot = root;
    }
  }

  return bestRoot;
}
