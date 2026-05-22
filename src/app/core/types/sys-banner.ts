/** Sys-banner__state — JP-OS / session only (not perimeter fence). */
export const SysBanner = {
  COLD_START: 'COLD START',
  AWAITING_LOGIN: 'AWAITING OPERATOR LOGIN',
  LOADING_SUBSYSTEMS: 'LOADING SUBSYSTEMS',
  STARTING: 'STARTING...',
  READY: 'READY...',
  SHUTDOWN: 'SHUTDOWN',
  HALTED: 'HALTED',
  INITIALIZING: 'INITIALIZING...',
  SYSTEM_COLLAPSE: 'SYSTEM COLLAPSE',
  BLACKOUT: 'GRID BLACKOUT',
} as const;

export function isBootTransientBanner(msg: string): boolean {
  return (
    !msg ||
    msg === SysBanner.AWAITING_LOGIN ||
    msg === SysBanner.LOADING_SUBSYSTEMS ||
    msg === SysBanner.COLD_START ||
    msg === SysBanner.STARTING ||
    msg === SysBanner.SHUTDOWN ||
    msg === SysBanner.HALTED ||
    msg === 'READY' ||
    msg === 'SYSTEM READY'
  );
}

export function normalizeSysBanner(msg: string): string {
  if (msg === 'READY' || msg === 'SYSTEM READY') {
    return SysBanner.READY;
  }
  return msg;
}
