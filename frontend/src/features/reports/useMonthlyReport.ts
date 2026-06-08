import { useState, useEffect } from 'react'
import {
  getMyMonthlyReport,
  getEmployeeMonthlyReport,
  type MonthlySummaryResponse,
} from '@/api/reports.api'
import type { ApiError } from '@/api/client'

export function useMonthlyReport(userId?: number) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState<MonthlySummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setReport(null)

    const fetchFn =
      userId !== undefined
        ? getEmployeeMonthlyReport(userId, year, month)
        : getMyMonthlyReport(year, month)

    fetchFn
      .then((data) => {
        if (!cancelled) setReport(data)
      })
      .catch((err: ApiError) => {
        if (!cancelled) setError(err.message ?? 'שגיאה בטעינת הדוח.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, year, month])

  const prevMonth = () => {
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1)
        return 12
      }
      return m - 1
    })
  }

  const nextMonth = () => {
    const now = new Date()
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1)
        return 1
      }
      return m + 1
    })
    // No guard needed — the backend simply returns empty data for future months.
    void now
  }

  return { report, year, month, setYear, setMonth, prevMonth, nextMonth, loading, error }
}
