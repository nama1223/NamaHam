const JUST_RATIOS = [
  1 / 1,
  16 / 15,
  9 / 8,
  6 / 5,
  5 / 4,
  4 / 3,
  45 / 32,
  3 / 2,
  8 / 5,
  5 / 3,
  9 / 5,
  15 / 8,
];

export function equalFreq(midi: number, concertPitch: number): number {
  return concertPitch * Math.pow(2, (midi - 69) / 12);
}

export function justFreq(midi: number, keyPc: number, concertPitch: number): number {
  let rootMidi = Math.floor(midi / 12) * 12 + keyPc;
  if (rootMidi > midi) rootMidi -= 12;
  const interval = midi - rootMidi;
  const rootFreq = equalFreq(rootMidi, concertPitch);
  return rootFreq * JUST_RATIOS[interval];
}

export function noteFreq(
  midi: number,
  temperament: 'equal' | 'just',
  keyPc: number,
  concertPitch: number,
): number {
  if (temperament === 'just') return justFreq(midi, keyPc, concertPitch);
  return equalFreq(midi, concertPitch);
}

export function midiFromRowAndIndex(rowOctave: number, scaleIndex: number): number {
  return (rowOctave + 1) * 12 + scaleIndex;
}

export function pcToName(pc: number, useFlat = false): string {
  const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const n = ((pc % 12) + 12) % 12;
  return (useFlat ? FLAT : SHARP)[n];
}
