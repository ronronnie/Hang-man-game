import type { AnalyticsAdapter, AnalyticsProperties } from "@hangman/shared";

export class NoopAnalyticsAdapter implements AnalyticsAdapter {
  async track(event: string, properties?: AnalyticsProperties): Promise<void> {
    void event;
    void properties;
  }

  async identify(userId: string, traits?: AnalyticsProperties): Promise<void> {
    void userId;
    void traits;
  }

  async reset(): Promise<void> {}
}
