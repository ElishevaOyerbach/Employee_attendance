import { useCallback, useEffect, useState } from 'react'
import type { ApiError } from '@/api/client'
import {
  getAllCorrections,
  type CorrectionRecord,
  type CorrectionStatus,
} from '@/api/corrections.api'
import { getUsers } from '@/api/users.api'

interface CorrectionsData {
  corrections: CorrectionRecord[]
  usersById: Record<number, string>
}

/**
 * Manager view of correction requests for the given status filter, plus a map
 * of user id -> full name so the queue can show who asked. Re-fetches when the
 * status filter changes; setState happens only in async callbacks.
 */
export function usePendingCorrections(status?: CorrectionStatus) {
  const [items, setItems] = useState<CorrectionRecord[]>([])
  const [usersById, setUsersById] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pure fetch — no setState, safe to call from both the effect and refresh.
  const fetchData = useCallback(async (): Promise<CorrectionsData> => {
    const [corrections, users] = await Promise.all([getAllCorrections(status), getUsers()])
    const map: Record<number, string> = {}
    for (const u of users) map[u.id] = u.fullName
    return { corrections, usersById: map }
  }, [status])

  // Load on mount and whenever the status filter changes.
  useEffect(() => {
    let active = true
    fetchData()
      .then((data) => {
        if (!active) return
        setItems(data.corrections)
        setUsersById(data.usersById)
        setError(null)
      })
      .catch((err: ApiError) => {
        if (active) setError(err.message ?? 'טעינת הבקשות נכשלה.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchData])

  // Manual refresh (event handler) — here a leading loading state is fine.
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchData()
      setItems(data.corrections)
      setUsersById(data.usersById)
      setError(null)
    } catch (err) {
      setError((err as ApiError).message ?? 'טעינת הבקשות נכשלה.')
    } finally {
      setLoading(false)
    }
  }, [fetchData])

  return { items, usersById, loading, error, refresh }
}
