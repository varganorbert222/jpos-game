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
import { AudioService } from '../../core/services/audio.service';
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
  private readonly audio = inject(AudioService);
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
    this.sim.onAudio((alerts) => {
      for (const a of alerts) {
        this.audio.playAlert(a);
      }
    });
  }

  ngOnDestroy(): void {
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
