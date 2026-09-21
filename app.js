// NamaHam — app.js
// TypeScript ソース (src/*.ts) を結合・JS 変換したファイル
// 更新時は CACHE_NAME のバージョン番号も sw.js で上げてください

'use strict';

// =====================================================================
// storage.ts — LocalStorage へのシリアライズ
// =====================================================================
const _STORAGE_KEY = 'namaham_state_v1';

function loadJson(fallback) {
  try {
    const raw = localStorage.getItem(_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function saveJson(value) {
  try {
    localStorage.setItem(_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

// =====================================================================
// state.ts — アプリ状態管理
// =====================================================================
const DEFAULT_STATE = {
  transpose: 0,        // 0..11 (半音, 0=C, 10=Bb)
  toneIndex: 0,        // TONES へのインデックス
  sustain: false,      // 持続音モード
  volume: 60,          // 0..100
  octaveOffset: 0,     // -2..+2 (音域シフト)
  rootMode: false,     // 「根音を弾く」トグル
  key: 0,              // 0..11 (純正律の根音)
  keyAuto: true,       // コード根音自動検出
  temperament: 'just', // 'equal' | 'just'
  concertPitch: 442,   // Hz, A4 基準
  themeIndex: 0,
  wakeLock: false,
  lang: 'ja',          // 'ja' | 'en'
  chordSuffix: '',     // 自動検出コードサフィックス (例: "m7")
};

class StateStore {
  constructor() {
    this.data = { ...DEFAULT_STATE };
    this.listeners = new Map();
  }

  load() {
    this.data = loadJson(DEFAULT_STATE);
    this.data.sustain = false;
    this.data.rootMode = false;
    this.data.chordSuffix = '';
  }

  save() {
    saveJson(this.data);
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    if (this.data[key] === value) return;
    this.data[key] = value;
    this._notify(key, value);
    this.save();
  }

  on(key, fn) {
    const arr = this.listeners.get(key) ?? [];
    arr.push(fn);
    this.listeners.set(key, arr);
    return () => {
      const list = this.listeners.get(key);
      if (!list) return;
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    };
  }

  _notify(key, value) {
    const direct = this.listeners.get(key);
    if (direct) for (const fn of direct.slice()) fn(value, key);
    const wild = this.listeners.get('*');
    if (wild) for (const fn of wild.slice()) fn(value, key);
  }
}

const store = new StateStore();

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// =====================================================================
// locale.ts — 多言語対応
// =====================================================================
const STRINGS = {
  ja: {
    transpose: '移調',
    tone: '音色',
    sustain: '持続音',
    range: '音域',
    harmony: '和声',
    playRoot: '根音を弾く',
    key: '調',
    just: '純',
    equal: '平',
    settings: '設定',
    close: '×',
    keepAwake: 'スリープ防止',
    keepAwakeOn: '有効（画面をオンに維持）',
    keepAwakeOff: '無効',
    keepAwakeUnsupported: '非対応のブラウザです',
    concertPitch: 'コンサートピッチ (A=)',
    themeColor: 'テーマカラー',
    language: '言語',
    transposeModal: '移調',
    toneModal: '音色',
    keyModal: '調（純正律）',
    keyAuto: '自動',
    install: 'インストール',
    installBtn: '📲 アプリとしてインストール',
    installedBtn: '✓ インストール済',
    installedTitle: 'インストール済み',
    installedBody: 'このアプリはすでにインストールされています。',
    installGateTitle: 'NamaHamのみインストールしますか？',
    installGateBody: 'このインストールボタンは、NamaHamを単独でホーム画面に追加するためのものです。メトロノーム・チューナーも含む統合アプリ「NamaSound+」が欲しい場合は、左上の⚙アイコンではなくNamaSound+側の設定からインストールしてください。',
    installGateCancel: 'キャンセル',
    installGateProceed: 'NamaHamだけインストール',
    installIOSTitle: 'iOSへのインストール方法',
    installIOSBody: '<p>Safariでこのページを開いてください。</p><ol><li>画面下部の<strong>共有ボタン（□↑）</strong>をタップ</li><li>「<strong>ホーム画面に追加</strong>」を選択</li><li>右上の「<strong>追加</strong>」をタップ</li></ol><p style="margin-top:8px;font-size:12px;color:var(--sub-text)">※ Chrome・Firefoxでは対応していません。</p>',
    installGenericTitle: 'インストール方法',
    installGenericBody: '<ol><li><strong>Chrome：</strong>アドレスバー右端の「⊕」または「⋮」→「アプリをインストール」</li><li><strong>Edge：</strong>「…」→「アプリ」→「このサイトをアプリとしてインストール」</li><li><strong>Safari（Mac）：</strong>メニュー File →「Dockに追加」</li></ol><p style="margin-top:8px;font-size:12px;color:var(--sub-text)">FirefoxはPWAインストールに対応していません。</p>',
    installModalClose: '閉じる',
  },
  en: {
    transpose: 'Xpose',
    tone: 'Tone',
    sustain: 'Sustain',
    range: 'Range',
    harmony: 'Harmony',
    playRoot: 'Play Root',
    key: 'Key',
    just: 'Just',
    equal: 'Equal',
    settings: 'Settings',
    close: '×',
    keepAwake: 'Keep Awake',
    keepAwakeOn: 'Enabled (screen stays on)',
    keepAwakeOff: 'Disabled',
    keepAwakeUnsupported: 'Not supported',
    concertPitch: 'Concert Pitch (A=)',
    themeColor: 'Theme Color',
    language: 'Language',
    transposeModal: 'Transposition',
    toneModal: 'Tone',
    keyModal: 'Key (Just Tuning)',
    keyAuto: 'Auto',
    install: 'Install',
    installBtn: '📲 Install as App',
    installedBtn: '✓ Installed',
    installedTitle: 'Already Installed',
    installedBody: 'This app is already installed.',
    installGateTitle: 'Install NamaHam only?',
    installGateBody: 'This install button adds only NamaHam to your home screen. If you want the combined "NamaSound+" app (which also includes the metronome and tuner), please install it from NamaSound+\u2019s own settings instead of this \u2699 icon.',
    installGateCancel: 'Cancel',
    installGateProceed: 'Install NamaHam only',
    installIOSTitle: 'How to Install on iOS',
    installIOSBody: '<p>Please open this page in Safari.</p><ol><li>Tap the <strong>Share button (□↑)</strong> at the bottom of the screen</li><li>Select "<strong>Add to Home Screen</strong>"</li><li>Tap "<strong>Add</strong>" at the top right</li></ol><p style="margin-top:8px;font-size:12px;color:var(--sub-text)">Not supported in Chrome or Firefox.</p>',
    installGenericTitle: 'How to Install',
    installGenericBody: '<ol><li><strong>Chrome:</strong> "⊕" or "⋮" at the right of the address bar → "Install app"</li><li><strong>Edge:</strong> "…" → "Apps" → "Install this site as an app"</li><li><strong>Safari (Mac):</strong> File menu → "Add to Dock"</li></ol><p style="margin-top:8px;font-size:12px;color:var(--sub-text)">Firefox does not support PWA install.</p>',
    installModalClose: 'Close',
  },
};

function t(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS.ja[key] ?? key;
}

function applyLocale(lang) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(lang, key);
  });
}

// =====================================================================
// themes.ts — テーマカラー
// =====================================================================
const THEMES = [
  {
    name: 'クリーム', nameEn: 'Cream', kind: 'light',
    headerBg: '#ede3cc', footerBg: '#7a4f28', footerText: '#f5e6d6',
    text: '#222', subText: '#555', panelBg: '#ffffff', panelBorder: '#1f1f1f',
    accent: '#e67e22', modalBg: '#fffaf0',
  },
  {
    name: 'スカイ', nameEn: 'Sky', kind: 'light',
    headerBg: '#d4e5f0', footerBg: '#1a5e88', footerText: '#d8edf8',
    text: '#11304a', subText: '#4a6a82', panelBg: '#ffffff', panelBorder: '#1b3b5a',
    accent: '#1d7ed1', modalBg: '#f3f8fc',
  },
  {
    name: 'ミント', nameEn: 'Mint', kind: 'light',
    headerBg: '#cceadb', footerBg: '#1e6b42', footerText: '#d0f0e2',
    text: '#1c3a2c', subText: '#4a6b58', panelBg: '#ffffff', panelBorder: '#234c39',
    accent: '#2aa66b', modalBg: '#f0f8f3',
  },
  {
    name: 'ネイビー', nameEn: 'Navy', kind: 'dark',
    headerBg: '#1c2d42', footerBg: '#0c1e35', footerText: '#a8c4de',
    text: '#f0f3f7', subText: '#a8b8cc', panelBg: '#2a3a55', panelBorder: '#c8d3e3',
    accent: '#5aa9ff', modalBg: '#1a2a40',
  },
  {
    name: 'フォレスト', nameEn: 'Forest', kind: 'dark',
    headerBg: '#1c2f20', footerBg: '#3a1e08', footerText: '#e0c4a8',
    text: '#eef5ef', subText: '#a8c2af', panelBg: '#314a39', panelBorder: '#c5d6c9',
    accent: '#71d39a', modalBg: '#1e3424',
  },
  {
    name: 'プラム', nameEn: 'Plum', kind: 'dark',
    headerBg: '#2a1a34', footerBg: '#0e2a36', footerText: '#a8d4e0',
    text: '#f4ecf7', subText: '#c3aed0', panelBg: '#4a3057', panelBorder: '#d8c8e0',
    accent: '#c682e0', modalBg: '#321f3e',
  },
];

function applyTheme(index) {
  const theme = THEMES[index] ?? THEMES[0];
  const root = document.documentElement;
  root.style.setProperty('--header-bg', theme.headerBg);
  root.style.setProperty('--footer-bg', theme.footerBg);
  root.style.setProperty('--footer-text', theme.footerText);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--sub-text', theme.subText);
  root.style.setProperty('--panel-bg', theme.panelBg);
  root.style.setProperty('--panel-border', theme.panelBorder);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--modal-bg', theme.modalBg);
  root.setAttribute('data-theme-kind', theme.kind);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.headerBg);
}

// =====================================================================
// pitch.ts — 音高計算（平均律・純正律）
// =====================================================================
const JUST_RATIOS = [
  1 / 1,   // ユニゾン
  16 / 15, // 短2度
  9 / 8,   // 長2度
  6 / 5,   // 短3度
  5 / 4,   // 長3度
  4 / 3,   // 完全4度
  45 / 32, // 増4度
  3 / 2,   // 完全5度
  8 / 5,   // 短6度
  5 / 3,   // 長6度
  9 / 5,   // 短7度
  15 / 8,  // 長7度
];

function equalFreq(midi, concertPitch) {
  return concertPitch * Math.pow(2, (midi - 69) / 12);
}

function justFreq(midi, keyPc, concertPitch) {
  let rootMidi = Math.floor(midi / 12) * 12 + keyPc;
  if (rootMidi > midi) rootMidi -= 12;
  const interval = midi - rootMidi;
  const rootFreq = equalFreq(rootMidi, concertPitch);
  return rootFreq * JUST_RATIOS[interval];
}

function noteFreq(midi, temperament, keyPc, concertPitch) {
  if (temperament === 'just') return justFreq(midi, keyPc, concertPitch);
  return equalFreq(midi, concertPitch);
}

function midiFromRowAndIndex(rowOctave, scaleIndex) {
  return (rowOctave + 1) * 12 + scaleIndex;
}

function pcToName(pc, useFlat = false) {
  const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const n = ((pc % 12) + 12) % 12;
  return (useFlat ? FLAT : SHARP)[n];
}

// =====================================================================
// chord.ts — コード根音・コード名検出
// =====================================================================
/**
 * 各音程の重み付け（和音根音スコアリング用）
 *  P5(7)=5, P4(5)=4, M3(4)=3, m3(3)=3, M6(9)=2, m6(8)=2,
 *  m7(10)=2, M7(11)=2, M2(2)=1, m2(1)=-1, TT(6)=-2
 */
const INTERVAL_WEIGHT = {
  0: 0, 1: -1, 2: 1, 3: 3, 4: 3, 5: 4,
  6: -2, 7: 5, 8: 2, 9: 2, 10: 2, 11: 2,
};

function detectRoot(midis) {
  if (midis.length === 0) return null;

  const pcs = [...new Set(midis.map((m) => ((m % 12) + 12) % 12))];
  if (pcs.length === 1) return pcs[0];

  let lowestMidi = midis[0];
  for (const m of midis) if (m < lowestMidi) lowestMidi = m;
  const bassPc = ((lowestMidi % 12) + 12) % 12;

  const potentialRootOfBass = ((bassPc - 7) + 12) % 12;
  const bassIsAFifth = pcs.includes(potentialRootOfBass);
  const bassBonus = bassIsAFifth ? 0 : 4;

  let bestRoot = pcs[0];
  let bestScore = -Infinity;

  for (const root of pcs) {
    let score = 0;
    for (const pc of pcs) {
      if (pc === root) continue;
      const interval = (pc - root + 12) % 12;
      score += INTERVAL_WEIGHT[interval] ?? 0;
    }
    if (root === bassPc) score += bassBonus;
    if (score > bestScore) {
      bestScore = score;
      bestRoot = root;
    }
  }

  return bestRoot;
}

const CHORD_PATTERNS = [
  // 5音拡張コード
  { intervals: [0, 4, 7, 10, 2], suffix: '9' },
  { intervals: [0, 4, 7, 11, 2], suffix: 'M9' },
  { intervals: [0, 3, 7, 10, 2], suffix: 'm9' },
  { intervals: [0, 3, 7, 11, 2], suffix: 'mM9' },
  { intervals: [0, 4, 7, 9, 2],  suffix: '6/9' },
  { intervals: [0, 3, 7, 9, 2],  suffix: 'm6/9' },
  // 4音7thコード
  { intervals: [0, 4, 7, 10], suffix: '7' },
  { intervals: [0, 4, 7, 11], suffix: 'M7' },
  { intervals: [0, 3, 7, 10], suffix: 'm7' },
  { intervals: [0, 3, 7, 11], suffix: 'mM7' },
  { intervals: [0, 3, 6, 9],  suffix: 'dim7' },
  { intervals: [0, 3, 6, 10], suffix: 'm7b5' },
  { intervals: [0, 4, 8, 10], suffix: 'aug7' },
  { intervals: [0, 4, 8, 11], suffix: 'augM7' },
  // 4音6th/addコード
  { intervals: [0, 4, 7, 9],  suffix: '6' },
  { intervals: [0, 3, 7, 9],  suffix: 'm6' },
  { intervals: [0, 4, 7, 2],  suffix: 'add9' },
  { intervals: [0, 3, 7, 2],  suffix: 'm(add9)' },
  { intervals: [0, 5, 7, 10], suffix: '7sus4' },
  // 3音トライアド
  { intervals: [0, 4, 7], suffix: '' },       // Major
  { intervals: [0, 3, 7], suffix: 'm' },
  { intervals: [0, 3, 6], suffix: 'dim' },
  { intervals: [0, 4, 8], suffix: 'aug' },
  { intervals: [0, 2, 7], suffix: 'sus2' },
  { intervals: [0, 5, 7], suffix: 'sus4' },
  // 3音ルートレス7th
  { intervals: [0, 4, 10], suffix: '7(no5)' },
  { intervals: [0, 4, 11], suffix: 'M7(no5)' },
  { intervals: [0, 3, 10], suffix: 'm7(no5)' },
  // 2音パワーコード
  { intervals: [0, 7], suffix: '5' },
];

function detectChordSuffix(pitchClasses, root) {
  const uniquePcs = [...new Set(pitchClasses)];
  if (uniquePcs.length < 2) return '';

  const intervals = new Set();
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

// =====================================================================
// tones.ts — 音色定義・AudioEngine
// =====================================================================
const TONES = [
  {
    name: 'クラリネット', nameEn: 'Clarinet',
    harmonics: [0, 1.00, 0.02, 0.50, 0.01, 0.22, 0.01, 0.08, 0.01, 0.04],
    attack: 0.03, release: 0.04, gain: 0.28,
  },
  {
    name: 'フルート', nameEn: 'Flute',
    harmonics: [0, 1.00, 0.30, 0.05, 0.02, 0.01],
    attack: 0.05, release: 0.06, gain: 0.32,
  },
  {
    name: 'トランペット', nameEn: 'Trumpet',
    harmonics: [0, 1.00, 0.80, 0.50, 0.40, 0.25, 0.20, 0.15, 0.10, 0.08, 0.05],
    attack: 0.02, release: 0.05, gain: 0.20,
  },
  {
    name: 'オーボエ', nameEn: 'Oboe',
    harmonics: [0, 0.60, 1.00, 0.70, 0.50, 0.40, 0.30, 0.20, 0.15],
    attack: 0.03, release: 0.05, gain: 0.22,
  },
  {
    name: 'ホルン', nameEn: 'Horn',
    harmonics: [0, 1.00, 0.50, 0.30, 0.15, 0.07, 0.03],
    attack: 0.06, release: 0.10, gain: 0.28,
  },
  {
    name: '矩形波', nameEn: 'Square Wave',
    harmonics: [0, 1.00, 0, 0.33, 0, 0.20, 0, 0.14, 0, 0.11],
    attack: 0.02, release: 0.04, gain: 0.18,
  },
  {
    name: '正弦波', nameEn: 'Sine Wave',
    harmonics: [0, 1.00],
    attack: 0.03, release: 0.05, gain: 0.35,
  },
  {
    name: 'のこぎり波', nameEn: 'Saw Wave',
    harmonics: [0, 1.00, 0.50, 0.33, 0.25, 0.20, 0.16, 0.14, 0.12, 0.11],
    attack: 0.02, release: 0.05, gain: 0.16,
  },
];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.periodicWave = null;
    this.voices = new Map();
    /** リリース中（フェードアウト）のボイス */
    this.zombies = new Map();
    this.currentTone = TONES[0];
    this.currentVolume = 0.6;
  }

  ensureContext() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.currentVolume;
      this.master.connect(this.ctx.destination);
      this._rebuildWave();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setTone(tone) {
    this.currentTone = tone;
    if (this.ctx) this._rebuildWave();
  }

  setVolume(percent) {
    this.currentVolume = Math.max(0, Math.min(1, percent / 100));
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.currentVolume, now, 0.02);
    }
  }

  _rebuildWave() {
    if (!this.ctx) return;
    const h = this.currentTone.harmonics;
    const len = Math.max(2, h.length);
    const real = new Float32Array(len);
    const imag = new Float32Array(len);
    for (let i = 0; i < len; i++) imag[i] = h[i] ?? 0;
    this.periodicWave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  start(voiceId, freq) {
    const ctx = this.ensureContext();
    if (this.voices.has(voiceId)) return;

    // フェードアウト中のゾンビボイスを蘇生（クリックノイズ防止）
    const zombie = this.zombies.get(voiceId);
    if (zombie) {
      clearTimeout(zombie.timer);
      this.zombies.delete(voiceId);
      const now = ctx.currentTime;
      zombie.osc.frequency.setTargetAtTime(freq, now, 0.003);
      zombie.gain.gain.cancelScheduledValues(now);
      zombie.gain.gain.setTargetAtTime(this.currentTone.gain, now, this.currentTone.attack);
      this.voices.set(voiceId, { osc: zombie.osc, gain: zombie.gain });
      return;
    }

    if (!this.periodicWave || !this.master) return;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.currentTone.gain, now + this.currentTone.attack);
    gain.connect(this.master);
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(this.periodicWave);
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start();
    this.voices.set(voiceId, { osc, gain });
  }

  stop(voiceId) {
    const v = this.voices.get(voiceId);
    if (!v || !this.ctx) return;
    this.voices.delete(voiceId);
    const now = this.ctx.currentTime;
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setTargetAtTime(0, now, this.currentTone.release);
    const tail = (this.currentTone.release * 6 + 0.1) * 1000;
    const timer = setTimeout(() => {
      this.zombies.delete(voiceId);
      try { v.osc.stop(); } catch {}
      try { v.osc.disconnect(); } catch {}
      try { v.gain.disconnect(); } catch {}
    }, tail);
    this.zombies.set(voiceId, { osc: v.osc, gain: v.gain, timer });
  }

  setFrequency(voiceId, freq) {
    const v = this.voices.get(voiceId);
    if (!v || !this.ctx) return;
    const now = this.ctx.currentTime;
    // 15ms タイムコンスタント — 純正律リチューニング時のウォブル防止
    v.osc.frequency.setTargetAtTime(freq, now, 0.015);
  }

  stopAll() {
    for (const id of Array.from(this.voices.keys())) this.stop(id);
    for (const [, z] of this.zombies) {
      clearTimeout(z.timer);
      try { z.osc.stop(); } catch {}
      try { z.osc.disconnect(); } catch {}
      try { z.gain.disconnect(); } catch {}
    }
    this.zombies.clear();
  }
}

