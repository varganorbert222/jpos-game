import { Injectable, computed, inject, signal } from '@angular/core';
import { SimulationBridgeService } from './simulation-bridge.service';
import {
  incidentRequiresDockTerminal,
  tutorialGuideForStep,
  type TutorialUiPhase,
} from '../constants/operator-workflow.config';
import type { DockApp } from '../../features/panels/dock/dock.component';

@Injectable({ providedIn: 'root' })
export class OperatorGuidanceService {
  private readonly sim = inject(SimulationBridgeService);

  /** Active incident key requiring dock TERMINAL before advisory clears. */
  readonly pendingTerminalIncidentKey = signal<string | null>(null);
  readonly dockTerminalAcknowledged = signal(false);

  readonly tutorialActive = computed(() => {
    const s = this.sim.snapshot();
    return (
      s?.difficultyMode === 'tutorial' &&
      !s.tutorialScriptComplete &&
      s.tutorialBegun
    );
  });

  readonly tutorialPhases = computed((): readonly TutorialUiPhase[] => {
    const s = this.sim.snapshot();
    if (!s || s.difficultyMode !== 'tutorial' || s.tutorialScriptComplete) {
      return [];
    }
    return tutorialGuideForStep(s.tutorialStep)?.phases ?? [];
  });

  readonly tutorialRequiresDockTerminal = computed(() => {
    const s = this.sim.snapshot();
    if (!s || s.difficultyMode !== 'tutorial') {
      return false;
    }
    return tutorialGuideForStep(s.tutorialStep)?.requiresDockTerminal ?? false;
  });

  readonly highlightDockApp = computed((): DockApp | null => {
    if (this.tutorialRequiresDockTerminal() && !this.dockTerminalAcknowledged()) {
      return 'terminal';
    }
    const phases = this.tutorialPhases();
    const last = phases[phases.length - 1];
    return last?.dockApp ?? null;
  });

  readonly terminalRequiredNow = computed(
    () =>
      this.pendingTerminalIncidentKey() !== null &&
      !this.dockTerminalAcknowledged(),
  );

  flagTerminalRequired(incidentKey: string, message: string): void {
    if (!incidentRequiresDockTerminal(message)) {
      return;
    }
    this.pendingTerminalIncidentKey.set(incidentKey);
    this.dockTerminalAcknowledged.set(false);
  }

  onTerminalOpened(): void {
    this.dockTerminalAcknowledged.set(true);
    this.pendingTerminalIncidentKey.set(null);
  }

  clearTerminalRequirement(): void {
    this.pendingTerminalIncidentKey.set(null);
    this.dockTerminalAcknowledged.set(false);
  }
}
