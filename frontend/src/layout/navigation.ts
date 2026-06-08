import { Clock, History, LayoutDashboard, ClipboardCheck, BarChart2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/auth/types'
import { paths } from '@/routes/paths'

export interface NavItem {
  to: string
  label: string // Hebrew label
  icon: LucideIcon
  /** `end` for exact matching (used for the index "/" route). */
  end?: boolean
}

export interface NavGroup {
  id: string
  label: string // Hebrew section label
  /** Roles allowed to see this group; undefined = everyone authenticated. */
  roles?: Role[]
  items: NavItem[]
}

/** Source of truth for the sidebar. Groups render in order. */
export const navGroups: NavGroup[] = [
  {
    id: 'personal',
    label: 'אישי',
    items: [
      { to: paths.myDay, label: 'היום שלי', icon: Clock, end: true },
      { to: paths.attendance, label: 'היסטוריית נוכחות', icon: History },
      { to: paths.reports, label: 'דוחות', icon: BarChart2 },
    ],
  },
  {
    id: 'management',
    label: 'ניהול',
    roles: ['Manager'],
    items: [
      { to: paths.team, label: 'לוח צוות', icon: LayoutDashboard },
      { to: paths.reviews, label: 'משמרות לאישור', icon: ClipboardCheck },
    ],
  },
]

/** Returns only the groups visible to the given role. */
export function visibleNavGroups(role: Role): NavGroup[] {
  return navGroups.filter((g) => !g.roles || g.roles.includes(role))
}
