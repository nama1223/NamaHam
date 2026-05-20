import { loadJson, saveJson } from './storage';

export interface AppState {
  transpose: number;        // 0..11 (semitones, 0=C, 10=Bb)
  toneIndex: number;        // index into TONES
  sustain: boolean;         // sustain mode toggle
  volume: number;           // 0..100
  octaveOffset: number;     // -2..+2 (shift of keyboard range)
  rootMode: boolean;        // "根音を弾く" toggle
  key: number;              // 0..11 (root for just intonation)
  temperament: 'equal' | 'just';
  concertPitch: number;     // Hz, A4 reference (default 442)
  themeIndex: number;
  wakeLock: boolean;
  lang: 'ja' | 'en';
}

const DEFAULT_STATE: AppState = {
  transpose: 10,
  toneIndex: 0,
  sustain: false,
  volume: 60,
  octaveOffset: 0,
  rootMode: false,
  key: 10,
  temperament: 'just',
  concertPitch: 442,
  themeIndex: 0,
  wakeLock: false,
  lang: 'ja',
};

type Listener<K extends keyof AppState> = (value: AppState[K], key: K) => void;
type AnyListener = (value: AppState[keyof AppState], key: keyof AppState) => void;

class StateStore {
  private data: AppState = { ...DEFAULT_STATE };
  private listeners: Map<keyof AppState | '*', AnyListener[]> = new Map();

  load(): void {
    this.data = loadJson<AppState>(DEFAULT_STATE);
    this.data.sustain = false;
    this.data.rootMode = false;
  }

  save(): void {
    saveJson(this.data);
  }

  get<K extends keyof AppState>(key: K): AppState[K] {
    return this.data[key];
  }

  set<K extends keyof AppState>(key: K, value: AppState[K]): void {
    if (this.data[key] === value) return;
    this.data[key] = value;
    this.notify(key, value);
    this.save();
  }

  on<K extends keyof AppState>(key: K | '*', fn: Listener<K>): () => void {
    const arr = this.listeners.get(key) ?? [];
    arr.push(fn as AnyListener);
    this.listeners.set(key, arr);
    return () => {
      const list = this.listeners.get(key);
      if (!list) return;
      const i = list.indexOf(fn as AnyListener);
      if (i >= 0) list.splice(i, 1);
    };
  }

  private notify<K extends keyof AppState>(key: K, value: AppState[K]): void {
    const direct = this.listeners.get(key);
    if (direct) for (const fn of direct.slice()) fn(value as never, key);
    const wild = this.listeners.get('*');
    if (wild) for (const fn of wild.slice()) fn(value as never, key);
  }
}

export const store = new StateStore();

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
