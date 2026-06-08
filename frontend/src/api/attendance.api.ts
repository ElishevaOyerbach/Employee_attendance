import { api } from './client'

/** A single break within a shift (mirrors BreakDto). */
export interface BreakDto {
  id: number
  breakStartTime: string
  breakEndTime: string | null
  status: string // "Active" | "Completed" | "PendingReview"
  durationMinutes: number
  durationSeconds: number
}

/** An attendance record / shift (mirrors AttendanceRecordDto). */
export interface AttendanceRecord {
  id: number
  userId: number
  workDate: string // "2026-06-08"
  status: string // "Active" | "Completed" | "PendingReview"
  clockInTime: string
  clockOutTime: string | null
  expectedDailyHoursSnapshot: number
  workedMinutes: number
  breakMinutes: number
  workedSeconds: number
  breakSeconds: number
  hasActiveBreak: boolean
  activeBreakStartTime: string | null
  breaks: BreakDto[]
}

export interface ResolvePendingReviewPayload {
  estimatedClockOutTime: string
  estimatedBreakEndTime?: string | null
  note?: string | null
}

/**
 * The caller's currently open shift, or null if not clocked in.
 * GET /api/attendance/me/active
 */
export async function getActiveShift(): Promise<AttendanceRecord | null> {
  const { data } = await api.get<AttendanceRecord | null>('/attendance/me/active')
  return data && typeof data === 'object' ? data : null
}

/**
 * The caller's full shift history, newest first.
 * GET /api/attendance/me
 */
export async function getHistory(): Promise<AttendanceRecord[]> {
  const { data } = await api.get<AttendanceRecord[]>('/attendance/me')
  return Array.isArray(data) ? data : []
}

/**
 * Shifts flagged as PendingReview (missed clock-out) for the logged-in user.
 * GET /api/attendance/me/pending-review
 */
export async function getPendingReviews(): Promise<AttendanceRecord[]> {
  const { data } = await api.get<AttendanceRecord[]>('/attendance/me/pending-review')
  return Array.isArray(data) ? data : []
}

/**
 * Employee submits an estimated clock-out time for a PendingReview shift.
 * POST /api/attendance/:id/resolve
 */
export async function resolvePendingReview(
  id: number,
  payload: ResolvePendingReviewPayload,
): Promise<AttendanceRecord> {
  const { data } = await api.post<AttendanceRecord>(`/attendance/${id}/resolve`, payload)
  return data
}

export async function clockIn(): Promise<AttendanceRecord> {
  const { data } = await api.post<AttendanceRecord>('/attendance/clock-in')
  return data
}

export async function clockOut(): Promise<AttendanceRecord> {
  const { data } = await api.post<AttendanceRecord>('/attendance/clock-out')
  return data
}

export async function startBreak(): Promise<AttendanceRecord> {
  const { data } = await api.post<AttendanceRecord>('/attendance/break/start')
  return data
}

export async function endBreak(): Promise<AttendanceRecord> {
  const { data } = await api.post<AttendanceRecord>('/attendance/break/end')
  return data
}
