import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  inject,
  input,
} from '@angular/core';

/** Motif scrollbar styling; default always shows track, `auto` only when overflowing. */
@Directive({
  selector: '[jpRetroScroll]',
  standalone: true,
})
export class RetroScrollDirective implements AfterViewInit, OnDestroy {
  /** `scroll` = always reserve gutter; `auto` = scrollbar only if needed. */
  readonly scrollMode = input<'scroll' | 'auto', string | boolean | undefined>(
    'scroll',
    {
      alias: 'jpRetroScroll',
      transform: (value) => (value === 'auto' ? 'auto' : 'scroll'),
    },
  );

  private readonly el = inject(ElementRef<HTMLElement>);
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private readonly onScroll = (): void => this.update();

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;
    const mode = this.scrollMode();
    host.classList.add(mode === 'auto' ? 'jp-retro-scroll-auto' : 'jp-retro-scroll');
    this.update();
    this.resizeObserver = new ResizeObserver(() => this.update());
    this.resizeObserver.observe(host);
    this.mutationObserver = new MutationObserver(() => this.update());
    this.mutationObserver.observe(host, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    host.addEventListener('scroll', this.onScroll);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.el.nativeElement.removeEventListener('scroll', this.onScroll);
  }

  private update(): void {
    const host = this.el.nativeElement;
    if (this.scrollMode() === 'auto') {
      host.classList.remove('jp-retro-scroll--inactive');
      return;
    }
    const inactive = host.scrollHeight <= host.clientHeight + 1;
    host.classList.toggle('jp-retro-scroll--inactive', inactive);
  }
}
