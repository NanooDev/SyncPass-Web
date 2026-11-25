import crypto from 'node:crypto'
import { applyCors, requireAuth } from './_lib/auth.js'
import { SUPABASE_URL, requireSupabaseConfigured, supabaseHeaders } from './_lib/supabase.js'

const DEFAULT_EVENTO_ID = '00000000-0000-0000-0002-000000000001'
const DEFAULT_VOLUNTARIO_ID = '00000000-0000-0000-0000-000000000002'
const DEFAULT_BENEFICIARIO_ID = '00000000-0000-0000-0003-000000000001'

function mapAsistenciaRow(row) {
  const ben = row.beneficiario || {}
  return {
    id: row.id_registro,
    tallerId: row.id_evento || DEFAULT_EVENTO_ID,
    rut: ben.identificador_sintetico || ben.qr_code || 'BEN-00101',
    nombreBeneficiario: ben.nombre_ficticio || 'Beneficiario Acreditado',
    timestamp: row.timestamp_marcacion ? new Date(row.timestamp_marcacion).getTime() : Date.now(),
    metodo: (ben.qr_code || '').startsWith('QR') ? 'QR' : 'MANUAL',
    sincronizado: Boolean(row.is_synced ?? true),
    latitud: Number(row.latitud_marcacion ?? -33.5015),
    longitud: Number(row.longitud_marcacion ?? -70.6887),
    distanciaMetros: Number(row.distancia_recinto_m ?? 25),
    estadoValidacion: row.estado_validacion || 'valido',
    deviceId: row.device_id || 'ANDROID-SYNCPASS',
  }
}

async function fetchAsistenciasFromSupabase() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/registro_asistencia?select=*,beneficiario(identificador_sintetico,nombre_ficticio,qr_code)&order=timestamp_marcacion.desc`,
    { headers: supabaseHeaders() }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Supabase GET registro_asistencia (${res.status}): ${errText}`)
  }
  const rows = await res.json()
  return Array.isArray(rows) ? rows.map(mapAsistenciaRow) : []
}

async function resolveOrCreateBeneficiario(rutOrCode, nombreBeneficiario) {
  const rawCode = String(rutOrCode || 'BEN-00101').trim().slice(0, 20)
  const searchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/beneficiario?identificador_sintetico=eq.${encodeURIComponent(rawCode)}&select=id_beneficiario`,
    { headers: supabaseHeaders() }
  )
  if (searchRes.ok) {
    const found = await searchRes.json()
    if (Array.isArray(found) && found[0]?.id_beneficiario) {
      return found[0].id_beneficiario
    }
  }

  const newBenId = crypto.randomUUID()
  const createRes = await fetch(`${SUPABASE_URL}/rest/v1/beneficiario`, {
    method: 'POST',
    headers: supabaseHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      id_beneficiario: newBenId,
      identificador_sintetico: rawCode,
      nombre_ficticio: String(nombreBeneficiario || 'Beneficiario Comunitario').trim(),
      tipo: 'vecino',
      qr_code: `QR-${rawCode}-${newBenId.slice(0, 6)}`,
      activo: true,
    }),
  })
  if (createRes.ok) {
    const created = await createRes.json()
    if (Array.isArray(created) && created[0]?.id_beneficiario) {
      return created[0].id_beneficiario
    }
  }
  return DEFAULT_BENEFICIARIO_ID
}

export default async function handler(req, res) {
  const corsHandled = applyCors(req, res, 'GET,POST,OPTIONS')
  if (corsHandled !== null) return

  const auth = await requireAuth(req, res, ['admin', 'coordinator', 'volunteer'])
  if (!auth.ok) return

  if (!requireSupabaseConfigured(res)) return

  try {
    if (req.method === 'GET') {
      const datos = await fetchAsistenciasFromSupabase()
      res.status(200).json({
        exito: true,
        mensaje: 'Registros de asistencia obtenidos desde PostgreSQL (Supabase)',
        datos,
      })
      return
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      const items = Array.isArray(body.registros) ? body.registros : [body]
      if (items.length === 0) {
        res.status(400).json({
          exito: false,
          mensaje: 'Debe enviar al menos un registro de asistencia para sincronizar',
        })
        return
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const nowIso = new Date().toISOString()

      for (const item of items) {
        if (!item || typeof item !== 'object' || (!item.rut && !item.codigoQr)) {
          res.status(400).json({
            exito: false,
            mensaje: 'Cada asistencia debe incluir rut o codigoQr válido',
          })
          return
        }

        const id_registro = uuidRegex.test(String(item.id || '')) ? item.id : crypto.randomUUID()
        const id_evento = uuidRegex.test(String(item.tallerId || item.id_evento || ''))
          ? (item.tallerId || item.id_evento)
          : DEFAULT_EVENTO_ID
        const id_beneficiario = await resolveOrCreateBeneficiario(
          item.rut || item.codigoQr,
          item.nombreBeneficiario || 'Beneficiario Acreditado'
        )
        const tsIso = item.timestamp ? new Date(Number(item.timestamp)).toISOString() : nowIso
        const latitud_marcacion = Number(item.latitud ?? -33.5015)
        const longitud_marcacion = Number(item.longitud ?? -70.6887)
        const distancia_recinto_m = Math.max(0, Math.round(Number(item.distanciaMetros ?? 25)))
        const estado_validacion = ['valido', 'invalido', 'fuera_de_rango', 'duplicado'].includes(item.estadoValidacion)
          ? item.estadoValidacion
          : (distancia_recinto_m <= 150 ? 'valido' : 'fuera_de_rango')
        const device_id = String(item.deviceId || 'WEB-SYNCPASS').slice(0, 100)

        const payload = {
          id_registro,
          id_evento,
          id_beneficiario,
          id_voluntario: DEFAULT_VOLUNTARIO_ID,
          timestamp_marcacion: tsIso,
          latitud_marcacion,
          longitud_marcacion,
          distancia_recinto_m,
          estado_validacion,
          is_synced: true,
          created_locally_at: tsIso,
          sync_attempt_at: nowIso,
          synced_at: nowIso,
          device_id,
        }

        const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/registro_asistencia?on_conflict=id_evento,id_beneficiario`, {
          method: 'POST',
          headers: supabaseHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
          body: JSON.stringify(payload),
        })

        if (!upsertRes.ok) {
          const errText = await upsertRes.text()
          throw new Error(`Supabase POST registro_asistencia (${upsertRes.status}): ${errText}`)
        }

        await fetch(`${SUPABASE_URL}/rest/v1/sync_log`, {
          method: 'POST',
          headers: supabaseHeaders(),
          body: JSON.stringify({
            id_sync: crypto.randomUUID(),
            tabla_origen: 'registro_asistencia',
            id_registro_origen: id_registro,
            device_id,
            resultado: 'exitoso',
            timestamp_sync: nowIso,
          }),
        })
      }

      const asistencias = await fetchAsistenciasFromSupabase()
      res.status(201).json({
        exito: true,
        mensaje: `${items.length} registro(s) de asistencia sincronizados en PostgreSQL (Supabase)`,
        sincronizados: items.length,
        datos: asistencias,
      })
      return
    }

    res.status(405).json({ exito: false, mensaje: 'Método no permitido' })
  } catch (err) {
    res.status(500).json({
      exito: false,
      mensaje: err instanceof Error ? err.message : 'Error interno en /api/asistencias',
    })
  }
}