const audio = new AudioEngine();

// =====================================================================
// scrollSwipe.ts — スクロール・スワイプ操作
// =====================================================================
function attachScrollSwipe(el, opts) {
  const sens      = opts.sensitivity;
  const wheelSens = opts.wheelSensitivity ?? 100;
  const tapThreshold = opts.tapThreshold ?? 12;
  const axis      = opts.axis ?? 'y';

  let down = false;
  let startX = 0, startY = 0, lastX = 0, lastY = 0;
  let accumulator = 0;
  let swiping = false;
  let hasCaptured = false;
  let pointerId = null;
  let wheelAccumulator = 0;

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = true;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    accumulator = 0;
    swiping = false;
    hasCaptured = false;
    pointerId = e.pointerId;
    // スワイプ確定まではキャプチャしない（クリックが正常に発火するように）
  }

  function onPointerMove(e) {
    if (!down || e.pointerId !== pointerId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const totalDx = Math.abs(e.clientX - startX);
    const totalDy = Math.abs(e.clientY - startY);

    if (!swiping) {
      const movedInAxis = axis === 'y' ? totalDy : totalDx;
      if (movedInAxis > tapThreshold) {
        swiping = true;
        try { el.setPointerCapture(e.pointerId); hasCaptured = true; } catch {}
      }
      return;
    }

    const delta = axis === 'y' ? -dy : dx;
    accumulator += delta;
    while (accumulator >= sens)  { accumulator -= sens; opts.onStep(1);  }
    while (accumulator <= -sens) { accumulator += sens; opts.onStep(-1); }
  }

  function onPointerUp(e) {
    if (!down || e.pointerId !== pointerId) return;
    down = false;
    pointerId = null;
    if (hasCaptured) {
      try { el.releasePointerCapture(e.pointerId); } catch {}
      hasCaptured = false;
    }
  }

  function onPointerCancel() {
    down = false;
    pointerId = null;
    hasCaptured = false;
  }

  function onWheel(e) {
    e.preventDefault();
    const pixels = e.deltaMode === 0 ? e.deltaY : e.deltaY * 40;
    wheelAccumulator -= pixels;

    if (wheelAccumulator >= wheelSens) {
      while (wheelAccumulator >= wheelSens) { wheelAccumulator -= wheelSens; opts.onStep(1); }
      wheelAccumulator = 0;
    } else if (wheelAccumulator <= -wheelSens) {
      while (wheelAccumulator <= -wheelSens) { wheelAccumulator += wheelSens; opts.onStep(-1); }
      wheelAccumulator = 0;
    }
  }

  el.addEventListener('pointerdown',  onPointerDown);
  el.addEventListener('pointermove',  onPointerMove);
  el.addEventListener('pointerup',    onPointerUp);
  el.addEventListener('pointercancel', onPointerCancel);
  el.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    el.removeEventListener('pointerdown',  onPointerDown);
    el.removeEventListener('pointermove',  onPointerMove);
    el.removeEventListener('pointerup',    onPointerUp);
    el.removeEventListener('pointercancel', onPointerCancel);
    el.removeEventListener('wheel', onWheel);
  };
}

