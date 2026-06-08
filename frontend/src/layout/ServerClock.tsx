import { useEffect, useRef, useState } from 'react'
import { Globe } from 'lucide-react'
import { getServerTime } from '@/api/time.api'

/**
 * Trust-signal clock in the top bar. Fetches the authoritative Europe/Zurich
 * time once (ExternalZurichTimeProvider), then ticks locally so the display
 * stays live without hammering the endpoint. Re-syncs every few minutes to
 * correct any drift. Degrades quietly to the local clock if the API is down.
 */
export function ServerClock() {
  // Offset (ms) between server time and this device's clock.
  const offsetRef = useRef<number>(0)
  const [synced, setSynced] = useState(false)
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    let cancelled = false

    const sync = async () => {
      try {
        const { zurichTime } = await getServerTime()
        const serverMs = Date.parse(zurichTime)
        if (!cancelled && !Number.isNaN(serverMs)) {
          offsetRef.current = serverMs - Date.now()
          setSynced(true)
        }
      } catch {
        // Stay on the local clock; the widget still shows a sensible time.
      }
    }

    sync()
    const resync = setInterval(sync, 5 * 60 * 1000)
    const tick = setInterval(() => {
      setNow(new Date(Date.now() + offsetRef.current))
    }, 1000)

    return () => {
      cancelled = true
      clearInterval(resync)
      clearInterval(tick)
    }
  }, [])

  const time = now.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Zurich',
  })

  return (
    <div className="clock" title={synced ? 'שעון מאומת מהשרת (ציריך)' : 'שעון מקומי'}>
      <Globe size={14} aria-hidden="true" />
      <span className="ltr clock__time">{time}</span>
      <span>{synced ? 'ציריך' : 'מקומי'}</span>
    </div>
  )
}
