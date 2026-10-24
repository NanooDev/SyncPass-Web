import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiHealthCheck, apiLogin, apiRegister } from './api.ts'

describe('Cliente API Gateway HTTP (BFF)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('apiHealthCheck', () => {
    it('consume exitosamente el endpoint publico /api/health', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ service: 'cursos-api', status: 'UP' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await apiHealthCheck()
      expect(result.status).toBe('UP')
      expect(result.service).toBe('cursos-api')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/health'))
    })

    it('captura errores si el backend no responde', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(apiHealthCheck()).rejects.toThrow('Health check fallo con status 503')
    })
  })

  describe('apiLogin', () => {
    it('envia credenciales al endpoint /api/auth/login a traves del API Gateway', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { accessToken: 'token-jwt-123', idToken: 'id-token-123' },
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await apiLogin('usuario@duocuc.cl', 'Password123.')
      expect(result.data?.accessToken).toBe('token-jwt-123')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'usuario@duocuc.cl', password: 'Password123.' }),
        })
      )
    })
  })

  describe('apiRegister', () => {
    it('envia payload de registro de usuario al endpoint /api/auth/registro', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Usuario registrado exitosamente',
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await apiRegister({
        email: 'nuevo.usuario@duocuc.cl',
        password: 'Password123.',
        nombre: 'Nuevo Usuario',
        roles: ['coordinator'],
      })

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/registro'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'nuevo.usuario@duocuc.cl',
            password: 'Password123.',
            nombre: 'Nuevo Usuario',
            roles: ['coordinator'],
          }),
        })
      )
    })
  })
})
