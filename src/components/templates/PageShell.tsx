import type { ReactNode } from 'react'

export interface PageShellProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

/**
 * ATOMIC DESIGN — Template: PageShell
 * Plantilla estructural de página que organiza cabecera, acciones y contenido principal.
 */
export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.25rem 1rem 3rem 1rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>{actions}</div>}
      </header>
      <div>{children}</div>
    </div>
  )
}
