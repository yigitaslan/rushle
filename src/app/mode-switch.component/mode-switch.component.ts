import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GameMode = 'rush' | 'classic';

@Component({
  selector: 'app-mode-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mode-switch.component.html',
  styleUrls: ['./mode-switch.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeSwitchComponent {
  @Input() mode: GameMode = 'rush';
  @Output() modeChange = new EventEmitter<GameMode>();

  get isClassic() { return this.mode === 'classic'; }

  /* Mouse/touch: toggle + blur */
  onClick(ev: MouseEvent) {
    this.toggle();
    (ev.currentTarget as HTMLElement | null)?.blur();
  }

  toggle() {
    this.modeChange.emit(this.isClassic ? 'rush' : 'classic');
  }

  /* Klavye: Enter/Space toggle */
  onKeydown(e: KeyboardEvent) {
    const key = e.key;
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      this.toggle();
      return;
    }
    if (key === 'ArrowLeft')  { e.preventDefault(); this.modeChange.emit('rush'); }
    if (key === 'ArrowRight') { e.preventDefault(); this.modeChange.emit('classic'); }
  }
}