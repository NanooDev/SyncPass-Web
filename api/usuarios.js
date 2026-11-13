import crypto from 'node:crypto'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nxbsqkpnkawbkdksmnym.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function mapRoleFromDb(rol) {
  switch (String(rol || '').toLowerCase()) {
    case 'administrador':
    case 'admin':
      return 'admin'
    case 'docente':
    case 'coordinator':
      return 'coordinator'
    default:
      return 'volunteer'
  }
}

function mapRoleToDb(role) {
  switch (String(role || '').toLowerCase()) {
    case 'admin':
    case 'administrador':
      return 'administrador'
    case 'coordinator':
    case 'docente':
      return 'docente'
    default:
      return 'estudiante_voluntario'
  }
}

function mapRowToFrontend(row) {
  const role = mapRoleFromDb(row.rol)
  return {
    id: row.id_usuario,
    nombre: row.nombre,
    email: row.correo,
    role,
    roles: [role],
    activo: row.activo !== false,
  }
}

async function fetchAllUsersFromSupabase() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/usuario?select=*&order=created_at.desc`,
    { headers: supabaseHeaders() }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Supabase GET usuario (${res.status}): ${errText}`)
  }
  const rows = await res.json()
  return Array.isArray(rows) ? rows.map(mapRowToFrontend) : []
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    if (req.method === 'GET') {
      const usuarios = await fetchAllUsersFromSupabase()
      res.status(200).json({
        exito: true,
        mensaje: 'Usuarios obtenidos desde PostgreSQL (Supabase)',
        datos: usuarios,
      })
      return
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}

    if (req.method === 'POST') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const id_usuario = uuidRegex.test(String(body.id || '')) ? body.id : crypto.randomUUID()
      const correo = String(body.email || body.correo || '').trim().toLowerCase()
      const nombre = String(body.nombre || body.name || correo.split('@')[0] || 'Usuario SyncPass').trim()
      const rol = mapRoleToDb(body.role || (Array.isArray(body.roles) ? body.roles[0] : 'volunteer'))

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/usuario`, {
        method: 'POST',
        headers: supabaseHeaders({ Prefer: 'return=representation' }),
        body: JSON.stringify({
          id_usuario,
          nombre,
          correo,
          rol,
          activo: true,
        }),
      })

      if (!insertRes.ok) {
        const errText = await insertRes.text()
        throw new Error(`Supabase POST usuario (${insertRes.status}): ${errText}`)
      }

      const insertedRows = await insertRes.json()
      const created = Array.isArray(insertedRows) && insertedRows[0]
        ? mapRowToFrontend(insertedRows[0])
        : null
      const usuarios = await fetchAllUsersFromSupabase()

      res.status(201).json({
        exito: true,
        mensaje: 'Usuario registrado exitosamente en PostgreSQL (Supabase)',
        datos: created,
        usuarios,
      })
      return
    }

    if (req.method === 'PATCH') {
      const targetId = body.id || req.query?.id
      if (!targetId) {
        res.status(400).json({ exito: false, mensaje: 'Se requiere el ID del usuario' })
        return
      }
      const activo = body.activo !== undefined ? Boolean(body.activo) : true

      const patchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/usuario?id_usuario=eq.${encodeURIComponent(targetId)}`,
        {
          method: 'PATCH',
          headers: supabaseHeaders({ Prefer: 'return=representation' }),
          body: JSON.stringify({ activo, updated_at: new Date().toISOString() }),
        }
      )

      if (!patchRes.ok) {
        const errText = await patchRes.text()
        throw new Error(`Supabase PATCH usuario (${patchRes.status}): ${errText}`)
      }

      const updatedRows = await patchRes.json()
      const updatedUser = Array.isArray(updatedRows) && updatedRows[0] ? mapRowToFrontend(updatedRows[0]) : null
      const usuarios = await fetchAllUsersFromSupabase()

      res.status(200).json({
        exito: true,
        mensaje: activo ? 'Usuario reactivado en Supabase' : 'Usuario dado de baja en Supabase',
        datos: updatedUser,
        usuarios,
      })
      return
    }

    if (req.method === 'DELETE') {
      const targetId = req.query?.id || body?.id
      if (!targetId) {
        res.status(400).json({ exito: false, mensaje: 'Se requiere el ID del usuario' })
        return
      }

      const delRes = await fetch(
        `${SUPABASE_URL}/rest/v1/usuario?id_usuario=eq.${encodeURIComponent(targetId)}`,
        {
          method: 'DELETE',
          headers: supabaseHeaders(),
        }
      )

      if (!delRes.ok) {
        const errText = await delRes.text()
        throw new Error(`Supabase DELETE usuario (${delRes.status}): ${errText}`)
      }

      const usuarios = await fetchAllUsersFromSupabase()

      res.status(200).json({
        exito: true,
        mensaje: 'Usuario eliminado de PostgreSQL (Supabase)',
        usuarios,
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
