import type { ShareAdapter, SharePayload, ShareResult } from "@hangman/shared";

export class BrowserShareAdapter implements ShareAdapter {
  async share(payload: SharePayload): Promise<ShareResult> {
    if (typeof navigator === "undefined") {
      return { completed: false, method: "unavailable" };
    }

    if (navigator.share) {
      await navigator.share(payload);
      return { completed: true, method: "native" };
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText([payload.text, payload.url].filter(Boolean).join("\n"));
      return { completed: true, method: "clipboard" };
    }

    return { completed: false, method: "unavailable" };
  }
}
