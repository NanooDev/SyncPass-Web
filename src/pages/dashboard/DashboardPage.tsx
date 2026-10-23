import { useState } from 'react'
import { Link } from 'wouter'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import { useUserRoles } from '../../hooks/use-roles/useRoles.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import { ROLES, ROLE_LABELS, type Role } from '../../config/auth.ts'
import styles from './DashboardPage.module.css'

// Tarjetas de métricas base
const CARDS = [
  { title: 'Proyectos activos', value: 3, hint: 'coordinator' },
  { title: 'Eventos próximos', value: 5, hint: 'coordinator' },
  { title: 'Asistencias (QR)', value: 128, hint: 'volunteer' },
  { title: 'Encuestas pendientes', value: 2, hint: 'attendee' },
]

interface CommunityProject {
  id: string
  name: string
  location: string
  date: string
  attendeesCount: number
  capacity: number
  status: 'Activo' | 'En curso' | 'Finalizado'
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
  },
  {
    id: 'p2',
    name: 'Taller de Huertos Comunitarios Sostenibles',
    location: 'Sede Vecinal Los Pinos',
    date: 'Mañana, 10:30 hrs',
    attendeesCount: 15,
    capacity: 25,
    status: 'Activo',
  },
  {
    id: 'p3',
    name: 'Primeros Auxilios y Prevención Barrial',
    location: 'Colegio Polivalente San Bernardo',
    date: '24 Oct, 16:00 hrs',
    attendeesCount: 35,
    capacity: 35,
    status: 'Finalizado',
  },
]

