
export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized: boolean = false;

  // Thruster Nodes
  private thrusterOsc: OscillatorNode | null = null; // Fallback or layer
  private thrusterNoise: AudioBufferSourceNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;
  private thrusterGain: GainNode | null = null;

  // Scanner Nodes
  private scanOsc: OscillatorNode | null = null;
  private scanGain: GainNode | null = null;

  constructor() {}

  init() {
    if (this.initialized) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.25; // Master volume
    this.masterGain.connect(this.ctx.destination);
    
    this.initialized = true;
    
    // Resume if suspended (browser policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- THRUSTER SOUND (Filtered Noise) ---
  setThrust(isThrusting: boolean) {
    if (!this.initialized || !this.ctx || !this.masterGain) return;

    if (isThrusting) {
      if (!this.thrusterGain) {
        // Create Noise Buffer
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        this.thrusterNoise = this.ctx.createBufferSource();
        this.thrusterNoise.buffer = buffer;
        this.thrusterNoise.loop = true;

        this.thrusterFilter = this.ctx.createBiquadFilter();
        this.thrusterFilter.type = 'lowpass';
        this.thrusterFilter.frequency.value = 400;

        this.thrusterGain = this.ctx.createGain();
        this.thrusterGain.gain.value = 0;

        this.thrusterNoise.connect(this.thrusterFilter);
        this.thrusterFilter.connect(this.thrusterGain);
        this.thrusterGain.connect(this.masterGain);

        this.thrusterNoise.start();
        
        // Ramp up
        this.thrusterGain.gain.setTargetAtTime(0.8, this.ctx.currentTime, 0.1);
      }
    } else {
      if (this.thrusterGain) {
        // Ramp down and stop
        this.thrusterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        
        // Clean up after fade out
        const oldGain = this.thrusterGain;
        const oldNoise = this.thrusterNoise;
        const oldFilter = this.thrusterFilter;
        
        setTimeout(() => {
            oldNoise?.stop();
            oldNoise?.disconnect();
            oldFilter?.disconnect();
            oldGain?.disconnect();
        }, 200);

        this.thrusterGain = null;
        this.thrusterNoise = null;
        this.thrusterFilter = null;
      }
    }
  }

  // --- SCANNER HUM (Sine with rising pitch) ---
  setScan(isScanning: boolean, progress: number = 0) {
    if (!this.initialized || !this.ctx || !this.masterGain) return;

    if (isScanning) {
      if (!this.scanOsc) {
        this.scanOsc = this.ctx.createOscillator();
        this.scanOsc.type = 'sine';
        
        this.scanGain = this.ctx.createGain();
        this.scanGain.gain.value = 0;
        
        this.scanOsc.connect(this.scanGain);
        this.scanGain.connect(this.masterGain);
        this.scanOsc.start();
        
        this.scanGain.gain.setTargetAtTime(0.3, this.ctx.currentTime, 0.05);
      }
      
      // Modulate frequency based on progress
      // Start at 200Hz, go up to 800Hz, with some wobble
      const wobble = Math.sin(this.ctx.currentTime * 20) * 10;
      const targetFreq = 200 + (progress * 600) + wobble;
      this.scanOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);

    } else {
      if (this.scanOsc) {
        this.scanGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        const oldOsc = this.scanOsc;
        const oldGain = this.scanGain;
        setTimeout(() => {
          oldOsc.stop();
          oldOsc.disconnect();
          oldGain?.disconnect();
        }, 150);
        this.scanOsc = null;
        this.scanGain = null;
      }
    }
  }

  // --- SUCCESS BEEP (Arpeggio) ---
  playScanComplete() {
    if (!this.initialized || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'triangle';
    
    // Play a quick major triad arpeggio
    osc.frequency.setValueAtTime(880, t); // A5
    osc.frequency.setValueAtTime(1108, t + 0.1); // C#6
    osc.frequency.setValueAtTime(1318, t + 0.2); // E6
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
    gain.gain.setValueAtTime(0.4, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  playClick() {
     if (!this.initialized || !this.ctx || !this.masterGain) return;
     // Simple UI tick
  }
}

export const audio = new SoundManager();
