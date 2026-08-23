import { useUiStore } from '@/stores/ui.store'
import { BrandMark, NavLinks } from '@/components/layout/Sidebar'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Slide-in navigation drawer for small screens (375px+).
 * Closes when a link is chosen or the overlay/backdrop is activated.
 */
export function MobileNavigation() {
  const isOpen = useUiStore((state) => state.isMobileNavOpen)
  const setOpen = useUiStore((state) => state.setMobileNavOpen)
  const user = useAuthStore((state) => state.user)

  if (!isOpen) return null

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.username : ''

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
      <div
        className="animate-fade-in absolute inset-0 bg-gray-950/60"
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <div
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className="animate-fade-in absolute inset-y-0 left-0 flex w-64 flex-col gap-6 overflow-y-auto bg-white px-4 py-5 shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <BrandMark />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />

        <div className="mt-auto flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Avatar name={displayName} src={user?.image} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {displayName}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
