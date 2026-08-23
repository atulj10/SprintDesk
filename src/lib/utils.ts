/**
 * Joins conditional class names. Deliberately tiny (no clsx/tailwind-merge
 * dependency) because the app only needs conditional concatenation.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
