import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ROLES_CLAIM } from '../../config/auth.ts'
import Layout from './Layout.tsx'

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    user: { email: 'a@test.cl', [ROLES_CLAIM]: ['admin'] },
    logout: vi.fn(),
  }),
}))

describe('Layout', () => {
  it('muestra marca, links por rol y email', () => {
    render(
      <Layout>
        <p>contenido</p>
      </Layout>,
    )
    expect(screen.getByText('Sync Pass')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('a@test.cl')).toBeInTheDocument()
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })
})
