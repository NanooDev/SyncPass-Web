import { useState, useRef, useEffect } from 'react'
import { Link } from 'wouter'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import { useUserRoles } from '../../hooks/use-roles/useRoles.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import { ROLES, type Role } from '../../config/auth.ts'
import styles from './DashboardPage.module.css'

interface CommunityProject {
  id: string
  name: string
  location: string
  date: string
  attendeesCount: number
  capacity: number
  status: 'Activo' | 'En curso' | 'Finalizado'
  coordinatorName: string
}

const INITIAL_PROJECTS: CommunityProject[] = [
  {
    id: 'p1',
    name: 'Alfabetización Digital para Adultos Mayores',
    location: 'Junta de Vecinos N°14 Villa El Roble',
    date: 'Hoy, 15:00 hrs',
    attendeesCount: 28,
    capacity: 40,
    status: 'En curso',
    coordinatorName: 'Prof. Mariano Acevedo',
  },
  {
    id: 'p2',
    name: 'Taller de Huertos Comunitarios Sostenibles',
    location: 'Sede Vecinal Los Pinos',
    date: 'Mañana, 10:30 hrs',
    attendeesCount: 15,
    capacity: 25,
    status: 'Activo',
    coordinatorName: 'Prof. Mariano Acevedo',
  },
  {
    id: 'p3',
    name: 'Primeros Auxilios y Prevención Barrial',
    location: 'Colegio Polivalente San Bernardo',
    date: '24 Oct, 16:00 hrs',
    attendeesCount: 35,
    capacity: 35,
    status: 'Finalizado',
    coordinatorName: 'Prof. Álvaro León',
  },
]

