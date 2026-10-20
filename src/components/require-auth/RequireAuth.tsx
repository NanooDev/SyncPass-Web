import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useUserRoles } from '../../hooks/use-roles/useRoles.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'

/** Envuelve rutas que exigen login y, opcionalmente, alguno de los roles de SyncPass. */
export default function RequireAuth({
  roles,
  children,
}: {
  roles?: string[]
  children: ReactNode
}) {
  const auth = useAuth()
  const auth0 = useAuth0()
  const userRoles = useUserRoles()

  const isLoading = auth.isLoading || auth0.isLoading
  const isAuthenticated = auth.isAuthenticated || auth0.isAuthenticated

  if (isLoading) return <p>Cargando...</p>

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Acceso restringido
        </h2>
        <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
          Debes iniciar sesión para ver esta página.
        </p>
        <button
          onClick={() => {
            if (auth.loginWithCognito) {
              auth.loginWithCognito()
            } else if (auth0.loginWithRedirect) {
              auth0.loginWithRedirect()
            } else {
              window.location.href = '/login'
            }
          }}
        >
          Login
        </button>
      </div>
    )
  }

  if (roles && !roles.some((r) => userRoles.includes(r))) {
    return (
      <div style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
        <p>Acceso denegado: se requiere rol {roles.join(' o ')}.</p>
      </div>
    )
  }

  return <>{children}</>
}
