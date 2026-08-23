import { NavLink } from 'react-router-dom'
import { BarChart3, LayoutDashboard, SquareKanban } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/board', label: 'Board', Icon: SquareKanban },
  { to: '/analytics', label: 'Analytics', Icon: BarChart3 },
] as const

export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
      >
        S
      </span>
      <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
        SprintDesk
      </span>
    </div>
  )
}

interface NavLinksProps {
  orientation?: 'vertical' | 'horizontal'
  onNavigate?: () => void
}

export function NavLinks({ orientation = 'vertical', onNavigate }: NavLinksProps) {
  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        orientation === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-1',
      )}
    >
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
              orientation === 'vertical' ? '' : 'px-3',
              isActive
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white',
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Desktop-only fixed sidebar. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-14 left-0 z-20 hidden w-60 flex-col gap-6 overflow-y-auto border-r border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-gray-900 lg:flex">
      <NavLinks />
    </aside>
  )
}
