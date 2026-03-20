import type { TravelEntry } from '../types/travel';

export function sortEntriesByNewest(entries: TravelEntry[]): TravelEntry[] {
  return [...entries].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return 0;
    }

    if (Number.isNaN(leftTime)) {
      return 1;
    }

    if (Number.isNaN(rightTime)) {
      return -1;
    }

    return rightTime - leftTime;
  });
}
