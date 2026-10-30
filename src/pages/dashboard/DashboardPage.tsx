import { useState, useRef, useEffect } from 'react'
import { Link } from 'wouter'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import { useUserRoles } from '../../hooks/use-roles/useRoles.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import { ROLES, type Role } from '../../config/auth.ts'
import { sendPushNotification, deriveNtfyTopic } from '../../services/ntfy.ts'
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

  const [projects, setProjects] = useState<CommunityProject[]>(() => {
    try {
      const saved = localStorage.getItem('syncpass_projects')
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS
    } catch {
      return INITIAL_PROJECTS
    }
  })
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

  // Filtros y Búsqueda en Vivo (SaaS)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Activo' | 'En curso' | 'Finalizado'>('todos')

  // Estados del Mantenedor CRUD de Proyectos Comunitarios
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false)
  const [editingProject, setEditingProject] = useState<CommunityProject | null>(null)
  const [formName, setFormName] = useState<string>('')
  const [formLocation, setFormLocation] = useState<string>('')
  const [formDate, setFormDate] = useState<string>('')
  const [formCapacity, setFormCapacity] = useState<number>(30)
  const [formStatus, setFormStatus] = useState<'Activo' | 'En curso' | 'Finalizado'>('Activo')

  const saveProjects = (newProjects: CommunityProject[]) => {
    setProjects(newProjects)
    try {
      localStorage.setItem('syncpass_projects', JSON.stringify(newProjects))
    } catch {
      // Fallback
    }
  }

  const openCreateModal = () => {
    setEditingProject(null)
    setFormName('')
    setFormLocation('')
    setFormDate('Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs')
    setFormCapacity(30)
    setFormStatus('Activo')
    setShowProjectModal(true)
  }

  const openEditModal = (proj: CommunityProject, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProject(proj)
    setFormName(proj.name)
    setFormLocation(proj.location)
    setFormDate(proj.date)
    setFormCapacity(proj.capacity)
    setFormStatus(proj.status)
    setShowProjectModal(true)
  }

  const handleDeleteProject = (projId: string, projName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`¿Confirmas eliminar la iniciativa territorial "${projName}"?`)) {
      const updated = projects.filter((p) => p.id !== projId)
      saveProjects(updated)
      setActionNotice(`Iniciativa "${projName}" eliminada correctamente del mantenedor.`)
      setTimeout(() => setActionNotice(''), 3500)
    }
  }

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formLocation.trim()) return

    if (editingProject) {
      const updated = projects.map((p) =>
        p.id === editingProject.id
          ? {
              ...p,
              name: formName.trim(),
              location: formLocation.trim(),
              date: formDate.trim(),
              capacity: formCapacity,
              status: formStatus,
            }
          : p
      )
      saveProjects(updated)
      setActionNotice(`Iniciativa "${formName.trim()}" actualizada exitosamente en el mantenedor.`)
    } else {
      const newProj: CommunityProject = {
        id: `p-${Date.now()}`,
        name: formName.trim(),
        location: formLocation.trim(),
        date: formDate.trim(),
        attendeesCount: 0,
        capacity: formCapacity,
        status: formStatus,
        coordinatorName: localAuth.user?.name || 'Prof. Mariano Acevedo',
      }
      saveProjects([newProj, ...projects])
      setSelectedProjectId(newProj.id)
      setActionNotice(`Iniciativa "${formName.trim()}" creada en el mantenedor CRUD y lista para terreno.`)
      // Notificación push automática a territorio
      sendPushNotification({
        email: pushTargetEmail,
        title: 'Nueva Iniciativa SyncPass',
        message: `Se ha creado el taller: ${formName.trim()} en ${formLocation.trim()}`,
        priority: 'high',
        useBff: false,
      }).catch(() => {})
    }
    setShowProjectModal(false)
    setTimeout(() => setActionNotice(''), 3500)
  }

  // Estados de Notificaciones Push ntfy.sh y BFF
  const [pushTargetEmail, setPushTargetEmail] = useState<string>('voluntario.estudiante@duocuc.cl')
  const [pushTitle, setPushTitle] = useState<string>('SyncPass Alerta Territorial')
  const [pushMessage, setPushMessage] = useState<string>('Nuevo taller asignado en sede comunitaria.')
  const [pushStatus, setPushStatus] = useState<string>('')
  const [pushLoading, setPushLoading] = useState<boolean>(false)
  const [pushActiveTopic, setPushActiveTopic] = useState<string>('')
  const [useBffToggle, setUseBffToggle] = useState<boolean>(true)

  useEffect(() => {
    deriveNtfyTopic(pushTargetEmail).then(setPushActiveTopic)
  }, [pushTargetEmail])

  const handleSendPush = async () => {
    if (!pushMessage.trim()) return
    setPushLoading(true)
    setPushStatus('')
    const res = await sendPushNotification({
      email: pushTargetEmail,
      title: pushTitle,
      message: pushMessage,
      priority: 'high',
      useBff: useBffToggle,
    })
    setPushLoading(false)
    if (res.success) {
      const canal = res.source === 'bff' ? 'BFF Spring Boot /api/notificar' : 'ntfy.sh directo'
      setPushStatus(`Notificación push emitida exitosamente (${canal}) al tópico ${res.topic}`)
    } else {
      setPushStatus(`Error al emitir notificación: ${res.error}`)
    }
  }

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
    setActionNotice(`Sincronizando ${pendingSyncCount} registros con AWS API Gateway (5xvspck6jb)...`)
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

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
            <b style={{ color: 'var(--text-main)' }}>{localAuth.user?.name || 'Mariano Acevedo'}</b>
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
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: '0 0 0.25rem 0' }}>Talleres Comunitarios en Curso</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Supervisión de cupos, quórum y acreditación en terreno</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={openCreateModal}
                style={{
                  background: 'var(--brand-emerald, #10b981)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 1.1rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>+ Nueva Iniciativa (CRUD)</span>
              </button>
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
                  cursor: 'pointer',
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
          </div>

          {/* Barra de Búsqueda y Filtros de Talleres (SaaS UI) */}
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar taller por nombre, comuna o sede..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className={styles.filterTabs}>
              {(['todos', 'En curso', 'Activo', 'Finalizado'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`${styles.filterTabBtn} ${statusFilter === st ? styles.activeFilterTab : ''}`}
                >
                  {st === 'todos' ? `Todos (${projects.length})` : st}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.projectGrid}>
            {filteredProjects.map((proj) => {
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

                  <h3 className={styles.projectTitle}>
                    {proj.name}
                  </h3>
                  <p className={styles.projectSubtitle}>
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
                    <span style={{ color: 'var(--text-main)' }}>
                      Asistencia: {proj.attendeesCount} / {proj.capacity}
                    </span>
                    <span style={{ color: percent >= 80 ? 'var(--brand-emerald)' : 'var(--brand-indigo)' }}>
                      {percent}% Quórum
                    </span>
                  </div>

                  {/* Acciones CRUD del Mantenedor */}
                  <div
                    style={{
                      marginTop: '0.85rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                    }}
                  >
                    <button
                      onClick={(e) => openEditModal(proj, e)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      title="Editar iniciativa"
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => handleDeleteProject(proj.id, proj.name, e)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      title="Eliminar del mantenedor"
                    >
                      Eliminar
                    </button>
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
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-card)',
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
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Terminal de Acreditación Territorial
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Operación en terreno con soporte para zonas sin conexión a internet
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setOfflineMode(!offlineMode)}
                  style={{
                    background: offlineMode ? 'var(--brand-amber-light)' : 'var(--brand-emerald-light)',
                    color: offlineMode ? 'var(--brand-amber)' : 'var(--brand-emerald)',
                    border: '1px solid ' + (offlineMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'),
                    padding: '0.45rem 0.9rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
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
                      background: 'var(--brand-indigo)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                      cursor: 'pointer',
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
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Acreditación Rápida por Cédula / RUT
                </h3>
                <form onSubmit={handleAccreditation} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={manualRut}
                    onChange={(e) => setManualRut(e.target.value)}
                    placeholder="Ej: 19.823.456-7"
                    style={{
                      flex: 1,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '8px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: 'var(--brand-emerald)',
                      color: '#fff',
                      border: 'none',
                      padding: '0.65rem 1rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      cursor: 'pointer',
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
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      border: '1px dashed var(--border)',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
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
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Acreditaciones Recientes en este Dispositivo
                </h3>
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
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
                        borderBottom: idx < accreditedList.length - 1 ? '1px solid var(--border)' : 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ color: 'var(--brand-emerald)', fontWeight: 800 }}>✓</span>
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
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: '2rem',
              boxShadow: 'var(--shadow-card)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: 'var(--brand-indigo-light)',
                color: 'var(--brand-indigo)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '1rem',
              }}
            >
              Credencial Digital SyncPass
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              María González Valenzuela
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              RUT: 12.345.678-9 · Vecina Titular
            </p>

            <div
              style={{
                width: '180px',
                height: '180px',
                margin: '0 auto 1.25rem auto',
                background: 'var(--bg-subtle)',
                border: '2px dashed var(--border)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--brand-indigo)' }}>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Pase Verificado
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Taller asignado: <b style={{ color: 'var(--text-main)' }}>{selectedProject.name}</b>
            </div>
          </div>

          {/* Encuesta Inmediata de Satisfacción */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: '2rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Encuesta Inmediata de Satisfacción
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Tu respuesta toma solo 30 segundos y apoya la vinculación territorial
            </p>

            {surveySubmitted ? (
              <div
                style={{
                  background: 'var(--brand-emerald-light)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
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
                    background: 'var(--brand-emerald)',
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
                <h4 style={{ fontSize: '1.05rem', color: 'var(--brand-emerald)', marginBottom: '0.25rem' }}>
                  ¡Muchas gracias por tu valoración!
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
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
                      color: 'var(--text-main)',
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
                          background: star <= surveyRating ? 'var(--brand-indigo)' : 'var(--bg-subtle)',
                          color: star <= surveyRating ? '#ffffff' : 'var(--text-muted)',
                          border: '1px solid ' + (star <= surveyRating ? 'var(--brand-indigo)' : 'var(--border)'),
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
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
                      color: 'var(--text-main)',
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
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
                      borderRadius: '8px',
                      padding: '0.65rem',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: 'var(--brand-indigo)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    boxShadow: 'var(--shadow-card)',
                    cursor: 'pointer',
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
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            padding: '2rem',
            boxShadow: 'var(--shadow-card)',
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
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Auditoría y Telemetría Institucional</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estado de la infraestructura cloud y control de acceso</p>
            </div>
            <Link
              href="/users"
              style={{
                background: 'var(--brand-indigo)',
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
            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Servidor Cloud</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>AWS EC2 Ubuntu</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--brand-emerald)', fontWeight: 700 }}>Producción Cloud · Online</div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Identidad Federada</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>AWS Cognito</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--brand-emerald)', fontWeight: 700 }}>PKCE S256 · Operativo</div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Motor de Datos</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>PostgreSQL 16</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--brand-emerald)', fontWeight: 700 }}>mi_base_datos · Conectada</div>
            </div>
          </div>

          {/* Centro de Notificaciones Push ntfy.sh */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: 'var(--bg-subtle)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
                  Centro de Emisión de Notificaciones Push (ntfy.sh)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  Envío directo de eventos SSE hacia dispositivos Android vinculados.
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--brand-emerald)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                SSE En Vivo
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Destinatario (Email del usuario)
                </label>
                <input
                  type="email"
                  value={pushTargetEmail}
                  onChange={(e) => setPushTargetEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--brand-indigo)', marginTop: '0.3rem', fontFamily: 'monospace' }}>
                  Tópico: {pushActiveTopic}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Título del Mensaje
                </label>
                <input
                  type="text"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Cuerpo de la Notificación
              </label>
              <input
                type="text"
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="useBffCheck"
                checked={useBffToggle}
                onChange={(e) => setUseBffToggle(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="useBffCheck" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Enrutar a través del BFF Spring Boot (<code>POST /api/notificar</code>) con fallback automático a ntfy.sh
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSendPush}
                disabled={pushLoading || !pushMessage.trim()}
                style={{
                  background: 'var(--brand-indigo)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: pushLoading ? 'not-allowed' : 'pointer',
                  opacity: pushLoading ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {pushLoading ? 'Emitiendo evento...' : 'Emitir Notificación Push'}
              </button>

              {pushStatus && (
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: pushStatus.startsWith('Error') ? 'var(--brand-rose)' : 'var(--brand-emerald)',
                  }}
                >
                  {pushStatus}
                </span>
              )}
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
            background: 'rgba(11, 15, 25, 0.75)',
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
              background: 'var(--bg-card)',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              padding: '2rem',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: 'var(--shadow-hover)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Pase QR del Taller
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {selectedProject.name}
            </p>

            <div
              style={{
                background: '#ffffff',
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                display: 'inline-block',
                marginBottom: '1.25rem',
              }}
            >
              <canvas ref={canvasRef} width={220} height={220} />
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
              Proyecta o imprime este código en la sede comunitaria para acreditación inmediata
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--brand-indigo)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Cerrar Pase
            </button>
          </div>
        </div>
      )}

      {/* Modal de Creación / Edición del Mantenedor CRUD */}
      {showProjectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowProjectModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: '2rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: 'var(--shadow-hover)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {editingProject ? 'Editar Iniciativa Territorial' : 'Nueva Iniciativa Territorial'}
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Nombre del Taller / Actividad:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Taller de Robótica Comunitaria"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Sede Territorial / Ubicación:
                </label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ej: Sede Vecinal N°8 San Joaquín"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Cupos (Capacidad):
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Estado Operativo:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Activo' | 'En curso' | 'Finalizado')}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                    }}
                  >
                    <option value="Activo">Activo</option>
                    <option value="En curso">En curso</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Fecha y Horario:
                </label>
                <input
                  type="text"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  placeholder="Ej: Sábado, 10:30 hrs"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    background: 'var(--brand-emerald, #10b981)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {editingProject ? 'Guardar Cambios' : 'Crear en Mantenedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