// =====================================================================
// modal.ts — リストモーダル
// =====================================================================
function openListModal(title, options, current, onSelect) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'modal-sheet';

  const header = document.createElement('div');
  header.className = 'modal-title';
  header.textContent = title;
  sheet.appendChild(header);

  const list = document.createElement('div');
  list.className = 'modal-list';
  options.forEach((opt) => {
    const row = document.createElement('div');
    row.className = 'modal-row';
    if (opt.value === current) row.classList.add('active');
    const label = document.createElement('div');
    label.className = 'modal-row-label';
    label.textContent = opt.label;
    row.appendChild(label);
    if (opt.sub) {
      const sub = document.createElement('div');
      sub.className = 'modal-row-sub';
      sub.textContent = opt.sub;
      row.appendChild(sub);
    }
    row.addEventListener('click', () => { onSelect(opt.value); closeModal(); });
    list.appendChild(row);
  });
  sheet.appendChild(list);

  function closeModal() {
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 160);
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('shown');
    const active = list.querySelector('.modal-row.active');
    if (active) {
      list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
    }
  });
}

// =====================================================================
// controls.ts — トップバー・ボトムバー UI
// =====================================================================
function getLang() { return store.get('lang'); }
function getToneLabel(tone) { return getLang() === 'en' ? tone.nameEn : tone.name; }

