import { useCallback, useEffect, useState } from 'react'
import type { ApiError } from '@/api/client'
import {
  clockIn,
  clockOut,
  endBreak,
  getActiveShift,
  startBreak,
  type AttendanceRecord,
} from '@/api/attendance.api'
import { useToast } from '@/components/feedback/useToast'

export type ShiftState = 'out' | 'working' | 'break'
export type ShiftAction = 'clockIn' | 'clockOut' | 'startBreak' | 'endBreak'

/** Derive the three-state machine from the active record. */
export function deriveState(shift: AttendanceRecord | null): ShiftState {
  if (!shift) return 'out'
  return shift.hasActiveBreak ? 'break' : 'working'
}

const actionApi: Record<ShiftAction, () => Promise<AttendanceRecord>> = {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
}

const successMessage: Record<ShiftAction, string> = {
  clockIn: 'נרשמה כניסה. שיהיה יום מוצלח!',
  clockOut: 'נרשמה יציאה. תודה ולהתראות!',
  startBreak: 'ההפסקה החלה.',
  endBreak: 'חזרת מהפסקה.',
}

/**
 * Owns the My Day time-clock state: loads the active shift, runs clock
 * actions, and re-fetches the authoritative state after every action so the
 * UI never drifts from the server.
 */
export function useActiveShift() {
  const toast = useToast()
  const [shift, setShift] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<ShiftAction | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await getActiveShift()
      setShift(data)
      setError(null)
    } catch (err) {
      setError((err as ApiError).message ?? 'טעינת הסטטוס נכשלה.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load. setState happens only in async promise callbacks (never
  // synchronously in the effect body), so renders don't cascade.
  useEffect(() => {
    let active = true
    getActiveShift()
      .then((data) => {
        if (!active) return
        setShift(data)
        setError(null)
      })
      .catch((err: ApiError) => {
        if (active) setError(err.message ?? 'טעינת הסטטוס נכשלה.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const act = useCallback(
    async (action: ShiftAction) => {
      if (pendingAction) return
      setPendingAction(action)
      try {
        await actionApi[action]()
        // Re-fetch the authoritative state after the action succeeds.
        await refresh()
        toast.success(successMessage[action])
      } catch (err) {
        toast.error((err as ApiError).message ?? 'הפעולה נכשלה. נסו שוב.')
      } finally {
        setPendingAction(null)
      }
    },
    [pendingAction, refresh, toast],
  )

  return {
    shift,
    state: deriveState(shift),
    loading,
    error,
    pendingAction,
    isActing: pendingAction !== null,
    refresh,
    act,
  }
}
