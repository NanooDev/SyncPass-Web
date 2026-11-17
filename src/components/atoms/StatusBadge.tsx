import type { ReactNode } from 'react'

export type StatusVariant = 'online' | 'offline' | 'info'

export interface StatusBadgeProps {
  label: string
  variant?: StatusVariant
  pulse?: boolean
  icon?: ReactNode
}

/**
 * ATOMIC DESIGN — Atom: StatusBadge
 * Etiqueta de estado reutilizable con indicador luminoso opcional.
 */
export function StatusBadge({ label, variant = 'online', pulse = false, icon }: StatusBadgeProps) {
  const palette: Record<StatusVariant, { bg: string; border: string; color: string; dot: string }> = {
    online: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.32)',
      color: 'var(--brand-emerald, #059669)',
      dot: '#10b981',
    },
    offline: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.32)',
      color: 'var(--brand-amber, #d97706)',
      dot: '#f59e0b',
    },
    info: {
      bg: 'rgba(37, 99, 235, 0.12)',
      border: 'rgba(37, 99, 235, 0.28)',
      color: 'var(--brand-indigo, #2563eb)',
      dot: '#3b82f6',
    },
  }

  const current = palette[variant]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.3rem 0.75rem',
        borderRadius: '9999px',
        background: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
        fontSize: '0.78rem',
        fontWeight: 700,
      }}
    >
      {pulse && (
        <span
          aria-hidden="true"
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: current.dot,
          }}
        />
      )}
      {icon}
      <span>{label}</span>
    </span>
  )
}
