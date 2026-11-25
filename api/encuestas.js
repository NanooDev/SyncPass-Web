import crypto from 'node:crypto'
import { applyCors, requireAuth } from './_lib/auth.js'
import { SUPABASE_URL, requireSupabaseConfigured, supabaseHeaders } from './_lib/supabase.js'

const DEFAULT_EVENTO_ID = '00000000-0000-0000-0002-000000000001'
const DEFAULT_BENEFICIARIO_ID = '00000000-0000-0000-0003-000000000001'

export default async function handler(req, res) {
  const corsHandled = applyCors(req, res, 'GET,POST,OPTIONS')
  if (corsHandled !== null) return

  const allowedRoles =
    req.method === 'GET'
      ? ['admin', 'coordinator']
      : ['admin', 'coordinator', 'volunteer', 'attendee']
  const auth = await requireAuth(req, res, allowedRoles)
  if (!auth.ok) return

  if (!requireSupabaseConfigured(res)) return

  try {
    if (req.method === 'GET') {
      const getRes = await fetch(
        `${SUPABASE_URL}/rest/v1/encuesta_valoracion?select=*&order=created_locally_at.desc`,
        { headers: supabaseHeaders() }
      )
      if (!getRes.ok) {
        const errText = await getRes.text()
        throw new Error(`Supabase GET encuesta_valoracion (${getRes.status}): ${errText}`)
      }
      const rows = await getRes.json()
      res.status(200).json({
        exito: true,
        mensaje: 'Encuestas de satisfacción obtenidas desde PostgreSQL (Supabase)',
        datos: Array.isArray(rows) ? rows : [],
      })
      return
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const nowIso = new Date().toISOString()
      const id_encuesta = uuidRegex.test(String(body.id || '')) ? body.id : crypto.randomUUID()
      const id_evento = uuidRegex.test(String(body.tallerId || body.id_evento || ''))
        ? (body.tallerId || body.id_evento)
        : DEFAULT_EVENTO_ID
      const estrellas = Math.min(5, Math.max(1, Number(body.calificacionEstrellas ?? body.estrellas ?? 5)))
      const nivel_utilidad = Math.min(5, Math.max(1, Number(body.utilidad ?? body.nivel_utilidad ?? 4)))
      const comentarios = String(body.comentarios || 'Taller muy útil para la comunidad').trim().slice(0, 600)
      const device_id = String(body.deviceId || 'WEB-SYNCPASS').slice(0, 100)

      let id_beneficiario = uuidRegex.test(String(body.beneficiarioId || ''))
        ? body.beneficiarioId
        : DEFAULT_BENEFICIARIO_ID
      if (!uuidRegex.test(String(body.beneficiarioId || ''))) {
        const newBenId = crypto.randomUUID()
        const benCode = `BEN-${id_encuesta.slice(0, 8).toUpperCase()}`
        const benRes = await fetch(`${SUPABASE_URL}/rest/v1/beneficiario`, {
          method: 'POST',
          headers: supabaseHeaders({ Prefer: 'return=representation' }),
          body: JSON.stringify({
            id_beneficiario: newBenId,
            identificador_sintetico: benCode,
            nombre_ficticio: String(body.rutBeneficiario || 'Vecino Evaluador'),
            tipo: 'vecino',
            qr_code: `QR-${benCode}`,
            activo: true,
          }),
        })
        if (benRes.ok) {
          id_beneficiario = newBenId
        }
      }

      const payload = {
        id_encuesta,
        id_evento,
        id_beneficiario,
        estrellas,
        nivel_utilidad,
        comentarios,
        is_synced: true,
        created_locally_at: nowIso,
        synced_at: nowIso,
        device_id,
      }

      const postRes = await fetch(
        `${SUPABASE_URL}/rest/v1/encuesta_valoracion?on_conflict=id_evento,id_beneficiario`,
        {
          method: 'POST',
          headers: supabaseHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
          body: JSON.stringify(payload),
        }
      )

      if (!postRes.ok) {
        const errText = await postRes.text()
        throw new Error(`Supabase POST encuesta_valoracion (${postRes.status}): ${errText}`)
      }

      await fetch(`${SUPABASE_URL}/rest/v1/sync_log`, {
        method: 'POST',
        headers: supabaseHeaders(),
        body: JSON.stringify({
          id_sync: crypto.randomUUID(),
          tabla_origen: 'encuesta_valoracion',
          id_registro_origen: id_encuesta,
          device_id,
          resultado: 'exitoso',
          timestamp_sync: nowIso,
        }),
      })

      res.status(201).json({
        exito: true,
        mensaje: 'Encuesta de valoración guardada en PostgreSQL (Supabase)',
        datos: payload,
      })
      return
    }

    res.status(405).json({ exito: false, mensaje: 'Método no permitido' })
  } catch (err) {
    res.status(500).json({
      exito: false,
      mensaje: err instanceof Error ? err.message : 'Error interno en /api/encuestas',
    })
  }
}
