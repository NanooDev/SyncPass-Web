import { useAuth0 } from '@auth0/auth0-react'
import { Link } from 'wouter'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import { useUserRoles } from '../../hooks/use-roles/useRoles.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import { ROLE_LABELS, ROLES } from '../../config/auth.ts'
import styles from './HomePage.module.css'

export default function HomePage() {
  useDocumentTitle('Sync Pass | Vinculación con el Medio')

  const auth = useAuth()
  const auth0 = useAuth0()
  const roles = useUserRoles()

  const isAuthenticated = auth.isAuthenticated || auth0.isAuthenticated
  const user = auth.user

  const handleCognitoLogin = () => {
    if (auth.loginWithCognito) {
      auth.loginWithCognito()
    } else if (auth0.loginWithRedirect) {
      auth0.loginWithRedirect()
    } else {
      window.location.href = '/login'
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <section className={styles.hero}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          <span>Duoc UC</span> • <span>Vinculación con el Medio</span>
        </div>
        <h1 style={{ marginBottom: '1rem' }}>Sync Pass</h1>
        <p>
          Sistema integral para la gestión de proyectos comunitarios, talleres
          territoriales y acreditación en terreno mediante código QR.
        </p>

        {isAuthenticated ? (
          <div style={{ marginTop: '2rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 500 }}>
              Sesión activa como: <b>{user?.email || 'Usuario'}</b>
              {roles.length > 0 && (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    background: 'var(--accent-bg)',
                    color: 'var(--accent)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                  }}
                >
                  {ROLE_LABELS[roles[0]] || roles[0]}
                </span>
              )}
            </p>
            <div className={styles.actions}>
              <Link href="/dashboard" className={styles.primary}>
                Ir al Panel de Control (Dashboard)
              </Link>
              <button onClick={auth.logout}>Cerrar Sesión</button>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            <Link href="/login" className={styles.primary}>
              Ingresar al Sistema
            </Link>
            <button onClick={handleCognitoLogin} title="Iniciar con AWS Cognito">
              ☁️ AWS Cognito
            </button>
          </div>
        )}
      </section>

      {/* Características del caso SyncPass */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          margin: '2rem 0 4rem 0',
        }}
      >
        <article
          style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            background: 'var(--code-bg)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📍</div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            Operación Territorial Offline
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
            Diseñado para operar en juntas de vecinos, colegios y sedes
            comunitarias con conectividad limitada. Sincronización automática de
            asistencias al restablecer red.
          </p>
        </article>

        <article
          style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            background: 'var(--code-bg)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚡</div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            Acreditación Rápida con QR
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
            Los estudiantes voluntarios registran a los vecinos en segundos
            escaneando su pase digital o mediante búsqueda por cédula de
            identidad.
          </p>
        </article>

        <article
          style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            background: 'var(--code-bg)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⭐</div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            Encuestas Inmediatas
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
            Al confirmar la asistencia, el vecino responde en 30 segundos una
            encuesta de satisfacción y utilidad directamente en el móvil del
            voluntario.
          </p>
        </article>
      </section>

      {/* Demostración interactiva de roles */}
      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '3rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          Roles del Sistema (RBAC)
        </h2>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text)',
            marginBottom: '1rem',
          }}
        >
          Selecciona un rol para probar los permisos de la aplicación web:
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => {
              auth.switchRole(ROLES.coordinator)
              window.location.href = '/dashboard'
            }}
          >
            🎓 Docente / Coordinador
          </button>
          <button
            onClick={() => {
              auth.switchRole(ROLES.volunteer)
              window.location.href = '/dashboard'
            }}
          >
            🤝 Estudiante Voluntario
          </button>
          <button
            onClick={() => {
              auth.switchRole(ROLES.attendee)
              window.location.href = '/dashboard'
            }}
          >
            🏡 Beneficiario Comunitario
          </button>
          <button
            onClick={() => {
              auth.switchRole(ROLES.admin)
              window.location.href = '/users'
            }}
          >
            🛡️ Administrador General
          </button>
        </div>
      </section>
    </div>
  )
}
