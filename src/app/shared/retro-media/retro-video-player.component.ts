import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-retro-video-player',
  standalone: true,
  template: `
    <div class="retro-video" [attr.data-playing]="playing()">
      <img
        class="retro-video__frame"
        [src]="frameSrc()"
        alt="Video feed"
      />
      <div class="retro-video__hud">
        <span>● {{ playing() ? 'PLAY' : 'PAUSE' }}</span>
        <span>FRAME {{ frame() + 1 }}/{{ frameCount() }}</span>
      </div>
      <div class="retro-video__controls">
        <button type="button" class="jp-btn" (click)="togglePlay()">
          {{ playing() ? 'PAUSE' : 'PLAY' }}
        </button>
        <button type="button" class="jp-btn" (click)="stepFrame(-1)">◀</button>
        <button type="button" class="jp-btn" (click)="stepFrame(1)">▶</button>
      </div>
    </div>
  `,
  styleUrl: './retro-video-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroVideoPlayerComponent implements OnInit, OnDestroy {
  /** Base path without index, e.g. /jp-data/gate-cam */
  readonly basePath = input.required<string>();
  readonly frameCount = input(4);

  readonly frame = signal(0);
  readonly playing = signal(true);

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      if (!this.playing()) {
        return;
      }
      this.frame.update((f) => (f + 1) % this.frameCount());
    }, 450);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  frameSrc(): string {
    return `${this.basePath()}-${this.frame()}.svg`;
  }

  togglePlay(): void {
    this.playing.update((p) => !p);
  }

  stepFrame(delta: number): void {
    const n = this.frameCount();
    this.frame.update((f) => (f + delta + n) % n);
  }
}
