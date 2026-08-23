import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement,
  )
}

/**
 * Traps Tab focus inside `active` containers (modals, drawers) and restores
 * focus to the previously focused element on close. Returns the ref to attach
 * to the container element.
 */
export function useFocusTrap(active: boolean): RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusables = () => getFocusableElements(container)
    const focusFirst = (): void => {
      const first = focusables()[0]
      if (first) {
        first.focus()
      } else if (container.hasAttribute('tabindex')) {
        container.focus()
      }
    }

    // Focus after paint so content is mounted.
    const frame = window.requestAnimationFrame(focusFirst)

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) return

      const firstElement = items[0]
      const lastElement = items[items.length - 1]
      const current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null

      if (event.shiftKey && (current === firstElement || !container.contains(current))) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && (current === lastElement || !container.contains(current))) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    container.addEventListener('keydown', handleKeydown)

    return () => {
      window.cancelAnimationFrame(frame)
      container.removeEventListener('keydown', handleKeydown)
      previouslyFocused?.focus()
    }
  }, [active])

  return containerRef
}

/** Invokes `handler` when Escape is pressed while `active` is true. */
export function useEscapeKey(active: boolean, handler: () => void): void {
  useEffect(() => {
    if (!active) return
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handler()
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [active, handler])
}

/** Locks body scrolling while any overlay is open. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [active])
}
