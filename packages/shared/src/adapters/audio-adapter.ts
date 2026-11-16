export type AudioCue =
  | "button-press"
  | "correct-guess"
  | "incorrect-guess"
  | "hint"
  | "round-won"
  | "round-lost";

export interface AudioAdapter {
  register(cue: AudioCue, source: string): Promise<void>;
  play(cue: AudioCue): Promise<void>;
  stop(cue?: AudioCue): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
}
