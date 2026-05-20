export interface Theme {
  name: string;
  kind: 'light' | 'dark';
  headerBg: string;
  footerBg: string;
  text: string;
  subText: string;
  panelBg: string;
  panelBorder: string;
  accent: string;
  modalBg: string;
}

export const THEMES: Theme[] = [
  {
    name: 'クリーム',
    kind: 'light',
    headerBg: '#e9dfca',
    footerBg: '#f4ecd8',
    text: '#222',
    subText: '#555',
    panelBg: '#ffffff',
    panelBorder: '#1f1f1f',
    accent: '#e67e22',
    modalBg: '#fffaf0',
  },
  {
    name: 'スカイ',
    kind: 'light',
    headerBg: '#d6e6f2',
    footerBg: '#eaf3fb',
    text: '#11304a',
    subText: '#4a6a82',
    panelBg: '#ffffff',
    panelBorder: '#1b3b5a',
    accent: '#1d7ed1',
    modalBg: '#f3f8fc',
  },
  {
    name: 'ミント',
    kind: 'light',
    headerBg: '#cde9d8',
    footerBg: '#e3f3ea',
    text: '#1c3a2c',
    subText: '#4a6b58',
    panelBg: '#ffffff',
    panelBorder: '#234c39',
    accent: '#2aa66b',
    modalBg: '#f0f8f3',
  },
  {
    name: 'ネイビー',
    kind: 'dark',
    headerBg: '#16243a',
    footerBg: '#1f3252',
    text: '#f0f3f7',
    subText: '#a8b8cc',
    panelBg: '#2a3a55',
    panelBorder: '#c8d3e3',
    accent: '#5aa9ff',
    modalBg: '#1a2a40',
  },
  {
    name: 'フォレスト',
    kind: 'dark',
    headerBg: '#1a2c1f',
    footerBg: '#243e2c',
    text: '#eef5ef',
    subText: '#a8c2af',
    panelBg: '#314a39',
    panelBorder: '#c5d6c9',
    accent: '#71d39a',
    modalBg: '#1e3424',
  },
  {
    name: 'プラム',
    kind: 'dark',
    headerBg: '#2b1b34',
    footerBg: '#3b2547',
    text: '#f4ecf7',
    subText: '#c3aed0',
    panelBg: '#4a3057',
    panelBorder: '#d8c8e0',
    accent: '#c682e0',
    modalBg: '#321f3e',
  },
];

export function applyTheme(index: number): void {
  const theme = THEMES[index] ?? THEMES[0];
  const root = document.documentElement;
  root.style.setProperty('--header-bg', theme.headerBg);
  root.style.setProperty('--footer-bg', theme.footerBg);
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
