import { store } from './state';
import { THEMES } from './themes';
import { attachScrollSwipe } from './scrollSwipe';
import { t, applyLocale } from './locale';
import type { Lang } from './locale';

interface WakeLockSentinel {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
}

interface WakeLockController {
  acquire: () => Promise<void>;
  releaseLock: () => Promise<void>;
  isSupported: boolean;
}

function createWakeLockController(onChange: (active: boolean) => void): WakeLockController {
  let sentinel: WakeLockSentinel | null = null;
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && store.get('wakeLock') && !sentinel) {
      await acquire();
    }
  });

  async function acquire(): Promise<void> {
    if (!supported) return;
    try {
      const nav = navigator as unknown as { wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinel> } };
      sentinel = await nav.wakeLock.request('screen');
      sentinel.addEventListener('release', () => { sentinel = null; onChange(false); });
      onChange(true);
    } catch {
      sentinel = null;
      onChange(false);
    }
  }

  async function releaseLock(): Promise<void> {
    if (sentinel) { try { await sentinel.release(); } catch {} sentinel = null; }
    onChange(false);
  }

  return { acquire, releaseLock, isSupported: supported };
}

export function createSettingsScreen(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay';

  const panel = document.createElement('div');
  panel.className = 'settings-panel';

  // Header
  const header = document.createElement('div');
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

  // ---- Language toggle ----
  const langBlock = document.createElement('div');
  langBlock.className = 'setting-block';
  const langLabel = document.createElement('div');
  langLabel.className = 'setting-label';
  langLabel.dataset.i18n = 'language';
  langLabel.textContent = t(store.get('lang'), 'language');
  langBlock.appendChild(langLabel);

  const langRow = document.createElement('div');
  langRow.className = 'lang-row';
  (['ja', 'en'] as Lang[]).forEach((lang) => {
    const btn = document.createElement('button');
    btn.className = 'lang-btn';
    btn.textContent = lang === 'ja' ? '日本語' : 'English';
    const refreshLangBtn = () => btn.classList.toggle('active', store.get('lang') === lang);
    refreshLangBtn();
    store.on('lang', refreshLangBtn);
    btn.addEventListener('click', () => {
      store.set('lang', lang);
      applyLocale(lang);
      // Re-render dynamic labels inside settings
      titleEl.textContent = t(lang, 'settings');
      langLabel.textContent = t(lang, 'language');
      wakeTitle.textContent = t(lang, 'keepAwake');
      updateWakeStatus(wakeInput.checked, lang);
      pitchLabel.textContent = t(lang, 'concertPitch');
      themeLabel.textContent = t(lang, 'themeColor');
      themeNameEls.forEach((el, i) => {
        el.textContent = lang === 'en' ? THEMES[i].nameEn : THEMES[i].name;
      });
    });
    langRow.appendChild(btn);
  });
  langBlock.appendChild(langRow);
  body.appendChild(langBlock);

  // ---- Wake lock ----
  const wakeBlock = document.createElement('div');
  wakeBlock.className = 'setting-block';
  const wakeRow = document.createElement('div');
  wakeRow.className = 'wake-row';

  const wakeInfo = document.createElement('div');
  const wakeTitle = document.createElement('div');
  wakeTitle.className = 'wake-title';
  wakeTitle.textContent = t(store.get('lang'), 'keepAwake');
  const wakeStatus = document.createElement('div');
  wakeStatus.className = 'wake-status';
  wakeInfo.append(wakeTitle, wakeStatus);

  const wakeSwitch = document.createElement('label');
  wakeSwitch.className = 'switch';
  const wakeInput = document.createElement('input');
  wakeInput.type = 'checkbox';
  const wakeSlider = document.createElement('span');
  wakeSlider.className = 'switch-slider';
  wakeSwitch.append(wakeInput, wakeSlider);
  wakeRow.append(wakeInfo, wakeSwitch);
  wakeBlock.appendChild(wakeRow);
  body.appendChild(wakeBlock);

  const updateWakeStatus = (active: boolean, lang = store.get('lang')) => {
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
    else await wakeCtrl.releaseLock();
  });

  // ---- Concert pitch ----
  const pitchBlock = document.createElement('div');
  pitchBlock.className = 'setting-block';
  const pitchLabel = document.createElement('div');
  pitchLabel.className = 'setting-label';
  pitchLabel.textContent = t(store.get('lang'), 'concertPitch');
  const pitchRow = document.createElement('div');
  pitchRow.className = 'pitch-row';

  const minusBtn = document.createElement('button');
  minusBtn.className = 'pitch-step';
  minusBtn.textContent = '−';
  const pitchVal = document.createElement('div');
  pitchVal.className = 'pitch-value scroll-target';
  pitchVal.textContent = `${store.get('concertPitch')} Hz`;
  const plusBtn = document.createElement('button');
  plusBtn.className = 'pitch-step';
  plusBtn.textContent = '+';

  const setPitch = (v: number) => store.set('concertPitch', Math.max(415, Math.min(466, v)));
  minusBtn.addEventListener('click', () => setPitch(store.get('concertPitch') - 1));
  plusBtn.addEventListener('click', () => setPitch(store.get('concertPitch') + 1));
  attachScrollSwipe(pitchVal, {
    sensitivity: 20,
    wheelSensitivity: 50,
    onStep: (d) => setPitch(store.get('concertPitch') + d),
  });
  store.on('concertPitch', (v) => { pitchVal.textContent = `${v} Hz`; });

  pitchRow.append(minusBtn, pitchVal, plusBtn);
  pitchBlock.append(pitchLabel, pitchRow);
  body.appendChild(pitchBlock);

  // ---- Theme colors ----
  const themeBlock = document.createElement('div');
  themeBlock.className = 'setting-block';
  const themeLabel = document.createElement('div');
  themeLabel.className = 'setting-label';
  themeLabel.textContent = t(store.get('lang'), 'themeColor');
  themeBlock.appendChild(themeLabel);

  const themeGrid = document.createElement('div');
  themeGrid.className = 'theme-grid';
  const themeNameEls: HTMLElement[] = [];
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
    const nameEl = cell.querySelector('.theme-name') as HTMLElement;
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

  function show(): void {
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('shown'));
  }
  function hide(): void {
    overlay.classList.remove('shown');
    setTimeout(() => overlay.remove(), 200);
  }

  window.addEventListener('namaham:open-settings', show);
  return overlay;
}
