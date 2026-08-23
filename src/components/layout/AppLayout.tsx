import { Suspense, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { ToastViewport } from '@/components/ui/Toast'
import { FullScreenLoader } from '@/components/layout/FullScreenLoader'
import { useThemeStore } from '@/stores/theme.store'

/**
 * Authenticated application shell: fixed header, desktop sidebar,
 * mobile navigation drawer and the routed page content.
 */
export function AppLayout() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      <Header />
      <Sidebar />
      <MobileNavigation />

      <div className="pt-14 lg:pl-60">
        <main
          id="main-content"
          className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <Suspense fallback={<FullScreenLoader label="Loading page…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ToastViewport />
    </div>
  )
}
