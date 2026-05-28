import { store, NOTE_NAMES_FLAT } from './state';
import { audio } from './tones';
import { noteFreq, pcToName } from './pitch';
import { detectRoot, detectChordSuffix } from './chord';

const ROWS_FROM_TOP = [5, 4, 3, 2];
const WHITE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_OFFSETS: Array<[number, number] | null> = [
  [1, 1],
  [3, 2],
  null,
  [6, 4],
  [8, 5],
  [10, 6],
  null,
];

interface ActivePointer {
  voiceKey: string;
  rawMidi: number;
}

const pointerMap = new Map<number, ActivePointer>();
// Key = voiceKey ("n{origRawMidi}") — stable, used for audio.stop/setFrequency
// Value = displayMidi — visual key position, shifts with octaveOffset
const sustainedKeys = new Map<string, number>();
let prevOctaveOffset = 0; // synced in createKeyboard()

/** Find the voiceKey of a sustained note currently displayed at displayMidi. */
function findSustainedByDisplay(displayMidi: number): string | undefined {
  for (const [vk, dm] of sustainedKeys) {
    if (dm === displayMidi) return vk;
  }
  return undefined;
}

function buildVoiceKey(rawMidi: number): string {
  return `n${rawMidi}`;
}

function effectiveFreq(rawMidi: number): number {
  const transpose = store.get('transpose');
  const octaveOffset = store.get('octaveOffset');
  const concertPitch = store.get('concertPitch');
  const temperament = store.get('temperament');
  const key = store.get('key');
  const midi = rawMidi + transpose + octaveOffset * 12;
  return noteFreq(midi, temperament, key, concertPitch);
}

function startKey(rawMidi: number): void {
  if (store.get('rootMode')) {
    const pc = ((rawMidi % 12) + 12) % 12;
    const transposed = (pc + store.get('transpose')) % 12;
    store.set('key', transposed);
    store.set('keyAuto', false); // manual root tap exits auto mode
    store.set('rootMode', false);
    flashKey(rawMidi);
    return;
  }
  const voiceKey = buildVoiceKey(rawMidi);
  audio.start(voiceKey, effectiveFreq(rawMidi));
  setKeyVisualActive(rawMidi, true);
}

function stopKey(rawMidi: number): void {
  const voiceKey = buildVoiceKey(rawMidi);
  audio.stop(voiceKey);
  setKeyVisualActive(rawMidi, false);
}

