import type { StorageAdapter } from "@hangman/shared";

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly namespace = "hangman") {}

  async get<T>(key: string): Promise<T | null> {
    const value = this.storage?.getItem(this.key(key));
    return value === null || value === undefined ? null : (JSON.parse(value) as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.storage?.setItem(this.key(key), JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    this.storage?.removeItem(this.key(key));
  }

  async clear(): Promise<void> {
    if (!this.storage) return;

    const prefix = `${this.namespace}:`;
    const keys = Array.from({ length: this.storage.length }, (_, index) => this.storage?.key(index)).filter(
      (key): key is string => Boolean(key?.startsWith(prefix)),
    );

    keys.forEach((key) => this.storage?.removeItem(key));
  }

  private get storage(): Storage | null {
    return typeof window === "undefined" ? null : window.localStorage;
  }

  private key(key: string) {
    return `${this.namespace}:${key}`;
  }
}
