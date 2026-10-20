const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador del Sistema',
  coordinator: 'Coordinador de Proyecto',
  volunteer: 'Estudiante Voluntario',
  attendee: 'Beneficiario Comunitario',
}

/** Etiqueta legible para un slug de rol; si no lo conoce, devuelve el slug. */
export function roleLabel(slug: string): string {
  return ROLE_LABELS[slug] ?? slug
}
