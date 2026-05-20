import { store, NOTE_NAMES_FLAT } from './state';
import { TONES, audio } from './tones';
import { attachScrollSwipe } from './scrollSwipe';
import { openListModal } from './modal';

function speakerIcon(volume: number): string {
  if (volume <= 0) return 'OFF';
  if (volume < 34) return 'LOW';
  if (volume < 67) return 'MID';
  return 'HIGH';
}

function setSpeakerGraphic(el: HTMLElement, volume: number): void {
  const kind = speakerIcon(volume);
  el.className = 'speaker-svg';
  el.dataset.level = kind;
  el.innerHTML = renderSpeaker(volume);
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

  const gear = document.createElement('button');
  gear.className = 'icon-btn';
  gear.setAttribute('aria-label', '設定');
  gear.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Zm9.5 3.5l-1.94-1.12l.32-2.2l-2.13-.83l-1.12-1.94l-2.2.32L13.12 4.5h-2.24L9.57 6.23l-2.2-.32L6.25 7.85l-2.13.83l.32 2.2L2.5 12l1.94 1.12l-.32 2.2l2.13.83l1.12 1.94l2.2-.32l1.31 1.73h2.24l1.31-1.73l2.2.32l1.12-1.94l2.13-.83l-.32-2.2L21.5 12Z"/></svg>`;
  gear.addEventListener('click', () => {
    const event = new CustomEvent('namaham:open-settings');
    window.dispatchEvent(event);
  });
  row1.appendChild(gear);

  const transposeLabel = document.createElement('span');
  transposeLabel.className = 'topbar-label';
  transposeLabel.textContent = '移調';
  row1.appendChild(transposeLabel);

  const transposeBtn = document.createElement('div');
  transposeBtn.className = 'pill scroll-target';
  const transposeText = document.createElement('span');
  transposeText.textContent = NOTE_NAMES_FLAT[store.get('transpose')];
  transposeBtn.appendChild(transposeText);
  row1.appendChild(transposeBtn);

  attachScrollSwipe(transposeBtn, {
    sensitivity: 24,
    wheelSensitivity: 60,
    onStep: (d) => {
      const next = (store.get('transpose') + d + 12) % 12;
      store.set('transpose', next);
    },
    onTap: () => {
      openListModal(
        '移調',
        NOTE_NAMES_FLAT.map((n, i) => ({ label: n, value: i })),
        store.get('transpose'),
        (v) => store.set('transpose', v),
      );
    },
  });
  store.on('transpose', (v) => {
    transposeText.textContent = NOTE_NAMES_FLAT[v];
  });

  const toneBtn = document.createElement('div');
  toneBtn.className = 'pill scroll-target tone-pill';
  const toneText = document.createElement('span');
  toneText.textContent = TONES[store.get('toneIndex')].name;
  toneBtn.appendChild(toneText);
  row1.appendChild(toneBtn);

  attachScrollSwipe(toneBtn, {
    sensitivity: 28,
    wheelSensitivity: 70,
    onStep: (d) => {
      const next = (store.get('toneIndex') + d + TONES.length) % TONES.length;
      store.set('toneIndex', next);
    },
    onTap: () => {
      openListModal(
        '音色',
        TONES.map((t, i) => ({ label: t.name, value: i })),
        store.get('toneIndex'),
        (v) => store.set('toneIndex', v),
      );
    },
  });
  store.on('toneIndex', (v) => {
    toneText.textContent = TONES[v].name;
    audio.setTone(TONES[v]);
  });

  top.appendChild(row1);

  const row2 = document.createElement('div');
  row2.className = 'topbar-row';

  const sustainBtn = document.createElement('div');
  sustainBtn.className = 'pill toggle-pill';
  sustainBtn.textContent = '持続音';
  sustainBtn.addEventListener('click', () => {
    store.set('sustain', !store.get('sustain'));
  });
  const refreshSustain = () => {
    sustainBtn.classList.toggle('on', store.get('sustain'));
  };
  refreshSustain();
  store.on('sustain', refreshSustain);
  row2.appendChild(sustainBtn);

  const volWrap = document.createElement('div');
  volWrap.className = 'vol-wrap scroll-target';

  const speakerBtn = document.createElement('button');
  speakerBtn.className = 'speaker-btn';
  const speakerSvg = document.createElement('span');
  speakerSvg.className = 'speaker-svg';
  speakerBtn.appendChild(speakerSvg);
  setSpeakerGraphic(speakerSvg, store.get('volume'));
  volWrap.appendChild(speakerBtn);

  const volNum = document.createElement('div');
  volNum.className = 'vol-num';
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
  document.addEventListener('click', (e) => {
    if (!volWrap.contains(e.target as Node)) {
      volPopup.classList.remove('shown');
    }
  });
  volSlider.addEventListener('input', () => {
    store.set('volume', parseInt(volSlider.value, 10));
  });

  attachScrollSwipe(speakerBtn, {
    sensitivity: 6,
    wheelSensitivity: 30,
    onStep: (d) => {
      const next = Math.max(0, Math.min(100, store.get('volume') + d * 2));
      store.set('volume', next);
    },
  });
  store.on('volume', (v) => {
    volNum.textContent = `${v}%`;
    volSlider.value = String(v);
    setSpeakerGraphic(speakerSvg, v);
    audio.setVolume(v);
  });

  row2.appendChild(volWrap);

  const rangeWrap = document.createElement('div');
  rangeWrap.className = 'range-wrap scroll-target';
  const rangeDown = document.createElement('button');
  rangeDown.className = 'tri-btn';
  rangeDown.textContent = '▼';
  rangeDown.addEventListener('click', () => {
    const next = Math.max(-2, store.get('octaveOffset') - 1);
    store.set('octaveOffset', next);
  });
  const rangeText = document.createElement('div');
  rangeText.className = 'range-text';
  rangeText.textContent = '音域';
  const rangeUp = document.createElement('button');
  rangeUp.className = 'tri-btn';
  rangeUp.textContent = '▲';
  rangeUp.addEventListener('click', () => {
    const next = Math.min(2, store.get('octaveOffset') + 1);
    store.set('octaveOffset', next);
  });
  rangeWrap.append(rangeDown, rangeText, rangeUp);
  attachScrollSwipe(rangeWrap, {
    sensitivity: 60,
    wheelSensitivity: 140,
    onStep: (d) => {
      const next = Math.max(-2, Math.min(2, store.get('octaveOffset') + d));
      store.set('octaveOffset', next);
    },
  });
  row2.appendChild(rangeWrap);

  top.appendChild(row2);

  return top;
}

