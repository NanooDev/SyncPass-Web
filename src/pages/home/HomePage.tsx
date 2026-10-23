import { useAuth0 } from '@auth0/auth0-react'
import { Link } from 'wouter'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import { useUserRoles } from '../../hooks/use-roles/useRoles.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import { ROLES } from '../../config/auth.ts'
import styles from './HomePage.module.css'

export default function HomePage() {
  useDocumentTitle('Sync Pass | Vinculación Territorial')

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
    <div className={styles.homeContainer}>
      {/* Hero Principal */}
      <section className={styles.hero}>
        <div className={styles.pillBadge}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }} />
          <span>SyncPass v2.2 · Arquitectura Cloud & Offline-First</span>
        </div>

        <h1 className={styles.heroTitle}>
          Gestión Territorial Inteligente y{' '}
          <span className={styles.heroGradient}>Acreditación de Impacto</span>
        </h1>

        <p className={styles.heroDescription}>
          Diseñado para operativos comunitarios, juntas de vecinos y talleres de Vinculación con el Medio de Duoc UC. Acreditación QR instantánea en 2 segundos, soporte 100% desconectado y encuestas inmediatas de satisfacción.
        </p>

        {isAuthenticated ? (
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Sesión iniciada como: <b style={{ color: 'var(--text-main)' }}>{user?.email || 'Usuario'}</b>
              {roles.length > 0 && (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    background: 'var(--brand-indigo-light)',
                    color: 'var(--brand-indigo)',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {roles[0]}
                </span>
              )}
            </p>
            <div className={styles.actions}>
              <Link href="/dashboard" className={styles.primaryBtn}>
                Abrir Dashboard Operativo
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.primaryBtn}>
              Explorar Dashboard
            </Link>
            <button onClick={handleCognitoLogin} className={styles.secondaryBtn}>
              Acceso AWS Cognito (SSO)
            </button>
          </div>
        )}
      </section>

      {/* 3 Modern Feature Cards */}
      <section className={styles.featureGrid}>
        <article className={styles.featureCard}>
          <div className={styles.iconWrapper} style={{ background: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Arquitectura Offline-First
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Diseñado para operar en zonas con conectividad nula o intermitente. La base de datos local SQLite almacena las asistencias y sincroniza automáticamente al reconectar con AWS EC2.
          </p>
        </article>

        <article className={styles.featureCard}>
          <div className={styles.iconWrapper} style={{ background: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Acreditación Rápida con QR
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Validación de asistentes en menos de 2 segundos mediante cámara o pase digital en Canvas. Incorpora fallback de contingencia por búsqueda de Cédula de Identidad / RUT.
          </p>
        </article>

        <article className={styles.featureCard}>
          <div className={styles.iconWrapper} style={{ background: 'var(--brand-amber-light)', color: 'var(--brand-amber)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Encuestas Inmediatas de 30s
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Al confirmar la asistencia, el vecino responde una encuesta de satisfacción directamente en el móvil del voluntario, eliminando la pérdida de fichas en papel y la digitación posterior.
          </p>
        </article>
      </section>

      {/* Role Switcher Demo Banner */}
      <section
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '3rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          Simulación Interactiva de Roles (RBAC)
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Prueba de inmediato la experiencia y permisos específicos de cada actor:
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center' }}>
          <button
            onClick={() => {
              auth.switchRole(ROLES.coordinator)
              window.location.href = '/dashboard'
            }}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            Docente / Coordinador
          </button>
          <button
            onClick={() => {
              auth.switchRole(ROLES.volunteer)
              window.location.href = '/dashboard'
            }}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            Estudiante Voluntario
          </button>
          <button
            onClick={() => {
              auth.switchRole(ROLES.attendee)
              window.location.href = '/dashboard'
            }}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            Beneficiario Comunitario
          </button>
          <button
            onClick={() => {
              auth.switchRole(ROLES.admin)
              window.location.href = '/users'
            }}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            Administrador General
          </button>
        </div>
      </section>
    </div>
  )
}
