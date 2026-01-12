import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './left-panel.component.html',
  styleUrls: ['./left-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftPanelComponent {
  @Input() mode: 'rush'|'classic' = 'rush';
  @Input() score = 0;
  @Input() high = 0;
  @Input() solved: string[] = [];
  @Input() streak = 0;

  track = (_: number, v: string) => v;
}