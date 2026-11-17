/**
 * Capa de utilidades (utils) para formateo y validación de datos territoriales en SyncPass.
 */

export function formatRut(rawRut: string): string {
  const cleaned = rawRut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (cleaned.length < 2) return cleaned
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedBody}-${dv}`
}

export function isValidRutFormat(rut: string): boolean {
  const trimmed = rut.trim()
  if (!trimmed) return false
  return /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]|BEN-\d{3,6})$/i.test(trimmed)
}

export function calculateQuorumPercentage(attendees: number, capacity: number): number {
  if (capacity <= 0) return 0
  const pct = Math.round((Math.max(0, attendees) / capacity) * 100)
  return Math.min(100, pct)
}

export function buildAttendanceCsv(
  workshopName: string,
  records: Array<{ id: string; rut: string; nombre: string; metodo: string; estado: string }>,
): string {
  const header = 'ID_REGISTRO,TALLER,RUT_BENEFICIARIO,NOMBRE,METODO,ESTADO_VALIDACION'
  const rows = records.map(
    (r) => `${r.id},"${workshopName.replace(/"/g, '""')}",${r.rut},"${r.nombre}",${r.metodo},${r.estado}`,
  )
  return [header, ...rows].join('\n')
}
