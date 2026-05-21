export interface ToneSpec {
  name: string;
  nameEn: string;
  harmonics: number[];
  attack: number;
  release: number;
  gain: number;
}

export const TONES: ToneSpec[] = [
  {
    name: 'クラリネット',
    nameEn: 'Clarinet',
    harmonics: [0, 1.00, 0.02, 0.50, 0.01, 0.22, 0.01, 0.08, 0.01, 0.04],
    attack: 0.03,
    release: 0.04,
    gain: 0.28,
  },
  {
    name: 'フルート',
    nameEn: 'Flute',
    harmonics: [0, 1.00, 0.30, 0.05, 0.02, 0.01],
    attack: 0.05,
    release: 0.06,
    gain: 0.32,
  },
  {
    name: 'トランペット',
    nameEn: 'Trumpet',
    harmonics: [0, 1.00, 0.80, 0.50, 0.40, 0.25, 0.20, 0.15, 0.10, 0.08, 0.05],
    attack: 0.02,
    release: 0.05,
    gain: 0.20,
  },
  {
    name: 'オーボエ',
    nameEn: 'Oboe',
    harmonics: [0, 0.60, 1.00, 0.70, 0.50, 0.40, 0.30, 0.20, 0.15],
    attack: 0.03,
    release: 0.05,
    gain: 0.22,
  },
  {
    name: 'ホルン',
    nameEn: 'Horn',
    harmonics: [0, 1.00, 0.50, 0.30, 0.15, 0.07, 0.03],
    attack: 0.06,
    release: 0.10,
    gain: 0.28,
  },
  {
    name: '矩形波',
    nameEn: 'Square Wave',
    harmonics: [0, 1.00, 0, 0.33, 0, 0.20, 0, 0.14, 0, 0.11],
    attack: 0.02,
    release: 0.04,
    gain: 0.18,
  },
  {
    name: '正弦波',
    nameEn: 'Sine Wave',
    harmonics: [0, 1.00],
    attack: 0.03,
    release: 0.05,
    gain: 0.35,
  },
  {
    name: 'のこぎり波',
    nameEn: 'Saw Wave',
    harmonics: [0, 1.00, 0.50, 0.33, 0.25, 0.20, 0.16, 0.14, 0.12, 0.11],
    attack: 0.02,
    release: 0.05,
    gain: 0.16,
  },
];

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
}

interface Zombie {
  osc: OscillatorNode;
  gain: GainNode;
  timer: ReturnType<typeof setTimeout>;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private periodicWave: PeriodicWave | null = null;
  private voices = new Map<string, Voice>();
  /** Voices in release phase (stop() called but oscillator still alive) */
  private zombies = new Map<string, Zombie>();
  private currentTone: ToneSpec = TONES[0];
  private currentVolume = 0.6;

  ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.currentVolume;
      this.master.connect(this.ctx.destination);
      this.rebuildWave();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setTone(tone: ToneSpec): void {
    this.currentTone = tone;
    if (this.ctx) this.rebuildWave();
  }

  setVolume(percent: number): void {
    this.currentVolume = Math.max(0, Math.min(1, percent / 100));
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.currentVolume, now, 0.02);
    }
  }

  private rebuildWave(): void {
    if (!this.ctx) return;
    const h = this.currentTone.harmonics;
    const len = Math.max(2, h.length);
    const real = new Float32Array(len);
    const imag = new Float32Array(len);
    for (let i = 0; i < len; i++) imag[i] = h[i] ?? 0;
    this.periodicWave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  start(voiceId: string, freq: number): void {
    const ctx = this.ensureContext();
    if (this.voices.has(voiceId)) return;

    // If a zombie (released-but-still-decaying) voice exists for this id,
    // revive it instead of spawning a new oscillator.
    // This prevents phase-offset clicks caused by two overlapping oscillators.
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

  stop(voiceId: string): void {
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
    // Keep the decaying voice as a zombie so start() can revive it cleanly
    this.zombies.set(voiceId, { osc: v.osc, gain: v.gain, timer });
  }

  setFrequency(voiceId: string, freq: number): void {
    const v = this.voices.get(voiceId);
    if (!v || !this.ctx) return;
    const now = this.ctx.currentTime;
    // 15 ms time constant — smooth enough to avoid audible wobble on JI retuning
    v.osc.frequency.setTargetAtTime(freq, now, 0.015);
  }

  stopAll(): void {
    for (const id of Array.from(this.voices.keys())) this.stop(id);
    // Also immediately kill any zombies (app-level stop, no need to revive)
    for (const [, z] of this.zombies) {
      clearTimeout(z.timer);
      try { z.osc.stop(); } catch {}
      try { z.osc.disconnect(); } catch {}
      try { z.gain.disconnect(); } catch {}
    }
    this.zombies.clear();
  }
}

export const audio = new AudioEngine();
