import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TileStatus } from '../game.store';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameBoardComponent {
  @Input() inputPreview = '';
  @Input() grid: TileStatus[][] = [];
  @Input() guesses: string[] = [];
  @Input() isGameOver = false;

  private normalizeTR5(s: string): string {
    return (s ?? '').toLocaleUpperCase('tr').replace(/[^A-ZÇĞİIÖŞÜ]/g,'').slice(0,5);
  }

  pendingRow() {
    return this.normalizeTR5(this.inputPreview).split('');
  }

  emptySlots()  {
    return Array(Math.max(0, 5 - this.pendingRow().length)).fill(0);
  }

  remainingRows() {
    const used =
      this.grid.length +
      (this.pendingRow().length > 0 && !this.isGameOver ? 1 : 0);

    return Array(Math.max(0, 6 - used)).fill(0);
  }
}