// 音名表示順 (C を最上位に)
const NOTE_ORDER      = [0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
// キースクロール順 (C→B→Bb→…→Db→-1(auto)→wrap)
const KEY_SCROLL_ORDER = [0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1];

function getKeyScrollPos() {
  if (store.get('keyAuto')) return KEY_SCROLL_ORDER.indexOf(-1);
  const idx = KEY_SCROLL_ORDER.indexOf(store.get('key'));
  return idx < 0 ? 0 : idx;
}
function applyKeyScrollPos(pos) {
  const len = KEY_SCROLL_ORDER.length;
  const val = KEY_SCROLL_ORDER[((pos % len) + len) % len];
  if (val === -1) {
    store.set('keyAuto', true);
  } else {
    store.set('keyAuto', false);
    store.set('key', val);
  }
}

function renderSpeaker(volume) {
  const waves = [];
  if (volume > 5)  waves.push('<path d="M19 9 Q22 12 19 15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>');
  if (volume > 33) waves.push('<path d="M22 6 Q27 12 22 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>');
  if (volume > 66) waves.push('<path d="M25 3 Q32 12 25 21" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>');
  const mute = volume <= 0
    ? '<path d="M20 8 L28 16 M28 8 L20 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    : '';
  return `<svg viewBox="0 0 34 24" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><path d="M3 9 L8 9 L13 4 L13 20 L8 15 L3 15 Z" fill="currentColor"/>${waves.join('')}${mute}</svg>`;
}

function createTopBar() {
  const top = document.createElement('div');
  top.className = 'topbar';

  // ---- Row 1: ⚙️ / 移調 / 音色 ----
  const row1 = document.createElement('div');
  row1.className = 'topbar-row';

  const gear = document.createElement('button');
  gear.className = 'icon-btn gear-btn';
  gear.setAttribute('aria-label', '設定');
  gear.textContent = '⚙️';
  gear.addEventListener('click', () => window.dispatchEvent(new CustomEvent('namaham:open-settings')));
  row1.appendChild(gear);

  const transposeLabel = document.createElement('span');
  transposeLabel.className = 'topbar-label';
  transposeLabel.dataset.i18n = 'transpose';
  transposeLabel.textContent = t(getLang(), 'transpose');
  row1.appendChild(transposeLabel);

  const transposeBtn = document.createElement('div');
  transposeBtn.className = 'pill scroll-target';
  transposeBtn.setAttribute('role', 'button');
  const transposeText = document.createElement('span');
  transposeText.textContent = NOTE_NAMES_FLAT[store.get('transpose')];
  transposeBtn.appendChild(transposeText);
  row1.appendChild(transposeBtn);

  attachScrollSwipe(transposeBtn, {
    sensitivity: 24, wheelSensitivity: 100,
    onStep: (d) => {
      const cur = NOTE_ORDER.indexOf(store.get('transpose'));
      const next = ((cur < 0 ? 0 : cur) - d + NOTE_ORDER.length) % NOTE_ORDER.length;
      store.set('transpose', NOTE_ORDER[next]);
    },
  });
  transposeBtn.addEventListener('click', () => {
    openListModal(
      t(getLang(), 'transposeModal'),
      NOTE_ORDER.map((i) => ({ label: NOTE_NAMES_FLAT[i], value: i })),
      store.get('transpose'),
      (v) => store.set('transpose', v),
    );
  });
  store.on('transpose', (v) => { transposeText.textContent = NOTE_NAMES_FLAT[v]; });

  const toneLabel = document.createElement('span');
  toneLabel.className = 'topbar-label';
  toneLabel.dataset.i18n = 'tone';
  toneLabel.textContent = t(getLang(), 'tone');
  row1.appendChild(toneLabel);

  const toneBtn = document.createElement('div');
  toneBtn.className = 'pill scroll-target tone-pill';
  toneBtn.setAttribute('role', 'button');
  const toneText = document.createElement('span');
  toneText.textContent = getToneLabel(TONES[store.get('toneIndex')]);
  toneBtn.appendChild(toneText);
  row1.appendChild(toneBtn);

  attachScrollSwipe(toneBtn, {
    sensitivity: 28, wheelSensitivity: 100,
    onStep: (d) => store.set('toneIndex', (store.get('toneIndex') + d + TONES.length) % TONES.length),
  });
  toneBtn.addEventListener('click', () => {
    openListModal(
      t(getLang(), 'toneModal'),
      TONES.map((tn, i) => ({ label: getToneLabel(tn), value: i })),
      store.get('toneIndex'),
      (v) => store.set('toneIndex', v),
    );
  });
  store.on('toneIndex', (v) => {
    toneText.textContent = getToneLabel(TONES[v]);
    audio.setTone(TONES[v]);
  });

  top.appendChild(row1);

  // ---- Row 2: 持続音 / 音量 / 音域 ----
  const row2 = document.createElement('div');
  row2.className = 'topbar-row';

  const sustainBtn = document.createElement('div');
  sustainBtn.className = 'pill toggle-pill sustain-btn';
  sustainBtn.dataset.i18n = 'sustain';
  sustainBtn.textContent = t(getLang(), 'sustain');
  sustainBtn.setAttribute('role', 'button');
  sustainBtn.addEventListener('click', () => store.set('sustain', !store.get('sustain')));
  const refreshSustain = () => sustainBtn.classList.toggle('on', store.get('sustain'));
  refreshSustain();
  store.on('sustain', refreshSustain);
  row2.appendChild(sustainBtn);

  // 音量
  const volWrap = document.createElement('div');
  volWrap.className = 'vol-wrap scroll-target';

  const speakerBtn = document.createElement('button');
  speakerBtn.className = 'speaker-btn';
  speakerBtn.innerHTML = renderSpeaker(store.get('volume'));
  volWrap.appendChild(speakerBtn);

  const volNum = document.createElement('div');
  volNum.className = 'vol-num scroll-target';
  volNum.textContent = `${store.get('volume')}%`;
  volWrap.appendChild(volNum);

  const volPopup = document.createElement('div');
  volPopup.className = 'vol-popup';
  const volSlider = document.createElement('input');
  volSlider.type = 'range';
  volSlider.min = '0'; volSlider.max = '100'; volSlider.step = '1';
  volSlider.value = String(store.get('volume'));
  volPopup.appendChild(volSlider);
  volWrap.appendChild(volPopup);

  speakerBtn.addEventListener('click', (e) => { e.stopPropagation(); volPopup.classList.toggle('shown'); });
  volNum.addEventListener('click',     (e) => { e.stopPropagation(); volPopup.classList.toggle('shown'); });
  document.addEventListener('click',  (e) => { if (!volWrap.contains(e.target)) volPopup.classList.remove('shown'); });
  volSlider.addEventListener('input', () => store.set('volume', parseInt(volSlider.value, 10)));

  const volSwipeOpts = {
    sensitivity: 6, wheelSensitivity: 40,
    onStep: (d) => store.set('volume', Math.max(0, Math.min(100, store.get('volume') + d * 2))),
  };
  attachScrollSwipe(speakerBtn, volSwipeOpts);
  attachScrollSwipe(volNum,     volSwipeOpts);
  store.on('volume', (v) => {
    volNum.textContent = `${v}%`;
    volSlider.value = String(v);
    speakerBtn.innerHTML = renderSpeaker(v);
    audio.setVolume(v);
  });
  row2.appendChild(volWrap);

  // 音域
  const rangeWrap = document.createElement('div');
  rangeWrap.className = 'range-wrap scroll-target';

  const rangeDown = document.createElement('button');
  rangeDown.className = 'tri-btn'; rangeDown.textContent = '▼';
  rangeDown.addEventListener('click', () => store.set('octaveOffset', Math.max(-2, store.get('octaveOffset') - 1)));

  const rangeText = document.createElement('div');
  rangeText.className = 'range-text';
  rangeText.dataset.i18n = 'range';
  rangeText.textContent = t(getLang(), 'range');

  const rangeUp = document.createElement('button');
  rangeUp.className = 'tri-btn'; rangeUp.textContent = '▲';
  rangeUp.addEventListener('click', () => store.set('octaveOffset', Math.min(2, store.get('octaveOffset') + 1)));

  rangeWrap.append(rangeDown, rangeText, rangeUp);
  attachScrollSwipe(rangeWrap, {
    sensitivity: 60, wheelSensitivity: 150,
    onStep: (d) => store.set('octaveOffset', Math.max(-2, Math.min(2, store.get('octaveOffset') + d))),
  });
  row2.appendChild(rangeWrap);

  top.appendChild(row2);

  store.on('lang', (lang) => {
    applyLocale(lang);
    toneText.textContent = getToneLabel(TONES[store.get('toneIndex')]);
  });

  return top;
}

function createBottomBar() {
  const bot = document.createElement('div');
  bot.className = 'bottombar';

  const harmonyLabel = document.createElement('span');
  harmonyLabel.className = 'b-label';
  harmonyLabel.dataset.i18n = 'harmony';
  harmonyLabel.textContent = t(getLang(), 'harmony');
  bot.appendChild(harmonyLabel);

  const rootBtn = document.createElement('div');
  rootBtn.className = 'pill toggle-pill root-btn';
  rootBtn.dataset.i18n = 'playRoot';
  rootBtn.textContent = t(getLang(), 'playRoot');
  rootBtn.setAttribute('role', 'button');
  rootBtn.addEventListener('click', () => store.set('rootMode', !store.get('rootMode')));
  const refreshRoot = () => rootBtn.classList.toggle('on', store.get('rootMode'));
  refreshRoot();
  store.on('rootMode', refreshRoot);
  bot.appendChild(rootBtn);

  const keyLabel = document.createElement('span');
  keyLabel.className = 'b-label';
  keyLabel.dataset.i18n = 'key';
  keyLabel.textContent = t(getLang(), 'key');
  bot.appendChild(keyLabel);

  const keyBtn = document.createElement('div');
  keyBtn.className = 'pill scroll-target key-pill';
  keyBtn.setAttribute('role', 'button');
  const keyText = document.createElement('span');

  const refreshKeyText = () => {
    if (store.get('keyAuto')) {
      const suffix = store.get('chordSuffix');
      keyText.textContent = t(getLang(), 'keyAuto') + ':' + NOTE_NAMES_FLAT[store.get('key')] + suffix;
      keyBtn.classList.remove('key-fs-sm', 'key-fs-xs');
      if (suffix.length >= 5) keyBtn.classList.add('key-fs-xs');
      else if (suffix.length >= 3) keyBtn.classList.add('key-fs-sm');
    } else {
      keyText.textContent = NOTE_NAMES_FLAT[store.get('key')];
      keyBtn.classList.remove('key-fs-sm', 'key-fs-xs');
    }
  };
  refreshKeyText();
  keyBtn.appendChild(keyText);
  bot.appendChild(keyBtn);

  attachScrollSwipe(keyBtn, {
    sensitivity: 24, wheelSensitivity: 100,
    onStep: (d) => applyKeyScrollPos(getKeyScrollPos() - d),
  });
  keyBtn.addEventListener('click', () => {
    const autoItem  = { label: t(getLang(), 'keyAuto'), value: -1 };
    const noteItems = NOTE_ORDER.map((i) => ({ label: NOTE_NAMES_FLAT[i], value: i }));
    const currentVal = store.get('keyAuto') ? -1 : store.get('key');
    openListModal(
      t(getLang(), 'keyModal'),
      [autoItem, ...noteItems],
      currentVal,
      (v) => {
        if (v === -1) { store.set('keyAuto', true); }
        else          { store.set('keyAuto', false); store.set('key', v); }
      },
    );
  });
  store.on('key',        refreshKeyText);
  store.on('keyAuto',    refreshKeyText);
  store.on('chordSuffix', refreshKeyText);
  store.on('lang',       refreshKeyText);

  const tempBtn = document.createElement('div');
  tempBtn.className = 'pill temp-btn';
  tempBtn.setAttribute('role', 'button');
  const tempText = document.createElement('span');
  const getTempLabel = () => store.get('temperament') === 'just' ? t(getLang(), 'just') : t(getLang(), 'equal');
  tempText.textContent = getTempLabel();
  tempBtn.appendChild(tempText);
  tempBtn.addEventListener('click', () => store.set('temperament', store.get('temperament') === 'just' ? 'equal' : 'just'));
  const refreshTemp = () => {
    tempText.textContent = getTempLabel();
    tempBtn.classList.toggle('just', store.get('temperament') === 'just');
  };
  store.on('temperament', refreshTemp);
  store.on('lang',        refreshTemp);
  refreshTemp();
  bot.appendChild(tempBtn);

  return bot;
}

// =====================================================================
// keyboard.ts — ピアノ鍵盤 UI・タッチ/ポインタ処理
// =====================================================================
const ROWS_FROM_TOP  = [5, 4, 3, 2];
const WHITE_OFFSETS  = [0, 2, 4, 5, 7, 9, 11];
const BLACK_OFFSETS  = [[1,1],[3,2],null,[6,4],[8,5],[10,6],null];

const pointerMap   = new Map(); // pointerId → { voiceKey, rawMidi }
const sustainedKeys = new Map(); // voiceKey → displayMidi
let prevOctaveOffset = 0;

function findSustainedByDisplay(displayMidi) {
  for (const [vk, dm] of sustainedKeys) if (dm === displayMidi) return vk;
  return undefined;
}

function buildVoiceKey(rawMidi) { return `n${rawMidi}`; }

function effectiveFreq(rawMidi) {
  const midi = rawMidi + store.get('transpose') + store.get('octaveOffset') * 12;
  return noteFreq(midi, store.get('temperament'), store.get('key'), store.get('concertPitch'));
}

function startKey(rawMidi) {
  if (store.get('rootMode')) {
    const transposed = (((rawMidi % 12) + 12) % 12 + store.get('transpose')) % 12;
    store.set('key', transposed);
    store.set('keyAuto', false);
    store.set('rootMode', false);
    flashKey(rawMidi);
    return;
  }
  audio.start(buildVoiceKey(rawMidi), effectiveFreq(rawMidi));
  setKeyVisualActive(rawMidi, true);
}

function stopKey(rawMidi) {
  audio.stop(buildVoiceKey(rawMidi));
  setKeyVisualActive(rawMidi, false);
}

function setKeyVisualActive(rawMidi, active) {
  document.querySelectorAll(`[data-midi="${rawMidi}"]`).forEach((el) => {
    el.classList.toggle('active', active);
  });
}

function flashKey(rawMidi) {
  document.querySelectorAll(`[data-midi="${rawMidi}"]`).forEach((el) => {
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 220);
  });
}

