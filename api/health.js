const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nxbsqkpnkawbkdksmnym.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  let dbStatus = 'Disconnected'
  try {
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/evento_taller?select=id_evento&limit=1`, {
      headers: { apikey: SUPABASE_KEY },
    })
    if (dbRes.ok) dbStatus = 'PostgreSQL Supabase (Connected)'
  } catch {
    dbStatus = 'Error'
  }

  res.status(200).json({
    exito: true,
    status: 'UP',
    service: 'syncpass-api-bff',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  })
}
