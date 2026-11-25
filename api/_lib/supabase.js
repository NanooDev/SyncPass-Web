export const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://nxbsqkpnkawbkdksmnym.supabase.co'

export function getSupabaseKey() {
  return process.env.SUPABASE_KEY || ''
}

export function supabaseHeaders(extra = {}) {
  const key = getSupabaseKey()
  if (!key) {
    throw new Error('SUPABASE_KEY no configurada en las variables de entorno del servidor')
  }
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export function requireSupabaseConfigured(res) {
  if (!getSupabaseKey()) {
    res.status(503).json({
      exito: false,
      mensaje: 'Servicio de base de datos no configurado en el servidor (SUPABASE_KEY faltante)',
    })
    return false
  }
  return true
}
