class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private volumeMultiplier: number = 0.8;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => console.log('Audio resume failed', err));
    }
  }

  setVolume(vol: number) {
    this.volumeMultiplier = Math.max(0, Math.min(1, vol));
  }

  playSingleChime() {
    try {
      this.init();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;
      
      // Crystal chime - combination of a foundational sine wave and metallic high-frequency harmonics
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5 Bell

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now); // Octave higher harmonic for pure clean chime shine

      // Filter to smooth out attack click
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);

      gainNode.gain.setValueAtTime(0.0, now);
      // Fast attack but not zero to avoid initial click pop
      gainNode.gain.linearRampToValueAtTime(0.3 * this.volumeMultiplier, now + 0.05);
      // Smooth organic bell decay
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.6);
      osc2.stop(now + 2.6);
    } catch (e) {
      console.warn('Audio Context blocked or unsupported in current view', e);
    }
  }

  playDoubleChime() {
    try {
      this.playSingleChime();
      // Second chime slightly delayed and a micro-semitone pitch variation for realistic double strike
      setTimeout(() => {
        try {
          this.init();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gainNode = this.ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(987.77, now); // B5 (slightly higher pitch feels ascending/positive)

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1975.53, now);

          gainNode.gain.setValueAtTime(0.0, now);
          gainNode.gain.linearRampToValueAtTime(0.25 * this.volumeMultiplier, now + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2000, now);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(this.ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 2.6);
          osc2.stop(now + 2.6);
        } catch (e) {
          console.warn(e);
        }
      }, 300);
    } catch (e) {
      console.warn(e);
    }
  }

  playTick() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      
      gainNode.gain.setValueAtTime(0.03, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      // Slient fail
    }
  }
}

export const chimeSynthesizer = new AudioSynthesizer();
