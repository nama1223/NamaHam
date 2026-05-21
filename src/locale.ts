export type Lang = 'ja' | 'en';

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
  },
} as const;

export type LocaleKey = keyof typeof STRINGS.ja;

export function t(lang: Lang, key: LocaleKey): string {
  return (STRINGS[lang] as Record<string, string>)[key]
    ?? (STRINGS.ja as Record<string, string>)[key]
    ?? key;
}

export function applyLocale(lang: Lang): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as LocaleKey | undefined;
    if (key) el.textContent = t(lang, key);
  });
}
