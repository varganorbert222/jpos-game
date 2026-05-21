import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameShellComponent } from './features/game-shell/game-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameShellComponent],
  template: '<app-game-shell />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
