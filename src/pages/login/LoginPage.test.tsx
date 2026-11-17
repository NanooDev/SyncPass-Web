import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage.tsx'

vi.mock('../../hooks/use-auth/useAuth.ts', () => ({
  useAuth: () => ({
    loginWithCognito: vi.fn(),
    loginLocal: vi.fn(),
    switchRole: vi.fn(),
  }),
}))

describe('LoginPage (Autenticación obligatoria y Registro)', () => {
  it('renderiza pestañas Iniciar sesión y Crear cuenta sin atajos de 1 toque', () => {
    render(<LoginPage />)
    expect(screen.getByText('Ingresar a SyncPass')).toBeInTheDocument()
    expect(screen.getByText('Continuar con Amazon Cognito')).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('permite cambiar a la pestaña Crear cuenta y validar campos', () => {
    render(<LoginPage />)
    const tabCrear = screen.getAllByText('Crear cuenta')[0]
    fireEvent.click(tabCrear)
    expect(screen.getAllByLabelText(/nombre y apellido/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/crear cuenta e ingresar/i)[0]).toBeInTheDocument()
  })
})
