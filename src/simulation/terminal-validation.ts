import type { SimulationState } from './types';

export type ParamLabel = 'fence ID' | 'camera ID' | 'generator ID' | 'dino ID' | 'zone';

export function parseIntegerParam(raw: string | undefined): number | 'missing' | 'invalid' {
  if (raw == null || raw === '') {
    return 'missing';
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    return 'invalid';
  }
  return value;
}

export function paramParseError(label: string, kind: 'missing' | 'invalid'): string {
  if (kind === 'missing') {
    return `ERR: missing ${label}`;
  }
  return `ERR: ${label} must be an integer`;
}

export function validateIndex(
  state: SimulationState,
  label: ParamLabel,
  id: number,
  count: number,
): string | null {
  if (id < 0) {
    return `ERR: ${label} must be non-negative`;
  }
  if (id >= count) {
    const last = count - 1;
    const range = count <= 1 ? '0' : `0–${last}`;
    return `ERR: ${label} ${id} out of range (${range})`;
  }
  return null;
}

export function validateFenceId(state: SimulationState, id: number): string | null {
  return validateIndex(state, 'fence ID', id, state.fences.length);
}

export function validateCameraId(state: SimulationState, id: number): string | null {
  return validateIndex(state, 'camera ID', id, state.cameras.length);
}

export function validateGeneratorId(state: SimulationState, id: number): string | null {
  return validateIndex(state, 'generator ID', id, state.generators.length);
}

export function validateDinoId(state: SimulationState, id: number): string | null {
  return validateIndex(state, 'dino ID', id, state.dinosaurs.length);
}

export function validateZoneId(state: SimulationState, zone: number): string | null {
  return validateIndex(state, 'zone', zone, state.zones.length);
}
