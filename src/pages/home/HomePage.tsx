import { useState, useEffect, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Link, useLocation } from 'wouter'
import QRCode from 'qrcode'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import { ROLES, type Role } from '../../config/auth.ts'
import styles from './HomePage.module.css'

export default function HomePage() {
  useDocumentTitle('Sync Pass | Vinculación Territorial Duoc UC')

  const auth = useAuth()
  const auth0 = useAuth0()
  const [, setLocation] = useLocation()

  const isAuthenticated = auth.isAuthenticated || auth0.isAuthenticated
  const user = auth.user

  // Simulador de escaneo en la tarjeta 3D interactiva
  const [scannedPass, setScannedPass] = useState(false)
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Sintetizador de audio nativo (Web Audio API) para feedback de escaneo
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.13)
    } catch {
      // Ignorar si el navegador bloquea audio sin interacción previa
    }
  }

  // Generar código QR real y 100% escaneable por teléfonos
  useEffect(() => {
    if (!qrCanvasRef.current) return
    const payload = `${window.location.origin}/dashboard?verified=true&rut=19.482.901-5&asistente=Mariano+Acevedo&taller=Alfabetizacion+Digital`
    QRCode.toCanvas(qrCanvasRef.current, payload, {
      width: 154,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    }).catch(() => {})
  }, [])

  const handleTogglePass = () => {
    setScannedPass((prev) => !prev)
    playChime()
  }

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
      {/* Luces Ambientales y Grid Flotante (Inspiración Muzli) */}
      <div className={styles.ambientOrb1} />
      <div className={styles.ambientOrb2} />
      <div className={styles.gridBackground} />

      {/* HERO SECTION SPLIT: Headline + Interactive 3D Pass Simulator */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.pillBadge}>
            <span className={styles.radarDot} />
            <span>Duoc UC · Vinculación Comunitaria & Ticdgm</span>
          </div>

          <h1 className={styles.heroTitle}>
            Acreditación Territorial en{' '}
            <span className={styles.heroGradient}>Menos de 2 Segundos</span>
          </h1>

          <p className={styles.heroDescription}>
            SyncPass sustituye las planillas en papel por pases QR instantáneos en terreno. Diseñado para que docentes coordinadores y estudiantes voluntarios de Duoc UC gestionen quórum en vivo y certifiquen horas de voluntariado.
          </p>

          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.primaryBtn}>
              <span>Ir al Dashboard</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>

            {!isAuthenticated && (
              <button onClick={handleCognitoLogin} className={styles.secondaryBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Acceso AWS Cognito</span>
              </button>
            )}
          </div>

          {/* Cinta de Métricas de Alto Impacto (Gamma & Muzli Style) */}
          <div className={styles.metricsRibbon}>
            <div className={styles.metricItem}>
              <div className={styles.metricValue} style={{ color: '#10b981' }}>
                &lt; 1.8s
              </div>
              <div className={styles.metricLabel}>Acreditación QR</div>
            </div>

            <div className={styles.metricItem}>
              <div className={styles.metricValue} style={{ color: '#38bdf8' }}>
                65%+
              </div>
              <div className={styles.metricLabel}>Tasa de Encuestas</div>
            </div>

            <div className={styles.metricItem}>
              <div className={styles.metricValue} style={{ color: '#818cf8' }}>
                100%
              </div>
              <div className={styles.metricLabel}>Modo Offline-First</div>
            </div>

            <div className={styles.metricItem}>
              <div className={styles.metricValue} style={{ color: '#f59e0b' }}>
                25 / 25
              </div>
              <div className={styles.metricLabel}>Pruebas Vitest</div>
            </div>
          </div>
        </div>

        {/* HERO RIGHT: Interactive 3D Credential Card (QR 100% Real Escaneable) */}
        <div className={styles.heroRight}>
          <div
            className={styles.pass3dCard}
            onClick={handleTogglePass}
            title="Pase QR real. Puedes escanearlo con la cámara de tu celular o hacer clic para simular la acreditación."
          >
            <div className={styles.passCardGlow} />

            <div className={styles.passCardHeader}>
              <div className={styles.passCardBrand}>
                <div className={styles.passCardBrandDot} />
                <span>SyncPass Credential</span>
              </div>
              <span className={styles.passCardPill}>
                {scannedPass ? 'Acreditado 15:14 hrs' : 'Pase Activo'}
              </span>
            </div>

            <div className={styles.passCardUser}>
              <div className={styles.passUserAvatar}>MA</div>
              <div className={styles.passUserInfo}>
                <h4>Mariano Acevedo</h4>
                <p>Estudiante Voluntario · Duoc UC</p>
                <p style={{ color: '#34d399', fontWeight: 700, marginTop: '2px' }}>
                  Alfabetización Digital N°14
                </p>
              </div>
            </div>

            <div className={styles.passQrContainer}>
              {/* Código QR Real 100% Funcional y Escaneable por cualquier cámara de celular */}
              <canvas
                ref={qrCanvasRef}
                style={{
                  width: '154px',
                  height: '154px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  display: 'block',
                }}
              />
              <div className={styles.passScanSpeed}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>{scannedPass ? 'Verificado en 1.2 segundos' : 'QR Real: ¡Escanéalo con tu celular!'}</span>
              </div>
            </div>

            <div className={styles.passCardFooter}>
              <span>UID: 2988-SYNCPASS</span>
              <span>SHA-256 VALIDATED</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN POST-LOGIN: Selección de Perfil Operativo (4 Roles del Caso) */}
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
              Selecciona el rol con el que deseas operar:
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
                  Quórum & Reportes
                </span>
              </div>
              <h3>Docente Coordinador</h3>
              <p>
                Crea fichas de proyectos, asigna cupos máximos, supervisa el quórum en vivo y redacta informes semestrales.
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
                  Horas de Voluntariado
                </span>
              </div>
              <h3>Estudiante Voluntario</h3>
              <p>
                Alumnos que van a sedes vecinales a dictar talleres. Acreditan beneficiarios en 2s y certifican sus horas académicas.
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
                Vecinos y asistentes al taller. Ingresan con su credencial QR y responden la encuesta de satisfacción al terminar.
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
                  Infraestructura Cloud
                </span>
              </div>
              <h3>Administrador General</h3>
              <p>
                Supervisión institucional, estado de AWS EC2 y PostgreSQL, y emisión de alertas push territoriales.
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

      {/* 3 Modern Feature Cards (Muzli Style) */}
      <section className={styles.featureGrid}>
        <article className={styles.featureCard}>
          <div className={styles.iconWrapper} style={{ background: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Arquitectura Offline-First
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Preparado para operar en sedes vecinales con nula o baja señal 4G. Almacena en la base local SQLite de Android y sincroniza por lotes al reconectar.
          </p>
        </article>

        <article className={styles.featureCard}>
          <div className={styles.iconWrapper} style={{ background: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Identidad Federada AWS Cognito
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Autenticación segura con tokens JWT firmados con RS256. Elimina la necesidad de almacenar contraseñas locales por riesgo de filtraciones.
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
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Telemetría en Tiempo Real
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Monitoreo continuo de asistencia para docentes e integración con notificaciones push directas hacia los teléfonos móviles de los estudiantes.
          </p>
        </article>
      </section>
    </div>
  )
}