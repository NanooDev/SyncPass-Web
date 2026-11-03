import fs from 'node:fs'
import path from 'node:path'

const TMP_FILE = path.join(process.env.TEMP || '/tmp', 'syncpass_talleres_db_v3.json')
const CLOUD_STORE_URL = 'https://ntfy.sh/syncpass_cloud_db_talleres_v3'

const INITIAL_TALLERES = [
  {
    id: 'T-101',
    name: 'Alfabetización Digital para Adultos Mayores',
    location: 'Junta de Vecinos N°14 Villa El Roble',
    date: 'Hoy, 15:00 hrs',
    attendeesCount: 28,
    capacity: 40,
    status: 'En curso',
    coordinatorName: 'Prof. Mariano Acevedo',
    qrCode: 'SYNCPASS-EVENT-T101-ELROBLE',
  },
  {
    id: 'T-102',
    name: 'Taller de Huertos Comunitarios Sostenibles',
    location: 'Sede Vecinal Los Pinos',
    date: 'Mañana, 10:30 hrs',
    attendeesCount: 15,
    capacity: 25,
    status: 'Activo',
    coordinatorName: 'Prof. Mariano Acevedo',
    qrCode: 'SYNCPASS-EVENT-T102-LOSPINOS',
  },
  {
    id: 'T-103',
    name: 'Primeros Auxilios y Prevención Barrial',
    location: 'Colegio Polivalente San Bernardo',
    date: '24 Oct, 16:00 hrs',
    attendeesCount: 35,
    capacity: 35,
    status: 'Finalizado',
    coordinatorName: 'Prof. Álvaro León',
    qrCode: 'SYNCPASS-EVENT-T103-SANBERNARDO',
  },
]

function readLocalCache() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return null
}

function writeLocalCache(items) {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(items, null, 2), 'utf8')
  } catch {
    // ignore
  }
}

async function loadTalleresFromCloud() {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3500)
    const res = await fetch(`${CLOUD_STORE_URL}/json?poll=1&since=48h`, {
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (res.ok) {
      const text = await res.text()
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const event = JSON.parse(lines[i])
          if (event.event === 'message' && event.message) {
            const payload = JSON.parse(event.message)
            if (payload && payload.type === 'talleres_snapshot' && Array.isArray(payload.items)) {
              writeLocalCache(payload.items)
              return payload.items
            }
          }
        } catch {
          // continue searching previous snapshot
        }
      }
    }
  } catch {
    // fallback to local cache
  }
  return readLocalCache() || INITIAL_TALLERES
}

async function saveTalleresToCloud(items) {
  writeLocalCache(items)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3500)
    await fetch(CLOUD_STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        type: 'talleres_snapshot',
        updatedAt: new Date().toISOString(),
        items,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
  } catch {
    // local cache already updated
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const currentList = await loadTalleresFromCloud()

    if (req.method === 'GET') {
      res.status(200).json({
        exito: true,
        mensaje: 'Listado de talleres obtenido desde la base de datos',
        datos: currentList,
      })
      return
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}

    if (req.method === 'POST') {
      const id = body.id || `T-${Date.now().toString().slice(-4)}`
      const name = (body.name || body.nombre || 'Nuevo Taller Territorial').trim()
      const location = (body.location || body.lugar || 'Sede Comunitaria Duoc UC').trim()
      const date = (body.date || body.fechaHora || 'Hoy, 15:00 hrs').trim()
      const capacity = Number(body.capacity ?? body.cuposMaximos ?? 30)
      const attendeesCount = Number(body.attendeesCount ?? body.cuposOcupados ?? 0)
      const status = body.status || body.estado || 'Activo'
      const coordinatorName = body.coordinatorName || 'Prof. Mariano Acevedo'
      const qrCode = body.qrCode || body.codigoQr || `SYNCPASS-EVENT-${id}`

      const nuevoTaller = {
        id,
        name,
        location,
        date,
        attendeesCount,
        capacity,
        status,
        coordinatorName,
        qrCode,
      }

      const updated = [nuevoTaller, ...currentList.filter((t) => t.id !== id)]
      await saveTalleresToCloud(updated)

      res.status(201).json({
        exito: true,
        mensaje: 'Taller registrado exitosamente en la base de datos',
        datos: nuevoTaller,
        talleres: updated,
      })
      return
    }

    if (req.method === 'PUT') {
      const targetId = body.id || req.query?.id
      if (!targetId) {
        res.status(400).json({ exito: false, mensaje: 'Se requiere el ID del taller para actualizar' })
        return
      }

      let updatedItem = null
      const updated = currentList.map((item) => {
        if (item.id === targetId) {
          updatedItem = {
            ...item,
            name: (body.name ?? body.nombre ?? item.name).trim(),
            location: (body.location ?? body.lugar ?? item.location).trim(),
            date: (body.date ?? body.fechaHora ?? item.date).trim(),
            capacity: Number(body.capacity ?? body.cuposMaximos ?? item.capacity),
            attendeesCount: Number(body.attendeesCount ?? body.cuposOcupados ?? item.attendeesCount),
            status: body.status ?? body.estado ?? item.status,
            coordinatorName: body.coordinatorName ?? item.coordinatorName,
          }
          return updatedItem
        }
        return item
      })

      await saveTalleresToCloud(updated)
      res.status(200).json({
        exito: true,
        mensaje: 'Taller actualizado en la base de datos',
        datos: updatedItem,
        talleres: updated,
      })
      return
    }

    if (req.method === 'DELETE') {
      const targetId = req.query?.id || body?.id
      if (!targetId) {
        res.status(400).json({ exito: false, mensaje: 'Se requiere el ID del taller para eliminar' })
        return
      }

      const updated = currentList.filter((item) => item.id !== targetId)
      await saveTalleresToCloud(updated)

      res.status(200).json({
        exito: true,
        mensaje: 'Taller eliminado de la base de datos',
        talleres: updated,
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