export function createBottomBar(): HTMLElement {
  const bot = document.createElement('div');
  bot.className = 'bottombar';

  const harmonyLabel = document.createElement('span');
  harmonyLabel.className = 'b-label';
  harmonyLabel.textContent = '和声';
  bot.appendChild(harmonyLabel);

  const rootBtn = document.createElement('div');
  rootBtn.className = 'pill toggle-pill root-btn';
  rootBtn.textContent = '根音を弾く';
  rootBtn.addEventListener('click', () => {
    store.set('rootMode', !store.get('rootMode'));
  });
  const refreshRoot = () => {
    rootBtn.classList.toggle('on', store.get('rootMode'));
  };
  refreshRoot();
  store.on('rootMode', refreshRoot);
  bot.appendChild(rootBtn);

  const keyLabel = document.createElement('span');
  keyLabel.className = 'b-label';
  keyLabel.textContent = '調';
  bot.appendChild(keyLabel);

  const keyBtn = document.createElement('div');
  keyBtn.className = 'pill scroll-target';
  const keyText = document.createElement('span');
  keyText.textContent = NOTE_NAMES_FLAT[store.get('key')];
  keyBtn.appendChild(keyText);
  bot.appendChild(keyBtn);
  attachScrollSwipe(keyBtn, {
    sensitivity: 24,
    wheelSensitivity: 60,
    onStep: (d) => {
      const next = (store.get('key') + d + 12) % 12;
      store.set('key', next);
    },
    onTap: () => {
      openListModal(
        '調（純正律）',
        NOTE_NAMES_FLAT.map((n, i) => ({ label: n, value: i })),
        store.get('key'),
        (v) => store.set('key', v),
      );
    },
  });
  store.on('key', (v) => {
    keyText.textContent = NOTE_NAMES_FLAT[v];
  });

  const tempBtn = document.createElement('div');
  tempBtn.className = 'pill temp-btn';
  const tempText = document.createElement('span');
  tempText.textContent = store.get('temperament') === 'just' ? '純' : '平';
  tempBtn.appendChild(tempText);
  tempBtn.addEventListener('click', () => {
    store.set('temperament', store.get('temperament') === 'just' ? 'equal' : 'just');
  });
  store.on('temperament', (v) => {
    tempText.textContent = v === 'just' ? '純' : '平';
    tempBtn.classList.toggle('just', v === 'just');
  });
  tempBtn.classList.toggle('just', store.get('temperament') === 'just');
  bot.appendChild(tempBtn);

  return bot;
}
