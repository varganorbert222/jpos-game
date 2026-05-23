import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';
import { AudioService } from '../../core/services/audio.service';

/** Typed width in ch; visible field chrome is on .jp-terminal-prompt__entry. */
const MIN_TYPED_CH = 0;

/**
 * Hides the native caret and places a blinking .jp-terminal-cursor after the typed text.
 * Host must contain one <input>; optional prefix spans stay outside __entry.
 */
@Directive({
  selector: '[jpTerminalPrompt]',
  standalone: true,
})
export class TerminalPromptDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly audio = inject(AudioService);

  /** When true, plays a short tick on each block-cursor blink (system-ready only). */
  @Input() jpCaretBlinkSound = false;

  private input?: HTMLInputElement;
  private cursor?: HTMLElement;
  private observer?: MutationObserver;
  private cursorWasHidden = true;
  private readonly onCursorBlink = (): void => {
    if (
      this.jpCaretBlinkSound &&
      this.cursor &&
      this.cursor.classList.contains('jp-terminal-cursor--active')
    ) {
      this.audio.playCaretBlink();
    }
  };
  private readonly onInput = (): void => this.sync();
  private readonly onFocusChange = (): void => this.sync();
  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.scheduleInputRefocus();
    }
  };

  ngAfterViewInit(): void {
    const el = this.host.nativeElement;
    el.classList.add('jp-terminal-prompt');

    const input = el.querySelector('input');
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.input = input;
    this.input.classList.add('jp-terminal-prompt__input');
    this.wrapEntry();
    this.ensureCursor();
    this.bindEntryFocus();
    this.sync();
    this.input.addEventListener('input', this.onInput);
    this.input.addEventListener('focus', this.onFocusChange);
    this.input.addEventListener('blur', this.onFocusChange);
    this.input.addEventListener('keydown', this.onKeydown);

    this.observer = new MutationObserver(() => this.sync());
    this.observer.observe(this.input, {
      attributes: true,
      attributeFilter: ['disabled', 'data-hide-cursor', 'value'],
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.input?.removeEventListener('input', this.onInput);
    this.input?.removeEventListener('focus', this.onFocusChange);
    this.input?.removeEventListener('blur', this.onFocusChange);
    this.input?.removeEventListener('keydown', this.onKeydown);
    this.cursor?.removeEventListener('animationiteration', this.onCursorBlink);
  }

  private wrapEntry(): void {
    const input = this.input!;
    const parent = input.parentElement;
    if (parent?.classList.contains('jp-terminal-prompt__entry')) {
      return;
    }

    const entry = document.createElement('span');
    entry.className = 'jp-terminal-prompt__entry';
    parent!.insertBefore(entry, input);
    entry.append(input);

    const sibling = entry.nextElementSibling;
    if (sibling?.classList.contains('jp-terminal-cursor')) {
      entry.append(sibling);
    }
  }

  private ensureCursor(): void {
    const entry = this.input!.parentElement;
    if (!entry) {
      return;
    }

    let cursor = entry.querySelector<HTMLElement>('.jp-terminal-cursor');
    if (!cursor) {
      cursor = document.createElement('span');
      cursor.className = 'jp-terminal-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      entry.append(cursor);
    }
    this.cursor = cursor;
    cursor.removeEventListener('animationiteration', this.onCursorBlink);
    cursor.addEventListener('animationiteration', this.onCursorBlink);
  }

  private sync(): void {
    if (!this.input) {
      return;
    }
    const len = this.input.value.length;
    this.input.style.width = `${Math.max(MIN_TYPED_CH, len)}ch`;
    this.updateCursorVisibility();
  }

  private updateCursorVisibility(): void {
    if (!this.cursor || !this.input) {
      return;
    }
    const hide =
      this.input.disabled ||
      this.input.hasAttribute('data-hide-cursor') ||
      document.activeElement !== this.input;
    const active = !hide;
    if (active && this.cursorWasHidden) {
      this.restartCursorBlink();
    } else {
      this.cursor.classList.toggle('jp-terminal-cursor--active', active);
    }
    this.cursorWasHidden = hide;
    this.cursor.hidden = hide;
  }

  /** Keep focus after Enter + signal updates that run on the next frame. */
  private scheduleInputRefocus(): void {
    const refocus = (): void => {
      const input = this.input;
      if (!input || input.disabled) {
        return;
      }
      input.focus();
      this.sync();
    };
    queueMicrotask(refocus);
    requestAnimationFrame(refocus);
  }

  private bindEntryFocus(): void {
    const entry = this.input?.parentElement;
    if (!entry?.classList.contains('jp-terminal-prompt__entry')) {
      return;
    }
    entry.addEventListener('click', () => {
      const input = this.input;
      if (input && !input.disabled) {
        input.focus();
      }
    });
  }

  private restartCursorBlink(): void {
    const cursor = this.cursor!;
    cursor.classList.remove('jp-terminal-cursor--active');
    void cursor.offsetHeight;
    cursor.classList.add('jp-terminal-cursor--active');
  }
}
