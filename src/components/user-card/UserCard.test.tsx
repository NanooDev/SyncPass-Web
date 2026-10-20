import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import UserCard from './UserCard.tsx'

describe('UserCard', () => {
  it('muestra el email y la etiqueta del rol', () => {
    render(<UserCard email="admin@sync-pass.test" role="admin" />)
    expect(screen.getByText('admin@sync-pass.test')).toBeInTheDocument()
    expect(screen.getByText('Administrador del Sistema')).toBeInTheDocument()
  })

  it('muestra el slug si el rol es desconocido', () => {
    render(<UserCard email="x@y.test" role="raro" />)
    expect(screen.getByText('raro')).toBeInTheDocument()
  })
})
