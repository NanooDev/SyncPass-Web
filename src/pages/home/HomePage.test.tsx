import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage.tsx'

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    loginWithRedirect: vi.fn(),
  }),
}))

vi.mock('../../hooks/use-auth/useAuth.ts', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    loginWithCognito: vi.fn(),
    switchRole: vi.fn(),
  }),
}))

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('HomePage (Portada Vinculación con el Medio)', () => {
  it('muestra propuesta de valor comunitaria, métricas de sede y tarjeta QR', () => {
    render(<HomePage />)
    expect(screen.getByText(/sin planillas de papel ni filas/i)).toBeInTheDocument()
    expect(screen.getByText(/3 sedes/i)).toBeInTheDocument()
    expect(screen.getByText(/Funciona aunque no haya señal en la sede/i)).toBeInTheDocument()
  })
})
