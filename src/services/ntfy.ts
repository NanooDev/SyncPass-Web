/**
 * Servicio de notificaciones push via ntfy.sh (Server-Sent Events / SSE)
 * Integra el algoritmo de microtopicos por usuario usando hash SHA-256
 */

export const NTFY_BASE_URL = 'https://ntfy.sh'
export const TOPIC_PREFIX = 'app_vibe_'
export const TOPIC_HASH_LENGTH = 20

/**
 * Deriva el topico secreto de ntfy a partir del email del usuario.
 * Algoritmo identico al del cliente Android y la especificacion del profesor:
 * 1. Normaliza email: trim().toLowerCase()
 * 2. Hash SHA-256
 * 3. Prefijo 'app_vibe_' + primeros 20 caracteres hexadecimales
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
}

export interface PushNotificationResult {
  success: boolean
  topic: string
  error?: string
}

/**
 * Publica una notificacion push en ntfy.sh para que la reciba la aplicacion movil
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<PushNotificationResult> {
  try {
    const topic = payload.topic || (payload.email ? await deriveNtfyTopic(payload.email) : `${TOPIC_PREFIX}default`)
    const url = `${NTFY_BASE_URL}/${topic}`

    const headers: Record<string, string> = {
      'Title': payload.title,
      'Priority': payload.priority || 'high',
      'Content-Type': 'text/plain; charset=utf-8',
    }

    if (payload.tags && payload.tags.length > 0) {
      headers['Tags'] = payload.tags.join(',')
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload.message,
    })

    if (!response.ok) {
      throw new Error(`Error en servidor ntfy.sh (HTTP ${response.status})`)
    }

    return { success: true, topic }
  } catch (err) {
    return {
      success: false,
      topic: payload.topic || '',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
