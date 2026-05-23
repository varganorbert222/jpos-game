import { getParamNumber } from '../gameplay-config';
import type { EventSeverity, SimulationState, ZoneId } from '../types';
import { injectScriptedIncident, triggerBlackSwanStack } from './events';

export type TutorialProgressEvent =
  | { type: 'terminal'; command: string }
  | { type: 'action'; actionType: string; params: Record<string, string | number> }
  | { type: 'mail_open'; from: string }
  | { type: 'tour_start' };

type TutorialWait =
  | { kind: 'terminal'; command: 'status' }
  | { kind: 'action'; actionType: string; paramKey?: 'id' | 'zone'; paramValue?: number }
  | { kind: 'mail_open_unknown' }
  | { kind: 'tour_start' };

interface TutorialStepDef {
  objective: string;
  begin: (state: SimulationState) => void;
  wait: TutorialWait;
}

function hint(state: SimulationState, text: string): void {
  state.logEntries.push(`[TRAINING] ${text}`);
  state.alertEntries.push(`TRAINING: ${text}`);
}

function setObjective(state: SimulationState, objective: string): void {
  state.tutorialObjective = objective;
  state.alertEntries.push(`TRAINING — REQUIRED: ${objective}`);
}

/** Reset incidental breaches from live interludes so tour gates stay open. */
function stabilizeTrainingContainment(state: SimulationState): void {
  let eased = 0;
  for (const fence of state.fences) {
    if (fence.state === 'Breached') {
      fence.state = 'Unstable';
      fence.integrity = Math.max(40, fence.integrity);
      fence.stress = Math.min(75, fence.stress);
      fence.voltage = Math.max(60, fence.voltage);
      eased++;
    }
  }
  state.breachCount = 0;
  state.visitorSectorCompromisedTicks = 0;
  if (state.rebootPowerOutageTicks <= 0) {
    state.globalBlackout = false;
  }
  if (eased > 0) {
    state.logEntries.push(
      `[TRAINING] Containment eased on ${eased} segment(s) — tour authorization unlocked.`,
    );
  }
}

function inject(
  state: SimulationState,
  category: string,
  severity: EventSeverity,
  zoneId: ZoneId,
  fenceId: number,
  dinoId?: number,
): void {
  injectScriptedIncident(state, {
    category,
    severity,
    zoneId,
    fenceId,
    dinoId: dinoId ?? 0,
  });
}

