import type { AudioAdapter, AudioCue } from "@hangman/shared";

export class BrowserAudioAdapter implements AudioAdapter {
  private muted = false;
  private readonly sources = new Map<AudioCue, string>();
  private readonly activeAudio = new Map<AudioCue, HTMLAudioElement>();

  async register(cue: AudioCue, source: string): Promise<void> {
    this.sources.set(cue, source);
  }

  async play(cue: AudioCue): Promise<void> {
    const source = this.sources.get(cue);
    if (this.muted || !source || typeof Audio === "undefined") return;

    const audio = new Audio(source);
    this.activeAudio.set(cue, audio);
    await audio.play();
  }

  async stop(cue?: AudioCue): Promise<void> {
    const audioEntries = cue ? [[cue, this.activeAudio.get(cue)] as const] : [...this.activeAudio.entries()];

    audioEntries.forEach(([audioCue, audio]) => {
      audio?.pause();
      if (audio) audio.currentTime = 0;
      this.activeAudio.delete(audioCue);
    });
  }

  async setMuted(muted: boolean): Promise<void> {
    this.muted = muted;
    if (muted) await this.stop();
  }
}
