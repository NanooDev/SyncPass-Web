import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deriveNtfyTopic, sendPushNotification } from './ntfy.ts'

describe('Servicio de Notificaciones Push ntfy.sh', () => {
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
    it('publica exitosamente un mensaje HTTP POST hacia ntfy.sh', async () => {
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
})
