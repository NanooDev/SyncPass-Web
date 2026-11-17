import { describe, expect, it } from 'vitest'
import {
  buildAttendanceCsv,
  calculateQuorumPercentage,
  formatRut,
  isValidRutFormat,
} from './formatters.ts'

describe('Capa utils: formatters y validadores de SyncPass', () => {
  it('formatea un RUT chileno con puntos y guion', () => {
    expect(formatRut('123456789')).toBe('12.345.678-9')
    expect(formatRut('19482901k')).toBe('19.482.901-K')
    expect(formatRut('9')).toBe('9')
  })

  it('valida formatos de RUT e identificadores de beneficiario', () => {
    expect(isValidRutFormat('12.345.678-9')).toBe(true)
    expect(isValidRutFormat('BEN-00101')).toBe(true)
    expect(isValidRutFormat('')).toBe(false)
    expect(isValidRutFormat('abc')).toBe(false)
  })

  it('calcula porcentaje de quorum acotado entre 0 y 100', () => {
    expect(calculateQuorumPercentage(20, 40)).toBe(50)
    expect(calculateQuorumPercentage(50, 40)).toBe(100)
    expect(calculateQuorumPercentage(10, 0)).toBe(0)
  })

  it('construye contenido CSV de acta de asistencia', () => {
    const csv = buildAttendanceCsv('Taller WhatsApp', [
      { id: '1', rut: '12.345.678-9', nombre: 'María González', metodo: 'QR', estado: 'valido' },
    ])
    expect(csv).toContain('ID_REGISTRO,TALLER,RUT_BENEFICIARIO')
    expect(csv).toContain('María González')
  })
})
