import { useId, type SelectHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hideLabel?: boolean
  error?: string
  /** Optional placeholder row rendered with value "". */
  placeholder?: string
  children: ReactNode
}

export function Select({
  label,
  hideLabel = false,
  error,
  placeholder,
  className,
  id,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? `select-${generatedId}`
  const messageId = `${selectId}-message`

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={selectId}
          className={cn(
            'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300',
            hideLabel && 'sr-only',
          )}
        >
          {label}
        </label>
      ) : null}

      <select
        id={selectId}
        className={cn(
          'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'dark:bg-gray-800 dark:text-gray-100',
          error
            ? 'border-red-400 focus-visible:outline-red-500'
            : 'border-gray-300 dark:border-gray-600',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? messageId : undefined}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {children}
      </select>

      {error && (
        <p
          id={messageId}
          role="alert"
          className="mt-1.5 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  )
}
