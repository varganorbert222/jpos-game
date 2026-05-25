/** UI filter chips in Operations Feed (ALL = empty selection). */
export type FeedFilterType = 'ALERT' | 'EVENT' | 'WARNING' | 'CRITICAL' | 'LOG';

export const FEED_FILTER_TYPES: readonly FeedFilterType[] = [
  'ALERT',
  'EVENT',
  'WARNING',
  'CRITICAL',
  'LOG',
] as const;

export const FEED_REVEAL_GAP_MS = 160;
export const FEED_ACTIVE_LIMIT = 48;
export const FEED_ARCHIVE_LIMIT = 120;
export const FEED_SEED_MAX_ITEMS = 14;

export function badgeToFilterType(badge: string, kind: string): FeedFilterType {
  if (badge === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (badge === 'GHOST' || badge === 'WARN') {
    return 'WARNING';
  }
  if (kind === 'alert') {
    return 'ALERT';
  }
  if (kind === 'event') {
    return 'EVENT';
  }
  return 'LOG';
}

export function feedItemPriority(
  severity: 'critical' | 'major' | 'minor' | 'info',
  filterType: FeedFilterType,
): number {
  if (filterType === 'CRITICAL' || severity === 'critical') {
    return 100;
  }
  if (filterType === 'WARNING' || severity === 'major') {
    return 80;
  }
  if (filterType === 'ALERT' || filterType === 'EVENT' || severity === 'minor') {
    return 60;
  }
  return 10;
}
