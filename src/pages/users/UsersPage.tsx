import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import UserCard from '../../components/user-card/UserCard.tsx'
import { apiGetUsers } from '../../clients/api.ts'
import { AUTH0_AUDIENCE, BFF_URL, type BffUser } from '../../config/auth.ts'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import styles from './UsersPage.module.css'

const DEMO_USERS: BffUser[] = [
  { id: 'usr-1', email: 'admin.syncpass@duocuc.cl', role: 'admin' },
  { id: 'usr-2', email: 'docente.coordinador@duocuc.cl', role: 'coordinator' },
  { id: 'usr-3', email: 'voluntario.estudiante@duocuc.cl', role: 'volunteer' },
  { id: 'usr-4', email: 'maria.gonzalez@comunidad.cl', role: 'attendee' },
]

export default function UsersPage() {
  useDocumentTitle('Usuarios | Sync Pass')
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0()
  const [users, setUsers] = useState<BffUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getAccessTokenSilently({
      authorizationParams: { audience: AUTH0_AUDIENCE },
    })
      .then((token) => {
        if (!token) throw new Error('Auth0 no devolvió access token')
        return apiGetUsers(token)
      })
      .then((data) => {
        if (alive) setUsers(data)
      })
      .catch((e: unknown) => {
        // Patrón oficial Auth0: el silent no puede mostrar pantallas; si falta
        // el consentimiento se hace un login interactivo una vez y queda guardado.
        if ((e as { error?: string }).error === 'consent_required') {
          loginWithRedirect({
            authorizationParams: { audience: AUTH0_AUDIENCE },
          }).catch(() => {})
          return
        }
        if (alive) setError(e instanceof Error ? e.message : 'Error desconocido')
      })
    return () => {
      alive = false
    }
  }, [getAccessTokenSilently, loginWithRedirect])

  return (
    <section>
      <h1>Usuarios</h1>
      <p className="mb-4">Solo administradores. Datos desde el BFF.</p>
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p>
            No se pudo cargar: {error} (¿BFF corriendo en {BFF_URL} con
            `./gradlew bootRun`?).
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <button
              onClick={() => {
                setError(null)
                setUsers(DEMO_USERS)
              }}
              style={{
                fontSize: '0.85rem',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
              }}
            >
              Cargar Usuarios de Prueba (Roles SyncPass)
            </button>
          </div>
        </div>
      )}
      {!error && users === null && <p>Cargando usuarios...</p>}
      {users && (
        <div className={styles.list}>
          {users.map((u) => (
            <UserCard key={u.id} email={u.email} role={u.role} />
          ))}
        </div>
      )}
    </section>
  )
}
