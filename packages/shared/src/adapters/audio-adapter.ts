export type AudioCue =
  | "button-hover"
  | "button-click"
  | "correct-letter"
  | "incorrect-letter"
  | "combo"
  | "countdown"
  | "warning-10"
  | "warning-5"
  | "hint"
  | "win"
  | "lose"
  | "ultra-max-reveal";

export interface AudioAdapter {
  register(cue: AudioCue, source: string): Promise<void>;
  play(cue: AudioCue): Promise<void>;
  stop(cue?: AudioCue): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
}
