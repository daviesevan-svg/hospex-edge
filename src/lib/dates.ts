// Date helpers. All dates are ISO strings (YYYY-MM-DD) on the wire; we use
// Date objects only for arithmetic. UTC throughout to avoid TZ drift in Workers.

export type ISODate = string; // YYYY-MM-DD

export function today(): ISODate {
  return toISO(new Date());
}

export function toISO(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function fromISO(s: ISODate): Date {
  return new Date(s + "T00:00:00Z");
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISO(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round(
    (fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000,
  );
}

export function rangeDays(start: ISODate, span: number): ISODate[] {
  return Array.from({ length: span }, (_, i) => addDays(start, i));
}

export function dayOfWeek(s: ISODate): number {
  return fromISO(s).getUTCDay(); // 0 = Sun
}

export function isWeekend(s: ISODate): boolean {
  const d = dayOfWeek(s);
  return d === 0 || d === 6;
}

export function formatShort(s: ISODate): string {
  // "Mon 12"
  const d = fromISO(s);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  return `${wd} ${d.getUTCDate()}`;
}

export function formatMonthLabel(s: ISODate): string {
  const d = fromISO(s);
  const m = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][d.getUTCMonth()];
  return `${m} ${d.getUTCFullYear()}`;
}
