import './style.css';
import { store } from './state';
import { applyTheme } from './themes';
import { createTopBar, createBottomBar } from './controls';
import { createKeyboard } from './keyboard';
import { createSettingsScreen } from './settings';
import { audio, TONES } from './tones';
import { applyLocale } from './locale';

function applyManifest(lang: string): void {
  const el = document.getElementById('pwa-manifest') as HTMLLinkElement | null;
  if (el) el.href = lang === 'en' ? './manifest-en.json' : './manifest.json';
  const icon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
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

const initAudioOnce = () => {
  audio.ensureContext();
  window.removeEventListener('pointerdown', initAudioOnce);
  window.removeEventListener('keydown', initAudioOnce);
};
window.addEventListener('pointerdown', initAudioOnce, { passive: true });
window.addEventListener('keydown', initAudioOnce);
