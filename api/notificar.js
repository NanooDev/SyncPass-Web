import crypto from 'node:crypto'

const NTFY_BASE_URL = 'https://ntfy.sh'
const TOPIC_PREFIX = 'app_vibe_'
const TOPIC_HASH_LENGTH = 20

function deriveTopic(email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return `${TOPIC_PREFIX}default`
  const hex = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex')
  return `${TOPIC_PREFIX}${hex.substring(0, TOPIC_HASH_LENGTH)}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const email = body.email || req.query?.email || ''
    const topic = body.topic || deriveTopic(email)

    if (req.method === 'GET') {
      res.status(200).json({ exito: true, data: topic })
      return
    }

    if (req.method === 'POST') {
      const title = body.title || 'SyncPass Alerta'
      const message = body.message || 'Notificación institucional SyncPass'
      const priority = String(body.priority || 'high')

      const ntfyRes = await fetch(`${NTFY_BASE_URL}/${topic}`, {
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
