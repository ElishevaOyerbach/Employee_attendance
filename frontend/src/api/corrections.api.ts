import { api } from './client'

/** Correction request kind (mirrors CorrectionRequestType, serialized as a string). */
export type CorrectionRequestType = 'MissingAction' | 'TimeAdjustment'

/** Which timestamp on the shift the request targets (mirrors CorrectionTargetField). */
export type CorrectionTargetField = 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd'

/** Lifecycle of a correction request (mirrors CorrectionStatus). */
export type CorrectionStatus = 'Pending' | 'Approved' | 'Rejected'

/** A correction request (mirrors CorrectionResponse). */
export interface CorrectionRecord {
  id: number
  attendanceRecordId: number
  breakId: number | null
  requestType: CorrectionRequestType
  targetField: CorrectionTargetField
  originalTime: string | null
  requestedTime: string
  approvedTime: string | null
  status: CorrectionStatus
  employeeNote: string | null
  managerNote: string | null
  requestedByUserId: number
  reviewedByUserId: number | null
  createdAt: string
  reviewedAt: string | null
}

/** Payload for creating a correction request (mirrors CreateCorrectionRequestDto). */
export interface CreateCorrectionPayload {
  attendanceRecordId: number
  /** Required only when targetField is BreakStart or BreakEnd. */
  breakId?: number | null
  requestType: CorrectionRequestType
  targetField: CorrectionTargetField
  /** Wall-clock datetime without offset, e.g. "2026-06-08T17:30:00". */
  requestedTime: string
  note?: string | null
}

/** Payload for a manager review (mirrors ReviewCorrectionRequestDto). */
export interface ReviewCorrectionPayload {
  approve: boolean
  /** Optional override of the requested time when approving. */
  approvedTime?: string | null
  managerNote?: string | null
}

/** Employee creates a correction request for one of their shifts. POST /api/corrections */
export async function createCorrection(
  payload: CreateCorrectionPayload,
): Promise<CorrectionRecord> {
  const { data } = await api.post<CorrectionRecord>('/corrections', payload)
  return data
}

/** The caller's own correction requests. GET /api/corrections/me */
export async function getMyCorrections(): Promise<CorrectionRecord[]> {
  const { data } = await api.get<CorrectionRecord[]>('/corrections/me')
  return Array.isArray(data) ? data : []
}

/** All correction requests (manager only), optionally filtered. GET /api/corrections?status= */
export async function getAllCorrections(
  status?: CorrectionStatus,
): Promise<CorrectionRecord[]> {
  const { data } = await api.get<CorrectionRecord[]>('/corrections', {
    params: status ? { status } : undefined,
  })
  return Array.isArray(data) ? data : []
}

/** Manager approves or rejects a pending request. POST /api/corrections/{id}/review */
export async function reviewCorrection(
  id: number,
  payload: ReviewCorrectionPayload,
): Promise<CorrectionRecord> {
  const { data } = await api.post<CorrectionRecord>(`/corrections/${id}/review`, payload)
  return data
}
