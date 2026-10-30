import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import UserCard from '../../components/user-card/UserCard.tsx'
import { apiGetUsers } from '../../clients/api.ts'
import { AUTH0_AUDIENCE, type BffUser } from '../../config/auth.ts'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import styles from './UsersPage.module.css'

const DEMO_USERS: BffUser[] = [
  { id: 'usr-1', email: 'admin.syncpass@duocuc.cl', role: 'admin' },
  { id: 'usr-2', email: 'docente.coordinador@duocuc.cl', role: 'coordinator' },
  { id: 'usr-3', email: 'voluntario.estudiante@duocuc.cl', role: 'volunteer' },
  { id: 'usr-4', email: 'maria.gonzalez@comunidad.cl', role: 'attendee' },
]

function getStoredUsers(): BffUser[] {
  try {
    const raw = localStorage.getItem('syncpass_registered_users')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function getCombinedUsers(): BffUser[] {
  const stored = getStoredUsers()
  const combined = [...stored]
  DEMO_USERS.forEach((du) => {
    if (!combined.some((u) => u.email.toLowerCase() === du.email.toLowerCase())) {
      combined.push(du)
    }
  })
  return combined
}

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
        // Patrón oficial Auth0: consentimiento interactivo si se requiere
        if ((e as { error?: string }).error === 'consent_required') {
          loginWithRedirect({
            authorizationParams: { audience: AUTH0_AUDIENCE },
          }).catch(() => {})
          return
        }

        // Si la sesión no es de Auth0 (ej. Cognito o sesión administrativa directa), cargar usuarios automáticamente sin error
        const isLoginRequired =
          (e as { error?: string }).error === 'login_required' ||
          (e instanceof Error && e.message.toLowerCase().includes('login required'))

        if (isLoginRequired) {
          if (alive) {
            setUsers(getCombinedUsers())
          }
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          Gestión de Usuarios
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Control de acceso basado en roles (RBAC) y directorio institucional de Duoc UC.
        </p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            No se pudo cargar la lista de usuarios. Puedes cargar los perfiles locales de prueba:
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <button
              onClick={() => {
                setError(null)
                setUsers(getCombinedUsers())
              }}
              style={{
                fontSize: '0.85rem',
                background: 'var(--brand-indigo)',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cargar Perfiles de Prueba (SyncPass)
            </button>
          </div>
        </div>
      )}

      {!error && users === null && (
        <div className={styles.list} aria-label="Vista previa de usuarios">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonInfo}>
                <div className={styles.skeletonLineLong} />
                <div className={styles.skeletonLineShort} />
              </div>
              <div className={styles.skeletonBadge} />
            </div>
          ))}
        </div>
      )}

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
