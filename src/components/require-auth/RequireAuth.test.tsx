import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROLES_CLAIM } from '../../config/auth.ts'
import RequireAuth from './RequireAuth.tsx'

const mockUseAuth0 = vi.fn()
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => mockUseAuth0() }))

function authState(state: Record<string, unknown>) {
  mockUseAuth0.mockReturnValue({
    isLoading: false,
    isAuthenticated: false,
    loginWithRedirect: vi.fn(),
    user: undefined,
    ...state,
  })
}

describe('RequireAuth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra cargando mientras Auth0 responde', () => {
    authState({ isLoading: true })
    render(
      <RequireAuth>
        <p>secreto</p>
      </RequireAuth>,
    )
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('pide login si no hay sesión', () => {
    authState({})
    render(
      <RequireAuth>
        <p>secreto</p>
      </RequireAuth>,
    )
    expect(screen.getByText(/debes iniciar sesión/i)).toBeInTheDocument()
    expect(screen.queryByText('secreto')).not.toBeInTheDocument()
  })

  it('niega el acceso si falta el rol', () => {
    authState({
      isAuthenticated: true,
      user: { email: 'v@test.cl', [ROLES_CLAIM]: ['volunteer'] },
    })
    render(
      <RequireAuth roles={['admin']}>
        <p>secreto</p>
      </RequireAuth>,
    )
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument()
    expect(screen.queryByText('secreto')).not.toBeInTheDocument()
  })

  it('muestra el contenido si tiene el rol', () => {
    authState({
      isAuthenticated: true,
      user: { email: 'a@test.cl', [ROLES_CLAIM]: ['admin'] },
    })
    render(
      <RequireAuth roles={['admin']}>
        <p>secreto</p>
      </RequireAuth>,
    )
    expect(screen.getByText('secreto')).toBeInTheDocument()
  })
})
