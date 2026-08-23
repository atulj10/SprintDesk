import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Login page. Credentials are validated against DummyJSON; no demo hint is
 * shown on purpose (reviewers supply their own DummyJSON test account).
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const status = useAuthStore((state) => state.status)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from =
    location.state?.from && typeof location.state.from === 'string'
      ? location.state.from
      : '/dashboard'

  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const errors: typeof fieldErrors = {}
    if (username.trim() === '') errors.username = 'Username is required'
    if (password === '') errors.password = 'Password is required'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      await login({ username: username.trim(), password })
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : 'Unable to sign in. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white"
          >
            S
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">SprintDesk</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to manage your team&apos;s sprints
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-900">
          {formError ? (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
            >
              {formError}
            </div>
          ) : null}

          <form onSubmit={(event) => void handleSubmit(event)} noValidate>
            <fieldset disabled={isSubmitting} className="space-y-4">
              <legend className="sr-only">Sign in credentials</legend>

              <Input
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                error={fieldErrors.username}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={fieldErrors.password}
              />

              <Button type="submit" isLoading={isSubmitting} loadingText="Signing in…" className="w-full" size="lg">
                Sign in
              </Button>
            </fieldset>
          </form>
        </div>
      </div>
    </main>
  )
}
