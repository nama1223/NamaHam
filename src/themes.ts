export interface Theme {
  name: string;
  nameEn: string;
  kind: 'light' | 'dark';
  headerBg: string;
  footerBg: string;
  footerText: string;
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
    nameEn: 'Cream',
    kind: 'light',
    headerBg: '#ede3cc',
    footerBg: '#7a4f28',
    footerText: '#f5e6d6',
    text: '#222',
    subText: '#555',
    panelBg: '#ffffff',
    panelBorder: '#1f1f1f',
    accent: '#e67e22',
    modalBg: '#fffaf0',
  },
  {
    name: 'スカイ',
    nameEn: 'Sky',
    kind: 'light',
    headerBg: '#d4e5f0',
    footerBg: '#1a5e88',
    footerText: '#d8edf8',
    text: '#11304a',
    subText: '#4a6a82',
    panelBg: '#ffffff',
    panelBorder: '#1b3b5a',
    accent: '#1d7ed1',
    modalBg: '#f3f8fc',
  },
  {
    name: 'ミント',
    nameEn: 'Mint',
    kind: 'light',
    headerBg: '#cceadb',
    footerBg: '#1e6b42',
    footerText: '#d0f0e2',
    text: '#1c3a2c',
    subText: '#4a6b58',
    panelBg: '#ffffff',
    panelBorder: '#234c39',
    accent: '#2aa66b',
    modalBg: '#f0f8f3',
  },
  {
    name: 'ネイビー',
    nameEn: 'Navy',
    kind: 'dark',
    headerBg: '#1c2d42',
    footerBg: '#0c1e35',
    footerText: '#a8c4de',
    text: '#f0f3f7',
    subText: '#a8b8cc',
    panelBg: '#2a3a55',
    panelBorder: '#c8d3e3',
    accent: '#5aa9ff',
    modalBg: '#1a2a40',
  },
  {
    name: 'フォレスト',
    nameEn: 'Forest',
    kind: 'dark',
    headerBg: '#1c2f20',
    footerBg: '#3a1e08',
    footerText: '#e0c4a8',
    text: '#eef5ef',
    subText: '#a8c2af',
    panelBg: '#314a39',
    panelBorder: '#c5d6c9',
    accent: '#71d39a',
    modalBg: '#1e3424',
  },
  {
    name: 'プラム',
    nameEn: 'Plum',
    kind: 'dark',
    headerBg: '#2a1a34',
    footerBg: '#0e2a36',
    footerText: '#a8d4e0',
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
