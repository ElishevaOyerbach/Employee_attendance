import { NavLink } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { visibleNavGroups } from './navigation'

export function SideNav() {
  const { user } = useAuth()
  if (!user) return null

  const groups = visibleNavGroups(user.role)

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">
          <CalendarClock size={18} aria-hidden="true" />
        </span>
        <span>נוכחות</span>
      </div>

      <nav aria-label="ניווט ראשי">
        {groups.map((group) => (
          <div key={group.id} className="nav-group">
            <div className="nav-group__label">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-item${isActive ? ' is-active' : ''}`
                  }
                >
                  <Icon className="nav-item__icon" aria-hidden="true" />
                  <span className="nav-item__label">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
