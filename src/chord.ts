/**
 * Chord root detection + chord name (suffix) detection for auto just-intonation.
 *
 * Each candidate root is scored by the harmonic weight of intervals formed
 * with the other played notes. The lowest sounding note (bass) provides a
 * small tiebreaker bonus, matching tonal-music convention.
 *
 *  P5  (7)  = 5   – strongest root indicator
 *  P4  (5)  = 4   – inversion of P5
 *  M3  (4)  = 3
 *  m3  (3)  = 3
 *  M6  (9)  = 2
 *  m6  (8)  = 2
 *  m7  (10) = 2   – dominant 7th
 *  M7  (11) = 2
 *  M2  (2)  = 1
 *  m2  (1)  = -1  – dissonant
 *  TT  (6)  = -2  – tritone
 */
const INTERVAL_WEIGHT: Readonly<Record<number, number>> = {
  0: 0, 1: -1, 2: 1, 3: 3, 4: 3, 5: 4,
  6: -2, 7: 5, 8: 2, 9: 2, 10: 2, 11: 2,
};

/**
 * Returns the most likely root pitch-class (0-11) from a set of
 * simultaneously played MIDI notes (with octave info), or null if empty.
 */
export function detectRoot(midis: number[]): number | null {
  if (midis.length === 0) return null;

  const pcs = [...new Set(midis.map((m) => ((m % 12) + 12) % 12))];
  if (pcs.length === 1) return pcs[0];

  // Bass note (lowest pitch) pitch class — used as tiebreaker
  let lowestMidi = midis[0];
  for (const m of midis) if (m < lowestMidi) lowestMidi = m;
  const bassPc = ((lowestMidi % 12) + 12) % 12;

  let bestRoot = pcs[0];
  let bestScore = -Infinity;

  for (const root of pcs) {
    let score = 0;
    for (const pc of pcs) {
      if (pc === root) continue;
      const interval = (pc - root + 12) % 12;
      score += INTERVAL_WEIGHT[interval] ?? 0;
    }
    if (root === bassPc) score += 1; // bass-note bonus
    if (score > bestScore) {
      bestScore = score;
      bestRoot = root;
    }
  }

  return bestRoot;
}

/**
 * Chord pattern dictionary. Each pattern lists the intervals (mod 12) from
 * the root and the suffix appended after the root note name.
 *
 * Matching is exact: the played pitch-class set (after subtracting root)
 * must equal the pattern's interval set.
 */
const CHORD_PATTERNS: ReadonlyArray<{ intervals: ReadonlyArray<number>; suffix: string }> = [
  // 5-note extended chords
  { intervals: [0, 4, 7, 10, 2], suffix: '9' },
  { intervals: [0, 4, 7, 11, 2], suffix: 'M9' },
  { intervals: [0, 3, 7, 10, 2], suffix: 'm9' },
  { intervals: [0, 3, 7, 11, 2], suffix: 'mM9' },
  { intervals: [0, 4, 7, 9, 2],  suffix: '6/9' },
  { intervals: [0, 3, 7, 9, 2],  suffix: 'm6/9' },

  // 4-note 7th chords
  { intervals: [0, 4, 7, 10], suffix: '7' },
  { intervals: [0, 4, 7, 11], suffix: 'M7' },
  { intervals: [0, 3, 7, 10], suffix: 'm7' },
  { intervals: [0, 3, 7, 11], suffix: 'mM7' },
  { intervals: [0, 3, 6, 9],  suffix: 'dim7' },
  { intervals: [0, 3, 6, 10], suffix: 'm7b5' },
  { intervals: [0, 4, 8, 10], suffix: 'aug7' },
  { intervals: [0, 4, 8, 11], suffix: 'augM7' },

  // 4-note 6th and add chords
  { intervals: [0, 4, 7, 9], suffix: '6' },
  { intervals: [0, 3, 7, 9], suffix: 'm6' },
  { intervals: [0, 4, 7, 2], suffix: 'add9' },
  { intervals: [0, 3, 7, 2], suffix: 'm(add9)' },
  { intervals: [0, 5, 7, 10], suffix: '7sus4' },

  // 3-note triads
  { intervals: [0, 4, 7], suffix: '' },      // Major
  { intervals: [0, 3, 7], suffix: 'm' },
  { intervals: [0, 3, 6], suffix: 'dim' },
  { intervals: [0, 4, 8], suffix: 'aug' },
  { intervals: [0, 2, 7], suffix: 'sus2' },
  { intervals: [0, 5, 7], suffix: 'sus4' },

  // 3-note rootless / 5-omitted 7th chords
  { intervals: [0, 4, 10], suffix: '7(no5)' },
  { intervals: [0, 4, 11], suffix: 'M7(no5)' },
  { intervals: [0, 3, 10], suffix: 'm7(no5)' },

  // 2-note
  { intervals: [0, 7], suffix: '5' },       // power chord
];

/**
 * Returns the chord suffix (e.g. "m7", "M7", "sus4") for a given root and
 * a set of pitch-classes, or empty string if no pattern matches or fewer
 * than 2 unique notes are present.
 */
export function detectChordSuffix(pitchClasses: number[], root: number): string {
  const uniquePcs = [...new Set(pitchClasses)];
  if (uniquePcs.length < 2) return '';

  const intervals = new Set<number>();
  for (const pc of uniquePcs) {
    intervals.add(((pc - root) % 12 + 12) % 12);
  }

  for (const pattern of CHORD_PATTERNS) {
    if (pattern.intervals.length !== intervals.size) continue;
    let match = true;
    for (const i of pattern.intervals) {
      if (!intervals.has(i)) { match = false; break; }
    }
    if (match) return pattern.suffix;
  }

  return '';
}
