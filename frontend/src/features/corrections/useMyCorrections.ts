import { useCallback, useEffect, useState } from 'react'
import type { ApiError } from '@/api/client'
import { getMyCorrections, type CorrectionRecord } from '@/api/corrections.api'

/** Loads the caller's own correction requests with loading/error and refresh. */
export function useMyCorrections() {
  const [items, setItems] = useState<CorrectionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyCorrections()
      setItems(data)
      setError(null)
    } catch (err) {
      setError((err as ApiError).message ?? 'טעינת הבקשות נכשלה.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getMyCorrections()
      .then((data) => {
        if (!active) return
        setItems(data)
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
  }, [])

  return { items, loading, error, refresh }
}
