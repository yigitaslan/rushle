import { Injectable, signal } from '@angular/core';
import type { TileStatus } from './game.store';

type DailyState = {
  date: string;
  answer: string;
  guesses: string[];
  grid: TileStatus[][];
  attemptsUsed: number;
  isSolved: boolean;
  isLocked: boolean;
};

const KEY_STREAK    = 'wr_daily_streak';
const KEY_LASTWIN   = 'wr_daily_lastwin';
const KEY_STATE_PRE = 'wr_daily_state_';

@Injectable({ providedIn: 'root' })
export class DailyStore {
  private readonly WORD_LENGTH = 5;
  private readonly MAX_ATTEMPTS = 6;
  private readonly TZ = 'Europe/Istanbul';

  private dailyMap = new Map<string,string>();

  readonly currentWord = signal('');
  readonly guesses = signal<string[]>([]);
  readonly grid = signal<TileStatus[][]>([]);
  readonly attemptsUsed = signal(0);
  readonly isSolved = signal(false);
  readonly isLocked = signal(false);
  readonly streak = signal(this.loadStreak());

  setDailyMap(map: Map<string,string>) { this.dailyMap = map; }

  initToday() {
    const today = this.today();
    this.recalcStreakContinuity(today);

    const answer = this.dailyMap.get(today) ?? 'MESAJ'; // fallback
    this.currentWord.set(answer);

    const saved = this.loadState(today);
    if (saved && saved.answer === answer) {
      this.guesses.set(saved.guesses || []);
      this.grid.set(saved.grid || []);
      this.attemptsUsed.set(saved.attemptsUsed || 0);
      this.isSolved.set(!!saved.isSolved);
      this.isLocked.set(!!saved.isLocked);
    } else {
      this.guesses.set([]);
      this.grid.set([]);
      this.attemptsUsed.set(0);
      this.isSolved.set(false);
      this.isLocked.set(false);
    }
  }

  submitGuess(raw: string) {
    if (this.isLocked()) return;
    const guess = this.normalizeTR5(raw);
    if (guess.length !== this.WORD_LENGTH) return;

    const answer = this.currentWord();
    const statuses = this.evaluate(guess, answer);

    this.guesses.update(g => [...g, guess]);
    this.grid.update(g => [...g, statuses]);
    this.attemptsUsed.update(n => n + 1);

    if (guess === answer) {
      this.isSolved.set(true);
      this.isLocked.set(true);
      this.bumpStreakOnWin();
    } else if (this.attemptsUsed() >= this.MAX_ATTEMPTS) {
      this.isLocked.set(true);
      this.resetStreakOnFail();
    }

    // Bugünün state’i saklanıyor
    const today = this.today();
    this.saveState(today, {
      date: today,
      answer: this.currentWord(),
      guesses: this.guesses(),
      grid: this.grid(),
      attemptsUsed: this.attemptsUsed(),
      isSolved: this.isSolved(),
      isLocked: this.isLocked(),
    });
  }

  private evaluate(guess:string, answer:string): TileStatus[] {
    const L=this.WORD_LENGTH; const res:Array<TileStatus>=Array(L).fill('absent');
    const ans=answer.split(''); const used=Array(L).fill(false);
    for(let i=0;i<L;i++){ if(guess[i]===ans[i]){ res[i]='correct'; used[i]=true; } }
    const freq:Record<string,number>={}; for(let i=0;i<L;i++){ if(!used[i]){ const ch=ans[i]; freq[ch]=(freq[ch]||0)+1; } }
    for(let i=0;i<L;i++){ if(res[i]==='correct') continue; const ch=guess[i]; if(freq[ch]>0){ res[i]='present'; freq[ch]--; } }
    return res;
  }

  private normalizeTR5(s:string){ return (s??'').toLocaleUpperCase('tr').replace(/[^A-ZÇĞİIÖŞÜ]/g,'').slice(0,5); }

  private ymd(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date);
  }
  private today(): string { return this.ymd(new Date()); }
  private yesterdayStr(): string { const d=new Date(); d.setDate(d.getDate()-1); return this.ymd(d); }

  // Streak continuity
  private recalcStreakContinuity(today: string) {
    const lastWin = this.loadLastWin();
    const yest = this.yesterdayStr();
    if (!lastWin) return;
    if (lastWin === today) return;
    if (lastWin === yest) return;
    this.streak.set(0);
    this.saveStreak(0);
  }

  private bumpStreakOnWin() {
    const today = this.today();
    const yest = this.yesterdayStr();
    const lastWin = this.loadLastWin();
    const next = (lastWin === yest) ? (this.streak() + 1) : 1;
    this.streak.set(next);
    this.saveStreak(next);
    this.saveLastWin(today);
  }

  private resetStreakOnFail() { this.streak.set(0); this.saveStreak(0); }

  // storage – streak
  private loadStreak(): number { try{ return Number(localStorage.getItem(KEY_STREAK))||0; }catch{ return 0; } }
  private saveStreak(n:number){ try{ localStorage.setItem(KEY_STREAK, String(n)); }catch{} }
  private loadLastWin(): string { try{ return localStorage.getItem(KEY_LASTWIN) || ''; }catch{ return ''; } }
  private saveLastWin(s:string){ try{ localStorage.setItem(KEY_LASTWIN, s); }catch{} }

  // storage – daily
  private saveState(date: string, state: DailyState){
    try { localStorage.setItem(KEY_STATE_PRE + date, JSON.stringify(state)); } catch {}
  }
  private loadState(date: string): DailyState | null {
    try {
      const raw = localStorage.getItem(KEY_STATE_PRE + date);
      return raw ? JSON.parse(raw) as DailyState : null;
    } catch { return null; }
  }
}