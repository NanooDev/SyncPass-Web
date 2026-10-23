import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deriveNtfyTopic, sendPushNotification, getTopicFromBff } from './ntfy.ts'

describe('Servicio de Notificaciones Push ntfy.sh y BFF', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('deriveNtfyTopic', () => {
    it('genera el topico exacto especificado por la arquitectura del profesor', async () => {
      const topic = await deriveNtfyTopic('docente.dev@gmail.com')
      expect(topic).toBe('app_vibe_8e63635b0c5401804b4b')
    })

    it('normaliza mayusculas y espacios en blanco del correo', async () => {
      const topic = await deriveNtfyTopic('  DOCENTE.DEV@GMAIL.COM  ')
      expect(topic).toBe('app_vibe_8e63635b0c5401804b4b')
    })

    it('retorna topico por defecto cuando el email esta vacio', async () => {
      const topic = await deriveNtfyTopic('')
      expect(topic).toBe('app_vibe_default')
    })
  })

  describe('sendPushNotification', () => {
    it('publica exitosamente un mensaje HTTP POST hacia ntfy.sh directo', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await sendPushNotification({
        email: 'docente.dev@gmail.com',
        title: 'Prueba SyncPass',
        message: 'Contenido de la notificacion',
        priority: 'high',
      })

      expect(result.success).toBe(true)
      expect(result.topic).toBe('app_vibe_8e63635b0c5401804b4b')
      expect(result.source).toBe('ntfy_direct')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://ntfy.sh/app_vibe_8e63635b0c5401804b4b',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Title: 'Prueba SyncPass',
            Priority: 'high',
          }),
          body: 'Contenido de la notificacion',
        })
      )
    })

    it('emite notificacion a traves del endpoint BFF de Spring Boot (/api/notificar)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Notificación enviada exitosamente' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await sendPushNotification({
        email: 'docente.dev@gmail.com',
        title: 'Prueba BFF',
        message: 'Mensaje hacia el BFF',
        priority: 'urgent',
        useBff: true,
      })

      expect(result.success).toBe(true)
      expect(result.source).toBe('bff')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notificar'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'docente.dev@gmail.com',
            message: 'Mensaje hacia el BFF',
            title: 'Prueba BFF',
            priority: 5,
          }),
        })
      )
    })

    it('captura errores de red y retorna resultado con error explicativo', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Fallo de red simulado'))
      vi.stubGlobal('fetch', mockFetch)

      const result = await sendPushNotification({
        email: 'docente.dev@gmail.com',
        title: 'Error Test',
        message: 'Mensaje fallido',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Fallo de red simulado')
    })
  })

  describe('getTopicFromBff', () => {
    it('obtiene el topico desde el endpoint BFF GET /api/notificar/topic/{email}', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: 'app_vibe_8e63635b0c5401804b4b' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const topic = await getTopicFromBff('docente.dev@gmail.com')
      expect(topic).toBe('app_vibe_8e63635b0c5401804b4b')
    })
  })
})
