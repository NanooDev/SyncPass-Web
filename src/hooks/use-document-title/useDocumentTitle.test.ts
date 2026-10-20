import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDocumentTitle } from './useDocumentTitle.ts'

describe('useDocumentTitle', () => {
  it('cambia el document.title y lo restaura al desmontar', () => {
    document.title = 'previo'
    const { unmount } = renderHook(() =>
      useDocumentTitle('Dashboard | Sync Pass'),
    )
    expect(document.title).toBe('Dashboard | Sync Pass')
    unmount()
    expect(document.title).toBe('previo')
  })

  it('actualiza el título cuando cambia el argumento', () => {
    const { rerender } = renderHook(
      ({ t }: { t: string }) => useDocumentTitle(t),
      { initialProps: { t: 'Uno' } },
    )
    expect(document.title).toBe('Uno')
    rerender({ t: 'Dos' })
    expect(document.title).toBe('Dos')
  })
})