function pickKeyAt(x, y) {
  const el = document.elementFromPoint(x, y);
  return el ? el.closest('[data-midi]') : null;
}

function handleSustainTap(rawMidi) {
  if (store.get('rootMode')) {
    const transposed = (((rawMidi % 12) + 12) % 12 + store.get('transpose')) % 12;
    store.set('key', transposed);
    store.set('keyAuto', false);
    store.set('rootMode', false);
    flashKey(rawMidi);
    return;
  }
  const existingKey = findSustainedByDisplay(rawMidi);
  if (existingKey !== undefined) {
    sustainedKeys.delete(existingKey);
    audio.stop(existingKey);
    setKeyVisualActive(rawMidi, false);
    onNotesChanged();
  } else {
    const effectiveMidi = rawMidi + store.get('transpose') + store.get('octaveOffset') * 12;
    const voiceKey = `s${effectiveMidi}`;
    sustainedKeys.set(voiceKey, rawMidi);
    audio.start(voiceKey, effectiveFreq(rawMidi));
    setKeyVisualActive(rawMidi, true);
    onNotesChanged();
  }
}

function clearSustained() {
  for (const [vk, displayMidi] of Array.from(sustainedKeys.entries())) {
    audio.stop(vk);
    setKeyVisualActive(displayMidi, false);
  }
  sustainedKeys.clear();
}

