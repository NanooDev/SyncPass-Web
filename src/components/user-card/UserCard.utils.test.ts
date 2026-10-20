import { describe, expect, it } from 'vitest'
import { roleLabel } from './UserCard.utils.ts'

describe('roleLabel', () => {
  it('traduce los slugs conocidos', () => {
    expect(roleLabel('admin')).toBe('Administrador del Sistema')
    expect(roleLabel('volunteer')).toBe('Estudiante Voluntario')
  })

  it('devuelve el slug si no lo conoce', () => {
    expect(roleLabel('otro')).toBe('otro')
  })
})
