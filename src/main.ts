import './style.css';
import { store } from './state';
import { applyTheme } from './themes';
import { createTopBar, createBottomBar } from './controls';
import { createKeyboard, stopAllKeyboard } from './keyboard';
import { createSettingsScreen } from './settings';
import { audio, TONES } from './tones';
import { applyLocale } from './locale';
import type { Lang } from './locale';

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

// ===== NamaSound+ 親フレーム連携 =====
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://nama1223.github.io') return;
  const msg = event.data as { type?: string; lang?: string; enabled?: boolean };
  if (!msg || typeof msg !== 'object') return;
  switch (msg.type) {
    case 'setLanguage': {
      const lang = msg.lang;
      if (lang === 'ja' || lang === 'en') store.set('lang', lang as Lang);
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
