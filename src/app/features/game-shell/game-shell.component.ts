import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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
import { ShiftCompleteModalComponent } from '../../shared/shift-complete/shift-complete-modal.component';
import { HardRebootConfirmService } from '../../core/services/hard-reboot-confirm.service';
import { formatHardRebootModalMessage } from '../../core/utils/hard-reboot-prompt';
import { ScoreboardService } from '../../core/services/scoreboard.service';

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
    ShiftCompleteModalComponent,
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
  readonly hardReboot = inject(HardRebootConfirmService);
  private readonly scoreboard = inject(ScoreboardService);

  private readonly collapseModalDismissed = signal(false);
  private readonly shiftModalDismissed = signal(false);
  private readonly recordedShiftKey = signal<string | null>(null);
  private readonly recordedCollapseKey = signal<string | null>(null);
  readonly shiftRankHint = signal<string | null>(null);

  readonly hardRebootMessage = computed(() => {
    const p = this.hardReboot.pending();
    return p ? formatHardRebootModalMessage(p) : '';
  });

  readonly shiftCompleteSnapshot = computed(() => {
    const snap = this.sim.snapshot();
    if (
      !snap?.shiftObjectiveWon ||
      snap.gameOver ||
      this.boot.phase() !== 'complete' ||
      this.shiftModalDismissed()
    ) {
      return null;
    }
    return snap;
  });

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

  constructor() {
    effect(() => {
      const snap = this.shiftCompleteSnapshot();
      if (!snap) {
        return;
      }
      const key = `${snap.runSeed}-${snap.operatorSlot}-${snap.tick}-shift`;
      if (this.recordedShiftKey() === key) {
        return;
      }
      const entry = this.scoreboard.recordRun(snap, 'shift');
      const global = this.scoreboard.globalTop();
      const rank = global.findIndex(
        (e) => e.recordedAt === entry.recordedAt && e.score === entry.score,
      );
      this.shiftRankHint.set(
        rank >= 0
          ? `Scoreboard: #${rank + 1} global · best for ${entry.operatorLabel}: ${this.scoreboard.bestForOperator(entry.operatorUsername)?.score ?? entry.score}`
          : `Scoreboard saved for ${entry.operatorLabel}.`,
      );
      this.recordedShiftKey.set(key);
    });

    effect(() => {
      const snap = this.collapseSnapshot();
      if (!snap) {
        return;
      }
      const key = `${snap.runSeed}-${snap.tick}-collapse`;
      if (this.recordedCollapseKey() === key) {
        return;
      }
      this.scoreboard.recordRun(snap, 'collapse');
      this.recordedCollapseKey.set(key);
    });
  }

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

  onDismissShiftModal(): void {
    this.shiftModalDismissed.set(true);
    this.shiftRankHint.set(null);
  }

  onHandoffOperator(): void {
    this.shiftModalDismissed.set(false);
    this.shiftRankHint.set(null);
    this.recordedShiftKey.set(null);
  }

  onConfirmInGameHardReboot(): void {
    this.sim.queueAction('system_hard_reboot');
    this.hardReboot.confirm();
  }

  onCancelInGameHardReboot(): void {
    this.hardReboot.cancel();
  }
}
