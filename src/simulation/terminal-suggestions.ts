import type { SimulationState } from './types';

export interface NextCommandSuggestion {
  usage: string;
  note: string;
}

interface ScoredSuggestion extends NextCommandSuggestion {
  score: number;
}

/** Non-prescriptive command hints from current park conditions (not optimal play). */
export function getNextCommandSuggestions(
  state: SimulationState,
  max = 2,
): NextCommandSuggestion[] {
  const candidates: ScoredSuggestion[] = [];

  const worstFence = state.fences.reduce<(typeof state.fences)[0] | null>(
    (worst, f) => {
      if (!worst) {
        return f;
      }
      const rank = (x: typeof f) =>
        x.state === 'Breached' ? 4 : x.state === 'Unstable' ? 3 : x.integrity < 50 ? 2 : 1;
      return rank(f) > rank(worst) ? f : worst;
    },
    null,
  );

  if (worstFence && (worstFence.state !== 'Stable' || worstFence.integrity < 70)) {
    candidates.push({
      score: worstFence.state === 'Breached' ? 90 : 65,
      usage: 'fence reset [ID]',
      note:
        'Perimeter segments report strain — a reset might stabilize one sector or redistribute stress.',
    });
  }

  const offlineCam = state.cameras.find(
    (c) => c.state === 'Offline' || c.state === 'Corrupted' || c.state === 'Interference',
  );
  if (offlineCam) {
    candidates.push({
      score: 58,
      usage: 'cam reboot [ID]',
      note: 'Surveillance gaps detected — reboot could restore a feed or waste precious uptime.',
    });
  }

  const hotGen = state.generators.find((g) => g.online && g.temperature >= 75);
  if (hotGen) {
    candidates.push({
      score: 52,
      usage: 'emergency_venting',
      note: 'Generator thermal load is elevated — venting may cool systems but can trigger blackout.',
    });
  }

  const offlineGen = state.generators.find((g) => !g.online);
  if (offlineGen || state.globalBlackout) {
    candidates.push({
      score: state.globalBlackout ? 85 : 60,
      usage: 'generator_restart [ID]',
      note: 'Power plant offline or grid unstable — restart might help if spare parts are available.',
    });
    candidates.push({
      score: 48,
      usage: 'power reroute [ZONE]',
      note: 'Load balancing is uneven — reroute could ease one zone while starving another.',
    });
  }

  const agitatedDino = state.dinosaurs.find((d) => d.stress >= 55 || d.aiState === 'Agitated');
  if (agitatedDino) {
    candidates.push({
      score: 45,
      usage: 'dino track [ID]',
      note: 'Specimen telemetry looks unsettled — tracking may clarify threat without changing outcomes.',
    });
  }

  if (state.activeEvents.some((e) => e.severity === 'critical' || e.severity === 'major')) {
    candidates.push({
      score: 50,
      usage: 'dispatch_patrol',
      note: 'Active incidents on the board — patrol might buy time or pull teams from other sectors.',
    });
  }

  if (state.stability < 55) {
    candidates.push({
      score: 40,
      usage: 'status',
      note: 'Park stability is soft — a status read may inform your next move (or add noise).',
    });
  }

  const highVoltageFence = state.fences.find((f) => f.voltage < 50 && f.state !== 'Breached');
  if (highVoltageFence) {
    candidates.push({
      score: 42,
      usage: 'increase_voltage [ID]',
      note: 'Low fence voltage reported — boosting output might harden a line or overload generators.',
    });
  }

  if (state.resources.tranquilizerAmmo > 0 && state.dinosaurs.some((d) => d.stress >= 70)) {
    candidates.push({
      score: 35,
      usage: 'lethal_authorization',
      note: 'Containment stress is high — authorization is an extreme option with stability cost.',
    });
  }

  if (state.escalationPhase >= 3) {
    candidates.push({
      score: 30,
      usage: 'system_hard_reboot',
      note: 'Escalation phase is severe — hard reboot is disruptive and not guaranteed to recover control.',
    });
  }

  if (candidates.length === 0) {
    candidates.push(
      {
        score: 10,
        usage: 'status',
        note: 'Routine interval — status may surface drift before symptoms appear on other panels.',
      },
      {
        score: 8,
        usage: 'dino track [ID]',
        note: 'Specimen roster is quiet — tracking is informational and may distract from real faults.',
      },
      {
        score: 6,
        usage: 'dispatch_patrol',
        note: 'No acute faults flagged — patrol is optional and consumes team capacity.',
      },
    );
  }

  const seen = new Set<string>();
  const ranked: NextCommandSuggestion[] = [];
  for (const c of candidates.sort((a, b) => b.score - a.score)) {
    if (seen.has(c.usage)) {
      continue;
    }
    seen.add(c.usage);
    ranked.push({ usage: c.usage, note: c.note });
    if (ranked.length >= max) {
      break;
    }
  }

  return ranked;
}
