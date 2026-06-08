import { useCallback, useEffect, useState } from 'react'
import type { ApiError } from '@/api/client'
import { getHistory, type AttendanceRecord } from '@/api/attendance.api'

/** Loads the caller's shift history with loading/error state and a refresh. */
export function useAttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getHistory()
      setRecords(data)
      setError(null)
    } catch (err) {
      setError((err as ApiError).message ?? 'טעינת ההיסטוריה נכשלה.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load — setState only in async callbacks, never synchronously.
  useEffect(() => {
    let active = true
    getHistory()
      .then((data) => {
        if (!active) return
        setRecords(data)
        setError(null)
      })
      .catch((err: ApiError) => {
        if (active) setError(err.message ?? 'טעינת ההיסטוריה נכשלה.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { records, loading, error, refresh }
}
