/**
 * Servicio de notificaciones push via ntfy.sh (Server-Sent Events / SSE)
 * Integra el algoritmo de microtópicos por usuario usando hash SHA-256
 * y soporte autenticado para /api/notificar (BFF Spring Boot o Vercel API).
 */
import { BFF_URL } from '../config/auth.ts'

export const NTFY_BASE_URL = 'https://ntfy.sh'
export const TOPIC_PREFIX = 'app_vibe_'
export const TOPIC_HASH_LENGTH = 20

/**
 * Deriva el tópico de ntfy a partir del email del usuario.
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
  token?: string | null
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
 * Publica una notificación push mediante el BFF de Spring Boot (/api/notificar)
 * o la ruta serverless autenticada (/api/notificar).
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<PushNotificationResult> {
  const email = payload.email || ''
  const topic = payload.topic || (email ? await deriveNtfyTopic(email) : `${TOPIC_PREFIX}default`)
  const authHeader: Record<string, string> = payload.token
    ? { Authorization: `Bearer ${payload.token}` }
    : {}

  if (payload.useBff && email) {
    try {
      const bffResponse = await fetch(`${BFF_URL}/api/notificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
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
      if (bffResponse.status === 401 || bffResponse.status === 403) {
        return {
          success: false,
          topic,
          error: `Acceso denegado en /api/notificar (HTTP ${bffResponse.status})`,
        }
      }
    } catch {
      // Continuar hacia la función serverless autenticada /api/notificar si BFF externo no responde
    }

    try {
      const apiRes = await fetch('/api/notificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
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
      return {
        success: false,
        topic,
        error: `Error HTTP ${apiRes.status} al emitir notificación`,
      }
    } catch (err) {
      return {
        success: false,
        topic,
        error: err instanceof Error ? err.message : 'Servicio de notificaciones no disponible',
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
 * Consulta el tópico generado por el BFF autenticado.
 */
export async function getTopicFromBff(email: string, token?: string | null): Promise<string> {
  try {
    const res = await fetch(`${BFF_URL}/api/notificar/topic/${encodeURIComponent(email)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (res.ok) {
      const json = await res.json()
      if (json.data) return json.data
    }
  } catch {
    // Si falla BFF, calcular localmente
  }
  return deriveNtfyTopic(email)
}
