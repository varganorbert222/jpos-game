import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { JpFilesystemService } from '../../../core/services/jp-filesystem.service';
import type { JpFileEntry } from '../../../core/types/jp-filesystem';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { RetroVideoPlayerComponent } from '../../../shared/retro-media/retro-video-player.component';

@Component({
  selector: 'app-files-window',
  standalone: true,
  imports: [RetroScrollDirective, RetroVideoPlayerComponent],
  templateUrl: './files-window.component.html',
  styleUrl: './files-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesWindowComponent {
  readonly fs = inject(JpFilesystemService);

  readonly currentPath = signal('/');
  readonly selectedPath = signal<string | null>('/PARK_OPS/README.TXT');
  readonly editDraft = signal('');

  readonly listing = computed(() => this.fs.listFolder(this.currentPath()));

  readonly selectedFile = computed(() => {
    const path = this.selectedPath();
    return path ? this.fs.getFile(path) : null;
  });

  openFolder(path: string): void {
    this.currentPath.set(path);
  }

  selectFile(file: JpFileEntry): void {
    this.selectedPath.set(file.path);
    if (file.kind === 'text') {
      this.editDraft.set(file.content);
    }
  }

  saveText(): void {
    const path = this.selectedPath();
    if (!path) {
      return;
    }
    this.fs.saveText(path, this.editDraft());
    this.editDraft.set(this.fs.getFile(path)?.content ?? '');
  }

  parentPath(): void {
    const p = this.currentPath();
    if (p === '/') {
      return;
    }
    const parts = p.split('/').filter(Boolean);
    parts.pop();
    this.currentPath.set(parts.length ? `/${parts.join('/')}` : '/');
  }
}
