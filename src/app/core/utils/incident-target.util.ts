import type { ZoneId } from '../../../simulation';
import type { DockApp } from '../../features/panels/dock/dock.component';

export interface ParsedIncidentTarget {
  zoneId?: ZoneId;
  fenceId?: number;
  cameraId?: number;
}

export function parseIncidentTargets(text: string): ParsedIncidentTarget {
  const zoneMatch = text.match(/\bZ(\d)\b/i);
  const fenceMatch = text.match(/\bF(\d{1,2})\b/i);
  const camMatch = text.match(/\bCAM(?:ERA)?\s*(\d{1,2})\b/i);
  const out: ParsedIncidentTarget = {};
  if (zoneMatch) {
    const z = Number(zoneMatch[1]);
    if (z >= 0 && z <= 5) {
      out.zoneId = z as ZoneId;
    }
  }
  if (fenceMatch) {
    out.fenceId = Number(fenceMatch[1]);
  }
  if (camMatch) {
    out.cameraId = Number(camMatch[1]);
  }
  return out;
}

export function incidentNeedsVerify(message: string): boolean {
  const u = message.toUpperCase();
  return (
    u.includes('GHOST') ||
    u.includes('UNVERIFIED') ||
    u.includes('CROSS-CHECK') ||
    u.includes('CROSS CHECK') ||
    u.includes('VERIFY')
  );
}

export function dockAppForIncident(message: string): DockApp {
  const u = message.toUpperCase();
  if (u.includes('FENCE') || u.includes('BREACH') || u.includes('VOLTAGE')) {
    return 'fence';
  }
  if (u.includes('CAM') || u.includes('SENSOR')) {
    return 'security';
  }
  if (u.includes('POWER') || u.includes('GEN') || u.includes('BLACKOUT')) {
    return 'power';
  }
  if (u.includes('DINO') || u.includes('SPECIMEN') || u.includes('BIO')) {
    return 'dino';
  }
  if (u.includes('WEATHER') || u.includes('STORM')) {
    return 'weather';
  }
  if (u.includes('TOUR') || u.includes('VISITOR')) {
    return 'tours';
  }
  return 'security';
}

export function verifyChecklistSteps(
  message: string,
  targets: ParsedIncidentTarget,
): { id: string; label: string }[] {
  const steps: { id: string; label: string }[] = [];
  if (targets.zoneId != null) {
    steps.push({ id: 'camera', label: `Camera Z${targets.zoneId}` });
    steps.push({ id: 'fence', label: `Fence Z${targets.zoneId}` });
  } else if (targets.fenceId != null) {
    steps.push({ id: 'fence', label: `Fence F${targets.fenceId}` });
  }
  if (incidentNeedsVerify(message)) {
    steps.push({ id: 'action', label: 'Countermeasure' });
  }
  return steps;
}