/**
 * 発音中の音が変化したときに自動根音・コード名を更新
 * （移調後の実音ピッチクラスで検出）
 */
function onNotesChanged() {
  const transpose = store.get('transpose');
  const midis = [];
  for (const entry of pointerMap.values()) midis.push(entry.rawMidi + transpose);
  for (const rawMidi of sustainedKeys.values()) {
    const midi = rawMidi + transpose;
    if (!midis.includes(midi)) midis.push(midi);
  }

  if (!store.get('keyAuto')) {
    if (store.get('chordSuffix') !== '') store.set('chordSuffix', '');
    return;
  }

  if (midis.length === 0) {
    if (store.get('chordSuffix') !== '') store.set('chordSuffix', '');
    return;
  }

  const root = detectRoot(midis);
  if (root === null) return;
  if (root !== store.get('key')) store.set('key', root);

  const pcs    = midis.map((m) => ((m % 12) + 12) % 12);
  const suffix = detectChordSuffix(pcs, root);
  if (suffix !== store.get('chordSuffix')) store.set('chordSuffix', suffix);
}

function refreshAllFrequencies() {
  for (const entry of pointerMap.values())
    audio.setFrequency(entry.voiceKey, effectiveFreq(entry.rawMidi));
  for (const [vk, displayMidi] of sustainedKeys)
    audio.setFrequency(vk, effectiveFreq(displayMidi));
}

function createKeyboard() {
  const wrap = document.createElement('div');
  wrap.className = 'keyboard';

  const labelEls = [];

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
      k.style.left  = `${(idx / 7) * 100}%`;
      k.style.width = `${(1 / 7) * 100}%`;
      whites.appendChild(k);
    });
    row.appendChild(whites);

    if (rowOctave === 4) {
      const logo = document.createElement('div');
      logo.className = 'kb-logo';
      const updateLogo = () => { logo.textContent = store.get('lang') === 'en' ? 'NamaHarmony' : 'NamaHam'; };
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
      k.style.left  = `calc(${center}% - ${w / 2}%)`;
      k.style.width = `${w}%`;
      blacks.appendChild(k);
    });
    row.appendChild(blacks);

    wrap.appendChild(row);
  });

  const updateLabels = () => {
    const off = store.get('octaveOffset');
    labelEls.forEach((el, idx) => { el.textContent = String(ROWS_FROM_TOP[idx] + off); });
  };
  updateLabels();
  prevOctaveOffset = store.get('octaveOffset');
  store.on('octaveOffset', updateLabels);

  store.on('octaveOffset', (newOff) => {
    const delta = newOff - prevOctaveOffset;
    prevOctaveOffset = newOff;

    for (const entry of pointerMap.values())
      audio.setFrequency(entry.voiceKey, effectiveFreq(entry.rawMidi));

    // 持続音の表示位置を移動（2パスで既存ハイライトを先に消す）
    for (const displayMidi of sustainedKeys.values()) setKeyVisualActive(displayMidi, false);
    for (const [vk, displayMidi] of Array.from(sustainedKeys.entries())) {
      const newDisplay = displayMidi - delta * 12;
      sustainedKeys.set(vk, newDisplay);
      if (document.querySelector(`[data-midi="${newDisplay}"]`)) setKeyVisualActive(newDisplay, true);
    }
  });

  store.on('transpose',    refreshAllFrequencies);
  store.on('transpose',    onNotesChanged);
  store.on('concertPitch', refreshAllFrequencies);
  store.on('temperament',  refreshAllFrequencies);
  store.on('key',          refreshAllFrequencies);
  store.on('keyAuto',      onNotesChanged);
  store.on('sustain',      (on) => { if (!on) clearSustained(); });

  wrap.addEventListener('pointerdown', (e) => {
    const target = pickKeyAt(e.clientX, e.clientY);
    if (!target) return;
    const rawMidi = Number(target.dataset.midi);
    if (Number.isNaN(rawMidi)) return;
    audio.ensureContext();
    if (store.get('sustain')) { handleSustainTap(rawMidi); return; }
    pointerMap.set(e.pointerId, { voiceKey: buildVoiceKey(rawMidi), rawMidi });
    startKey(rawMidi);
    onNotesChanged();
    try { wrap.setPointerCapture(e.pointerId); } catch {}
  });

  wrap.addEventListener('pointermove', (e) => {
    if (store.get('sustain')) return;
    const entry = pointerMap.get(e.pointerId);
    if (!entry) return;
    const target  = pickKeyAt(e.clientX, e.clientY);
    const newMidi = target ? Number(target.dataset.midi) : NaN;
    if (Number.isNaN(newMidi)) {
      stopKey(entry.rawMidi); pointerMap.delete(e.pointerId); return;
    }
    if (newMidi !== entry.rawMidi) {
      stopKey(entry.rawMidi); startKey(newMidi);
      entry.rawMidi = newMidi;
      entry.voiceKey = buildVoiceKey(newMidi);
      onNotesChanged();
    }
  });

  const release = (e) => {
    if (store.get('sustain')) return;
    const entry = pointerMap.get(e.pointerId);
    if (!entry) return;
    stopKey(entry.rawMidi);
    pointerMap.delete(e.pointerId);
    onNotesChanged();
    try { wrap.releasePointerCapture(e.pointerId); } catch {}
  };
  wrap.addEventListener('pointerup',     release);
  wrap.addEventListener('pointercancel', release);
  wrap.addEventListener('pointerleave',  (e) => {
    if (store.get('sustain')) return;
    if (e.pointerType === 'mouse') release(e);
  });

  wrap.addEventListener('contextmenu', (e) => e.preventDefault());

  // マルチタッチを OS のジェスチャー認識に渡さない（Samsung 3本指スクショ等）
  const absorbTouch = (e) => e.preventDefault();
  wrap.addEventListener('touchstart', absorbTouch, { passive: false });
  wrap.addEventListener('touchmove',  absorbTouch, { passive: false });

  return wrap;
}

function stopAllKeyboard() {
  for (const entry of Array.from(pointerMap.values())) stopKey(entry.rawMidi);
  pointerMap.clear();
  clearSustained();
  onNotesChanged();
}

function setKeyboardKeyHighlight(pc, active) {
  document.querySelectorAll('[data-midi]').forEach((el) => {
    const m = Number(el.dataset.midi);
    if (((m % 12) + 12) % 12 === pc) el.classList.toggle('flash', active);
  });
}

function noteLabelForKey(pc) {
  return pcToName(pc, true) ?? NOTE_NAMES_FLAT[pc];
}

// =====================================================================
// settings.ts — 設定画面
// =====================================================================
function createWakeLockController(onChange) {
  let sentinel = null;
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && store.get('wakeLock') && !sentinel) await acquire();
  });

  async function acquire() {
    if (!supported) return;
    try {
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => { sentinel = null; onChange(false); });
      onChange(true);
    } catch {
      sentinel = null; onChange(false);
    }
  }

  async function releaseLock() {
    if (sentinel) { try { await sentinel.release(); } catch {} sentinel = null; }
    onChange(false);
  }

  return { acquire, releaseLock, isSupported: supported };
}

