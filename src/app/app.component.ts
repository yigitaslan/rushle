import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameBoardComponent } from './game-board.component/game-board.component';
import { LeftPanelComponent } from './left-panel.component/left-panel.component';
import { RightPanelComponent } from './right-panel.component/right-panel.component';
import { ModeSwitchComponent } from './mode-switch.component/mode-switch.component';
import { KeyboardComponent } from './keyboard.component/keyboard.component';

import { GameStore } from './game.store'; //Rush
import { DailyStore } from './daily.store';
import { WordListService } from './words-list.service';

function toTRUpper(s: string) { return s.toLocaleUpperCase('tr'); }
const TR_ALLOWED = /^[A-ZÇĞİIÖŞÜ]$/;

type Mode = 'rush' | 'classic';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GameBoardComponent,
    LeftPanelComponent,
    RightPanelComponent,
    ModeSwitchComponent,
    KeyboardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {

  readonly rush  = inject(GameStore);
  readonly daily = inject(DailyStore);
  private readonly wordlist = inject(WordListService);


  readonly mode = signal<Mode>('rush');
  readonly guessInput = signal('');

  constructor() {
    // Kelime havuzu (Rush için)
    this.wordlist.loadTR5().then(list => {
      this.rush.setWordList(list);
    });

    // Günlük kelimeler (Classic için)
    this.wordlist.loadDailyMap().then(map => {
      this.daily.setDailyMap(map);
      this.daily.initToday(); // timer yok
    });

    // Rush modu yeniden başlat
    this.rush.startNewGame();
  }

  onModeChange(next: Mode) {
    if (this.mode() === next) return;
    this.mode.set(next);
    this.guessInput.set('');
    if (next === 'rush') {
      this.rush.startNewGame();
    } else {
      this.daily.initToday();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    const key = e.key;

    if (key === 'Backspace') {
      this.onBackspace();
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      this.submit();
      return;
    }

    if (key.length === 1) {
      this.addLetter(key);
    }
  }

  addLetter(ch: string) {
    const up = toTRUpper(ch);
    if (TR_ALLOWED.test(up)) {
      const cur = this.guessInput();
      if (cur.length < 5) this.guessInput.set((cur + up).slice(0, 5));
    }
  }

  onBackspace() {
    const cur = this.guessInput();
    if (cur.length > 0) this.guessInput.set(cur.slice(0, -1));
  }

  canSubmit(): boolean {
    if (this.mode() === 'rush') {
      if (this.rush.isGameOver()) return false;
    } else {
      if (this.daily.isLocked()) return false; // classic: gün bitti ise kilitli
    }
    return this.guessInput().length === 5;
  }

  submit() {
    if (!this.canSubmit()) return;
    const guess = this.guessInput();
    if (this.mode() === 'rush') {
      this.rush.submitGuess(guess);
    } else {
      this.daily.submitGuess(guess);
    }
    this.guessInput.set('');
  }
}