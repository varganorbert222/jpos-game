import type { SimulationSnapshot } from '../../../simulation';

export function buildHardRebootPrompt(snap: SimulationSnapshot): {
  breachActive: boolean;
  huntingActive: boolean;
  suggestions: string[];
} {
  const breachActive = snap.fences.some((f) => f.state === 'Breached');
  const huntingActive = snap.dinosaurs.some((d) => d.aiState === 'Hunting');
  const suggestions: string[] = [];
  if (breachActive) {
    const f = snap.fences.find((x) => x.state === 'Breached');
    if (f) {
      suggestions.push(`seal_breach ${f.id}`);
    }
  }
  if (huntingActive) {
    const d = snap.dinosaurs.find((x) => x.aiState === 'Hunting');
    if (d) {
      suggestions.push(`dino sedate ${d.id}`);
    }
  }
  if (snap.globalBlackout) {
    const off = snap.generators.find((g) => !g.online);
    if (off) {
      suggestions.push(`generator_restart ${off.id}`);
    }
  }
  if (suggestions.length === 0 && snap.infectionLevel > 0) {
    suggestions.push('(reboot appropriate for mail/telemetry infection)');
  }
  return { breachActive, huntingActive, suggestions };
}

export function formatHardRebootModalMessage(prompt: ReturnType<typeof buildHardRebootPrompt>): string {
  const lines = [
    'Hard reboot clears software anomalies and mail infection.',
    'Perimeter fence power will cycle OFF while the kernel reloads.',
    'Simulation keeps running during reboot.',
  ];
  if (prompt.breachActive || prompt.huntingActive) {
    lines.push('');
    lines.push('WARNING: Physical containment issue active.');
    lines.push('Recommended actions BEFORE reboot:');
    for (const s of prompt.suggestions) {
      lines.push(`  • ${s}`);
    }
    lines.push('');
    lines.push('You may still proceed with reboot.');
  }
  return lines.join('\n');
}
