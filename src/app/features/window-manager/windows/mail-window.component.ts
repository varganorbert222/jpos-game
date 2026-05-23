import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { JpMailService } from '../../../core/services/jp-mail.service';
import type { MailFolder } from '../../../core/types/jp-mail';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';

@Component({
  selector: 'app-mail-window',
  standalone: true,
  imports: [RetroScrollDirective],
  templateUrl: './mail-window.component.html',
  styleUrl: './mail-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailWindowComponent implements OnInit {
  readonly mail = inject(JpMailService);

  ngOnInit(): void {
    this.mail.clearNewMailIndicator();
  }

  readonly folders: { id: MailFolder; label: string }[] = [
    { id: 'inbox', label: 'INBOX' },
    { id: 'unread', label: 'UNREAD' },
    { id: 'deleted', label: 'DELETED' },
  ];

  setFolder(id: MailFolder): void {
    this.mail.setFolder(id);
  }

  onSelect(id: string): void {
    this.mail.select(id);
  }
}