export default function DashboardPage() {
  useDocumentTitle('Dashboard | Sync Pass')
  const roles = useUserRoles()
  const activeRole: Role = (roles[0] as Role) || ROLES.coordinator
  const localAuth = useAuth()

  const [projects] = useState<CommunityProject[]>(INITIAL_PROJECTS)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('p1')
  const [offlineMode, setOfflineMode] = useState<boolean>(false)
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(3)
  const [manualRut, setManualRut] = useState<string>('')
  const [accreditedList, setAccreditedList] = useState<string[]>([
    'María González (12.345.678-9) · 15:12 hrs · QR Validado',
    'Juan Pérez (14.567.890-K) · 15:14 hrs · QR Validado',
    'Rosa Morales (10.987.654-3) · 15:18 hrs · Registro Manual',
  ])
  const [surveyRating, setSurveyRating] = useState<number>(5)
  const [surveyComment, setSurveyComment] = useState<string>('')
  const [surveySubmitted, setSurveySubmitted] = useState<boolean>(false)
  const [actionNotice, setActionNotice] = useState<string>('')
  const [showQrModal, setShowQrModal] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Renderizar QR en Canvas nativo sin librerías externas
  useEffect(() => {
    if (!showQrModal || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    const blocks = 21
    const blockSize = size / blocks
    ctx.fillStyle = '#0f172a'

    // Generar patrón visual tipo QR determinista
    for (let r = 0; r < blocks; r++) {
      for (let c = 0; c < blocks; c++) {
        const isCorner =
          (r < 7 && c < 7) || (r < 7 && c >= blocks - 7) || (r >= blocks - 7 && c < 7)
        if (isCorner) {
          const isBorder =
            r === 0 || r === 6 || c === 0 || c === 6 ||
            r === blocks - 7 || r === blocks - 1 || c === blocks - 7 || c === blocks - 1
          const isCore =
            (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
            (r >= 2 && r <= 4 && c >= blocks - 5 && c <= blocks - 3) ||
            (r >= blocks - 5 && r <= blocks - 3 && c >= 2 && c <= 4)
          if (isBorder || isCore) {
            ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize)
          }
        } else if ((r * 11 + c * 17 + (selectedProjectId.charCodeAt(0) || 7)) % 3 === 0) {
          ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize)
        }
      }
    }
  }, [showQrModal, selectedProjectId])

  const handleAccreditation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualRut.trim()) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const entry = `${manualRut.trim()} · ${now} hrs · Acreditado Manual`
    setAccreditedList([entry, ...accreditedList])
    setManualRut('')
    if (offlineMode) {
      setPendingSyncCount((c) => c + 1)
      setActionNotice('Registro guardado localmente en almacenamiento offline.')
    } else {
      setActionNotice('Registro sincronizado exitosamente con el backend AWS EC2.')
    }
    setTimeout(() => setActionNotice(''), 3500)
  }

  const handleSyncNow = () => {
    setActionNotice(`Sincronizando ${pendingSyncCount} registros con AWS EC2 (54.164.69.142)...`)
    setTimeout(() => {
      setPendingSyncCount(0)
      setActionNotice('Todos los registros territoriales han sido sincronizados.')
      setTimeout(() => setActionNotice(''), 3500)
    }, 1000)
  }

  const handleSimulatedScan = () => {
    const fakeRuts = ['18.921.344-2', '16.482.901-5', '11.233.409-7', '20.109.845-K']
    const randomRut = fakeRuts[Math.floor(Math.random() * fakeRuts.length)]
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const entry = `Beneficiario (${randomRut}) · ${now} hrs · QR Validado`
    setAccreditedList([entry, ...accreditedList])
    if (offlineMode) {
      setPendingSyncCount((c) => c + 1)
      setActionNotice('Escáner QR: Asistencia guardada localmente (Offline).')
    } else {
      setActionNotice('Escáner QR: Acreditación sincronizada con éxito.')
    }
    setTimeout(() => setActionNotice(''), 3500)
  }

  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSurveySubmitted(true)
    setActionNotice('Encuesta de satisfacción registrada con éxito.')
    setTimeout(() => setActionNotice(''), 4000)
  }

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0]

  return (
    <div className={styles.dashboardContainer}>
      {/* Toast de Notificaciones */}
      {actionNotice && (
        <div className={styles.noticeToast}>
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice('')}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Role Segmented Control */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <h1>Panel de Operaciones SyncPass</h1>
          <p>
            Entorno de Vinculación Territorial · Sesión activa:{' '}
            <b style={{ color: '#0f172a' }}>{localAuth.user?.name || 'Mariano Acevedo'}</b>
          </p>
        </div>

        {/* Modern Segmented Role Switcher */}
        <div className={styles.roleSegment}>
          <button
            onClick={() => localAuth.switchRole(ROLES.coordinator)}
            className={`${styles.roleBtn} ${activeRole === ROLES.coordinator ? styles.activeRole : ''}`}
          >
            Docente
          </button>
          <button
            onClick={() => localAuth.switchRole(ROLES.volunteer)}
            className={`${styles.roleBtn} ${activeRole === ROLES.volunteer ? styles.activeRole : ''}`}
          >
            Voluntario
          </button>
          <button
            onClick={() => localAuth.switchRole(ROLES.attendee)}
            className={`${styles.roleBtn} ${activeRole === ROLES.attendee ? styles.activeRole : ''}`}
          >
            Beneficiario
          </button>
          <button
            onClick={() => localAuth.switchRole(ROLES.admin)}
            className={`${styles.roleBtn} ${activeRole === ROLES.admin ? styles.activeRole : ''}`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Quórum Promedio</span>
            <span className={styles.kpiBadge}>+14% vs meta</span>
          </div>
          <div className={styles.kpiValue}>87.5%</div>
          <div className={styles.kpiSub}>78 de 100 cupos totales cubiertos</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Acreditaciones QR</span>
            <span className={styles.kpiBadge} style={{ background: '#eef2ff', color: '#4f46e5' }}>
              En Vivo
            </span>
          </div>
          <div className={styles.kpiValue}>{128 + accreditedList.length}</div>
          <div className={styles.kpiSub}>Velocidad media: 1.8 seg / vecino</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Modo Operativo</span>
            <span
              className={styles.kpiBadge}
              style={{
                background: offlineMode ? '#fef3c7' : '#ecfdf5',
                color: offlineMode ? '#d97706' : '#059669',
              }}
            >
              {offlineMode ? 'Modo Offline' : 'En Línea'}
            </span>
          </div>
          <div className={styles.kpiValue}>{pendingSyncCount}</div>
          <div className={styles.kpiSub}>Registros pendientes de sincronizar</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Satisfacción</span>
            <span className={styles.kpiBadge}>4.9 de 5.0</span>
          </div>
          <div className={styles.kpiValue}>98%</div>
          <div className={styles.kpiSub}>Basado en 84 encuestas inmediatas</div>
        </div>
      </div>

      {/* VISTA 1: DOCENTE / COORDINADOR */}
      {activeRole === ROLES.coordinator && (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Talleres Comunitarios en Curso</h2>
              <p style={{ fontSize: '0.85rem' }}>Supervisión de cupos, quórum y acreditación en terreno</p>
            </div>
            <button
              onClick={() => setShowQrModal(true)}
              style={{
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.1rem',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              <span>Generar Pase QR del Taller</span>
            </button>
          </div>

          <div className={styles.projectGrid}>
            {projects.map((proj) => {
              const percent = Math.round((proj.attendeesCount / proj.capacity) * 100)
              const isSelected = proj.id === selectedProjectId
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`${styles.projectCard} ${isSelected ? styles.activeProject : ''}`}
                >
                  <div className={styles.projectTop}>
                    <span
                      className={`${styles.statusPill} ${
                        proj.status === 'Activo'
                          ? styles.statusActivo
                          : proj.status === 'En curso'
                          ? styles.statusEnCurso
                          : styles.statusFinalizado
                      }`}
                    >
                      {proj.status}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                      {proj.date}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                    {proj.name}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                    {proj.location}
                  </p>

                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ color: '#0f172a' }}>
                      Asistencia: {proj.attendeesCount} / {proj.capacity}
                    </span>
                    <span style={{ color: percent >= 80 ? '#059669' : '#4f46e5' }}>
                      {percent}% Quórum
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* VISTA 2: ESTUDIANTE VOLUNTARIO */}
      {activeRole === ROLES.volunteer && (
        <section>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
              marginBottom: '1.5rem',
            }}
          >
            {/* Field Status & Offline Switch Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                paddingBottom: '1.25rem',
                marginBottom: '1.5rem',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                  Terminal de Acreditación Territorial
                </h2>
                <p style={{ fontSize: '0.85rem' }}>
                  Operación en terreno con soporte para zonas sin conexión a internet
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setOfflineMode(!offlineMode)}
                  style={{
                    background: offlineMode ? '#fef3c7' : '#ecfdf5',
                    color: offlineMode ? '#92400e' : '#065f46',
                    border: '1px solid ' + (offlineMode ? '#fde68a' : '#a7f3d0'),
                    padding: '0.45rem 0.9rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: offlineMode ? '#d97706' : '#10b981',
                    }}
                  />
                  <span>{offlineMode ? 'Modo Offline Activo' : 'En Línea (Cloud)'}</span>
                </button>

                {pendingSyncCount > 0 && (
                  <button
                    onClick={handleSyncNow}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                    }}
                  >
                    Sincronizar {pendingSyncCount} pendientes
                  </button>
                )}
              </div>
            </div>

            {/* Fast Check-In Form & Simulated QR Scanner */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {/* Form Manual */}
              <div>
                <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '0.75rem' }}>
                  Acreditación Rápida por Cédula / RUT
                </h3>
                <form onSubmit={handleAccreditation} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={manualRut}
                    onChange={(e) => setManualRut(e.target.value)}
                    placeholder="Ej: 19.823.456-7"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#059669',
                      color: '#fff',
                      border: 'none',
                      padding: '0.65rem 1rem',
                      fontWeight: 700,
                    }}
                  >
                    Registrar
                  </button>
                </form>

                <div style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={handleSimulatedScan}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#f8fafc',
                      color: '#0f172a',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5'
                      e.currentTarget.style.background = '#eef2ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1'
                      e.currentTarget.style.background = '#f8fafc'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>Simular Lectura de Cámara QR</span>
                  </button>
                </div>
              </div>

              {/* Registro Reciente */}
              <div>
                <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '0.75rem' }}>
                  Acreditaciones Recientes en este Dispositivo
                </h3>
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '0.5rem 0.75rem',
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {accreditedList.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.45rem 0',
                        fontSize: '0.82rem',
                        borderBottom: idx < accreditedList.length - 1 ? '1px solid #f1f5f9' : 'none',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VISTA 3: BENEFICIARIO COMUNITARIO */}
      {activeRole === ROLES.attendee && (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Pase Digital QR */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '2rem',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: '#eef2ff',
                color: '#4f46e5',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '1rem',
              }}
            >
              Credencial Digital SyncPass
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.25rem' }}>
              María González Valenzuela
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              RUT: 12.345.678-9 · Vecina Titular
            </p>

            <div
              style={{
                width: '180px',
                height: '180px',
                margin: '0 auto 1.25rem auto',
                background: '#f8fafc',
                border: '2px dashed #cbd5e1',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                Pase Verificado
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Taller asignado: <b>{selectedProject.name}</b>
            </div>
          </div>

          {/* Encuesta Inmediata de Satisfacción */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '2rem',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.25rem' }}>
              Encuesta Inmediata de Satisfacción
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Tu respuesta toma solo 30 segundos y apoya la vinculación territorial
            </p>

            {surveySubmitted ? (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '14px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#059669',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  ✓
                </div>
                <h4 style={{ fontSize: '1.05rem', color: '#065f46', marginBottom: '0.25rem' }}>
                  ¡Muchas gracias por tu valoración!
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#047857' }}>
                  Tu calificación fue registrada y sincronizada en el panel de Duoc UC.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSurveySubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.5rem',
                    }}
                  >
                    ¿Cómo calificarías la utilidad de este taller?
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setSurveyRating(star)}
                        style={{
                          flex: 1,
                          padding: '0.6rem 0',
                          background: star <= surveyRating ? '#4f46e5' : '#f8fafc',
                          color: star <= surveyRating ? '#ffffff' : '#64748b',
                          border: '1px solid ' + (star <= surveyRating ? '#4f46e5' : '#e2e8f0'),
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Comentario breve u observación:
                  </label>
                  <textarea
                    rows={3}
                    value={surveyComment}
                    onChange={(e) => setSurveyComment(e.target.value)}
                    placeholder="El contenido fue muy claro y práctico para aplicarlo en el hogar..."
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  Enviar Encuesta
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* VISTA 4: ADMINISTRADOR GENERAL */}
      {activeRole === ROLES.admin && (
        <section
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Auditoría y Telemetría Institucional</h2>
              <p style={{ fontSize: '0.85rem' }}>Estado de la infraestructura cloud y control de acceso</p>
            </div>
            <Link
              href="/users"
              style={{
                background: '#0f172a',
                color: '#fff',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Gestionar Usuarios
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Servidor Cloud</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>AWS EC2 Ubuntu</div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>54.164.69.142 · Online</div>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Identidad Federada</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>AWS Cognito</div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>PKCE S256 · Operativo</div>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Motor de Datos</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>PostgreSQL 16</div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>mi_base_datos · Conectada</div>
            </div>
          </div>
        </section>
      )}

      {/* Modal de Pase QR para Docente */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '2rem',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.35rem' }}>
              Pase QR del Taller
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              {selectedProject.name}
            </p>

            <div
              style={{
                background: '#ffffff',
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'inline-block',
                marginBottom: '1.25rem',
              }}
            >
              <canvas ref={canvasRef} width={220} height={220} />
            </div>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Proyecta o imprime este código en la sede comunitaria para acreditación inmediata
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              Cerrar Pase
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
