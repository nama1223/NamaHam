import { store, NOTE_NAMES_FLAT } from './state';
import { audio } from './tones';
import { noteFreq, pcToName } from './pitch';

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
const sustainedKeys = new Map<string, number>();

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
    store.set('rootMode', false);
    flashKey(rawMidi);
    return;
  }
  const voiceKey = buildVoiceKey(rawMidi);
  if (sustainedKeys.has(rawMidi.toString())) {
    sustainedKeys.delete(rawMidi.toString());
    audio.stop(voiceKey);
    setKeyVisualActive(rawMidi, false);
  } else {
    sustainedKeys.set(rawMidi.toString(), rawMidi);
    audio.start(voiceKey, effectiveFreq(rawMidi));
    setKeyVisualActive(rawMidi, true);
  }
}

function clearSustained(): void {
  for (const rawMidi of Array.from(sustainedKeys.values())) {
    audio.stop(buildVoiceKey(rawMidi));
    setKeyVisualActive(rawMidi, false);
  }
  sustainedKeys.clear();
}

function refreshAllFrequencies(): void {
  for (const entry of pointerMap.values()) {
    audio.setFrequency(entry.voiceKey, effectiveFreq(entry.rawMidi));
  }
  for (const rawMidi of sustainedKeys.values()) {
    audio.setFrequency(buildVoiceKey(rawMidi), effectiveFreq(rawMidi));
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
  store.on('octaveOffset', updateLabels);

  store.on('octaveOffset', refreshAllFrequencies);
  store.on('transpose', refreshAllFrequencies);
  store.on('concertPitch', refreshAllFrequencies);
  store.on('temperament', refreshAllFrequencies);
  store.on('key', refreshAllFrequencies);
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
    }
  });

  const release = (e: PointerEvent) => {
    if (store.get('sustain')) return;
    const entry = pointerMap.get(e.pointerId);
    if (!entry) return;
    stopKey(entry.rawMidi);
    pointerMap.delete(e.pointerId);
    try { wrap.releasePointerCapture(e.pointerId); } catch {}
  };
  wrap.addEventListener('pointerup', release);
  wrap.addEventListener('pointercancel', release);
  wrap.addEventListener('pointerleave', (e) => {
    if (store.get('sustain')) return;
    if (e.pointerType === 'mouse') release(e as PointerEvent);
  });

  wrap.addEventListener('contextmenu', (e) => e.preventDefault());

  return wrap;
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
