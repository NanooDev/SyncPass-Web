import crypto from 'node:crypto'
import { applyCors, requireAuth } from './_lib/auth.js'

const NTFY_BASE_URL = 'https://ntfy.sh'
const TOPIC_PREFIX = 'app_vibe_'
const TOPIC_HASH_LENGTH = 20
const VALID_TOPIC_REGEX = /^app_vibe_[a-z0-9_]{4,40}$/
const VALID_PRIORITIES = new Set(['min', 'low', 'default', 'high', 'urgent'])

function deriveTopic(email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return `${TOPIC_PREFIX}default`
  const hex = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex')
  return `${TOPIC_PREFIX}${hex.substring(0, TOPIC_HASH_LENGTH)}`
}

function sanitizeHeaderValue(value, maxLen = 120) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, maxLen)
}

export default async function handler(req, res) {
  const corsHandled = applyCors(req, res, 'GET,POST,OPTIONS')
  if (corsHandled !== null) return

  const auth = await requireAuth(req, res, ['admin', 'coordinator'])
  if (!auth.ok) return

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const email = body.email || req.query?.email || ''
    const requestedTopic = body.topic ? String(body.topic).trim() : ''
    const topic = requestedTopic || deriveTopic(email)

    if (!VALID_TOPIC_REGEX.test(topic)) {
      res.status(400).json({
        exito: false,
        mensaje: 'Tópico de notificación inválido',
      })
      return
    }

    if (req.method === 'GET') {
      res.status(200).json({ exito: true, data: topic })
      return
    }

    if (req.method === 'POST') {
      const title = sanitizeHeaderValue(body.title || 'SyncPass Alerta', 100) || 'SyncPass Alerta'
      const message = String(body.message || '').trim().slice(0, 500)
      if (!message) {
        res.status(400).json({
          exito: false,
          mensaje: 'El mensaje de notificación es obligatorio',
        })
        return
      }
      const rawPriority = String(body.priority || 'high').toLowerCase()
      const priority = VALID_PRIORITIES.has(rawPriority) ? rawPriority : 'high'

      const ntfyRes = await fetch(`${NTFY_BASE_URL}/${encodeURIComponent(topic)}`, {
        method: 'POST',
        headers: {
          Title: title,
          Priority: priority,
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: message,
      })

      if (!ntfyRes.ok) {
        res.status(502).json({ exito: false, mensaje: 'No se pudo despachar la notificación desde el backend' })
        return
      }

      res.status(200).json({
        exito: true,
        mensaje: 'Notificación despachada por el servidor API',
        topic,
      })
      return
    }

    res.status(405).json({ exito: false, mensaje: 'Método no permitido' })
  } catch (err) {
    res.status(500).json({
      exito: false,
      mensaje: err instanceof Error ? err.message : 'Error interno del servidor',
    })
  }
}
