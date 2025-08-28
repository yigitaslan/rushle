// src/app/word-list.service.ts
import { Injectable } from '@angular/core';

export function normalizeTR5(raw: string): string {
  return (raw ?? '')
    .toLocaleUpperCase('tr')        // TR locale ile büyüt
    .replace(/[^A-ZÇĞİIÖŞÜ]/g, '')  // yalnızca TR alfabesi
    .slice(0, 5);                   // 5 harfe kes
}

/* base-aware URL: <base href="..."> neyse ona göre assets yolu üretir */
function assetUrl(path: string): string {
  return new URL(path, document.baseURI).toString();
}

@Injectable({ providedIn: 'root' })
export class WordListService {
  private cacheTR5: string[] | null = null;
  private cacheDaily: Map<string, string> | null = null;

  /* 5 harfli TR kelime havuzu (assets/words-tr-5.txt) */
  async loadTR5(): Promise<string[]> {
    if (this.cacheTR5) return this.cacheTR5;
    try {
      const res = await fetch(assetUrl('assets/words-tr-5.txt'), { cache: 'no-store' });
      const text = await res.text();
      const list = text
        .replace(/\uFEFF/g, '')
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(normalizeTR5)
        .filter(w => w.length === 5);

      this.cacheTR5 = Array.from(new Set(list));
      return this.cacheTR5;
    } catch (err) {
      console.error('[WordListService] words-tr-5.txt yüklenemedi:', err);
      this.cacheTR5 = [];
      return this.cacheTR5;
    }
  }

  /* Günlük cevaplar (assets/daily-answers.txt): "YYYY-MM-DD = KELİME" */
  async loadDailyMap(): Promise<Map<string, string>> {
    if (this.cacheDaily) return this.cacheDaily;

    const map = new Map<string, string>();
    try {
      const res = await fetch(assetUrl('assets/daily-answers.txt'), { cache: 'no-store' });
      let text = await res.text();

      text = text.replace(/\uFEFF/g, '');

      for (const line of text.split(/\r?\n/)) {
        const s = line.trim();
        if (!s || s.startsWith('#')) continue;

        const m = s.match(/^(\d{4}-\d{2}-\d{2})\s*=\s*(.+)$/);
        if (!m) continue;

        const date = m[1];
        const word = normalizeTR5(m[2]);
        if (word.length === 5) map.set(date, word);
      }

      this.cacheDaily = map;
      return this.cacheDaily;
    } catch (err) {
      console.error('[WordListService] daily-answers.txt yüklenemedi:', err);
      this.cacheDaily = map;
      return this.cacheDaily;
    }
  }
}