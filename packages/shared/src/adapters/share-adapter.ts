export interface SharePayload {
  title?: string;
  text: string;
  url?: string;
}

export interface ShareResult {
  completed: boolean;
  method: "native" | "clipboard" | "unavailable";
}

export interface ShareAdapter {
  share(payload: SharePayload): Promise<ShareResult>;
}