const TUTORIAL_STEPS: readonly TutorialStepDef[] = [
  {
    objective: 'Type status in the command line (CLI).',
    begin: (s) =>
      hint(
        s,
        'Welcome. Stability is your only game-over trigger. Run status to continue.',
      ),
    wait: { kind: 'terminal', command: 'status' },
  },
  {
    objective: 'Reboot camera 2 (cam reboot 2 or Security panel CAM2 REBOOT).',
    begin: (s) => {
      inject(s, 'camera offline', 'minor', 1, 2, 0);
      hint(s, 'Camera 2 offline in Z1 — reboot before continuing.');
    },
    wait: { kind: 'action', actionType: 'cam_reboot', paramKey: 'id', paramValue: 2 },
  },
  {
    objective: 'Boost fence 0 voltage (increase_voltage 0 or +VOLT F0).',
    begin: (s) => {
      inject(s, 'fence voltage drop', 'minor', 0, 0, 0);
      hint(s, 'Fence segment F0 voltage sag detected.');
    },
    wait: { kind: 'action', actionType: 'increase_voltage', paramKey: 'id', paramValue: 0 },
  },
  {
    objective: 'Reroute power to zone 0 (power reroute 0 or Power panel).',
    begin: (s) => {
      s.powerAllocation.fences = 28;
      hint(s, 'Power shed on perimeter allocation — reroute to restore headroom.');
    },
    wait: { kind: 'action', actionType: 'power_reroute', paramKey: 'zone', paramValue: 0 },
  },
  {
    objective: 'Sedate dinosaur 0 (dino sedate 0 or Bio panel SEDATE D0).',
    begin: (s) => {
      inject(s, 'dinosaur stress increase', 'minor', 0, 0, 0);
      hint(s, 'Specimen D0 stress elevated in Z0.');
    },
    wait: { kind: 'action', actionType: 'dino_sedate', paramKey: 'id', paramValue: 0 },
  },
  {
    objective: 'Dispatch patrol to zone 2 (dispatch_patrol 2 or Grid panel).',
    begin: (s) => {
      inject(s, 'high fence stress', 'major', 2, 4, 6);
      hint(s, 'High fence stress Z2 — send a patrol team.');
    },
    wait: { kind: 'action', actionType: 'dispatch_patrol', paramKey: 'zone', paramValue: 2 },
  },
  {
    objective: 'Boost fence 3 voltage (+VOLT / increase_voltage 3) — ignore ghost alerts.',
    begin: (s) => {
      triggerBlackSwanStack(s, 1, 3, 'tutorial');
      hint(
        s,
        'Black swan: ghost + real drop on F3. Cross-check, then boost the real segment.',
      );
    },
    wait: { kind: 'action', actionType: 'increase_voltage', paramKey: 'id', paramValue: 3 },
  },
  {
    objective: 'Open the UNKNOWN mail in INGEN MAIL (read the training message).',
    begin: (s) => {
      s.tutorialMailDemoPending = true;
      hint(
        s,
        'Unsigned mail queued. Optional: FILE VAULT MAIL_CONTACTS.TXT. Open to see risk.',
      );
    },
    wait: { kind: 'mail_open_unknown' },
  },
  {
    objective: 'Hard reboot to clear infection (system_hard_reboot or HARD REBOOT).',
    begin: (s) =>
      hint(s, 'Mail bus compromised — hard reboot clears software anomalies only.'),
    wait: { kind: 'action', actionType: 'system_hard_reboot' },
  },
  {
    objective: 'Start a tour from TOUR CONTROL (depart one vehicle).',
    begin: (s) => {
      stabilizeTrainingContainment(s);
      s.weather = 'Clear';
      s.tourBonusTicksRemaining = 30;
      hint(
        s,
        'Training clearance: perimeter stabilized for tour exercise. Open TOUR CONTROL and depart TOUR-01.',
      );
    },
    wait: { kind: 'tour_start' },
  },
  {
    objective: 'Restart generator 0 (generator_restart 0 or Power panel).',
    begin: (s) => {
      s.weather = 'Storm';
      hint(s, 'Storm front — verify generators; restart if required.');
    },
    wait: { kind: 'action', actionType: 'generator_restart', paramKey: 'id', paramValue: 0 },
  },
  {
    objective: 'Seal fence 0 (seal_breach 0 or Grid panel SEAL F0).',
    begin: (s) => {
      const f = s.fences[0];
      if (f) {
        f.state = 'Breached';
        f.stress = 85;
      }
      inject(s, 'fence voltage drop', 'major', 0, 0, 0);
      hint(s, 'Fence F0 breach — dispatch seal crew.');
    },
    wait: { kind: 'action', actionType: 'seal_breach', paramKey: 'id', paramValue: 0 },
  },
];

function finishTraining(state: SimulationState): void {
  state.tutorialScriptComplete = true;
  state.tutorialAwaitingAction = false;
  state.tutorialAwaitingStepCompletion = false;
  state.tutorialInterlude = false;
  state.tutorialObjective = '';
  state.shiftObjectiveWon = true;
  state.alertEntries.push('TRAINING COMPLETE — PERFORMANCE INDEX RECORDED');
  state.logEntries.push('[TRAINING] All steps complete — shift logged to scoreboard.');
}

function beginStep(state: SimulationState, index: number): void {
  const step = TUTORIAL_STEPS[index];
  if (!step) {
    finishTraining(state);
    return;
  }
  state.tutorialStep = index;
  state.tutorialInterlude = false;
  state.tutorialAwaitingStepCompletion = false;
  state.tutorialAwaitingAction = true;
  state.tutorialBegun = true;
  setObjective(state, step.objective);
  step.begin(state);
  state.logEntries.push('[TRAINING] Simulation clock paused — complete the required action.');
}

