import type { QueuedPlayerAction } from '../../../simulation/types';

export function formatActionCommand(
  type: string,
  params: Record<string, string | number> = {},
): string {
  const parts = [type];
  if (params['id'] !== undefined) {
    parts.push(String(params['id']));
  } else if (params['zone'] !== undefined) {
    parts.push(String(params['zone']));
  }
  return parts.join(' ');
}

export function actionParamKey(
  type: string,
  params: Record<string, string | number> = {},
): string {
  const id = params['id'];
  const zone = params['zone'];
  if (id !== undefined) {
    return `${type}#id=${id}`;
  }
  if (zone !== undefined) {
    return `${type}#zone=${zone}`;
  }
  return `${type}#`;
}

export function queueHasDuplicate(
  queue: readonly QueuedPlayerAction[],
  type: string,
  params: Record<string, string | number> = {},
): boolean {
  const key = actionParamKey(type, params);
  return queue.some((a) => actionParamKey(a.type, a.params) === key);
}
