import { StatusBadge, type StatusVariant } from '../atoms/StatusBadge.tsx'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  badgeLabel?: string
  badgeVariant?: StatusVariant
}

/**
 * ATOMIC DESIGN — Molecule: MetricCard
 * Combina átomos de tipografía e indicador StatusBadge para mostrar un KPI operativo.
 */
export function MetricCard({
  title,
  value,
  subtitle,
  badgeLabel,
  badgeVariant = 'info',
}: MetricCardProps) {
  return (
    <article
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{title}</span>
        {badgeLabel && <StatusBadge label={badgeLabel} variant={badgeVariant} />}
      </div>
      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{subtitle}</div>
    </article>
  )
}
