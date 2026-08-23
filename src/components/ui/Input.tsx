import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hideLabel?: boolean
  error?: string
  hint?: ReactNode
}

export function Input({
  label,
  hideLabel = false,
  error,
  hint,
  className,
  id,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? `input-${generatedId}`
  const messageId = `${inputId}-message`

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300',
            hideLabel && 'sr-only',
          )}
        >
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={cn(
          'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
          error
            ? 'border-red-400 focus-visible:outline-red-500'
            : 'border-gray-300 dark:border-gray-600',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [error ? messageId : null, hint && !error ? messageId : null]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...rest}
      />

      {(error || hint) && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={cn(
            'mt-1.5 text-xs',
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400',
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
