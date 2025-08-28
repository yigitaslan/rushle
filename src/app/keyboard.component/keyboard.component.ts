import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TileStatus } from '../game.store';

type KeyState = 'correct' | 'present' | 'absent' | undefined;

@Component({
  selector: 'app-keyboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardComponent {
  @Input() guesses: string[] = [];
  @Input() grid: TileStatus[][] = [];

  @Output() type = new EventEmitter<string>();
  @Output() backspace = new EventEmitter<void>();
  @Output() enter = new EventEmitter<void>();

  readonly rows: string[][] = [
    ['E','R','T','Y','U','I','O','P','Ğ','Ü'],
    ['A','S','D','F','G','H','J','K','L','Ş','İ'],
    ['Z','C','V','B','N','M','Ö','Ç'],
  ];

  private rank(s: TileStatus): number { return s==='correct'?3 : s==='present'?2 : s==='absent'?1 : 0; }

  keyState(letter: string): KeyState {
    const L = letter.toLocaleUpperCase('tr');
    let best: TileStatus | undefined;
    for (let i = 0; i < this.grid.length; i++) {
      const row = this.grid[i], g = this.guesses[i] ?? '';
      for (let j = 0; j < row.length; j++) {
        if (g[j] === L) {
          const s = row[j];
          if (!best || this.rank(s) > this.rank(best)) best = s;
          if (best === 'correct') return 'correct';
        }
      }
    }
    return best as KeyState;
  }

  onKey(k: string){ this.type.emit(k); }
  onBackspace(){ this.backspace.emit(); }
  onEnter(){ this.enter.emit(); }
}