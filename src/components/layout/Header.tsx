import { LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/hooks/useToast'
import { BrandMark } from '@/components/layout/Sidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Avatar } from '@/components/ui/Avatar'

/** Top application bar: branding, notifications, theme, user and logout. */
export function Header() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen)
  const toast = useToast()
  const navigate = useNavigate()

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.username : ''

  const handleLogout = () => {
    logout()
    toast.info('You have been signed out')
    navigate('/login', { replace: true })
  }

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          aria-controls="mobile-navigation"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="lg:hidden">
          <BrandMark />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <ThemeToggle />

        <div className="ml-1 hidden items-center gap-2 sm:flex" title={user?.email}>
          <Avatar name={displayName} src={user?.image} size="sm" />
          <span className="max-w-[10rem] truncate text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out of SprintDesk"
          className="flex items-center gap-2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span className="hidden text-sm font-medium md:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
