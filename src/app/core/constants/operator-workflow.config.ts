import type { DockApp } from '../../features/panels/dock/dock.component';

export interface TutorialUiPhase {
  label: string;
  hint: string;
  dockApp?: DockApp;
}

/** Step-by-step UI path aligned with simulation TUTORIAL_STEPS indices. */
export const TUTORIAL_UI_GUIDES: readonly {
  stepIndex: number;
  requiresDockTerminal?: boolean;
  phases: readonly TutorialUiPhase[];
}[] = [
  {
    stepIndex: 0,
    phases: [
      {
        label: 'CLI',
        hint: 'Right panel COMMAND LINE — type: status',
      },
    ],
  },
  {
    stepIndex: 1,
    phases: [
      { label: '1', hint: 'Dock → SECURITY', dockApp: 'security' },
      { label: '2', hint: 'Click table row CAM 2', dockApp: 'security' },
      { label: '3', hint: 'Window bar → REBOOT CAMERA', dockApp: 'security' },
    ],
  },
  {
    stepIndex: 2,
    phases: [
      { label: '1', hint: 'Dock → FENCE MON', dockApp: 'fence' },
      { label: '2', hint: 'Click row F0', dockApp: 'fence' },
      { label: '3', hint: 'Window bar → INCREASE VOLTAGE', dockApp: 'fence' },
    ],
  },
  {
    stepIndex: 3,
    phases: [
      { label: '1', hint: 'Dock → POWER GRID', dockApp: 'power' },
      { label: '2', hint: 'Click generator row GEN 0', dockApp: 'power' },
      { label: '3', hint: 'Window bar → REROUTE POWER (zone)', dockApp: 'power' },
    ],
  },
  {
    stepIndex: 4,
    phases: [
      { label: '1', hint: 'Dock → DINO MON', dockApp: 'dino' },
      { label: '2', hint: 'Click specimen row D0', dockApp: 'dino' },
      { label: '3', hint: 'Window bar → SEDATE SPECIMEN', dockApp: 'dino' },
    ],
  },
  {
    stepIndex: 5,
    phases: [
      { label: '1', hint: 'Map → click zone Z2 (or key 3)', dockApp: undefined },
      { label: '2', hint: 'Center tactical bar → PATROL Z', dockApp: undefined },
    ],
  },
  {
    stepIndex: 6,
    phases: [
      { label: '1', hint: 'Incident feed → open GHOST item', dockApp: 'fence' },
      { label: '2', hint: 'Cross-check checklist → Camera then Fence', dockApp: 'fence' },
      { label: '3', hint: 'Select F3 row → INCREASE VOLTAGE', dockApp: 'fence' },
    ],
  },
  {
    stepIndex: 7,
    phases: [
      { label: '1', hint: 'Dock → MAIL, read UNKNOWN message', dockApp: 'mail' },
    ],
  },
  {
    stepIndex: 8,
    requiresDockTerminal: true,
    phases: [
      { label: '1', hint: 'Dock → TERMINAL (required)', dockApp: 'terminal' },
      { label: '2', hint: 'Type: system_hard_reboot', dockApp: 'terminal' },
    ],
  },
  {
    stepIndex: 9,
    phases: [
      { label: '1', hint: 'Dock → TOURS', dockApp: 'tours' },
      { label: '2', hint: 'Depart TOUR-01', dockApp: 'tours' },
    ],
  },
  {
    stepIndex: 10,
    phases: [
      { label: '1', hint: 'Dock → POWER GRID', dockApp: 'power' },
      { label: '2', hint: 'Select GEN 0 → RESTART GENERATOR', dockApp: 'power' },
    ],
  },
  {
    stepIndex: 11,
    phases: [
      { label: '1', hint: 'Crisis opens FENCE — click breached F0 row', dockApp: 'fence' },
      { label: '2', hint: 'Window bar → SEAL BREACH', dockApp: 'fence' },
    ],
  },
] as const;

export function tutorialGuideForStep(step: number) {
  return TUTORIAL_UI_GUIDES.find((g) => g.stepIndex === step);
}

/** Live incidents that should route through dock TERMINAL (soft mandatory). */
export function incidentRequiresDockTerminal(message: string): boolean {
  const u = message.toUpperCase();
  return (
    u.includes('INFECTION') ||
    u.includes('MALWARE') ||
    u.includes('SOFTWARE ANOMAL') ||
    u.includes('HARD REBOOT') ||
    u.includes('SYSREBOOT')
  );
}
