export class MMKV {
  private store: Map<string, string> = new Map();
  set(key: string, value: string): void { this.store.set(key, value); }
  getString(key: string): string | undefined { return this.store.get(key); }
  delete(key: string): void { this.store.delete(key); }
  contains(key: string): boolean { return this.store.has(key); }
  clearAll(): void { this.store.clear(); }
}
