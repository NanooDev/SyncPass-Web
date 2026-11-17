/**
 * Servicio de notificaciones push via ntfy.sh (Server-Sent Events / SSE)
 * Integra el algoritmo de microtopicos por usuario usando hash SHA-256
 * y soporte para el endpoint BFF (/api/notificar) de Spring Boot.
 */
import { BFF_URL } from '../config/auth.ts'

export const NTFY_BASE_URL = 'https://ntfy.sh'
export const TOPIC_PREFIX = 'app_vibe_'
export const TOPIC_HASH_LENGTH = 20

/**
 * Deriva el topico secreto de ntfy a partir del email del usuario.
 */
export async function deriveNtfyTopic(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return `${TOPIC_PREFIX}default`

  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(normalized)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      return `${TOPIC_PREFIX}${hex.substring(0, TOPIC_HASH_LENGTH)}`
    }
  } catch {
    // Si falla Web Crypto, se utiliza topic por defecto
  }

  return `${TOPIC_PREFIX}default`
}

export interface PushNotificationPayload {
  email?: string
  topic?: string
  title: string
  message: string
  priority?: 'min' | 'low' | 'default' | 'high' | 'urgent'
  tags?: string[]
  useBff?: boolean
}

export interface PushNotificationResult {
  success: boolean
  topic: string
  source?: 'bff' | 'ntfy_direct'
  error?: string
}

function mapPriorityToNumber(priority?: string): number {
  switch (priority) {
    case 'min': return 1
    case 'low': return 2
    case 'default': return 3
    case 'high': return 4
    case 'urgent': return 5
    default: return 4
  }
}

/**
 * Publica una notificacion push mediante el BFF de Spring Boot (/api/notificar)
 * o directamente en ntfy.sh como mecanismo de fallback y desarrollo local.
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<PushNotificationResult> {
  const email = payload.email || ''
  const topic = payload.topic || (email ? await deriveNtfyTopic(email) : `${TOPIC_PREFIX}default`)

  if (payload.useBff && email) {
    try {
      const bffResponse = await fetch(`${BFF_URL}/api/notificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          message: payload.message,
          title: payload.title,
          tags: payload.tags?.join(','),
          priority: mapPriorityToNumber(payload.priority),
        }),
      })

      if (bffResponse.ok) {
        return { success: true, topic, source: 'bff' }
      }
    } catch {
      // Fallback a ruta serverless local /api/notificar si BFF externo no responde
      try {
        const apiRes = await fetch('/api/notificar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            topic,
            message: payload.message,
            title: payload.title,
            priority: payload.priority || 'high',
          }),
        })
        if (apiRes.ok) {
          return { success: true, topic, source: 'bff' }
        }
      } catch {
        // continuar al envio directo ntfy.sh
      }
    }
  }

  try {
    const headers: Record<string, string> = {
      Title: payload.title,
      Priority: payload.priority || 'default',
    }
    if (payload.tags && payload.tags.length > 0) {
      headers.Tags = payload.tags.join(',')
    }

    const res = await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: 'POST',
      headers,
      body: payload.message,
    })

    if (res.ok) {
      return { success: true, topic, source: 'ntfy_direct' }
    }
    return {
      success: false,
      topic,
      error: `Error HTTP ${res.status}`,
    }
  } catch (err) {
    return {
      success: false,
      topic,
      error: err instanceof Error ? err.message : 'Servicio de notificaciones no disponible',
    }
  }
}

/**
 * Consulta el topico generado por el BFF de Spring Boot
 */
export async function getTopicFromBff(email: string): Promise<string> {
  try {
    const res = await fetch(`${BFF_URL}/api/notificar/topic/${encodeURIComponent(email)}`)
    if (res.ok) {
      const json = await res.json()
      if (json.data) return json.data
    }
  } catch {
    // Si falla BFF, calcular localmente
  }
  return deriveNtfyTopic(email)
}
