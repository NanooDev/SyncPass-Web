import { useEffect } from 'react'

/** Sincroniza `document.title` y restaura el anterior al desmontar. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const prev = document.title
    document.title = title
    return () => {
      document.title = prev
    }
  }, [title])
}
