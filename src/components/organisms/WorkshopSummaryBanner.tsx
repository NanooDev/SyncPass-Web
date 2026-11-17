import { StatusBadge } from '../atoms/StatusBadge.tsx'
import { MetricCard } from '../molecules/MetricCard.tsx'
import { calculateQuorumPercentage } from '../../utils/formatters.ts'

export interface WorkshopSummaryBannerProps {
  workshopName: string
  location: string
  attendees: number
  capacity: number
  isOffline?: boolean
  pendingCount?: number
}

/**
 * ATOMIC DESIGN — Organism: WorkshopSummaryBanner
 * Compone moléculas MetricCard y átomos StatusBadge para resumir el estado de una jornada comunitaria.
 */
export function WorkshopSummaryBanner({
  workshopName,
  location,
  attendees,
  capacity,
  isOffline = false,
  pendingCount = 0,
}: WorkshopSummaryBannerProps) {
  const quorum = calculateQuorumPercentage(attendees, capacity)

  return (
    <section
      aria-label="Resumen de jornada comunitaria"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{workshopName}</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{location}</p>
        </div>
        <StatusBadge
          label={isOffline ? `Modo sin señal (${pendingCount} pendientes)` : 'Sincronizado con Supabase'}
          variant={isOffline ? 'offline' : 'online'}
          pulse
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <MetricCard
          title="Asistentes en sala"
          value={`${attendees} / ${capacity}`}
          subtitle="Vecinos acreditados hoy"
          badgeLabel="QR + RUT"
          badgeVariant="info"
        />
        <MetricCard
          title="Nivel de quórum"
          value={`${quorum}%`}
          subtitle="Ocupación de la sede"
          badgeLabel={quorum >= 50 ? 'Meta alcanzada' : 'En recepción'}
          badgeVariant={quorum >= 50 ? 'online' : 'offline'}
        />
      </div>
    </section>
  )
}
