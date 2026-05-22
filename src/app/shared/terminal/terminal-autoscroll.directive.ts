import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

/** Keep terminal output pinned to newest lines (scroll end). */
@Directive({
  selector: '[jpTerminalAutoscroll]',
  standalone: true,
})
export class TerminalAutoscrollDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: MutationObserver;

  ngOnInit(): void {
    const host = this.el.nativeElement;
    this.scrollToEnd();
    this.observer = new MutationObserver(() => this.scrollToEnd());
    this.observer.observe(host, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private scrollToEnd(): void {
    const host = this.el.nativeElement;
    host.scrollTop = host.scrollHeight;
  }
}
