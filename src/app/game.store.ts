import { Injectable, signal } from '@angular/core';
export type TileStatus = 'correct' | 'present' | 'absent';

@Injectable({ providedIn: 'root' })
export class GameStore {
  private readonly WORD_LENGTH = 5;
  private readonly MAX_ATTEMPTS = 6;
  private readonly START_TIME = 90;
  private readonly BONUS_TIME = 20;

  private words: string[] = [];
  private FALLBACK = ['KİTAP','YAZAR','KALEM','SİYAH','BEYAZ','TATLI','ÜCRET','ÇİÇEK','ŞEKER'];
  private lastWord = '';

  readonly timeLeft = signal(this.START_TIME);
  readonly score = signal(0);
  readonly highScore = signal(this.loadHighScore());
  readonly currentWord = signal('');
  readonly guesses = signal<string[]>([]);
  readonly grid = signal<TileStatus[][]>([]);
  readonly solvedWords = signal<string[]>([]);
  readonly isGameOver = signal(false);
  readonly attemptsUsed = signal(0);
  readonly solvedCount = signal(0);
  readonly started = signal(false);
  readonly revealWord = signal('');

  private tickerId: any = null;
  private revealTimerId: any = null;

  setWordList(list: string[]) { this.words = Array.from(new Set(list)); }

  startNewGame() {
    this.clearTicker();
    this.started.set(false);
    this.clearReveal();
    this.timeLeft.set(this.START_TIME);
    this.score.set(0);
    this.highScore.set(this.loadHighScore());
    this.currentWord.set(this.pickRandomWord());
    this.guesses.set([]); this.grid.set([]);
    this.solvedWords.set([]); this.isGameOver.set(false);
    this.attemptsUsed.set(0); this.solvedCount.set(0);
  }

  submitGuess(raw: string) {
    if (this.isGameOver()) return;
    const guess = this.normalizeTR5(raw);
    if (guess.length !== this.WORD_LENGTH) return;
    this.ensureStarted();

    const answer = this.currentWord();
    const statuses = this.evaluate(guess, answer);
    this.guesses.update(g => [...g, guess]);
    this.grid.update(g => [...g, statuses]);
    this.attemptsUsed.update(n => n + 1);

    if (guess === answer) {
      const nextSolved = this.solvedCount() + 1;
      this.solvedCount.set(nextSolved);
      this.score.update(s => s + nextSolved * 10);
      this.solvedWords.update(list => [...list, answer]);
      this.addTime(this.BONUS_TIME);
      this.nextWord();
    } else if (this.attemptsUsed() >= this.MAX_ATTEMPTS) {
      this.showReveal(answer, 5000);
      this.nextWord();
    }
  }

  // internals
  private ensureStarted(){ if (!this.started()) { this.started.set(true); this.startTicker(); } }
  private nextWord(){ this.currentWord.set(this.pickRandomWord()); this.guesses.set([]); this.grid.set([]); this.attemptsUsed.set(0); }
  private startTicker(){ this.tickerId = setInterval(()=>{ if (this.isGameOver()) return; const n = Math.max(0, this.timeLeft()-1); this.timeLeft.set(n); if (n===0) this.gameOver(); },1000); }
  private addTime(sec:number){ this.timeLeft.set(this.timeLeft()+sec); }
  private gameOver(){ this.isGameOver.set(true); this.started.set(false); this.clearTicker(); if (this.score()>this.highScore()){ this.highScore.set(this.score()); this.saveHighScore(this.highScore()); } }
  private clearTicker(){ if (this.tickerId){ clearInterval(this.tickerId); this.tickerId=null; } }
  private showReveal(w:string,ms:number){ this.revealWord.set(w); if(this.revealTimerId) clearTimeout(this.revealTimerId); this.revealTimerId=setTimeout(()=>this.clearReveal(),ms); }
  private clearReveal(){ this.revealWord.set(''); if(this.revealTimerId){ clearTimeout(this.revealTimerId); this.revealTimerId=null; } }

  private evaluate(guess:string, answer:string): TileStatus[] {
    const L=this.WORD_LENGTH; const res:Array<TileStatus>=Array(L).fill('absent');
    const ans=answer.split(''); const used=Array(L).fill(false);
    for(let i=0;i<L;i++){ if(guess[i]===ans[i]){ res[i]='correct'; used[i]=true; } }
    const freq:Record<string,number>={}; for(let i=0;i<L;i++){ if(!used[i]){ const ch=ans[i]; freq[ch]=(freq[ch]||0)+1; } }
    for(let i=0;i<L;i++){ if(res[i]==='correct') continue; const ch=guess[i]; if(freq[ch]>0){ res[i]='present'; freq[ch]--; } }
    return res;
  }

  private pickRandomWord(): string {
    const pool = this.words.length ? this.words : this.FALLBACK;
    if (pool.length === 1) { this.lastWord = pool[0]; return pool[0]; }
    let next = this.lastWord;
    while (next === this.lastWord) { next = pool[Math.floor(Math.random()*pool.length)]; }
    this.lastWord = next; return next;
  }

  private normalizeTR5(s:string){ return (s??'').toLocaleUpperCase('tr').replace(/[^A-ZÇĞİIÖŞÜ]/g,'').slice(0,5); }
  private loadHighScore(): number { try{ return Number(localStorage.getItem('wordrush_highscore'))||0; }catch{ return 0; } }
  private saveHighScore(v:number){ try{ localStorage.setItem('wordrush_highscore', String(v)); }catch{} }
}