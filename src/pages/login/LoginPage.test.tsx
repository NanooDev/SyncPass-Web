import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage.tsx'

const mockLoginWithToken = vi.fn().mockReturnValue(true)
const mockLoginCognito = vi.fn()
const mockClearAuthError = vi.fn()

vi.mock('../../hooks/use-auth/useAuth.ts', () => ({
  useAuth: () => ({
    loginWithCognito: mockLoginCognito,
    loginWithToken: mockLoginWithToken,
    clearAuthError: mockClearAuthError,
    authError: null,
  }),
}))

describe('LoginPage (Autenticación real obligatoria y Registro)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    mockLoginWithToken.mockClear().mockReturnValue(true)
    mockLoginCognito.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('valida campos, rechaza credenciales inválidas y solo autentica cuando el backend emite JWT', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, mensaje: 'Correo o contraseña incorrectos.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            accessToken: 'header.payload.sig',
            idToken: 'header.payload.sig',
            user: { id: 'u1', email: 'voluntario@duocuc.cl', roles: ['volunteer'] },
          },
        }),
      })
    vi.stubGlobal('fetch', mockFetch)

    render(<LoginPage />)
    expect(screen.getByText('Ingresar a SyncPass')).toBeInTheDocument()

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passInput = screen.getByLabelText(/contraseña/i)
    const submitBtn = screen.getAllByRole('button', { name: 'Iniciar sesión' })[1]

    // Contraseña muy corta no envía petición ni inicia sesión
    fireEvent.change(emailInput, { target: { value: 'voluntario@duocuc.cl' } })
    fireEvent.change(passInput, { target: { value: '123' } })
    fireEvent.submit(emailInput.closest('form')!)
    expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument()

    // Intento con backend rechazado -> NO inicia sesión local ficticia
    fireEvent.change(passInput, { target: { value: 'wrongpass' } })
    fireEvent.click(submitBtn)
    expect(await screen.findByText(/correo o contraseña incorrectos/i)).toBeInTheDocument()
    expect(mockLoginWithToken).not.toHaveBeenCalled()

    // Intento válido -> backend devuelve JWT y llama loginWithToken
    fireEvent.change(passInput, { target: { value: '123456' } })
    fireEvent.click(submitBtn)
    await waitFor(() =>
      expect(mockLoginWithToken).toHaveBeenCalledWith(
        'header.payload.sig',
        expect.objectContaining({ email: 'voluntario@duocuc.cl', roles: ['volunteer'] }),
        'bff',
      ),
    )

    fireEvent.click(screen.getByText('Continuar con Amazon Cognito'))
    expect(mockLoginCognito).toHaveBeenCalled()
  })

  it('permite cambiar a la pestaña Crear cuenta y registrar usuario sin auto-otorgarse admin', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ success: true, message: 'Cuenta creada con éxito' }),
      }),
    )

    render(<LoginPage />)
    fireEvent.click(screen.getAllByText('Crear cuenta')[0])

    const nameInput = screen.getByLabelText(/nombre y apellido/i)
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passInput = screen.getByLabelText(/contraseña/i)
    const roleSelect = screen.getByLabelText(/perfil solicitado/i)

    expect(screen.queryByRole('option', { name: 'Administrador' })).not.toBeInTheDocument()
    fireEvent.change(nameInput, { target: { value: 'Mariano Acevedo' } })
    fireEvent.change(emailInput, { target: { value: 'mariano@duocuc.cl' } })
    fireEvent.change(passInput, { target: { value: '123456' } })
    fireEvent.change(roleSelect, { target: { value: 'coordinator' } })
    fireEvent.submit(nameInput.closest('form')!)

    expect(await screen.findByText(/cuenta creada con éxito/i)).toBeInTheDocument()
  })
})
