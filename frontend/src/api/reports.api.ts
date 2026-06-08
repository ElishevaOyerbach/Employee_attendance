import { api } from './client'

export interface DailySummaryResponse {
  date: string
  workedMinutes: number
  breakMinutes: number
  expectedMinutes: number
  overtimeMinutes: number
  missingMinutes: number
}

export interface MonthlySummaryResponse {
  userId: number
  year: number
  month: number
  daysWorked: number
  totalWorkedMinutes: number
  totalBreakMinutes: number
  totalExpectedMinutes: number
  totalOvertimeMinutes: number
  totalMissingMinutes: number
  netDifferenceMinutes: number
  days: DailySummaryResponse[]
}

export interface AttendanceReportRow {
  userId: number
  fullName: string
  workDate: string
  clockInTime: string
  clockOutTime: string | null
  workedMinutes: number
  breakMinutes: number
  status: string
}

export interface RangeReportResponse {
  from: string
  to: string
  totalWorkedMinutes: number
  totalBreakMinutes: number
  daysWorked: number
  openShiftsCount: number
  rows: AttendanceReportRow[]
}

/** Monthly summary for the logged-in user. GET /api/reports/me/monthly */
export async function getMyMonthlyReport(
  year: number,
  month: number,
): Promise<MonthlySummaryResponse> {
  const { data } = await api.get<MonthlySummaryResponse>('/reports/me/monthly', {
    params: { year, month },
  })
  return data
}

/** Monthly summary for a specific employee (manager only). GET /api/reports/employee/:id/monthly */
export async function getEmployeeMonthlyReport(
  id: number,
  year: number,
  month: number,
): Promise<MonthlySummaryResponse> {
  const { data } = await api.get<MonthlySummaryResponse>(`/reports/employee/${id}/monthly`, {
    params: { year, month },
  })
  return data
}

/** Date-range attendance report for the logged-in user. GET /api/reports/me/range */
export async function getMyRangeReport(
  from: string,
  to: string,
): Promise<RangeReportResponse> {
  const { data } = await api.get<RangeReportResponse>('/reports/me/range', { params: { from, to } })
  return data
}

/** Date-range attendance report for the whole team (manager only). GET /api/reports/team/range */
export async function getTeamRangeReport(
  from: string,
  to: string,
  userId?: number,
): Promise<RangeReportResponse> {
  const { data } = await api.get<RangeReportResponse>('/reports/team/range', {
    params: { from, to, ...(userId ? { userId } : {}) },
  })
  return data
}
