import type { GameSettings, WorldTheme } from '../types';

type MusicMode = 'none' | 'menu' | 'meadows' | 'desert' | 'frozen' | 'volcanic' | 'sky' | 'boss';

const MELODIES: Record<Exclude<MusicMode, 'none'>, number[]> = {
  menu: [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 587.33],
  meadows: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.0],
  desert: [440, 466.16, 554.37, 587.33, 698.46, 587.33, 554.37, 466.16],
  frozen: [659.25, 783.99, 987.77, 783.99, 880, 739.99, 659.25, 587.33],
  volcanic: [293.66, 311.13, 349.23, 311.13, 293.66, 261.63, 233.08, 261.63],
  sky: [587.33, 739.99, 880, 1174.66, 880, 739.99, 659.25, 783.99],
  boss: [220, 261.63, 246.94, 293.66, 220, 329.63, 311.13, 261.63],
};

export class AudioManager {
  private ctx: AudioContext | null = null;
  private musicVol = 0.55;
  private sfxVol = 0.75;
  private muted = false;
  private musicMode: MusicMode = 'none';
  private musicTimer: number | null = null;
  private stepIdx = 0;
  private unlockedByGesture = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined' || !this.unlockedByGesture) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.unlockedByGesture = true;
    this.ensureContext();
  }

  public applySettings(s: Pick<GameSettings, 'musicVolume' | 'sfxVolume' | 'muted'>): void {
    this.musicVol = s.musicVolume;
    this.sfxVol = s.sfxVolume;
    this.muted = s.muted;
  }

  public setMusicMode(mode: MusicMode): void {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.stepIdx = 0;
    if (mode === 'none') return;

    const tempoMs = mode === 'boss' ? 190 : mode === 'menu' ? 320 : 260;
    this.musicTimer = window.setInterval(() => {
      if (this.muted || this.musicVol <= 0.01) return;
      if (document.hidden) return;
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;
      const notes = MELODIES[mode];
      const freq = notes[this.stepIdx % notes.length];
      this.stepIdx += 1;
      this.playTone(freq, tempoMs * 0.0008, mode === 'boss' ? 'sawtooth' : 'triangle', this.musicVol * 0.11);
      if (this.stepIdx % 4 === 0) {
        this.playTone(freq * 0.5, tempoMs * 0.0012, 'sine', this.musicVol * 0.09);
      }
    }, tempoMs);
  }

  public setWorldMusic(theme: WorldTheme, isBoss = false): void {
    this.setMusicMode(isBoss ? 'boss' : theme);
  }

  public stopMusic(): void {
    this.setMusicMode('none');
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq?: number
  ): void {
    if (this.muted || volume <= 0.001) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playJump(isDouble = false): void {
    const jitter = 0.94 + Math.random() * 0.12;
    this.playTone((isDouble ? 420 : 300) * jitter, 0.14, 'square', this.sfxVol * 0.14, (isDouble ? 760 : 590) * jitter);
  }

  public playLand(): void {
    this.playTone(130, 0.08, 'triangle', this.sfxVol * 0.14, 65);
  }

  public playCoin(): void {
    const jitter = 0.97 + Math.random() * 0.06;
    this.playTone(987.77 * jitter, 0.07, 'sine', this.sfxVol * 0.18);
    window.setTimeout(() => this.playTone(1318.51 * jitter, 0.13, 'sine', this.sfxVol * 0.18), 55);
  }

  public playGem(): void {
    [783.99, 987.77, 1318.51].forEach((f, idx) => {
      window.setTimeout(() => this.playTone(f, 0.14, 'triangle', this.sfxVol * 0.2), idx * 55);
    });
  }

  public playAttack(special = false): void {
    if (special) {
      this.playTone(540, 0.2, 'sawtooth', this.sfxVol * 0.18, 220);
    } else {
      this.playTone(340, 0.1, 'sawtooth', this.sfxVol * 0.14, 150);
    }
  }

  public playEnemyDefeat(): void {
    this.playTone(280, 0.14, 'square', this.sfxVol * 0.16, 540);
  }

  public playDamage(): void {
    this.playTone(190, 0.22, 'sawtooth', this.sfxVol * 0.24, 70);
  }

  public playPowerUp(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 0.13, 'triangle', this.sfxVol * 0.2), i * 65);
    });
  }

  public playCheckpoint(): void {
    [587.33, 880].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 0.16, 'sine', this.sfxVol * 0.2), i * 85);
    });
  }

  public playVictory(): void {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 0.22, 'triangle', this.sfxVol * 0.22), i * 110);
    });
  }

  public playGameOver(): void {
    [392.0, 349.23, 311.13, 261.63].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 0.26, 'sawtooth', this.sfxVol * 0.18), i * 160);
    });
  }

  public playClick(): void {
    this.playTone(620, 0.05, 'sine', this.sfxVol * 0.12, 740);
  }
}
