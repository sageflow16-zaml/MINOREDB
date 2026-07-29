import { AIMemoryEntry } from './types';

class AIMemoryStore {
  private entries: AIMemoryEntry[] = [];
  private storageKey = 'ai_memory';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) this.entries = JSON.parse(raw);
    } catch { this.entries = []; }
  }

  private save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.entries.slice(-200)));
    } catch {}
  }

  add(entry: Omit<AIMemoryEntry, 'timestamp'>) {
    const full: AIMemoryEntry = { ...entry, timestamp: new Date().toISOString() };
    const existing = this.entries.findIndex((e) => e.key === entry.key);
    if (existing >= 0) {
      this.entries[existing] = { ...this.entries[existing], ...full, confidence: Math.min(100, this.entries[existing].confidence + 5) };
    } else {
      this.entries.push(full);
    }
    this.save();
  }

  getByCategory(category: AIMemoryEntry['category']): AIMemoryEntry[] {
    return this.entries.filter((e) => e.category === category);
  }

  get(key: string): AIMemoryEntry | undefined {
    return this.entries.find((e) => e.key === key);
  }

  getStrengths(): string[] {
    return this.getByCategory('strength').map((e) => e.content);
  }

  getWeaknesses(): string[] {
    return this.getByCategory('weakness').map((e) => e.content);
  }

  getMistakes(): AIMemoryEntry[] {
    return this.getByCategory('mistake');
  }

  getPreferences(): Record<string, unknown> {
    return this.getByCategory('preference').reduce<Record<string, unknown>>((acc, e) => {
      acc[e.key] = e.content;
      return acc;
    }, {});
  }

  getAll(): AIMemoryEntry[] {
    return [...this.entries];
  }

  getRecent(count = 20): AIMemoryEntry[] {
    return this.entries.slice(-count).reverse();
  }

  search(query: string): AIMemoryEntry[] {
    const q = query.toLowerCase();
    return this.entries.filter((e) => e.content.toLowerCase().includes(q) || e.key.toLowerCase().includes(q));
  }

  clear() {
    this.entries = [];
    this.save();
  }
}

export const aiMemory = new AIMemoryStore();
