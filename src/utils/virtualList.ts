/**
 * How many items were inserted before the previous first item — e.g. an older page of
 * messages loaded on top. Returns 0 when nothing was prepended, or when the list was
 * replaced outright (the previous first item is gone).
 */
export function countPrepended<T>(prev: T[], next: T[], getKey: (item: T) => string): number {
  if (prev.length === 0 || next.length === 0) return 0;

  const prevFirstKey = getKey(prev[0]);
  const index = next.findIndex((item) => getKey(item) === prevFirstKey);

  return index > 0 ? index : 0;
}
