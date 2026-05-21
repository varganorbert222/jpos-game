import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { DesktopComponent } from '../desktop/desktop.component';
import { CrtOverlayComponent } from '../../rendering/crt-overlay/crt-overlay.component';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
import { AudioService } from '../../core/services/audio.service';
import { DisplayScaleService } from '../../core/services/display-scale.service';

@Component({
  selector: 'app-game-shell',
  standalone: true,
  imports: [NgStyle, DesktopComponent, CrtOverlayComponent],
  templateUrl: './game-shell.component.html',
  styleUrl: './game-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameShellComponent implements OnInit, OnDestroy {
  private readonly sim = inject(SimulationBridgeService);
  private readonly audio = inject(AudioService);
  readonly display = inject(DisplayScaleService);

  ngOnInit(): void {
    this.sim.onAudio((alerts) => {
      for (const a of alerts) {
        this.audio.playAlert(a);
      }
    });
    this.sim.start();
  }

  ngOnDestroy(): void {
    this.sim.stop();
  }
}
