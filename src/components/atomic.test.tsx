import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './atoms/StatusBadge.tsx'
import { MetricCard } from './molecules/MetricCard.tsx'
import { WorkshopSummaryBanner } from './organisms/WorkshopSummaryBanner.tsx'
import { PageShell } from './templates/PageShell.tsx'

describe('Atomic Design Hierarchy (Atoms, Molecules, Organisms, Templates)', () => {
  it('renderiza Atom StatusBadge en variantes online y offline', () => {
    render(
      <div>
        <StatusBadge label="Conectado" variant="online" pulse />
        <StatusBadge label="Sin señal" variant="offline" />
      </div>,
    )
    expect(screen.getByText('Conectado')).toBeInTheDocument()
    expect(screen.getByText('Sin señal')).toBeInTheDocument()
  })

  it('renderiza Molecule MetricCard con titulo, valor y badge', () => {
    render(<MetricCard title="Vecinos" value={35} subtitle="En sala" badgeLabel="Activo" />)
    expect(screen.getByText('Vecinos')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('renderiza Organism WorkshopSummaryBanner calculando quorum', () => {
    render(
      <WorkshopSummaryBanner
        workshopName="Alfabetización Digital"
        location="Sede Maipú"
        attendees={24}
        capacity={40}
        isOffline={false}
      />,
    )
    expect(screen.getByText('Alfabetización Digital')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('Sincronizado con Supabase')).toBeInTheDocument()
  })

  it('renderiza Template PageShell con cabecera y contenido hijo', () => {
    render(
      <PageShell title="Panel de Sede" subtitle="Gestión diaria" actions={<button>Acción</button>}>
        <p>Contenido principal</p>
      </PageShell>,
    )
    expect(screen.getByText('Panel de Sede')).toBeInTheDocument()
    expect(screen.getByText('Contenido principal')).toBeInTheDocument()
  })
})
