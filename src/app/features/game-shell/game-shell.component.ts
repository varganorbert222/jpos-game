import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DesktopComponent } from '../desktop/desktop.component';
import { CrtOverlayComponent } from '../../rendering/crt-overlay/crt-overlay.component';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
import { GameFeedbackService } from '../../core/services/game-feedback.service';
import { WaitCursorAnimationService } from '../../core/services/wait-cursor-animation.service';
import { DisplayScaleService } from '../../core/services/display-scale.service';
import { SystemBootService } from '../../core/services/system-boot.service';
import { BootScreenComponent } from '../../shared/boot/boot-screen.component';
import { JpConfirmModalComponent } from '../../shared/boot/jp-confirm-modal.component';
import { SystemReadyTerminalComponent } from '../../shared/boot/system-ready-terminal.component';
import { LoginScreenComponent } from '../auth/login-screen.component';
import { AuthService } from '../../core/services/auth.service';
import { GameOverModalComponent } from '../../shared/game-over/game-over-modal.component';

@Component({
  selector: 'app-game-shell',
  standalone: true,
  imports: [
    NgStyle,
    DesktopComponent,
    CrtOverlayComponent,
    BootScreenComponent,
    JpConfirmModalComponent,
    SystemReadyTerminalComponent,
    LoginScreenComponent,
    GameOverModalComponent,
  ],
  templateUrl: './game-shell.component.html',
  styleUrl: './game-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameShellComponent implements OnInit, OnDestroy {
  private readonly sim = inject(SimulationBridgeService);
  private readonly feedback = inject(GameFeedbackService);
  private readonly waitCursor = inject(WaitCursorAnimationService);
  readonly display = inject(DisplayScaleService);
  readonly boot = inject(SystemBootService);
  readonly auth = inject(AuthService);

  private readonly collapseModalDismissed = signal(false);

  readonly collapseSnapshot = computed(() => {
    const snap = this.sim.snapshot();
    if (
      !snap?.gameOver ||
      this.boot.phase() !== 'complete' ||
      this.collapseModalDismissed()
    ) {
      return null;
    }
    return snap;
  });

  ngOnInit(): void {
    this.waitCursor.start();
    this.feedback.connectSimAudio();
  }

  ngOnDestroy(): void {
    this.waitCursor.stop();
    this.sim.stop();
  }

  onDismissCollapseModal(): void {
    this.collapseModalDismissed.set(true);
  }

  onRestartAfterCollapse(): void {
    this.collapseModalDismissed.set(false);
    void this.boot.restartAfterCollapse();
  }
}