function createSettingsScreen() {
  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay';

  const panel = document.createElement('div');
  panel.className = 'settings-panel';

  // ヘッダー
  const header  = document.createElement('div');
  header.className = 'settings-header';
  const titleEl = document.createElement('div');
  titleEl.className = 'settings-title';
  titleEl.dataset.i18n = 'settings';
  titleEl.textContent = t(store.get('lang'), 'settings');
  const closeBtn = document.createElement('button');
  closeBtn.className = 'settings-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', hide);
  header.append(titleEl, closeBtn);
  panel.appendChild(header);

  const body = document.createElement('div');
  body.className = 'settings-body';

  // ---- インストール ----
  const installBlock = document.createElement('div');
  installBlock.className = 'setting-block install-block';
  const installBtn = document.createElement('button');
  installBtn.className = 'install-btn';
  const refreshInstallBtn = () => {
    const lang = store.get('lang');
    if (isStandaloneDisplay()) {
      installBtn.textContent = t(lang, 'installedBtn');
      installBtn.classList.add('installed');
      installBtn.disabled = true;
    } else {
      installBtn.textContent = t(lang, 'installBtn');
      installBtn.classList.remove('installed');
      installBtn.disabled = false;
    }
  };
  refreshInstallBtn();
  installBtn.addEventListener('click', () => { void runInstallFlow(); });
  window.addEventListener('namaham:install-availability-changed', refreshInstallBtn);
  store.on('lang', refreshInstallBtn);
  installBlock.appendChild(installBtn);
  body.appendChild(installBlock);

  // ---- 言語 ----
  const langBlock = document.createElement('div');
  langBlock.className = 'setting-block setting-block-inline';
  const langLabel = document.createElement('div');
  langLabel.className = 'setting-label setting-label-inline';
  langLabel.dataset.i18n = 'language';
  langLabel.textContent = t(store.get('lang'), 'language');
  langBlock.appendChild(langLabel);

  const langRow = document.createElement('div');
  langRow.className = 'lang-row lang-row-inline';
  ['ja', 'en'].forEach((lang) => {
    const btn = document.createElement('button');
    btn.className = 'lang-btn';
    btn.textContent = lang === 'ja' ? '日本語' : 'English';
    const refreshLangBtn = () => btn.classList.toggle('active', store.get('lang') === lang);
    refreshLangBtn();
    store.on('lang', refreshLangBtn);
    btn.addEventListener('click', () => {
      store.set('lang', lang);
      applyLocale(lang);
      titleEl.textContent    = t(lang, 'settings');
      langLabel.textContent  = t(lang, 'language');
      wakeTitle.textContent  = t(lang, 'keepAwake');
      updateWakeStatus(wakeInput.checked, lang);
      pitchLabel.textContent = t(lang, 'concertPitch');
      themeLabel.textContent = t(lang, 'themeColor');
      themeNameEls.forEach((el, i) => { el.textContent = lang === 'en' ? THEMES[i].nameEn : THEMES[i].name; });
    });
    langRow.appendChild(btn);
  });
  langBlock.appendChild(langRow);
  body.appendChild(langBlock);

  // ---- スリープ防止 ----
  const wakeBlock = document.createElement('div');
  wakeBlock.className = 'setting-block';
  const wakeRow = document.createElement('div');
  wakeRow.className = 'wake-row';

  const wakeInfo   = document.createElement('div');
  const wakeTitle  = document.createElement('div');
  wakeTitle.className = 'wake-title';
  wakeTitle.textContent = t(store.get('lang'), 'keepAwake');
  const wakeStatus = document.createElement('div');
  wakeStatus.className = 'wake-status';
  wakeInfo.append(wakeTitle, wakeStatus);

  const wakeSwitch = document.createElement('label');
  wakeSwitch.className = 'switch';
  const wakeInput  = document.createElement('input');
  wakeInput.type = 'checkbox';
  const wakeSlider = document.createElement('span');
  wakeSlider.className = 'switch-slider';
  wakeSwitch.append(wakeInput, wakeSlider);
  wakeRow.append(wakeInfo, wakeSwitch);
  wakeBlock.appendChild(wakeRow);
  body.appendChild(wakeBlock);

  const updateWakeStatus = (active, lang = store.get('lang')) => {
    wakeInput.checked = active;
    wakeStatus.textContent = active ? t(lang, 'keepAwakeOn') : t(lang, 'keepAwakeOff');
    wakeSlider.classList.toggle('on', active);
  };

  const wakeCtrl = createWakeLockController((active) => updateWakeStatus(active));

  if (!wakeCtrl.isSupported) {
    wakeStatus.textContent = t(store.get('lang'), 'keepAwakeUnsupported');
    wakeInput.disabled = true;
    wakeBlock.classList.add('disabled');
  } else {
    updateWakeStatus(store.get('wakeLock'));
    if (store.get('wakeLock')) void wakeCtrl.acquire();
  }

  wakeInput.addEventListener('change', async () => {
    const want = wakeInput.checked;
    store.set('wakeLock', want);
    if (want) await wakeCtrl.acquire();
    else      await wakeCtrl.releaseLock();
  });

  // ---- コンサートピッチ ----
  const pitchBlock = document.createElement('div');
  pitchBlock.className = 'setting-block setting-block-inline';
  const pitchLabel = document.createElement('div');
  pitchLabel.className = 'setting-label setting-label-inline';
  pitchLabel.textContent = t(store.get('lang'), 'concertPitch');
  const pitchRow = document.createElement('div');
  pitchRow.className = 'pitch-row pitch-row-inline';

  const minusBtn = document.createElement('button');
  minusBtn.className = 'pitch-step'; minusBtn.textContent = '−';
  const pitchVal = document.createElement('div');
  pitchVal.className = 'pitch-value scroll-target';
  pitchVal.textContent = `${store.get('concertPitch')} Hz`;
  const plusBtn = document.createElement('button');
  plusBtn.className = 'pitch-step'; plusBtn.textContent = '+';

  const setPitch = (v) => store.set('concertPitch', Math.max(415, Math.min(466, v)));
  minusBtn.addEventListener('click', () => setPitch(store.get('concertPitch') - 1));
  plusBtn.addEventListener('click',  () => setPitch(store.get('concertPitch') + 1));
  attachScrollSwipe(pitchVal, {
    sensitivity: 20, wheelSensitivity: 50,
    onStep: (d) => setPitch(store.get('concertPitch') + d),
  });
  store.on('concertPitch', (v) => { pitchVal.textContent = `${v} Hz`; });

  pitchRow.append(minusBtn, pitchVal, plusBtn);
  pitchBlock.append(pitchLabel, pitchRow);
  body.appendChild(pitchBlock);

  // ---- テーマカラー ----
  const themeBlock = document.createElement('div');
  themeBlock.className = 'setting-block';
  const themeLabel = document.createElement('div');
  themeLabel.className = 'setting-label';
  themeLabel.textContent = t(store.get('lang'), 'themeColor');
  themeBlock.appendChild(themeLabel);

  const themeGrid    = document.createElement('div');
  themeGrid.className = 'theme-grid';
  const themeNameEls = [];
  THEMES.forEach((th, i) => {
    const cell = document.createElement('button');
    cell.className = 'theme-cell';
    cell.setAttribute('aria-label', th.name);
    cell.innerHTML = `
      <div class="theme-swatch">
        <div class="theme-half" style="background:${th.headerBg}"></div>
        <div class="theme-half" style="background:${th.footerBg}"></div>
      </div>
      <div class="theme-name">${th.name}</div>
    `;
    const nameEl = cell.querySelector('.theme-name');
    themeNameEls.push(nameEl);
    const refresh = () => cell.classList.toggle('active', store.get('themeIndex') === i);
    refresh();
    store.on('themeIndex', refresh);
    cell.addEventListener('click', () => store.set('themeIndex', i));
    themeGrid.appendChild(cell);
  });
  themeBlock.appendChild(themeGrid);
  body.appendChild(themeBlock);

  panel.appendChild(body);
  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) hide(); });

  function show() {
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('shown'));
  }
  function hide() {
    overlay.classList.remove('shown');
    setTimeout(() => overlay.remove(), 200);
  }

  // 言語変更（外部 postMessage 経由含む）でラベルを同期
  store.on('lang', (lang) => {
    titleEl.textContent    = t(lang, 'settings');
    langLabel.textContent  = t(lang, 'language');
    wakeTitle.textContent  = t(lang, 'keepAwake');
    if (!wakeCtrl.isSupported) {
      wakeStatus.textContent = t(lang, 'keepAwakeUnsupported');
    } else {
      updateWakeStatus(wakeInput.checked, lang);
    }
    pitchLabel.textContent = t(lang, 'concertPitch');
    themeLabel.textContent = t(lang, 'themeColor');
    themeNameEls.forEach((el, i) => { el.textContent = lang === 'en' ? THEMES[i].nameEn : THEMES[i].name; });
  });

  // NamaSound+ からのウェイクロック制御
  window.addEventListener('namaham:set-wakelock', async (e) => {
    if (!wakeCtrl.isSupported) return;
    const enabled = e.detail.enabled;
    store.set('wakeLock', enabled);
    if (enabled) await wakeCtrl.acquire();
    else         await wakeCtrl.releaseLock();
  });

  window.addEventListener('namaham:open-settings', show);
  return overlay;
}

