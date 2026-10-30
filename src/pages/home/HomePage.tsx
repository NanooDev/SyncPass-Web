import { useAuth0 } from '@auth0/auth0-react'
import { Link, useLocation } from 'wouter'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import { ROLES, type Role } from '../../config/auth.ts'
import styles from './HomePage.module.css'

export default function HomePage() {
  useDocumentTitle('Sync Pass | Vinculación Territorial')

  const auth = useAuth()
  const auth0 = useAuth0()
  const [, setLocation] = useLocation()

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

  const handleSelectRole = (role: Role) => {
    auth.switchRole(role)
    setLocation('/dashboard')
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

        {!isAuthenticated && (
          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.primaryBtn}>
              Explorar Dashboard
            </Link>
            <button onClick={handleCognitoLogin} className={styles.secondaryBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Acceso AWS Cognito (SSO)</span>
            </button>
          </div>
        )}
      </section>

      {/* Panel Ejecutivo de Bienvenida y Selección de Entorno Operativo */}
      {isAuthenticated && (
        <section className={styles.roleSelectionSection}>
          <div className={styles.roleSelectionHeader}>
            <div className={styles.authBadgeSuccess}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Sesión Verificada · AWS Cognito (JWT RS256)</span>
            </div>
            <h2>Bienvenido a SyncPass, {user?.name || user?.email?.split('@')[0] || 'Mariano'}</h2>
            <p>
              Sesión activa con el correo <b style={{ color: 'var(--text-main)' }}>{user?.email || 'mariano.acevedo@duocuc.cl'}</b>.
              Selecciona el perfil operativo con el que deseas ingresar a la plataforma:
            </p>
          </div>

          <div className={styles.roleCardsGrid}>
            {/* 1. Docente / Coordinador */}
            <div className={styles.roleCard} onClick={() => handleSelectRole(ROLES.coordinator)}>
              <div className={styles.roleCardTop}>
                <div className={styles.roleIconWrapper} style={{ background: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <span className={styles.rolePillBadge} style={{ background: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}>
                  Quórum & Talleres
                </span>
              </div>
              <h3>Docente / Coordinador</h3>
              <p>
                Supervisión y control de iniciativas territoriales. Monitoreo de quórum en vivo y emisión de pases QR para acreditación en terreno.
              </p>
              <button
                type="button"
                className={styles.roleCardBtn}
                style={{ background: 'var(--brand-emerald)', color: '#ffffff' }}
              >
                <span>Ingresar como Docente</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 2. Estudiante Voluntario */}
            <div className={styles.roleCard} onClick={() => handleSelectRole(ROLES.volunteer)}>
              <div className={styles.roleCardTop}>
                <div className={styles.roleIconWrapper} style={{ background: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </div>
                <span className={styles.rolePillBadge} style={{ background: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}>
                  Acreditación Terreno
                </span>
              </div>
              <h3>Estudiante Voluntario</h3>
              <p>
                Acreditación ágil en terreno. Validación de RUT, escáner de pases QR comunitarios y registro de asistencia en sedes sociales.
              </p>
              <button
                type="button"
                className={styles.roleCardBtn}
                style={{ background: 'var(--brand-indigo)', color: '#ffffff' }}
              >
                <span>Ingresar como Voluntario</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 3. Beneficiario Comunitario */}
            <div className={styles.roleCard} onClick={() => handleSelectRole(ROLES.attendee)}>
              <div className={styles.roleCardTop}>
                <div className={styles.roleIconWrapper} style={{ background: 'var(--brand-amber-light)', color: 'var(--brand-amber)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span className={styles.rolePillBadge} style={{ background: 'var(--brand-amber-light)', color: 'var(--brand-amber)' }}>
                  Acceso Ciudadano
                </span>
              </div>
              <h3>Beneficiario Comunitario</h3>
              <p>
                Credencial digital vecinal. Consulta de talleres activos en la junta vecinal y registro de encuestas de satisfacción inmediata.
              </p>
              <button
                type="button"
                className={styles.roleCardBtn}
                style={{ background: 'var(--brand-amber)', color: '#ffffff' }}
              >
                <span>Ingresar como Vecino</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 4. Administrador General */}
            <div className={styles.roleCard} onClick={() => handleSelectRole(ROLES.admin)}>
              <div className={styles.roleCardTop}>
                <div className={styles.roleIconWrapper} style={{ background: 'var(--brand-cyan-light)', color: 'var(--brand-cyan)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <span className={styles.rolePillBadge} style={{ background: 'var(--brand-cyan-light)', color: 'var(--brand-cyan)' }}>
                  Control RBAC & Telemetría
                </span>
              </div>
              <h3>Administrador General</h3>
              <p>
                Gobernanza institucional y auditoría. Estado de la infraestructura Cloud (AWS EC2, PostgreSQL) y despacho de alertas push territoriales.
              </p>
              <button
                type="button"
                className={styles.roleCardBtn}
                style={{ background: 'var(--brand-cyan)', color: '#ffffff' }}
              >
                <span>Ingresar como Admin</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Identidad Segura AWS Cognito
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Autenticación federada mediante OAuth 2.0 y OpenID Connect. Los tokens JWT con firma criptográfica garantizan segregación estricta de privilegios RBAC en cada microservicio.
          </p>
        </article>

        <article className={styles.featureCard}>
          <div className={styles.iconWrapper} style={{ background: 'var(--brand-cyan-light)', color: 'var(--brand-cyan)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Telemetría en Tiempo Real
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Integración con el protocolo SSE y servidor ntfy.sh para despacho de alertas directas hacia dispositivos móviles Android vinculados al operativo en terreno.
          </p>
        </article>
      </section>
    </div>
  )
}