/** Unfreeze ticks so a queued command can execute on the next tick(s). */
export function resumeTutorialTicks(state: SimulationState): void {
  if (
    state.difficultyMode !== 'tutorial' ||
    state.tutorialScriptComplete ||
    !state.tutorialAwaitingAction
  ) {
    return;
  }
  state.tutorialAwaitingAction = false;
  state.tutorialAwaitingStepCompletion = true;
  state.logEntries.push(
    '[TRAINING] Command accepted — simulation clock resuming until action completes.',
  );
}

function matchesWait(state: SimulationState, event: TutorialProgressEvent): boolean {
  const step = TUTORIAL_STEPS[state.tutorialStep];
  if (!step) {
    return false;
  }
  const wait = step.wait;

  switch (wait.kind) {
    case 'terminal': {
      if (event.type !== 'terminal') {
        return false;
      }
      const cmd = event.command.trim().toLowerCase().split(/\s+/)[0];
      return cmd === wait.command;
    }
    case 'action': {
      if (event.type !== 'action' || event.actionType !== wait.actionType) {
        return false;
      }
      if (wait.paramKey == null || wait.paramValue == null) {
        return true;
      }
      const raw = event.params[wait.paramKey];
      return Number(raw) === wait.paramValue;
    }
    case 'mail_open_unknown': {
      if (event.type !== 'mail_open') {
        return false;
      }
      return event.from.trim().toUpperCase() === 'UNKNOWN';
    }
    case 'tour_start':
      return event.type === 'tour_start';
    default:
      return false;
  }
}

function startInterlude(state: SimulationState, nextStepIndex: number): void {
  state.tutorialAwaitingStepCompletion = false;
  const pause = getParamNumber('tutorialInterludeTicks');
  state.tutorialInterlude = true;
  state.tutorialInterludeUntilTick = state.tick + pause;
  state.tutorialPendingStepIndex = nextStepIndex;
  state.tutorialObjective = '';
  hint(
    state,
    `Step complete — ${pause} tick(s) of live simulation before the next training briefing.`,
  );
}

function completeCurrentStep(state: SimulationState): void {
  hint(state, 'Required action verified.');
  const next = state.tutorialStep + 1;
  if (next >= TUTORIAL_STEPS.length) {
    finishTraining(state);
    return;
  }
  startInterlude(state, next);
}

function tryBeginPendingStep(state: SimulationState): void {
  if (!state.tutorialInterlude || state.tick < state.tutorialInterludeUntilTick) {
    return;
  }
  state.tutorialInterlude = false;
  beginStep(state, state.tutorialPendingStepIndex);
}

/** Called when the operator satisfies the current training step. */
export function notifyTutorialProgress(
  state: SimulationState,
  event: TutorialProgressEvent,
): void {
  if (state.difficultyMode !== 'tutorial' || state.tutorialScriptComplete) {
    return;
  }
  if (state.tutorialInterlude) {
    return;
  }
  if (!state.tutorialAwaitingAction && !state.tutorialAwaitingStepCompletion) {
    return;
  }
  if (!matchesWait(state, event)) {
    return;
  }
  completeCurrentStep(state);
}

/** Training pacing: first step, then interlude → next freeze. */
export function advanceTutorialScript(state: SimulationState): void {
  if (state.difficultyMode !== 'tutorial' || state.tutorialScriptComplete) {
    return;
  }
  if (!state.tutorialBegun) {
    beginStep(state, 0);
    return;
  }
  tryBeginPendingStep(state);
}

export function isTutorialTickFrozen(state: SimulationState): boolean {
  return (
    state.difficultyMode === 'tutorial' &&
    !state.tutorialScriptComplete &&
    state.tutorialAwaitingAction
  );
}