// =====================================================================
// install.ts — PWA インストールボタン
// =====================================================================
let deferredInstallPrompt = null;
let isInsideNamaSoundPlus = false;

const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios/i.test(navigator.userAgent);
const isStandaloneDisplay = () =>
  window.matchMedia('(display-mode: standalone)').matches
  || ('standalone' in navigator && navigator.standalone === true);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  window.dispatchEvent(new CustomEvent('namaham:install-availability-changed'));
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  window.dispatchEvent(new CustomEvent('namaham:install-availability-changed'));
});

window.addEventListener('namaham:enter-hostcontext', () => {
  isInsideNamaSoundPlus = true;
  window.dispatchEvent(new CustomEvent('namaham:install-availability-changed'));
});

function openInfoModal(title, bodyHTML) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const sheet = document.createElement('div');
  sheet.className = 'modal-sheet';
  sheet.style.width = '300px';

  const header = document.createElement('div');
  header.className = 'modal-title';
  header.textContent = title;
  sheet.appendChild(header);

  const body = document.createElement('div');
  body.style.padding = '14px 16px';
  body.style.fontSize = '13px';
  body.style.lineHeight = '1.8';
  body.style.color = 'var(--sub-text)';
  body.innerHTML = bodyHTML;
  sheet.appendChild(body);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = t(store.get('lang'), 'installModalClose');
  closeBtn.style.cssText = 'margin:0 16px 16px;padding:11px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:15px;font-weight:600;cursor:pointer;';
  closeBtn.addEventListener('click', close);
  sheet.appendChild(closeBtn);

  function close() {
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 160);
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('shown'));
}

function openConfirmModal(title, bodyText, cancelLabel, proceedLabel, onProceed) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const sheet = document.createElement('div');
  sheet.className = 'modal-sheet';
  sheet.style.width = '300px';

  const header = document.createElement('div');
  header.className = 'modal-title';
  header.textContent = title;
  sheet.appendChild(header);

  const body = document.createElement('div');
  body.style.padding = '14px 16px';
  body.style.fontSize = '13px';
  body.style.lineHeight = '1.8';
  body.style.color = 'var(--sub-text)';
  body.textContent = bodyText;
  sheet.appendChild(body);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;padding:0 16px 16px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = cancelLabel;
  cancelBtn.style.cssText = 'flex:1;padding:11px;border:2px solid var(--panel-border);border-radius:8px;background:transparent;color:var(--text);font-size:14px;font-weight:600;cursor:pointer;';
  cancelBtn.addEventListener('click', close);

  const proceedBtn = document.createElement('button');
  proceedBtn.textContent = proceedLabel;
  proceedBtn.style.cssText = 'flex:1;padding:11px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:14px;font-weight:600;cursor:pointer;';
  proceedBtn.addEventListener('click', () => { close(); onProceed(); });

  btnRow.append(cancelBtn, proceedBtn);
  sheet.appendChild(btnRow);

  function close() {
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 160);
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('shown'));
}

async function runInstallFlow() {
  const lang = store.get('lang');

  if (isStandaloneDisplay()) {
    openInfoModal(t(lang, 'installedTitle'), t(lang, 'installedBody'));
    return;
  }

  // 直接インストール可能な環境（Chrome/Edge 等）かどうか
  const canPromptDirectly = !!deferredInstallPrompt;

  const doDirectPrompt = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredInstallPrompt = null;
      window.dispatchEvent(new CustomEvent('namaham:install-availability-changed'));
    }
  };

  const showFallbackGuide = () => {
    if (isIOSDevice) {
      openInfoModal(t(lang, 'installIOSTitle'), t(lang, 'installIOSBody'));
    } else {
      openInfoModal(t(lang, 'installGenericTitle'), t(lang, 'installGenericBody'));
    }
  };

  if (isInsideNamaSoundPlus) {
    if (canPromptDirectly) {
      // 直接インストール可能な環境: 確認ダイアログを割り込み表示
      openConfirmModal(
        t(lang, 'installGateTitle'),
        t(lang, 'installGateBody'),
        t(lang, 'installGateCancel'),
        t(lang, 'installGateProceed'),
        doDirectPrompt,
      );
    } else {
      // 直接インストール不可の環境: キャンセル/続行の選択肢は出さず、
      // 案内文の前に説明メッセージを続けて表示する
      const lang2 = store.get('lang');
      const combinedBody = `<p style="margin-bottom:10px">${t(lang2, 'installGateBody')}</p>`
        + (isIOSDevice ? t(lang2, 'installIOSBody') : t(lang2, 'installGenericBody'));
      openInfoModal(isIOSDevice ? t(lang2, 'installIOSTitle') : t(lang2, 'installGenericTitle'), combinedBody);
    }
    return;
  }

  if (canPromptDirectly) {
    await doDirectPrompt();
    return;
  }

  showFallbackGuide();
}

// =====================================================================
// main.ts — エントリポイント
// =====================================================================
function applyManifest(lang) {
  const el = document.getElementById('pwa-manifest');
  if (el) el.href = lang === 'en' ? './manifest-en.json' : './manifest.json';
  const icon = document.querySelector('link[rel="apple-touch-icon"]');
  if (icon) icon.href = lang === 'en' ? './NamaHarmony192.png' : './NamaHam192.png';
}

store.load();
applyTheme(store.get('themeIndex'));
store.on('themeIndex', (i) => applyTheme(i));
applyLocale(store.get('lang'));
applyManifest(store.get('lang'));
store.on('lang', applyManifest);

audio.setTone(TONES[store.get('toneIndex')]);
audio.setVolume(store.get('volume'));

const app = document.getElementById('app');
if (app) {
  app.appendChild(createTopBar());
  app.appendChild(createKeyboard());
  app.appendChild(createBottomBar());
  app.appendChild(createSettingsScreen());
}

// AudioContext は初回操作まで遅延初期化（iOS Safari 対応）
const initAudioOnce = () => {
  audio.ensureContext();
  window.removeEventListener('pointerdown', initAudioOnce);
  window.removeEventListener('keydown',     initAudioOnce);
};
window.addEventListener('pointerdown', initAudioOnce, { passive: true });
window.addEventListener('keydown',     initAudioOnce);

// ===== NamaSound+ 親フレーム連携 =====
// ダブルドメイン対応: nama1223.com / nama1223.github.io のどちらから
// 開かれていても親からのメッセージを受け取れるよう許可リスト化する。
const ALLOWED_PARENT_ORIGINS = [
  'https://nama1223.com',
  'https://nama1223.github.io',
  'http://nama1223.github.io',
];

window.addEventListener('message', (event) => {
  if (!ALLOWED_PARENT_ORIGINS.includes(event.origin)) return;
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;
  switch (msg.type) {
    case 'setHostContext':
      if (msg.host === 'namasoundplus') {
        window.dispatchEvent(new CustomEvent('namaham:enter-hostcontext'));
      }
      break;
    case 'setLanguage': {
      const lang = msg.lang;
      if (lang === 'ja' || lang === 'en') store.set('lang', lang);
      break;
    }
    case 'setWakeLock':
      window.dispatchEvent(new CustomEvent('namaham:set-wakelock', {
        detail: { enabled: !!msg.enabled },
      }));
      break;
    case 'pauseAll':
      stopAllKeyboard();
      break;
  }
});

if (window.parent !== window) {
  window.parent.postMessage({ type: 'childReady', app: location.pathname }, '*');
}
// ===== ここまで =====
