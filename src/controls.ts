import { store, NOTE_NAMES_FLAT } from './state';
import { TONES, audio } from './tones';
import type { ToneSpec } from './tones';
import { attachScrollSwipe } from './scrollSwipe';
import { openListModal } from './modal';
import { t, applyLocale } from './locale';

function getLang() { return store.get('lang'); }
function getToneLabel(tone: ToneSpec): string {
  return getLang() === 'en' ? tone.nameEn : tone.name;
}

function renderSpeaker(volume: number): string {
  const waves: string[] = [];
  if (volume > 5) waves.push('<path d="M19 9 Q22 12 19 15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>');
  if (volume > 33) waves.push('<path d="M22 6 Q27 12 22 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>');
  if (volume > 66) waves.push('<path d="M25 3 Q32 12 25 21" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>');
  const mute = volume <= 0
    ? '<path d="M20 8 L28 16 M28 8 L20 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    : '';
  return `<svg viewBox="0 0 34 24" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><path d="M3 9 L8 9 L13 4 L13 20 L8 15 L3 15 Z" fill="currentColor"/>${waves.join('')}${mute}</svg>`;
}

export function createTopBar(): HTMLElement {
  const top = document.createElement('div');
  top.className = 'topbar';

  const row1 = document.createElement('div');
  row1.className = 'topbar-row';

  // Gear button (settings)
  const gear = document.createElement('button');
  gear.className = 'icon-btn gear-btn';
  gear.setAttribute('aria-label', '設定');
  gear.textContent = '⚙️';
  gear.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('namaham:open-settings'));
  });
  row1.appendChild(gear);

  // 移調 label + pill
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
    sensitivity: 24,
    wheelSensitivity: 100,
    onStep: (d) => {
      store.set('transpose', (store.get('transpose') + d + 12) % 12);
    },
  });
  transposeBtn.addEventListener('click', () => {
    openListModal(
      t(getLang(), 'transposeModal'),
      NOTE_NAMES_FLAT.map((n, i) => ({ label: n, value: i })),
      store.get('transpose'),
      (v) => store.set('transpose', v),
    );
  });
  store.on('transpose', (v) => { transposeText.textContent = NOTE_NAMES_FLAT[v]; });

  // 音色 label + pill
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
    sensitivity: 28,
    wheelSensitivity: 100,
    onStep: (d) => {
      store.set('toneIndex', (store.get('toneIndex') + d + TONES.length) % TONES.length);
    },
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

  // Row 2
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

  // Volume
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
  volSlider.min = '0';
  volSlider.max = '100';
  volSlider.step = '1';
  volSlider.value = String(store.get('volume'));
  volPopup.appendChild(volSlider);
  volWrap.appendChild(volPopup);

  speakerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    volPopup.classList.toggle('shown');
  });
  volNum.addEventListener('click', (e) => {
    e.stopPropagation();
    volPopup.classList.toggle('shown');
  });
  document.addEventListener('click', (e) => {
    if (!volWrap.contains(e.target as Node)) volPopup.classList.remove('shown');
  });
  volSlider.addEventListener('input', () => {
    store.set('volume', parseInt(volSlider.value, 10));
  });
  const volSwipeOpts = {
    sensitivity: 6,
    wheelSensitivity: 40,
    onStep: (d: number) => {
      store.set('volume', Math.max(0, Math.min(100, store.get('volume') + d * 2)));
    },
  };
  attachScrollSwipe(speakerBtn, volSwipeOpts);
  attachScrollSwipe(volNum, volSwipeOpts);
  store.on('volume', (v) => {
    volNum.textContent = `${v}%`;
    volSlider.value = String(v);
    speakerBtn.innerHTML = renderSpeaker(v);
    audio.setVolume(v);
  });
  row2.appendChild(volWrap);

  // Range (octave)
  const rangeWrap = document.createElement('div');
  rangeWrap.className = 'range-wrap scroll-target';

  const rangeDown = document.createElement('button');
  rangeDown.className = 'tri-btn';
  rangeDown.textContent = '▼';
  rangeDown.addEventListener('click', () => {
    store.set('octaveOffset', Math.max(-2, store.get('octaveOffset') - 1));
  });

  const rangeText = document.createElement('div');
  rangeText.className = 'range-text';
  rangeText.dataset.i18n = 'range';
  rangeText.textContent = t(getLang(), 'range');

  const rangeUp = document.createElement('button');
  rangeUp.className = 'tri-btn';
  rangeUp.textContent = '▲';
  rangeUp.addEventListener('click', () => {
    store.set('octaveOffset', Math.min(2, store.get('octaveOffset') + 1));
  });

  rangeWrap.append(rangeDown, rangeText, rangeUp);
  attachScrollSwipe(rangeWrap, {
    sensitivity: 60,
    wheelSensitivity: 150,
    onStep: (d) => {
      store.set('octaveOffset', Math.max(-2, Math.min(2, store.get('octaveOffset') + d)));
    },
  });
  row2.appendChild(rangeWrap);

  top.appendChild(row2);

  // Update labels on language change
  store.on('lang', (lang) => {
    applyLocale(lang);
    toneText.textContent = getToneLabel(TONES[store.get('toneIndex')]);
  });

  return top;
}

export function createBottomBar(): HTMLElement {
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
  keyBtn.className = 'pill scroll-target';
  keyBtn.setAttribute('role', 'button');
  const keyText = document.createElement('span');
  keyText.textContent = NOTE_NAMES_FLAT[store.get('key')];
  keyBtn.appendChild(keyText);
  bot.appendChild(keyBtn);

  attachScrollSwipe(keyBtn, {
    sensitivity: 24,
    wheelSensitivity: 100,
    onStep: (d) => { store.set('key', (store.get('key') + d + 12) % 12); },
  });
  keyBtn.addEventListener('click', () => {
    openListModal(
      t(getLang(), 'keyModal'),
      NOTE_NAMES_FLAT.map((n, i) => ({ label: n, value: i })),
      store.get('key'),
      (v) => store.set('key', v),
    );
  });
  store.on('key', (v) => { keyText.textContent = NOTE_NAMES_FLAT[v]; });

  const tempBtn = document.createElement('div');
  tempBtn.className = 'pill temp-btn';
  tempBtn.setAttribute('role', 'button');
  const tempText = document.createElement('span');
  const getTempLabel = () => store.get('temperament') === 'just'
    ? t(getLang(), 'just')
    : t(getLang(), 'equal');
  tempText.textContent = getTempLabel();
  tempBtn.appendChild(tempText);
  tempBtn.addEventListener('click', () => {
    store.set('temperament', store.get('temperament') === 'just' ? 'equal' : 'just');
  });
  const refreshTemp = () => {
    tempText.textContent = getTempLabel();
    tempBtn.classList.toggle('just', store.get('temperament') === 'just');
  };
  store.on('temperament', refreshTemp);
  store.on('lang', refreshTemp);
  refreshTemp();
  bot.appendChild(tempBtn);

  return bot;
}
