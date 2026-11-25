import crypto from 'node:crypto'
import { applyCors, normalizeRoles, signSessionJwt } from './_lib/auth.js'
import { SUPABASE_URL, getSupabaseKey, supabaseHeaders } from './_lib/supabase.js'

function mapDbRole(rol) {
  const normalized = normalizeRoles([rol])
  return normalized[0] || 'attendee'
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

async function lookupRoleInDatabase(email) {
  if (!getSupabaseKey() || !email) return null
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/usuario?correo=eq.${encodeURIComponent(email)}&select=id_usuario,nombre,correo,rol,activo`,
      { headers: supabaseHeaders() },
    )
    if (!res.ok) return null
    const rows = await res.json()
    if (!Array.isArray(rows) || !rows[0]) return null
    return rows[0]
  } catch {
    return null
  }
}

async function handleLogin(req, res, body) {
  const email = (String(body.email || '').trim() || String(body.username || '').trim()).toLowerCase()
  const password = String(body.password || '')

  if (!email || !password || password.length < 6) {
    res.status(400).json({
      success: false,
      mensaje: 'Credenciales incompletas: ingresa correo y contraseña (mín. 6 caracteres).',
    })
    return
  }

  const key = getSupabaseKey()
  if (!key) {
    res.status(503).json({
      success: false,
      mensaje: 'Servicio de autenticación no configurado en el servidor.',
    })
    return
  }

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!authRes.ok) {
    const errJson = await authRes.json().catch(() => ({}))
    res.status(401).json({
      success: false,
      mensaje: errJson.error_description || errJson.msg || 'Correo o contraseña incorrectos.',
    })
    return
  }

  const authData = await authRes.json()
  const dbUser = await lookupRoleInDatabase(email)
  if (dbUser && dbUser.activo === false) {
    res.status(403).json({
      success: false,
      mensaje: 'Tu cuenta se encuentra desactivada.',
    })
    return
  }

  // Solo confiar en la tabla usuario (servidor) o app_metadata (gestionado por admin);
  // nunca en user_metadata editable por el propio usuario.
  const trustedAppRole = authData.user?.app_metadata?.role
  const role = dbUser ? mapDbRole(dbUser.rol) : mapDbRole(trustedAppRole || 'attendee')
  const name = dbUser?.nombre || authData.user?.user_metadata?.nombre || email.split('@')[0]
  const id = dbUser?.id_usuario || authData.user?.id || crypto.randomUUID()

  const accessToken = signSessionJwt({ id, email, name, roles: [role] })
  res.status(200).json({
    success: true,
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 86400,
    user: { username: email, email, name, roles: [role] },
    data: {
      accessToken,
      idToken: accessToken,
      user: { id, email, name, roles: [role] },
    },
  })
}

async function handleRegister(req, res, body) {
  const nombre = String(body.nombre || body.name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!nombre || !email || password.length < 6) {
    res.status(400).json({
      success: false,
      mensaje: 'Completa nombre, correo válido y contraseña (mín. 6 caracteres).',
    })
    return
  }

  const key = getSupabaseKey()
  if (!key) {
    res.status(503).json({
      success: false,
      mensaje: 'Servicio de registro no configurado en el servidor.',
    })
    return
  }

  // Registro público nunca puede auto-otorgarse privilegios de administrador
  const requestedRole = Array.isArray(body.roles) ? body.roles[0] : body.role
  const assignedRole =
    requestedRole === 'volunteer' || requestedRole === 'coordinator' || requestedRole === 'attendee'
      ? requestedRole
      : 'attendee'

  const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      data: { nombre, role: assignedRole },
    }),
  })

  const signupData = await signupRes.json().catch(() => ({}))
  if (!signupRes.ok) {
    res.status(signupRes.status === 422 || signupRes.status === 400 ? 400 : 502).json({
      success: false,
      mensaje: signupData.msg || signupData.error_description || 'No se pudo completar el registro.',
    })
    return
  }

  const userId = signupData.user?.id || crypto.randomUUID()
  await fetch(`${SUPABASE_URL}/rest/v1/usuario`, {
    method: 'POST',
    headers: supabaseHeaders({ Prefer: 'resolution=ignore-duplicates' }),
    body: JSON.stringify({
      id_usuario: userId,
      nombre,
      correo: email,
      rol: mapRoleToDb(assignedRole),
      activo: true,
    }),
  }).catch(() => {})

  const accessToken = signupData.access_token
    ? signSessionJwt({ id: userId, email, name: nombre, roles: [assignedRole] })
    : undefined

  res.status(201).json({
    success: true,
    message: accessToken
      ? 'Cuenta registrada y autenticada exitosamente.'
      : 'Cuenta creada. Verifica tu correo electrónico antes de iniciar sesión.',
    data: accessToken
      ? { accessToken, idToken: accessToken, user: { id: userId, email, name: nombre, roles: [assignedRole] } }
      : undefined,
  })
}

export default async function handler(req, res) {
  const corsHandled = applyCors(req, res, 'POST,OPTIONS')
  if (corsHandled !== null) return

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, mensaje: 'Método no permitido' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const urlPath = (req.url || '').split('?')[0]
    if (urlPath.endsWith('/registro') || body.action === 'register') {
      await handleRegister(req, res, body)
      return
    }
    await handleLogin(req, res, body)
  } catch (err) {
    res.status(500).json({
      success: false,
      mensaje: err instanceof Error ? err.message : 'Error interno de autenticación',
    })
  }
}
