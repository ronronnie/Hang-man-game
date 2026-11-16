export type HapticImpact = "light" | "medium" | "heavy";
export type HapticNotification = "success" | "warning" | "error";

export interface HapticsAdapter {
  impact(style: HapticImpact): Promise<void>;
  notification(type: HapticNotification): Promise<void>;
  selection(): Promise<void>;
}
