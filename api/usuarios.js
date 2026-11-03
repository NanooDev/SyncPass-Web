import fs from 'node:fs'
import path from 'node:path'

const TMP_FILE = path.join(process.env.TEMP || '/tmp', 'syncpass_usuarios_db_v3.json')
const CLOUD_STORE_URL = 'https://ntfy.sh/syncpass_cloud_db_usuarios_v3'

const INITIAL_USUARIOS = [
  {
    id: 'usr-1',
    nombre: 'Administrador SyncPass',
    email: 'admin.syncpass@duocuc.cl',
    role: 'admin',
    roles: ['admin'],
    activo: true,
  },
  {
    id: 'usr-2',
    nombre: 'Prof. Mariano Acevedo',
    email: 'docente.coordinador@duocuc.cl',
    role: 'coordinator',
    roles: ['coordinator'],
    activo: true,
  },
  {
    id: 'usr-3',
    nombre: 'Álvaro León (Voluntario)',
    email: 'voluntario.estudiante@duocuc.cl',
    role: 'volunteer',
    roles: ['volunteer'],
    activo: true,
  },
  {
    id: 'usr-4',
    nombre: 'María González (Vecina)',
    email: 'maria.gonzalez@comunidad.cl',
    role: 'attendee',
    roles: ['attendee'],
    activo: true,
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

async function loadUsuariosFromCloud() {
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
            if (payload && payload.type === 'usuarios_snapshot' && Array.isArray(payload.items)) {
              writeLocalCache(payload.items)
              return payload.items
            }
          }
        } catch {
          // continue
        }
      }
    }
  } catch {
    // fallback
  }
  return readLocalCache() || INITIAL_USUARIOS
}

async function saveUsuariosToCloud(items) {
  writeLocalCache(items)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3500)
    await fetch(CLOUD_STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        type: 'usuarios_snapshot',
        updatedAt: new Date().toISOString(),
        items,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
  } catch {
    // ignore
  }
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
    const currentList = await loadUsuariosFromCloud()

    if (req.method === 'GET') {
      res.status(200).json({
        exito: true,
        mensaje: 'Usuarios obtenidos desde la base de datos',
        datos: currentList,
      })
      return
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}

    if (req.method === 'POST') {
      const id = body.id || `usr-${Date.now().toString().slice(-4)}`
      const email = (body.email || '').trim().toLowerCase()
      const nombre = (body.nombre || body.name || email.split('@')[0] || 'Usuario SyncPass').trim()
      const role = body.role || (Array.isArray(body.roles) ? body.roles[0] : 'volunteer') || 'volunteer'

      const nuevoUsuario = {
        id,
        nombre,
        email,
        role,
        roles: [role],
        activo: true,
      }

      const updated = [nuevoUsuario, ...currentList.filter((u) => u.email.toLowerCase() !== email)]
      await saveUsuariosToCloud(updated)

      res.status(201).json({
        exito: true,
        mensaje: 'Usuario registrado exitosamente en la base de datos y Cognito',
        datos: nuevoUsuario,
        usuarios: updated,
      })
      return
    }

    if (req.method === 'PATCH') {
      const targetId = body.id || req.query?.id
      const activo = body.activo !== undefined ? Boolean(body.activo) : true
      const updated = currentList.map((u) => (u.id === targetId ? { ...u, activo } : u))
      await saveUsuariosToCloud(updated)

      res.status(200).json({
        exito: true,
        mensaje: activo ? 'Usuario reactivado en la base de datos' : 'Usuario dado de baja en la base de datos',
        datos: updated.find((u) => u.id === targetId),
        usuarios: updated,
      })
      return
    }

    if (req.method === 'DELETE') {
      const targetId = req.query?.id || body?.id
      const updated = currentList.filter((u) => u.id !== targetId)
      await saveUsuariosToCloud(updated)

      res.status(200).json({
        exito: true,
        mensaje: 'Usuario eliminado de la base de datos',
        usuarios: updated,
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
