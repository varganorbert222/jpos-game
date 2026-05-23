import {
  configValue,
  GAMEPLAY_CONFIG,
  getMailNumber,
  getMailSpoofPatterns,
  getMailTrustedSenders,
} from './gameplay-config';

export type MailSenderClass =
  | 'registry_trusted'
  | 'runtime_trusted'
  | 'malcolm'
  | 'spoof'
  | 'unknown';

const MALCOLM_SPOOFS = ['MALC0LM', 'I.MALC0LM', 'I-MALCOLM', 'MALCOLM?'] as const;

export function normalizeMailFrom(from: string): string {
  return from.trim().toUpperCase();
}

export function isRegistryTrustedSender(from: string): boolean {
  const key = normalizeMailFrom(from);
  return getMailTrustedSenders().some((t) => normalizeMailFrom(t) === key);
}

export function isMalcolmSpoof(from: string): boolean {
  const key = normalizeMailFrom(from);
  if (key === 'I.MALCOLM') {
    return false;
  }
  return MALCOLM_SPOOFS.some((s) => key === s || key.includes('MALC0LM'));
}

export function isSpoofSender(from: string): boolean {
  const key = normalizeMailFrom(from);
  if (isMalcolmSpoof(from)) {
    return true;
  }
  return getMailSpoofPatterns().some((p) => normalizeMailFrom(p) === key);
}

export function classifyMailSender(
  from: string,
  runtimeTrusted: readonly string[],
): MailSenderClass {
  const key = normalizeMailFrom(from);
  if (runtimeTrusted.some((t) => normalizeMailFrom(t) === key)) {
    return 'runtime_trusted';
  }
  if (isRegistryTrustedSender(from)) {
    return key === 'I.MALCOLM' ? 'malcolm' : 'registry_trusted';
  }
  if (isSpoofSender(from)) {
    return 'spoof';
  }
  return 'unknown';
}

/** Megnyitáskor: vírus roll esély (0–1). */
export function mailVirusChanceOnOpen(
  senderClass: MailSenderClass,
  difficulty: 'tutorial' | 'easy' | 'normal' | 'veteran',
): number {
  const d = GAMEPLAY_CONFIG.difficulties[difficulty];
  switch (senderClass) {
    case 'registry_trusted':
    case 'runtime_trusted':
      return 0;
    case 'malcolm':
      return 0;
    case 'spoof':
      return configValue(d.mailVirusChanceSpoof);
    case 'unknown':
      return configValue(d.mailVirusChanceUnknown);
    default:
      return 0;
  }
}

export function malcolmPhilosophySpamRoll(rng: () => number): boolean {
  return rng() < getMailNumber('malcolmPhilosophySpamChance');
}
