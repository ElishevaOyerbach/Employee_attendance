import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { paths } from '@/routes/paths'

const roleLabel: Record<string, string> = {
  Employee: 'עובד',
  Manager: 'מנהל',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate(paths.login, { replace: true })
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="usermenu"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="usermenu__avatar" aria-hidden="true">
          {initials(user.fullName)}
        </span>
        <span className="usermenu__meta">
          <span className="usermenu__name">{user.fullName}</span>
          <span className="usermenu__role">{roleLabel[user.role] ?? user.role}</span>
        </span>
        <ChevronDown size={16} color="var(--text-secondary)" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            insetInlineStart: 0,
            top: 'calc(100% + 8px)',
            minWidth: 200,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            padding: 'var(--space-1)',
            zIndex: 'var(--z-topbar)',
          }}
        >
          <button
            role="menuitem"
            onClick={handleLogout}
            className="btn btn--ghost btn--md"
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger-600)' }}
          >
            <LogOut size={16} aria-hidden="true" />
            התנתקות
          </button>
        </div>
      )}
    </div>
  )
}
