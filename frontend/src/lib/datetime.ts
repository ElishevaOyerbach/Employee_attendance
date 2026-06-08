/**
 * Time helpers for attendance display.
 *
 * Backend timestamps are Europe/Zurich wall-clock values serialized without a
 * timezone offset (e.g. "2026-06-08T08:31:12"). Constructing a JS Date would
 * reinterpret them in the browser's local zone, so for *display of a clock
 * time* we slice the string directly and keep the wall-clock value intact.
 */

/** "2026-06-08T08:31:12" -> "08:31" (wall-clock, no timezone math). */
export function wallClockTime(iso: string | null | undefined): string {
  if (!iso) return '--:--'
  const timePart = iso.split('T')[1] ?? ''
  const [h, m] = timePart.split(':')
  if (!h || !m) return '--:--'
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

/** 462 -> "7:42" (hours:minutes, zero-padded minutes). */
export function formatHoursMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes))
  const h = Math.floor(safe / 60)
  const m = safe % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/** 462 -> "7 שע׳ 42 דק׳" (readable Hebrew duration). */
export function formatDurationHe(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes))
  const h = Math.floor(safe / 60)
  const m = safe % 60
  if (h === 0) return `${m} דק׳`
  if (m === 0) return `${h} שע׳`
  return `${h} שע׳ ${m} דק׳`
}

/**
 * "2026-06-08" or "2026-06-08T08:31:12" -> "8 ביוני 2026" (Hebrew long date).
 * Builds the Date from the y/m/d parts in local time so the calendar date is
 * never shifted by a timezone reinterpretation.
 */
export function formatDateHe(iso: string | null | undefined): string {
  const date = parseDateParts(iso)
  if (!date) return '—'
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Same as formatDateHe but prefixed with the weekday, e.g. "יום ראשון, 8 ביוני 2026". */
export function formatDateHeWithWeekday(iso: string | null | undefined): string {
  const date = parseDateParts(iso)
  if (!date) return '—'
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** "2026-06-08T17:30:00" -> "8 ביוני 2026, 17:30" (date + wall-clock time). */
export function formatDateTimeHe(iso: string | null | undefined): string {
  if (!iso) return '—'
  return `${formatDateHe(iso)}, ${wallClockTime(iso)}`
}

/**
 * A backend wall-clock string -> the value an <input type="datetime-local">
 * expects: "2026-06-08T17:05". Returns '' when there is nothing to prefill.
 */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const [datePart, timePart = ''] = iso.split('T')
  const [h = '00', m = '00'] = timePart.split(':')
  if (!datePart) return ''
  return `${datePart}T${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

/**
 * A datetime-local value ("2026-06-08T17:05") -> the wall-clock string the
 * backend stores ("2026-06-08T17:05:00"), with no timezone offset appended.
 */
export function fromDateTimeLocal(value: string): string {
  if (!value) return value
  // Ensure seconds are present so the value round-trips as a full DateTime.
  return value.length === 16 ? `${value}:00` : value
}

/** Internal: parse the date portion of an ISO-ish string into a local Date. */
function parseDateParts(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const datePart = iso.split('T')[0]
  const [y, m, d] = datePart.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** Seconds -> "HH:MM:SS" for a live ticking timer. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}
