import { useState, useEffect, useCallback } from 'react'
import { getUsers, deactivateUser, type UserSummary } from '@/api/users.api'
import { useToast } from '@/components/feedback/useToast'
import type { ApiError } from '@/api/client'

export function useTeamUsers() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      setError((err as ApiError).message ?? 'שגיאה בטעינת רשימת העובדים.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const deactivate = useCallback(
    async (id: number, name: string) => {
      try {
        await deactivateUser(id)
        toast.success(`${name} הושבת/ה בהצלחה.`)
        load()
      } catch (err) {
        toast.error((err as ApiError).message ?? 'הפעולה נכשלה. נסו שוב.')
      }
    },
    [load, toast],
  )

  return { users, loading, error, refresh: load, deactivate }
}
