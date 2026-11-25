import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiHealthCheck, apiLogin, apiRegister, apiSyncAsistencias } from './api.ts'

describe('Cliente API Gateway / Serverless SyncPass', () => {
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
    it('autentica cuando el backend devuelve tokens reales y rechaza errores sin fabricar sesión', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { accessToken: 'token-jwt-123', idToken: 'id-token-123' },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ success: false, mensaje: 'Credenciales inválidas' }),
        })
      vi.stubGlobal('fetch', mockFetch)

      const okRes = await apiLogin('usuario@duocuc.cl', 'Password123.')
      expect(okRes.success).toBe(true)
      expect(okRes.data?.accessToken).toBe('token-jwt-123')

      const badRes = await apiLogin('usuario@duocuc.cl', 'wrongpass')
      expect(badRes.success).toBe(false)
      expect(badRes.data).toBeUndefined()
    })
  })

  describe('apiRegister', () => {
    it('envia payload de registro y propaga errores cuando falla', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            message: 'Usuario registrado exitosamente',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ success: false, mensaje: 'Correo ya existe' }),
        })
      vi.stubGlobal('fetch', mockFetch)

      const result = await apiRegister({
        email: 'nuevo.usuario@duocuc.cl',
        password: 'Password123.',
        nombre: 'Nuevo Usuario',
        roles: ['coordinator'],
      })
      expect(result.success).toBe(true)

      const failResult = await apiRegister({
        email: 'nuevo.usuario@duocuc.cl',
        password: 'Password123.',
        nombre: 'Nuevo Usuario',
      })
      expect(failResult.success).toBe(false)
      expect(failResult.message).toBe('Correo ya existe')
    })
  })

  describe('apiSyncAsistencias', () => {
    it('envía registros reales con Bearer token y rechaza lotes vacíos', async () => {
      await expect(apiSyncAsistencias([], 'jwt-tok')).rejects.toThrow(/no hay registros/i)

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ exito: true, mensaje: 'ok', sincronizados: 1 }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const res = await apiSyncAsistencias(
        [
          {
            id: 'att-1',
            tallerId: 'T-101',
            rut: '12.345.678-9',
            nombreBeneficiario: 'Ana',
            metodo: 'QR',
            latitud: -33.5,
            longitud: -70.6,
            distanciaMetros: 20,
            estadoValidacion: 'valido',
          },
        ],
        'jwt-tok',
      )
      expect(res.sincronizados).toBe(1)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/asistencias/sync',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-tok' }),
        }),
      )
    })
  })
})
