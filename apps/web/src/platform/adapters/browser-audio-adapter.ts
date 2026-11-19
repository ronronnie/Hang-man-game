import type { AudioAdapter, AudioCue } from "@hangman/shared";

interface SynthNote {
  duration: number;
  frequency: number;
  offset?: number;
  type?: OscillatorType;
  volume?: number;
}

const SYNTH_CUES: Partial<Readonly<Record<AudioCue, readonly SynthNote[]>>> = {
  "button-hover": [{ duration: 0.045, frequency: 520, type: "sine", volume: 0.018 }],
  combo: [
    { duration: 0.08, frequency: 620, type: "triangle", volume: 0.045 },
    { duration: 0.11, frequency: 820, offset: 0.065, type: "triangle", volume: 0.04 },
  ],
  countdown: [{ duration: 0.06, frequency: 680, type: "square", volume: 0.025 }],
  "warning-10": [
    { duration: 0.09, frequency: 420, type: "sawtooth", volume: 0.035 },
    { duration: 0.09, frequency: 420, offset: 0.13, type: "sawtooth", volume: 0.035 },
  ],
  "warning-5": [
    { duration: 0.075, frequency: 340, type: "square", volume: 0.04 },
    { duration: 0.075, frequency: 340, offset: 0.105, type: "square", volume: 0.04 },
    { duration: 0.1, frequency: 280, offset: 0.21, type: "square", volume: 0.045 },
  ],
  "ultra-max-reveal": [
    { duration: 0.24, frequency: 92, type: "sawtooth", volume: 0.05 },
    { duration: 0.2, frequency: 138, offset: 0.12, type: "triangle", volume: 0.04 },
  ],
};

export class BrowserAudioAdapter implements AudioAdapter {
  private muted = true;
  private readonly sources = new Map<AudioCue, string>();
  private readonly activeAudio = new Map<AudioCue, HTMLAudioElement>();
  private readonly activeOscillators = new Set<OscillatorNode>();
  private audioContext: AudioContext | null = null;

  async register(cue: AudioCue, source: string): Promise<void> {
    this.sources.set(cue, source);
  }

  async play(cue: AudioCue): Promise<void> {
    const source = this.sources.get(cue);
    if (this.muted) return;

    if (!source) {
      await this.playSynthCue(cue);
      return;
    }

    if (typeof Audio === "undefined") return;

    const audio = new Audio(source);
    audio.volume = cue === "button-click" ? 0.32 : 0.5;
    audio.addEventListener(
      "ended",
      () => {
        if (this.activeAudio.get(cue) === audio) this.activeAudio.delete(cue);
      },
      { once: true },
    );
    this.activeAudio.set(cue, audio);
    try {
      await audio.play();
    } catch {
      this.activeAudio.delete(cue);
    }
  }

  async stop(cue?: AudioCue): Promise<void> {
    const audioEntries = cue ? [[cue, this.activeAudio.get(cue)] as const] : [...this.activeAudio.entries()];

    audioEntries.forEach(([audioCue, audio]) => {
      audio?.pause();
      if (audio) audio.currentTime = 0;
      this.activeAudio.delete(audioCue);
    });

    this.activeOscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // The oscillator may have already ended naturally.
      }
    });
    this.activeOscillators.clear();
  }

  async setMuted(muted: boolean): Promise<void> {
    this.muted = muted;
    if (muted) await this.stop();
  }

  private async playSynthCue(cue: AudioCue): Promise<void> {
    const notes = SYNTH_CUES[cue];
    if (!notes || typeof AudioContext === "undefined") return;

    this.audioContext ??= new AudioContext();
    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch {
        return;
      }
    }

    const startTime = this.audioContext.currentTime;
    notes.forEach((note) => {
      if (!this.audioContext) return;

      const noteStart = startTime + (note.offset ?? 0);
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.frequency.setValueAtTime(note.frequency, noteStart);
      oscillator.type = note.type ?? "sine";
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(note.volume ?? 0.035, noteStart + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.duration);
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      oscillator.addEventListener(
        "ended",
        () => {
          this.activeOscillators.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        },
        { once: true },
      );
      this.activeOscillators.add(oscillator);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + note.duration + 0.01);
    });
  }
}
