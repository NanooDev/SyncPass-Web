import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ROLES_CLAIM } from '../../config/auth.ts'
import Layout from './Layout.tsx'

const mockLogout = vi.fn()

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    user: { email: 'a@test.cl', [ROLES_CLAIM]: ['admin'] },
    logout: mockLogout,
  }),
}))

describe('Layout', () => {
  it('muestra marca, links por rol, alterna tema claro/oscuro y cierra sesion', () => {
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

    const themeBtn = screen.getByLabelText('Alternar tema claro y oscuro')
    fireEvent.click(themeBtn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    fireEvent.click(themeBtn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    const logoutBtn = screen.getByText('Cerrar Sesión')
    fireEvent.click(logoutBtn)
    expect(mockLogout).toHaveBeenCalled()
  })
})
