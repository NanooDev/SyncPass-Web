import crypto from 'node:crypto'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nxbsqkpnkawbkdksmnym.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''

const DEFAULT_PROYECTO_ID = '00000000-0000-0000-0001-000000000001'
const DEFAULT_COORDINADOR_ID = '00000000-0000-0000-0000-000000000002'

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function mapStatusFromDb(estado) {
  switch (String(estado || '').toLowerCase()) {
    case 'en_curso':
      return 'En curso'
    case 'finalizado':
    case 'cancelado':
      return 'Finalizado'
    default:
      return 'Activo'
  }
}

function mapStatusToDb(status) {
  switch (String(status || '').toLowerCase()) {
    case 'en curso':
    case 'en_curso':
      return 'en_curso'
    case 'finalizado':
    case 'completado':
      return 'finalizado'
    case 'cancelado':
      return 'cancelado'
    default:
      return 'programado'
  }
}

function formatDateDisplay(isoStr) {
  if (!isoStr) return 'Hoy, 15:00 hrs'
  try {
    const d = new Date(isoStr)
    if (Number.isNaN(d.getTime())) return String(isoStr)
    const dd = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
    const hh = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${dd}, ${hh} hrs`
  } catch {
    return String(isoStr)
  }
}

function mapRowToFrontend(row) {
  const id = row.id_evento
  return {
    id,
    name: row.nombre_actividad || 'Taller Territorial',
    location: [row.recinto, row.direccion].filter(Boolean).join(' · ') || 'Sede Comunitaria',
    date: formatDateDisplay(row.fecha_hora_programada),
    attendeesCount: 0,
    capacity: Number(row.cupos_maximos || 30),
    status: mapStatusFromDb(row.estado),
    coordinatorName: 'Prof. Mariano Acevedo',
    qrCode: row.qr_evento || `SYNCPASS-EVENT-${id.slice(0, 8).toUpperCase()}`,
  }
}

async function fetchAllFromSupabase() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/evento_taller?select=*&order=created_at.desc`,
    { headers: supabaseHeaders() }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Supabase GET evento_taller (${res.status}): ${errText}`)
  }
  const rows = await res.json()
  return Array.isArray(rows) ? rows.map(mapRowToFrontend) : []
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
    if (req.method === 'GET') {
      const talleres = await fetchAllFromSupabase()
      res.status(200).json({
        exito: true,
        mensaje: 'Listado de talleres obtenido desde PostgreSQL (Supabase)',
        datos: talleres,
      })
      return
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}

    if (req.method === 'POST') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const id_evento = uuidRegex.test(String(body.id || '')) ? body.id : crypto.randomUUID()
      const nombre_actividad = String(body.name || body.nombre || 'Nuevo Taller Territorial').trim()
      const recinto = String(body.location || body.lugar || 'Sede Comunitaria Duoc UC').trim()
      const cupos_maximos = Math.max(1, Number(body.capacity ?? body.cuposMaximos ?? 30))
      const estado = mapStatusToDb(body.status || body.estado || 'Activo')
      const qr_evento = body.qrCode || body.codigoQr || `EVT-${id_evento.slice(0, 8).toUpperCase()}`

      const insertPayload = {
        id_evento,
        id_proyecto: DEFAULT_PROYECTO_ID,
        id_coordinador: DEFAULT_COORDINADOR_ID,
        nombre_actividad,
        fecha_hora_programada: new Date().toISOString(),
        cupos_maximos,
        recinto,
        direccion: recinto,
        qr_evento,
        estado,
      }

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/evento_taller`, {
        method: 'POST',
        headers: supabaseHeaders({ Prefer: 'return=representation' }),
        body: JSON.stringify(insertPayload),
      })

      if (!insertRes.ok) {
        const errText = await insertRes.text()
        throw new Error(`Supabase POST evento_taller (${insertRes.status}): ${errText}`)
      }

      const insertedRows = await insertRes.json()
      const created = Array.isArray(insertedRows) && insertedRows[0]
        ? mapRowToFrontend(insertedRows[0])
        : mapRowToFrontend(insertPayload)

      const talleres = await fetchAllFromSupabase()

      res.status(201).json({
        exito: true,
        mensaje: 'Taller registrado exitosamente en PostgreSQL (Supabase)',
        datos: created,
        talleres,
      })
      return
    }

    if (req.method === 'PUT') {
      const targetId = body.id || req.query?.id
      if (!targetId) {
        res.status(400).json({ exito: false, mensaje: 'Se requiere el ID del taller para actualizar' })
        return
      }

      const patchPayload = {}
      if (body.name || body.nombre) patchPayload.nombre_actividad = String(body.name || body.nombre).trim()
      if (body.location || body.lugar) {
        const loc = String(body.location || body.lugar).trim()
        patchPayload.recinto = loc
        patchPayload.direccion = loc
      }
      if (body.capacity !== undefined || body.cuposMaximos !== undefined) {
        patchPayload.cupos_maximos = Math.max(1, Number(body.capacity ?? body.cuposMaximos))
      }
      if (body.status || body.estado) {
        patchPayload.estado = mapStatusToDb(body.status || body.estado)
      }
      patchPayload.updated_at = new Date().toISOString()

      const patchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/evento_taller?id_evento=eq.${encodeURIComponent(targetId)}`,
        {
          method: 'PATCH',
          headers: supabaseHeaders({ Prefer: 'return=representation' }),
          body: JSON.stringify(patchPayload),
        }
      )

      if (!patchRes.ok) {
        const errText = await patchRes.text()
        throw new Error(`Supabase PATCH evento_taller (${patchRes.status}): ${errText}`)
      }

      const updatedRows = await patchRes.json()
      const updatedItem = Array.isArray(updatedRows) && updatedRows[0] ? mapRowToFrontend(updatedRows[0]) : null
      const talleres = await fetchAllFromSupabase()

      res.status(200).json({
        exito: true,
        mensaje: 'Taller actualizado en PostgreSQL (Supabase)',
        datos: updatedItem,
        talleres,
      })
      return
    }

    if (req.method === 'DELETE') {
      const targetId = req.query?.id || body?.id
      if (!targetId) {
        res.status(400).json({ exito: false, mensaje: 'Se requiere el ID del taller para eliminar' })
        return
      }

      const delRes = await fetch(
        `${SUPABASE_URL}/rest/v1/evento_taller?id_evento=eq.${encodeURIComponent(targetId)}`,
        {
          method: 'DELETE',
          headers: supabaseHeaders(),
        }
      )

      if (!delRes.ok) {
        const errText = await delRes.text()
        throw new Error(`Supabase DELETE evento_taller (${delRes.status}): ${errText}`)
      }

      const talleres = await fetchAllFromSupabase()

      res.status(200).json({
        exito: true,
        mensaje: 'Taller eliminado de PostgreSQL (Supabase)',
        talleres,
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
