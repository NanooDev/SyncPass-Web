import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ROLES_CLAIM, AUTH0_AUDIENCE } from '../../config/auth.ts'
import UsersPage from './UsersPage.tsx'

const mockGetToken = vi.fn()
const mockLoginRedirect = vi.fn()
let mockAuthToken: string | null = null

vi.mock('../../hooks/use-auth/useAuth.ts', () => ({
  useAuth: () => ({
    token: mockAuthToken,
  }),
}))

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    getAccessTokenSilently: mockGetToken,
    loginWithRedirect: mockLoginRedirect,
    user: { email: 'a@test.cl', [ROLES_CLAIM]: ['admin'] },
  }),
}))

const BFF_USERS = [
  { id: '1', nombre: 'Admin Uno', email: 'admin@sync-pass.test', role: 'admin', activo: true },
  { id: '2', nombre: 'Vol Uno', email: 'voluntario@sync-pass.test', role: 'volunteer', activo: true },
]

describe('UsersPage', () => {
  afterEach(() => {
    mockAuthToken = null
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('pide el token, muestra usuarios con Bearer y permite crear, pausar y eliminar cuentas', async () => {
    mockGetToken.mockResolvedValue('tok-auth0')
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => BFF_USERS })
    vi.stubGlobal('fetch', mockFetch)

    render(<UsersPage />)
    expect(await screen.findByText('admin@sync-pass.test')).toBeInTheDocument()
    expect(screen.getByText('voluntario@sync-pass.test')).toBeInTheDocument()
    expect(mockGetToken).toHaveBeenCalledWith({
      authorizationParams: { audience: AUTH0_AUDIENCE },
    })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/usuarios',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok-auth0' }),
      }),
    )

    // Crear nuevo usuario en modal
    fireEvent.click(screen.getByText('+ Agregar persona'))
    fireEvent.change(screen.getByPlaceholderText('Ej. Camila Rojas'), { target: { value: 'Camila Rojas' } })
    fireEvent.change(screen.getByPlaceholderText('camila.rojas@duocuc.cl'), { target: { value: 'camila@duocuc.cl' } })
    fireEvent.click(screen.getByText('Guardar'))
    expect(await screen.findByText(/Se agregó a "Camila Rojas"/i)).toBeInTheDocument()

    // Pausar y quitar usuario
    fireEvent.click(screen.getAllByText('Pausar')[0])
    expect(await screen.findByText(/pausada/i)).toBeInTheDocument()
    fireEvent.click(screen.getAllByText('Quitar')[0])
    expect(await screen.findByText(/eliminada/i)).toBeInTheDocument()
  })

  it('muestra error explícito si el servidor rechaza por permisos o falla la red (sin mockear usuarios)', async () => {
    mockAuthToken = 'tok-session'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network fail')))
    render(<UsersPage />)
    expect(await screen.findByText(/no se pudo cargar/i)).toBeInTheDocument()
    expect(screen.queryByText('admin.syncpass@duocuc.cl')).not.toBeInTheDocument()
  })

  it('redirige a login interactivo si falta el consentimiento', async () => {
    mockGetToken.mockRejectedValue(
      Object.assign(new Error('Consent required'), { error: 'consent_required' }),
    )
    mockLoginRedirect.mockResolvedValue(undefined)
    render(<UsersPage />)
    await vi.waitFor(() =>
      expect(mockLoginRedirect).toHaveBeenCalledWith({
        authorizationParams: { audience: AUTH0_AUDIENCE },
      }),
    )
  })
})
