import type { HapticImpact, HapticNotification, HapticsAdapter } from "@hangman/shared";

const impactPatterns: Record<HapticImpact, number> = { light: 10, medium: 20, heavy: 35 };
const notificationPatterns: Record<HapticNotification, number[]> = {
  success: [15, 40, 15],
  warning: [25, 50, 25],
  error: [40, 40, 40],
};

export class BrowserHapticsAdapter implements HapticsAdapter {
  async impact(style: HapticImpact): Promise<void> {
    this.vibrate(impactPatterns[style]);
  }

  async notification(type: HapticNotification): Promise<void> {
    this.vibrate(notificationPatterns[type]);
  }

  async selection(): Promise<void> {
    this.vibrate(8);
  }

  private vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }
}
