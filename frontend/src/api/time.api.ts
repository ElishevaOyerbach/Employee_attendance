import { api } from './client'

/** Shape of GET /api/health/external-time (ExternalZurichTimeProvider). */
export interface ServerTimeResponse {
  source: string
  zurichTime: string // ISO datetime, Europe/Zurich
  serverTime: string // ISO datetime, server clock
}

/**
 * Fetches the authoritative Europe/Zurich time used to stamp attendance.
 * Powers the trust-signal clock widget in the top bar.
 */
export async function getServerTime(): Promise<ServerTimeResponse> {
  const { data } = await api.get<ServerTimeResponse>('/health/external-time')
  return data
}
