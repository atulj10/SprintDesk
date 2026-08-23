import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '@/hooks/useToast'
import { useUiStore } from '@/stores/ui.store'
import type { ToastItem } from '@/stores/ui.store'

function currentToasts(): ToastItem[] {
  return useUiStore.getState().toasts
}

beforeEach(() => {
  useUiStore.setState({ toasts: [] })
})

describe('useToast', () => {
  it('adds a toast of each type', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Task created')
      result.current.error('Something failed')
      result.current.warning('Careful')
      result.current.info('FYI')
    })

    const toasts = currentToasts()
    expect(toasts.map((toast) => toast.type)).toEqual(['success', 'error', 'warning', 'info'])
    expect(toasts[0].message).toBe('Task created')
  })

  it('dismisses a specific toast by id (manual removal)', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.info('first')
      result.current.info('second')
    })

    const [firstId] = currentToasts().map((toast) => toast.id)

    act(() => {
      result.current.dismiss(firstId)
    })

    const remaining = currentToasts()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].message).toBe('second')
  })

  it('auto-dismisses a toast after the configured timeout', () => {
    vi.useFakeTimers()
    try {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.info('temporary')
      })
      expect(currentToasts()).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(currentToasts()).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
