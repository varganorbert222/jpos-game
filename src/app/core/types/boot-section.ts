import type { DockApp } from '../../features/panels/dock/dock.component';

export type BootSectionId =
  | 'security_alerts'
  | 'active_events'
  | 'park_grid'
  | 'camera_feeds'
  | 'next_command'
  | 'window_security'
  | 'window_power'
  | 'window_fence'
  | 'window_dino'
  | 'window_terminal'
  | 'window_weather'
  | 'window_files'
  | 'window_mail'
  | 'window_tours';

export type BootSectionState = 'pending' | 'loading' | 'ready';

export const PANEL_BOOT_SEQUENCE: readonly BootSectionId[] = [
  'security_alerts',
  'active_events',
  'park_grid',
  'camera_feeds',
  'next_command',
] as const;

/** Panel sections only — OS windows load per instance on each open. */
export const ALL_BOOT_SECTIONS: readonly BootSectionId[] = PANEL_BOOT_SEQUENCE;

export function windowBootSection(app: DockApp): BootSectionId {
  return `window_${app}` as BootSectionId;
}

export const BOOT_SECTION_MESSAGES: Record<BootSectionId, string> = {
  security_alerts: 'INITIALIZING SECURITY ALERT BUS...',
  active_events: 'LOADING EVENT DISPATCH QUEUE...',
  park_grid: 'CALIBRATING PARK GRID MAP...',
  camera_feeds: 'SYNCHRONIZING CAMERA MATRIX...',
  next_command: 'STARTING COMMAND ADVISORY MODULE...',
  window_security: 'BOOTING SECURITY DESKTOP...',
  window_power: 'BOOTING POWER CONTROL DESKTOP...',
  window_fence: 'BOOTING FENCE PERIMETER DESKTOP...',
  window_dino: 'BOOTING BIO-MONITOR DESKTOP...',
  window_terminal: 'BOOTING JP-OS TERMINAL...',
  window_weather: 'BOOTING WEATHER STATION...',
  window_files: 'MOUNTING FILE VAULT...',
  window_mail: 'CONNECTING INGEN MAIL RELAY...',
  window_tours: 'INITIALIZING TOUR CONTROL BUS...',
};
