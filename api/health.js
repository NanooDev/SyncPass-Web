import { applyCors } from './_lib/auth.js'
import { SUPABASE_URL, getSupabaseKey } from './_lib/supabase.js'

export default async function handler(req, res) {
  const corsHandled = applyCors(req, res, 'GET,OPTIONS')
  if (corsHandled !== null) return

  let dbStatus = 'Disconnected'
  const key = getSupabaseKey()
  if (key) {
    try {
      const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/evento_taller?select=id_evento&limit=1`, {
        headers: { apikey: key },
      })
      if (dbRes.ok) dbStatus = 'PostgreSQL Supabase (Connected)'
    } catch {
      dbStatus = 'Error'
    }
  } else {
    dbStatus = 'Not Configured'
  }

  res.status(200).json({
    exito: true,
    status: 'UP',
    service: 'syncpass-api-bff',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  })
}
