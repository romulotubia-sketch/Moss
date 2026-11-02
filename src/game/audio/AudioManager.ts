// Synthesized Web Audio API manager for responsive, cozy fantasy combat & ambient audio

class AudioManager {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private musicEnabled = true;
  private musicInterval: number | null = null;
  private musicStep = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopAmbientMusic();
    } else {
      this.startAmbientMusic();
    }
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public startAmbientMusic() {
    if (!this.musicEnabled || this.musicInterval !== null) return;
    // Cozy minor-pentatonic / Dorian harp-bell arpeggio
    const scale = [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25, 392.0, 329.63, 293.66];
    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled) return;
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;

      const freq = scale[this.musicStep % scale.length];
      this.musicStep++;

      // Skip occasional beats for organic cozy breathing room
      if (this.musicStep % 7 === 0) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.022, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    }, 520);
  }

  public stopAmbientMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0
  ) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(25, freqStart), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, freqEnd), now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + Math.min(0.02, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoiseBurst(duration: number, volume = 0.08, filterFreq = 900, delay = 0) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playUiClick() {
    this.playTone(520, 680, 0.07, 'triangle', 0.07);
  }

  public playEquip() {
    this.playTone(440, 660, 0.09, 'triangle', 0.08, 0);
    this.playTone(660, 880, 0.12, 'triangle', 0.07, 0.05);
  }

  public playBasicClaw(combo: number) {
    const pitchShift = combo % 2 === 0 ? 1.0 : 1.14;
    this.playNoiseBurst(0.09, 0.09, 1300 * pitchShift);
    this.playTone(340 * pitchShift, 130 * pitchShift, 0.1, 'sawtooth', 0.07);
  }

  public playBasicBoneStrike(combo: number) {
    const pitchShift = combo % 3 === 0 ? 1.0 : combo % 3 === 1 ? 1.15 : 1.28;
    this.playNoiseBurst(0.075, 0.09, 2100 * pitchShift);
    this.playTone(520 * pitchShift, 185 * pitchShift, 0.09, 'triangle', 0.085);
    this.playTone(880 * pitchShift, 410 * pitchShift, 0.05, 'sine', 0.045, 0.015);
  }

  public playBasicDaggerStrike(combo: number, isPoisoned = false) {
    const step = combo % 4;
    const isFinisher = step === 3;
    const pitchShift = step === 0 ? 1.0 : step === 1 ? 1.16 : step === 2 ? 1.08 : 1.38;
    this.playNoiseBurst(isFinisher ? 0.085 : 0.058, 0.085, 2900 * pitchShift);
    this.playTone(740 * pitchShift, 280 * pitchShift, isFinisher ? 0.1 : 0.068, 'triangle', 0.08);
    if (isFinisher) {
      this.playTone(1180, 560, 0.08, 'sine', 0.06, 0.015);
    }
    if (isPoisoned) {
      this.playTone(390, 540, 0.06, 'sine', 0.04, 0.01);
    }
  }

  public playNimbleEvade() {
    this.playNoiseBurst(0.09, 0.075, 1650);
    this.playTone(460, 820, 0.09, 'sine', 0.07);
  }

  public playTrapDetonate() {
    this.playNoiseBurst(0.28, 0.16, 480);
    this.playTone(175, 48, 0.34, 'sawtooth', 0.14);
    this.playTone(520, 180, 0.18, 'triangle', 0.09, 0.03);
  }

  public playThiefSiphonHit(stepIndex = 0) {
    const pitchMul = 1 + (stepIndex % 5) * 0.06;
    this.playNoiseBurst(0.08, 0.09, 2400);
    this.playTone(320 * pitchMul, 660 * pitchMul, 0.14, 'triangle', 0.08);
    this.playTone(580 * pitchMul, 920 * pitchMul, 0.12, 'sine', 0.06, 0.03);
  }

  public playFallingDaggerHit() {
    this.playNoiseBurst(0.055, 0.06, 3100);
    this.playTone(960, 440, 0.065, 'triangle', 0.055);
  }

  public playBoneBlock() {
    this.playNoiseBurst(0.06, 0.08, 2400);
    this.playTone(760, 480, 0.08, 'triangle', 0.08);
  }

  public playDodge() {
    this.playNoiseBurst(0.12, 0.07, 750);
    this.playTone(260, 420, 0.11, 'sine', 0.06);
  }

  public playSkillCast(abilityId: string) {
    switch (abilityId) {
      case 'zombie_flesh_ripper':
        this.playNoiseBurst(0.18, 0.14, 1100);
        this.playTone(280, 95, 0.22, 'sawtooth', 0.12);
        this.playTone(410, 140, 0.18, 'triangle', 0.09, 0.05);
        break;
      case 'zombie_plague_burst':
        this.playNoiseBurst(0.26, 0.12, 550);
        this.playTone(180, 75, 0.28, 'sine', 0.13);
        this.playTone(320, 480, 0.15, 'triangle', 0.08, 0.06);
        break;
      case 'zombie_deaths_embrace':
        this.playTone(120, 65, 0.3, 'sawtooth', 0.11);
        this.playTone(240, 170, 0.25, 'triangle', 0.09, 0.08);
        this.playNoiseBurst(0.22, 0.09, 420, 0.04);
        break;
      case 'zombie_rotting_dash':
        this.playNoiseBurst(0.18, 0.1, 950);
        this.playTone(220, 520, 0.16, 'triangle', 0.09);
        break;
      case 'zombie_undead_regen':
        this.playTone(330, 495, 0.22, 'sine', 0.09, 0);
        this.playTone(440, 660, 0.26, 'triangle', 0.08, 0.09);
        break;
      case 'zombie_ult_apocalypse':
        this.playTone(146.8, 220, 0.35, 'sawtooth', 0.11, 0);
        this.playTone(220, 293.6, 0.38, 'triangle', 0.11, 0.1);
        this.playTone(293.6, 440, 0.45, 'triangle', 0.11, 0.2);
        break;
      case 'zombie_ult_graveyard':
        this.playNoiseBurst(0.35, 0.16, 360);
        this.playTone(110, 55, 0.45, 'sawtooth', 0.14);
        this.playTone(220, 110, 0.4, 'triangle', 0.1, 0.08);
        break;
      case 'zombie_ult_lord_of_decay':
        this.playTone(130, 260, 0.35, 'sawtooth', 0.12, 0);
        this.playTone(196, 392, 0.4, 'triangle', 0.12, 0.08);
        this.playNoiseBurst(0.28, 0.11, 800, 0.05);
        break;
      // --- SKELETON ABILITY SFX ---
      case 'skeleton_bone_slash':
        this.playNoiseBurst(0.14, 0.13, 2200);
        this.playTone(640, 180, 0.17, 'sawtooth', 0.11);
        this.playTone(920, 320, 0.13, 'triangle', 0.08, 0.03);
        break;
      case 'skeleton_bone_spear':
        this.playTone(480, 960, 0.12, 'triangle', 0.09, 0);
        this.playNoiseBurst(0.14, 0.11, 2600, 0.03);
        this.playTone(720, 290, 0.16, 'sawtooth', 0.09, 0.04);
        break;
      case 'skeleton_ribcage_shield':
        this.playTone(320, 520, 0.14, 'triangle', 0.1, 0);
        this.playTone(480, 720, 0.18, 'triangle', 0.09, 0.06);
        this.playNoiseBurst(0.1, 0.07, 1800, 0.04);
        break;
      case 'skeleton_skeletal_rush':
        this.playNoiseBurst(0.15, 0.11, 1950);
        this.playTone(340, 760, 0.15, 'triangle', 0.1);
        break;
      case 'skeleton_bone_storm':
        this.playNoiseBurst(0.22, 0.11, 1750);
        this.playTone(380, 620, 0.24, 'triangle', 0.09, 0);
        this.playTone(560, 840, 0.22, 'sine', 0.08, 0.08);
        break;
      case 'skeleton_ult_bone_colossus':
        this.playNoiseBurst(0.32, 0.15, 520);
        this.playTone(110, 220, 0.36, 'sawtooth', 0.13, 0);
        this.playTone(165, 330, 0.42, 'triangle', 0.12, 0.1);
        break;
      case 'skeleton_ult_army_of_bones':
        this.playNoiseBurst(0.26, 0.13, 900);
        this.playTone(196, 293.66, 0.3, 'triangle', 0.11, 0);
        this.playTone(293.66, 440, 0.34, 'triangle', 0.11, 0.1);
        this.playTone(440, 587.33, 0.36, 'triangle', 0.1, 0.2);
        break;
      case 'skeleton_ult_reapers_judgment':
        this.playNoiseBurst(0.32, 0.16, 1400);
        this.playTone(420, 95, 0.42, 'sawtooth', 0.14, 0);
        this.playTone(620, 165, 0.36, 'triangle', 0.11, 0.06);
        break;
      // --- GOBLIN ABILITY SFX ---
      case 'goblin_dagger_flurry':
        this.playNoiseBurst(0.12, 0.11, 3000);
        this.playTone(840, 380, 0.1, 'triangle', 0.09, 0);
        this.playTone(980, 440, 0.1, 'triangle', 0.09, 0.05);
        this.playTone(1120, 520, 0.12, 'triangle', 0.1, 0.1);
        break;
      case 'goblin_shadowstep':
        this.playNoiseBurst(0.14, 0.1, 1100);
        this.playTone(220, 680, 0.13, 'sine', 0.1, 0);
        this.playTone(880, 260, 0.14, 'sawtooth', 0.1, 0.06);
        break;
      case 'goblin_explosive_trap':
        this.playTone(540, 720, 0.08, 'triangle', 0.08, 0);
        this.playTone(760, 420, 0.09, 'sine', 0.07, 0.05);
        break;
      case 'goblin_windrunner':
        this.playNoiseBurst(0.2, 0.09, 1850);
        this.playTone(392, 784, 0.2, 'sine', 0.09, 0);
        this.playTone(587.33, 987.77, 0.18, 'triangle', 0.07, 0.06);
        break;
      case 'goblin_poisoned_blades':
        this.playNoiseBurst(0.1, 0.08, 3200);
        this.playTone(660, 990, 0.11, 'triangle', 0.08, 0);
        this.playTone(290, 440, 0.18, 'sine', 0.08, 0.05);
        break;
      case 'goblin_ult_phantom_frenzy':
        this.playNoiseBurst(0.22, 0.13, 2400);
        this.playTone(330, 880, 0.22, 'sawtooth', 0.11, 0);
        this.playTone(660, 1174, 0.24, 'triangle', 0.1, 0.08);
        break;
      case 'goblin_ult_king_of_thieves':
        this.playNoiseBurst(0.2, 0.12, 900);
        this.playTone(196, 392, 0.25, 'sawtooth', 0.11, 0);
        this.playTone(293.66, 587.33, 0.28, 'triangle', 0.11, 0.09);
        break;
      case 'goblin_ult_thousand_daggers':
        this.playNoiseBurst(0.24, 0.13, 2800);
        this.playTone(523.25, 1046.5, 0.24, 'triangle', 0.11, 0);
        this.playTone(659.25, 1318.5, 0.26, 'sine', 0.1, 0.07);
        break;
      default:
        this.playTone(300, 180, 0.15, 'triangle', 0.08);
    }
  }

  public playEnemyHit(isCrit = false) {
    if (isCrit) {
      this.playTone(580, 240, 0.11, 'square', 0.08);
      this.playNoiseBurst(0.08, 0.09, 1600);
    } else {
      this.playTone(240, 120, 0.08, 'triangle', 0.08);
    }
  }

  public playEnemyDeath(isBoss = false) {
    if (isBoss) {
      this.playNoiseBurst(0.45, 0.16, 400);
      this.playTone(196, 65, 0.55, 'sawtooth', 0.14);
      this.playTone(293, 587, 0.45, 'triangle', 0.12, 0.25);
    } else {
      this.playTone(310, 110, 0.14, 'sine', 0.09);
      this.playNoiseBurst(0.1, 0.07, 700);
    }
  }

  public playPlayerHurt() {
    this.playTone(190, 95, 0.18, 'sawtooth', 0.12);
    this.playNoiseBurst(0.12, 0.1, 500);
  }

  public playPickup(kind: 'XP' | 'GOLD' | 'HEART' | 'ENERGY') {
    if (kind === 'GOLD') {
      this.playTone(784, 1046.5, 0.1, 'triangle', 0.07);
    } else if (kind === 'HEART') {
      this.playTone(440, 659.25, 0.16, 'sine', 0.09);
    } else if (kind === 'ENERGY') {
      this.playTone(523.25, 783.99, 0.12, 'triangle', 0.07);
    } else {
      this.playTone(620, 740, 0.07, 'sine', 0.05);
    }
  }

  public playRoomClear() {
    const notes = [392, 493.88, 587.33, 783.99];
    notes.forEach((n, idx) => {
      this.playTone(n, n * 1.01, 0.24, 'triangle', 0.09, idx * 0.08);
    });
  }

  public playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, idx) => {
      this.playTone(n, n, 0.2, 'triangle', 0.08, idx * 0.06);
    });
  }
}

export const audio = new AudioManager();
