import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage.tsx'

const mockLoginLocal = vi.fn()
const mockLoginCognito = vi.fn()

vi.mock('../../hooks/use-auth/useAuth.ts', () => ({
  useAuth: () => ({
    loginWithCognito: mockLoginCognito,
    loginLocal: mockLoginLocal,
    switchRole: vi.fn(),
  }),
}))

describe('LoginPage (Autenticación obligatoria y Registro)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('valida campos vacíos, contraseña corta, permite login con credenciales y botón Cognito', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { accessToken: 'tok', idToken: 'id' } }),
      }),
    )

    render(<LoginPage />)
    expect(screen.getByText('Ingresar a SyncPass')).toBeInTheDocument()

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passInput = screen.getByLabelText(/contraseña/i)
    const submitBtn = screen.getAllByRole('button', { name: 'Iniciar sesión' })[1]

    fireEvent.change(emailInput, { target: { value: 'voluntario@duocuc.cl' } })
    fireEvent.change(passInput, { target: { value: '123' } })
    fireEvent.submit(emailInput.closest('form')!)
    expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument()

    fireEvent.change(passInput, { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(/perfil de trabajo/i), { target: { value: 'volunteer' } })
    fireEvent.click(submitBtn)

    await waitFor(() => expect(mockLoginLocal).toHaveBeenCalledWith('voluntario@duocuc.cl', 'volunteer'))

    fireEvent.click(screen.getByText('Continuar con Amazon Cognito'))
    expect(mockLoginCognito).toHaveBeenCalled()
  })

  it('permite cambiar a la pestaña Crear cuenta y registrar usuario', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Cuenta creada con éxito' }),
      }),
    )

    render(<LoginPage />)
    fireEvent.click(screen.getAllByText('Crear cuenta')[0])

    const nameInput = screen.getByLabelText(/nombre y apellido/i)
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passInput = screen.getByLabelText(/contraseña/i)

    fireEvent.change(nameInput, { target: { value: 'Mariano Acevedo' } })
    fireEvent.change(emailInput, { target: { value: 'mariano@duocuc.cl' } })
    fireEvent.change(passInput, { target: { value: '123456' } })
    fireEvent.submit(nameInput.closest('form')!)

    expect(await screen.findByText(/cuenta creada/i)).toBeInTheDocument()
  })
})
