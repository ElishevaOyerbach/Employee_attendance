import { useEffect, useState } from 'react'
import { LogIn, LogOut, Coffee, Play, AlertCircle } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'
import { formatClock, formatDurationHe, wallClockTime } from '@/lib/datetime'
import type { AttendanceRecord } from '@/api/attendance.api'
import type { ShiftAction, ShiftState } from './useActiveShift'
import './status-hero.css'

interface StatusHeroProps {
  state: ShiftState
  shift: AttendanceRecord | null
  loading: boolean
  error: string | null
  pendingAction: ShiftAction | null
  isActing: boolean
  act: (action: ShiftAction) => void
  refresh: () => void
}

/**
 * Live HH:MM:SS timer. Counts up from `baseSeconds` (the server-reported value
 * at fetch time) by ticking a counter once per second. Mount this with a
 * `key` that changes whenever the base should reset, so each rebase remounts
 * fresh — no effect-driven setState, no refs read during render.
 */
function LiveTimer({ baseSeconds }: { baseSeconds: number }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  return <div className="hero__timer ltr">{formatClock(baseSeconds + elapsed)}</div>
}

export function StatusHero({
  state,
  shift,
  loading,
  error,
  pendingAction,
  isActing,
  act,
  refresh,
}: StatusHeroProps) {
  const activeBreak = shift?.breaks?.find((b) => b.status === 'Active')

  if (loading) {
    return (
      <div className="card hero hero--out">
        <Spinner />
        <p className="hero__subline">טוען סטטוס…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card hero hero--out">
        <div className="hero__error">
          <AlertCircle size={32} aria-hidden="true" />
          <p>{error}</p>
          <Button variant="secondary" onClick={refresh}>
            נסו שוב
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`card hero hero--${state}`}>
      {state === 'out' && (
        <>
          <span className="hero__pill">
            <span className="badge__dot" aria-hidden="true" />
            לא רשומה כניסה
          </span>
          <div>
            <div className="hero__headline">מוכנים להתחיל?</div>
            <div className="hero__subline">לחצו ״כניסה״ כדי להתחיל את יום העבודה</div>
          </div>
          <div className="hero__actions">
            <Button
              size="lg"
              leadingIcon={<LogIn size={18} aria-hidden="true" />}
              loading={pendingAction === 'clockIn'}
              disabled={isActing}
              onClick={() => act('clockIn')}
            >
              כניסה
            </Button>
          </div>
        </>
      )}

      {state === 'working' && shift && (
        <>
          <span className="hero__pill">
            <span className="hero__pulse" aria-hidden="true" />
            בעבודה
          </span>
          <div>
            <LiveTimer key={`work-${shift.id}`} baseSeconds={shift.workedSeconds} />
            <div className="hero__timer-label">
              נכנסת בשעה <span className="ltr">{wallClockTime(shift.clockInTime)}</span>
            </div>
          </div>
          <div className="hero__actions">
            <Button
              variant="secondary"
              size="lg"
              leadingIcon={<Coffee size={18} aria-hidden="true" />}
              loading={pendingAction === 'startBreak'}
              disabled={isActing}
              onClick={() => act('startBreak')}
            >
              התחלת הפסקה
            </Button>
            <Button
              size="lg"
              leadingIcon={<LogOut size={18} aria-hidden="true" />}
              loading={pendingAction === 'clockOut'}
              disabled={isActing}
              onClick={() => act('clockOut')}
            >
              יציאה
            </Button>
          </div>
          <div className="hero__stats">
            <div className="hero__stat">
              <div className="hero__stat-value">{formatDurationHe(shift.workedMinutes)}</div>
              <div className="hero__stat-label">זמן עבודה היום</div>
            </div>
            <div className="hero__stat">
              <div className="hero__stat-value">{formatDurationHe(shift.breakMinutes)}</div>
              <div className="hero__stat-label">זמן הפסקות היום</div>
            </div>
          </div>
        </>
      )}

      {state === 'break' && shift && (
        <>
          <span className="hero__pill">
            <span className="hero__pulse" aria-hidden="true" />
            בהפסקה
          </span>
          <div>
            <LiveTimer
              key={`break-${activeBreak?.id ?? shift.id}`}
              baseSeconds={activeBreak?.durationSeconds ?? 0}
            />
            <div className="hero__timer-label">
              בהפסקה מאז{' '}
              <span className="ltr">{wallClockTime(activeBreak?.breakStartTime)}</span>
            </div>
          </div>
          <div className="hero__actions">
            <Button
              size="lg"
              leadingIcon={<Play size={18} aria-hidden="true" />}
              loading={pendingAction === 'endBreak'}
              disabled={isActing}
              onClick={() => act('endBreak')}
            >
              סיום הפסקה
            </Button>
          </div>
          <div className="hero__stats">
            <div className="hero__stat">
              <div className="hero__stat-value">{formatDurationHe(shift.workedMinutes)}</div>
              <div className="hero__stat-label">זמן עבודה היום</div>
            </div>
            <div className="hero__stat">
              <div className="hero__stat-value">
                <span className="ltr">{wallClockTime(shift.clockInTime)}</span>
              </div>
              <div className="hero__stat-label">שעת כניסה</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
