export function getCurrentMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { start, end };
}

export function isInCurrentMonth(timestamp: number): boolean {
  const { start, end } = getCurrentMonthBounds();
  return timestamp >= start.getTime() && timestamp < end.getTime();
}
