import { Howl, Howler } from 'howler';

interface Sound {
  howl: Howl;
  id?: number;
}

export class AudioManager {
  private sounds: Map<string, Sound> = new Map();
  private music: Map<string, Sound> = new Map();
  private currentMusic: string | null = null;
  private masterVolume: number = 1.0;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private initialized: boolean = false;

  constructor() {
    // Set global volume
    Howler.volume(this.masterVolume);
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    // Load sound effects - using generated placeholder audio
    // In production, these would be real audio files
    await this.loadSound('shoot', this.createShootSound());
    await this.loadSound('reload', this.createReloadSound());
    await this.loadSound('empty', this.createEmptySound());
    await this.loadSound('hit', this.createHitSound());
    await this.loadSound('enemyHit', this.createEnemyHitSound());
    await this.loadSound('enemyDeath', this.createEnemyDeathSound());
    await this.loadSound('playerHurt', this.createPlayerHurtSound());
    await this.loadSound('pickup', this.createPickupSound());
    await this.loadSound('levelComplete', this.createLevelCompleteSound());
    await this.loadSound('gameOver', this.createGameOverSound());
    await this.loadSound('victory', this.createVictorySound());
    
    // Load music - using ambient generated tones
    await this.loadMusic('menu', this.createMenuMusic());
    await this.loadMusic('level1', this.createLevel1Music());
    await this.loadMusic('level2', this.createLevel2Music());
    await this.loadMusic('level3', this.createLevel3Music());

    this.initialized = true;
  }

  private async loadSound(id: string, dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const howl = new Howl({
        src: [dataUrl],
        volume: this.sfxVolume,
        onload: () => resolve(),
        onloaderror: (_id, error) => {
          console.warn(`Failed to load sound ${id}:`, error);
          resolve(); // Don't fail on audio errors
        }
      });
      this.sounds.set(id, { howl });
    });
  }

  private async loadMusic(id: string, dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const howl = new Howl({
        src: [dataUrl],
        volume: this.musicVolume,
        loop: true,
        onload: () => resolve(),
        onloaderror: (_id, error) => {
          console.warn(`Failed to load music ${id}:`, error);
          resolve();
        }
      });
      this.music.set(id, { howl });
    });
  }

  public playSound(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.howl.play();
    }
  }

  public playMusic(id: string): void {
    // Stop current music
    if (this.currentMusic) {
      this.stopMusic();
    }

    const music = this.music.get(id);
    if (music) {
      music.id = music.howl.play();
      this.currentMusic = id;
    }
  }

  public stopMusic(): void {
    if (this.currentMusic) {
      const music = this.music.get(this.currentMusic);
      if (music) {
        music.howl.stop();
      }
      this.currentMusic = null;
    }
  }

  public pauseMusic(): void {
    if (this.currentMusic) {
      const music = this.music.get(this.currentMusic);
      if (music) {
        music.howl.pause();
      }
    }
  }

  public resumeMusic(): void {
    if (this.currentMusic) {
      const music = this.music.get(this.currentMusic);
      if (music) {
        music.howl.play();
      }
    }
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.howl.volume(this.sfxVolume);
    });
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.music.forEach(music => {
      music.howl.volume(this.musicVolume);
    });
  }

  // Generate procedural audio using Web Audio API encoded as base64
  private createShootSound(): string {
    return this.generateTone(150, 0.1, 'square', 0.5);
  }

  private createReloadSound(): string {
    return this.generateTone(300, 0.3, 'sine', 0.3);
  }

  private createEmptySound(): string {
    return this.generateTone(100, 0.05, 'square', 0.2);
  }

  private createHitSound(): string {
    return this.generateTone(200, 0.1, 'sawtooth', 0.4);
  }

  private createEnemyHitSound(): string {
    return this.generateTone(250, 0.15, 'square', 0.5);
  }

  private createEnemyDeathSound(): string {
    return this.generateTone(100, 0.4, 'sawtooth', 0.6);
  }

  private createPlayerHurtSound(): string {
    return this.generateTone(180, 0.2, 'sine', 0.5);
  }

  private createPickupSound(): string {
    return this.generateTone(600, 0.15, 'sine', 0.4);
  }

  private createLevelCompleteSound(): string {
    return this.generateTone(800, 0.5, 'sine', 0.5);
  }

  private createGameOverSound(): string {
    return this.generateTone(100, 0.8, 'sawtooth', 0.4);
  }

  private createVictorySound(): string {
    return this.generateTone(500, 1.0, 'sine', 0.5);
  }

  private createMenuMusic(): string {
    return this.generateTone(220, 2.0, 'sine', 0.2);
  }

  private createLevel1Music(): string {
    return this.generateTone(200, 3.0, 'triangle', 0.15);
  }

  private createLevel2Music(): string {
    return this.generateTone(180, 3.0, 'triangle', 0.15);
  }

  private createLevel3Music(): string {
    return this.generateTone(150, 3.0, 'sawtooth', 0.15);
  }

  private generateTone(
    frequency: number, 
    duration: number, 
    type: OscillatorType, 
    volume: number
  ): string {
    // Create offline audio context
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const channels = 1;
    
    // Create WAV header and data
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    
    // Generate tone samples
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      // Generate waveform
      const phase = 2 * Math.PI * frequency * t;
      switch (type) {
        case 'sine':
          sample = Math.sin(phase);
          break;
        case 'square':
          sample = Math.sin(phase) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          sample = 2 * ((frequency * t) % 1) - 1;
          break;
        case 'triangle':
          sample = Math.abs(4 * ((frequency * t) % 1) - 2) - 1;
          break;
      }
      
      // Apply envelope (fade out)
      const envelope = 1 - (i / numSamples);
      sample *= envelope * volume;
      
      // Convert to 16-bit PCM
      const pcm = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(44 + i * 2, pcm, true);
    }
    
    // Convert to base64 data URL
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  public dispose(): void {
    this.sounds.forEach(sound => sound.howl.unload());
    this.music.forEach(music => music.howl.unload());
    this.sounds.clear();
    this.music.clear();
  }
}
