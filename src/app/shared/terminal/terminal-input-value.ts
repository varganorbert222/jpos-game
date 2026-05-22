/** Set prompt input value and notify jpTerminalPrompt (width + block cursor). */
export function applyTerminalInputValue(
  input: HTMLInputElement,
  value: string,
): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const end = value.length;
  input.setSelectionRange(end, end);
}