export default function DashboardPage() {
  useDocumentTitle('Dashboard | Sync Pass')
  const roles = useUserRoles()
  const activeRole: Role = (roles[0] as Role) || ROLES.coordinator
  const localAuth = useAuth()

  // Estados interactivos
  const [projects] = useState<CommunityProject[]>(INITIAL_PROJECTS)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('p1')
  const [offlineMode, setOfflineMode] = useState<boolean>(false)
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(3)
  const [manualRut, setManualRut] = useState<string>('')
  const [accreditedList, setAccreditedList] = useState<string[]>([
    'María González (12.345.678-9) - Acreditado QR',
    'Juan Pérez (14.567.890-K) - Acreditado QR',
    'Rosa Morales (10.987.654-3) - Acreditado Manual',
  ])
  const [surveyRating, setSurveyRating] = useState<number>(5)
  const [surveyComment, setSurveyComment] = useState<string>('')
  const [surveySubmitted, setSurveySubmitted] = useState<boolean>(false)
  const [actionNotice, setActionNotice] = useState<string>('')

  const handleAccreditation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualRut) return
    const entry = `${manualRut} - Acreditado Manualmente`
    setAccreditedList([entry, ...accreditedList])
    setManualRut('')
    if (offlineMode) {
      setPendingSyncCount((c) => c + 1)
      setActionNotice('Registro guardado localmente (Offline).')
    } else {
      setActionNotice('Registro sincronizado exitosamente con la nube.')
    }
    setTimeout(() => setActionNotice(''), 3000)
  }

  const handleSyncNow = () => {
    setActionNotice(`Sincronizando ${pendingSyncCount} registros con AWS...`)
    setTimeout(() => {
      setPendingSyncCount(0)
      setActionNotice('¡Todos los registros sincronizados correctamente!')
      setTimeout(() => setActionNotice(''), 3000)
    }, 1200)
  }

  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSurveySubmitted(true)
    setTimeout(() => {
      setActionNotice('¡Gracias por evaluar esta actividad comunitaria!')
      setTimeout(() => setActionNotice(''), 3000)
    }, 300)
  }

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0]

  return (
    <section style={{ maxWidth: '1050px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0' }}>Panel de Control</h1>
          <p style={{ color: 'var(--text)' }}>
            Rol activo:{' '}
            <b>{ROLE_LABELS[activeRole] || activeRole}</b> • Vinculación con el
            Medio Duoc UC
          </p>
        </div>

        {/* Selector de rol rápido dentro del dashboard */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--code-bg)',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
            Cambiar vista:
          </span>
          <select
            value={activeRole}
            onChange={(e) => localAuth.switchRole(e.target.value as Role)}
            style={{
              background: 'var(--bg)',
              color: 'var(--text-h)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.2rem 0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <option value={ROLES.coordinator}>Docente / Coordinador</option>
            <option value={ROLES.volunteer}>Estudiante Voluntario</option>
            <option value={ROLES.attendee}>Beneficiario Comunitario</option>
            <option value={ROLES.admin}>Administrador</option>
          </select>
        </div>
      </div>

      {actionNotice && (
        <div
          style={{
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontWeight: 500,
          }}
        >
          {actionNotice}
        </div>
      )}

      {/* Grid de Métricas Principales */}
      <div className={styles.grid}>
        {CARDS.map((c) => (
          <article key={c.title} className={styles.card}>
            <p className={styles.number}>{c.value}</p>
            <h2>{c.title}</h2>
            <small style={{ color: 'var(--text)' }}>
              Módulo: {ROLE_LABELS[c.hint as Role] || c.hint}
            </small>
          </article>
        ))}
      </div>

      {/* VISTAS ESPECÍFICAS SEGÚN ROL */}

      {/* 1. MÓDULO DOCENTE / COORDINADOR */}
      {(activeRole === ROLES.coordinator || activeRole === ROLES.admin) && (
        <div
          style={{
            marginTop: '2.5rem',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            background: 'var(--code-bg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Proyectos y Talleres Comunitarios</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                Gestión territorial y control de asistencia en tiempo real
              </p>
            </div>
            <button
              onClick={() => alert('Formulario de nuevo proyecto en desarrollo')}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
              }}
            >
              + Nuevo Taller
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                style={{
                  border: `2px solid ${
                    selectedProjectId === proj.id
                      ? 'var(--accent)'
                      : 'var(--border)'
                  }`,
                  borderRadius: '10px',
                  padding: '1rem',
                  background: 'var(--bg)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background:
                        proj.status === 'En curso'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(59, 130, 246, 0.15)',
                      color:
                        proj.status === 'En curso' ? '#10b981' : '#3b82f6',
                      fontWeight: 600,
                    }}
                  >
                    {proj.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                    {proj.date}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0' }}>
                  {proj.name}
                </h3>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Sede: {proj.location}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>
                    Cupos: <b>{proj.attendeesCount}</b> / {proj.capacity}
                  </span>
                  <div
                    style={{
                      width: '60px',
                      height: '6px',
                      background: 'var(--border)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${(proj.attendeesCount / proj.capacity) * 100}%`,
                        height: '100%',
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detalle del Taller seleccionado y Pase QR del evento */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                background: '#fff',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '4px',
                  width: '90px',
                  height: '90px',
                }}
              >
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: (i * 7) % 3 === 0 ? '#1e293b' : '#cbd5e1',
                      borderRadius: '2px',
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: '#475569',
                  marginTop: '4px',
                }}
              >
                QR Acreditación
              </span>
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <h3 style={{ margin: '0 0 0.25rem 0' }}>
                {selectedProject.name}
              </h3>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text)',
                  marginBottom: '0.5rem',
                }}
              >
                Código de acreditación rápida para estudiantes voluntarios y
                vecinos inscritos.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() =>
                    alert(
                      `Código QR generado para ${selectedProject.name} con ID: ${selectedProject.id}`,
                    )
                  }
                >
                  Descargar QR
                </button>
                <button
                  onClick={() =>
                    alert('Generando reporte PDF de asistencia para Duoc UC')
                  }
                >
                  Descargar Asistencia (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MÓDULO ESTUDIANTE VOLUNTARIO */}
      {(activeRole === ROLES.volunteer || activeRole === ROLES.admin) && (
        <div
          style={{
            marginTop: '2.5rem',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            background: 'var(--code-bg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Modo Acreditación en Terreno</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                Taller activo: Alfabetización Digital (Sede Villa El Roble)
              </p>
            </div>

            {/* Toggle de Modo Offline */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: offlineMode
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(16, 185, 129, 0.1)',
              }}
            >
              <span>{offlineMode ? '[OFFLINE] Modo Local' : '[ONLINE] En Línea'}</span>
              <button
                onClick={() => setOfflineMode(!offlineMode)}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                {offlineMode ? 'Reconectar Red' : 'Simular Sin Red'}
              </button>
              {pendingSyncCount > 0 && (
                <button
                  onClick={handleSyncNow}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    background: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  Sincronizar ({pendingSyncCount})
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Formulario de Registro Manual o Escaneo */}
            <div
              style={{
                background: 'var(--bg)',
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
              }}
            >
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                Registro Rápido de Vecino
              </h3>
              <form onSubmit={handleAccreditation}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label
                    htmlFor="rut-input"
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    RUT del Beneficiario
                  </label>
                  <input
                    id="rut-input"
                    type="text"
                    placeholder="Ej. 18.765.432-1"
                    value={manualRut}
                    onChange={(e) => setManualRut(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--code-bg)',
                      color: 'var(--text-h)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                    }}
                  >
                    Registrar Asistencia
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rutSimulado = `1${Math.floor(
                        1000000 + Math.random() * 9000000,
                      )}-K`
                      setAccreditedList([
                        `Simulado QR (${rutSimulado})`,
                        ...accreditedList,
                      ])
                      setActionNotice('Escáner QR: Asistencia registrada.')
                      setTimeout(() => setActionNotice(''), 3000)
                    }}
                    title="Simular lectura de cámara QR"
                  >
                    Escanear QR
                  </button>
                </div>
              </form>
            </div>

            {/* Asistencias Recientes */}
            <div
              style={{
                background: 'var(--bg)',
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Acreditados Hoy</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                  Total: {accreditedList.length}
                </span>
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  maxHeight: '140px',
                  overflowY: 'auto',
                }}
              >
                {accreditedList.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ color: '#059669', fontWeight: 'bold' }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. MÓDULO BENEFICIARIO COMUNITARIO */}
      {(activeRole === ROLES.attendee || activeRole === ROLES.admin) && (
        <div
          style={{
            marginTop: '2.5rem',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            background: 'var(--code-bg)',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem 0' }}>Portal del Beneficiario</h2>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text)',
              marginBottom: '1.25rem',
            }}
          >
            Consulta tus talleres inscritos y danos tu retroalimentación para
            seguir mejorando.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Pase digital del vecino */}
            <div
              style={{
                background: 'var(--bg)',
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                Tu Pase Digital SyncPass
              </h3>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text)',
                  marginBottom: '1rem',
                }}
              >
                Muestra este código al estudiante voluntario en la entrada del
                taller:
              </p>
              <div
                style={{
                  display: 'inline-block',
                  background: '#fff',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 10px)',
                    gap: '2px',
                  }}
                >
                  {Array.from({ length: 49 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '10px',
                        height: '10px',
                        background:
                          (i * 11) % 4 === 0 || i % 6 === 0
                            ? '#1e293b'
                            : '#e2e8f0',
                      }}
                    />
                  ))}
                </div>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  marginTop: '0.75rem',
                  color: 'var(--text)',
                }}
              >
                ID: SP-BENEFICIARIO-2026
              </p>
            </div>

            {/* Encuesta rápida de 30 segundos */}
            <div
              style={{
                background: 'var(--bg)',
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
              }}
            >
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                Encuesta Inmediata de Satisfacción
              </h3>
              {surveySubmitted ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '0.4rem 0.9rem',
                      background: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      marginBottom: '0.75rem',
                      letterSpacing: '0.05em',
                    }}
                  >
                    ENCUESTA ENVIADA CON ÉXITO
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>
                    ¡Muchas gracias por tu respuesta!
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                    Tus comentarios ayudan a los docentes y estudiantes de Duoc UC
                    a seguir apoyando a la comunidad.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSurveySubmit}>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    ¿Cómo calificarías la actividad de hoy?
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      marginBottom: '1rem',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setSurveyRating(star)}
                        style={{
                          color:
                            star <= surveyRating ? '#f59e0b' : 'var(--border)',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      htmlFor="survey-comment"
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        marginBottom: '0.25rem',
                      }}
                    >
                      ¿Qué aprendiste o qué podemos mejorar? (Opcional)
                    </label>
                    <textarea
                      id="survey-comment"
                      rows={2}
                      value={surveyComment}
                      onChange={(e) => setSurveyComment(e.target.value)}
                      placeholder="Me gustó la paciencia de los estudiantes..."
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--code-bg)',
                        color: 'var(--text-h)',
                        padding: '0.5rem',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                    }}
                  >
                    Enviar Encuesta Rápida
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MÓDULO ADMINISTRADOR */}
      {activeRole === ROLES.admin && (
        <div
          style={{
            marginTop: '2.5rem',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            background: 'var(--code-bg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0' }}>
                Administración General SyncPass
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: 0 }}>
                Control de accesos RBAC, sincronización de base de datos y
                auditoría
              </p>
            </div>
            <Link
              href="/users"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Gestionar Usuarios →
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