function setKeyVisualActive(rawMidi: number, active: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-midi="${rawMidi}"]`).forEach((el) => {
    if (active) el.classList.add('active');
    else el.classList.remove('active');
  });
}

function flashKey(rawMidi: number): void {
  document.querySelectorAll<HTMLElement>(`[data-midi="${rawMidi}"]`).forEach((el) => {
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 220);
  });
}

function pickKeyAt(x: number, y: number): HTMLElement | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  return (el as HTMLElement).closest<HTMLElement>('[data-midi]');
}

function handleSustainTap(rawMidi: number): void {
  if (store.get('rootMode')) {
    const pc = ((rawMidi % 12) + 12) % 12;
    const transposed = (pc + store.get('transpose')) % 12;
    store.set('key', transposed);
    store.set('keyAuto', false); // manual root tap exits auto mode
    store.set('rootMode', false);
    flashKey(rawMidi);
    return;
  }
  // Look up by current display position (displayMidi may differ from origRawMidi
  // if octaveOffset changed while this note was held).
  const existingKey = findSustainedByDisplay(rawMidi);
  if (existingKey !== undefined) {
    sustainedKeys.delete(existingKey);
    audio.stop(existingKey);
    setKeyVisualActive(rawMidi, false);
    onNotesChanged();
  } else {
    // Key the voice by effective MIDI (not rawMidi) so that after an octave
    // shift, pressing a different physical key at the same position never
    // collides with the sustained note that moved there.
    // e.g. C3 pressed at octaveOffset=-2 → voiceKey="s48";
    //      after offset→-1 the same rawMidi now sounds C4 → voiceKey="s60" (no clash)
    const effectiveMidi = rawMidi + store.get('transpose') + store.get('octaveOffset') * 12;
    const voiceKey = `s${effectiveMidi}`;
    sustainedKeys.set(voiceKey, rawMidi); // displayMidi = rawMidi at press time
    audio.start(voiceKey, effectiveFreq(rawMidi));
    setKeyVisualActive(rawMidi, true);
    onNotesChanged();
  }
}

function clearSustained(): void {
  for (const [vk, displayMidi] of Array.from(sustainedKeys.entries())) {
    audio.stop(vk);
    setKeyVisualActive(displayMidi, false);
  }
  sustainedKeys.clear();
}

/**
 * Called after any note start/stop to update auto-detected key and chord name.
 * Uses (rawMidi + transpose) so detection is based on the SOUNDING pitches,
 * not the visible keyboard positions.
 */
function onNotesChanged(): void {
  const transpose = store.get('transpose');
  const midis: number[] = [];

  for (const entry of pointerMap.values()) {
    midis.push(entry.rawMidi + transpose);
  }
  for (const rawMidi of sustainedKeys.values()) {
    const midi = rawMidi + transpose;
    if (!midis.includes(midi)) midis.push(midi);
  }

  if (!store.get('keyAuto')) {
    if (store.get('chordSuffix') !== '') store.set('chordSuffix', '');
    return;
  }

  if (midis.length === 0) {
    // Keep last detected key, but clear the chord-name suffix
    if (store.get('chordSuffix') !== '') store.set('chordSuffix', '');
    return;
  }

  const root = detectRoot(midis);
  if (root === null) return;
  if (root !== store.get('key')) store.set('key', root);

  const pcs = midis.map((m) => ((m % 12) + 12) % 12);
  const suffix = detectChordSuffix(pcs, root);
  if (suffix !== store.get('chordSuffix')) store.set('chordSuffix', suffix);
}

function refreshAllFrequencies(): void {
  for (const entry of pointerMap.values()) {
    audio.setFrequency(entry.voiceKey, effectiveFreq(entry.rawMidi));
  }
  // Use displayMidi so that effectiveFreq() computes the ORIGINAL sounding pitch
  // even after octaveOffset has changed (displayMidi is already adjusted).
  for (const [vk, displayMidi] of sustainedKeys) {
    audio.setFrequency(vk, effectiveFreq(displayMidi));
  }
}

export function createKeyboard(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'keyboard';

  const labelEls: HTMLElement[] = [];

  ROWS_FROM_TOP.forEach((rowOctave) => {
    const row = document.createElement('div');
    row.className = 'kb-row';
    row.dataset.rowOctave = String(rowOctave);

    const numLabel = document.createElement('div');
    numLabel.className = 'kb-octave-label';
    numLabel.textContent = String(rowOctave);
    row.appendChild(numLabel);
    labelEls.push(numLabel);

    const whites = document.createElement('div');
    whites.className = 'kb-whites';
    WHITE_OFFSETS.forEach((off, idx) => {
      const k = document.createElement('div');
      k.className = 'kb-key kb-white';
      const rawMidi = (rowOctave + 1) * 12 + off;
      k.dataset.midi = String(rawMidi);
      k.style.left = `${(idx / 7) * 100}%`;
      k.style.width = `${(1 / 7) * 100}%`;
      whites.appendChild(k);
    });
    row.appendChild(whites);

    if (rowOctave === 4) {
      const logo = document.createElement('div');
      logo.className = 'kb-logo';
      const updateLogo = () => {
        logo.textContent = store.get('lang') === 'en' ? 'NamaHarmony' : 'NamaHam';
      };
      updateLogo();
      store.on('lang', updateLogo);
      row.appendChild(logo);
    }

    const blacks = document.createElement('div');
    blacks.className = 'kb-blacks';
    BLACK_OFFSETS.forEach((b, idx) => {
      if (!b) return;
      const [off] = b;
      const k = document.createElement('div');
      k.className = 'kb-key kb-black';
      const rawMidi = (rowOctave + 1) * 12 + off;
      k.dataset.midi = String(rawMidi);
      const center = ((idx + 1) / 7) * 100;
      const w = (1 / 7) * 100 * 0.6;
      k.style.left = `calc(${center}% - ${w / 2}%)`;
      k.style.width = `${w}%`;
      blacks.appendChild(k);
    });
    row.appendChild(blacks);

    wrap.appendChild(row);
  });

  const updateLabels = () => {
    const off = store.get('octaveOffset');
    labelEls.forEach((el, idx) => {
      el.textContent = String(ROWS_FROM_TOP[idx] + off);
    });
  };
  updateLabels();
  prevOctaveOffset = store.get('octaveOffset');
  store.on('octaveOffset', updateLabels);

  store.on('octaveOffset', (newOff) => {
    const delta = newOff - prevOctaveOffset;
    prevOctaveOffset = newOff;

    // Pointer-held notes: retune to new octave as usual
    for (const entry of pointerMap.values()) {
      audio.setFrequency(entry.voiceKey, effectiveFreq(entry.rawMidi));
    }

    // Sustained notes: shift the DISPLAY position by -delta octaves.
    // The audio voice is untouched — pitch stays exactly as pressed.
    // Two-pass: remove ALL old highlights first, then add new ones.
    // Without this, iterating order can cause a removal in pass N to wipe out
    // a highlight that was just added in pass N-1 when two notes' display
    // positions cross each other during the shift (e.g. C4→72 then C5 removes 72).
    for (const displayMidi of sustainedKeys.values()) {
      setKeyVisualActive(displayMidi, false);
    }
    for (const [vk, displayMidi] of Array.from(sustainedKeys.entries())) {
      const newDisplay = displayMidi - delta * 12;
      sustainedKeys.set(vk, newDisplay);
      if (document.querySelector(`[data-midi="${newDisplay}"]`)) {
        setKeyVisualActive(newDisplay, true);
      }
    }
  });
  store.on('transpose', refreshAllFrequencies);
  store.on('transpose', onNotesChanged); // re-detect key when transpose changes
  store.on('concertPitch', refreshAllFrequencies);
  store.on('temperament', refreshAllFrequencies);
  store.on('key', refreshAllFrequencies);
  store.on('keyAuto', onNotesChanged);   // re-detect or clear suffix on mode toggle
  store.on('sustain', (on) => { if (!on) clearSustained(); });

  wrap.addEventListener('pointerdown', (e: PointerEvent) => {
    const target = pickKeyAt(e.clientX, e.clientY);
    if (!target) return;
    const rawMidi = Number(target.dataset.midi);
    if (Number.isNaN(rawMidi)) return;
    audio.ensureContext();
    if (store.get('sustain')) {
      handleSustainTap(rawMidi);
      return;
    }
    pointerMap.set(e.pointerId, { voiceKey: buildVoiceKey(rawMidi), rawMidi });
    startKey(rawMidi);
    onNotesChanged();
    try { wrap.setPointerCapture(e.pointerId); } catch {}
  });

  wrap.addEventListener('pointermove', (e: PointerEvent) => {
    if (store.get('sustain')) return;
    const entry = pointerMap.get(e.pointerId);
    if (!entry) return;
    const target = pickKeyAt(e.clientX, e.clientY);
    const newMidi = target ? Number(target.dataset.midi) : NaN;
    if (Number.isNaN(newMidi)) {
      stopKey(entry.rawMidi);
      pointerMap.delete(e.pointerId);
      return;
    }
    if (newMidi !== entry.rawMidi) {
      stopKey(entry.rawMidi);
      startKey(newMidi);
      entry.rawMidi = newMidi;
      entry.voiceKey = buildVoiceKey(newMidi);
      onNotesChanged();
    }
  });

  const release = (e: PointerEvent) => {
    if (store.get('sustain')) return;
    const entry = pointerMap.get(e.pointerId);
    if (!entry) return;
    stopKey(entry.rawMidi);
    pointerMap.delete(e.pointerId);
    onNotesChanged();
    try { wrap.releasePointerCapture(e.pointerId); } catch {}
  };
  wrap.addEventListener('pointerup', release);
  wrap.addEventListener('pointercancel', release);
  wrap.addEventListener('pointerleave', (e) => {
    if (store.get('sustain')) return;
    if (e.pointerType === 'mouse') release(e as PointerEvent);
  });

  wrap.addEventListener('contextmenu', (e) => e.preventDefault());

  // Prevent the browser from passing multi-touch sequences to OS gesture
  // recognizers (e.g. Samsung 3-finger screenshot swipe). This stops
  // pointercancel from firing and notes cutting out on simultaneous touches.
  // Hardware screenshots (power + volume-down) are OS-level and unaffected.
  const absorbTouch = (e: TouchEvent) => e.preventDefault();
  wrap.addEventListener('touchstart', absorbTouch, { passive: false });
  wrap.addEventListener('touchmove',  absorbTouch, { passive: false });

  return wrap;
}

export function stopAllKeyboard(): void {
  for (const entry of Array.from(pointerMap.values())) {
    stopKey(entry.rawMidi);
  }
  pointerMap.clear();
  clearSustained();
  onNotesChanged(); // clear chord suffix
}

export function setKeyboardKeyHighlight(pc: number, active: boolean): void {
  document.querySelectorAll<HTMLElement>('[data-midi]').forEach((el) => {
    const m = Number(el.dataset.midi);
    if (((m % 12) + 12) % 12 === pc) {
      if (active) el.classList.add('flash');
      else el.classList.remove('flash');
    }
  });
}

export function noteLabelForKey(pc: number): string {
  return pcToName(pc, true) ?? NOTE_NAMES_FLAT[pc];
}
