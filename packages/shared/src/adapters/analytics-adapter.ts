export type AnalyticsProperties = Readonly<Record<string, boolean | number | string | null>>;

export interface AnalyticsAdapter {
  track(event: string, properties?: AnalyticsProperties): Promise<void>;
  identify(userId: string, traits?: AnalyticsProperties): Promise<void>;
  reset(): Promise<void>;
}
