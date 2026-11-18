import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ROLES_CLAIM, AUTH0_AUDIENCE } from '../../config/auth.ts'
import UsersPage from './UsersPage.tsx'

const mockGetToken = vi.fn()
const mockLoginRedirect = vi.fn()
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
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('pide el token, muestra usuarios y permite crear, pausar y eliminar cuentas', async () => {
    mockGetToken.mockResolvedValue('tok')
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => BFF_USERS }),
    )
    render(<UsersPage />)
    expect(await screen.findByText('admin@sync-pass.test')).toBeInTheDocument()
    expect(screen.getByText('voluntario@sync-pass.test')).toBeInTheDocument()
    expect(mockGetToken).toHaveBeenCalledWith({
      authorizationParams: { audience: AUTH0_AUDIENCE },
    })

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

  it('muestra error si el BFF no responde', async () => {
    mockGetToken.mockResolvedValue('tok')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network fail')))
    render(<UsersPage />)
    expect(await screen.findByText(/no se pudo cargar/i)).toBeInTheDocument()
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
