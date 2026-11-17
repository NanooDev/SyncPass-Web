import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { AUTH0_AUDIENCE, type BffUser } from '../../config/auth.ts'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import styles from './UsersPage.module.css'

interface ExtendedUser extends BffUser {
  nombre?: string
  activo?: boolean
}

const DEMO_USERS: ExtendedUser[] = [
  { id: 'usr-1', nombre: 'Administrador SyncPass', email: 'admin.syncpass@duocuc.cl', role: 'admin', activo: true },
  { id: 'usr-2', nombre: 'Prof. Mariano Acevedo', email: 'docente.coordinador@duocuc.cl', role: 'coordinator', activo: true },
  { id: 'usr-3', nombre: 'Álvaro León (Voluntario)', email: 'voluntario.estudiante@duocuc.cl', role: 'volunteer', activo: true },
  { id: 'usr-4', nombre: 'María González (Vecina)', email: 'maria.gonzalez@comunidad.cl', role: 'attendee', activo: true },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  coordinator: 'Docente Coordinador',
  volunteer: 'Estudiante Voluntario',
  attendee: 'Vecino / Beneficiario',
}

export default function UsersPage() {
  useDocumentTitle('Equipo y Usuarios | Sync Pass')
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0()
  const [users, setUsers] = useState<ExtendedUser[] | null>(null)
  const [error, setError] = useState<string>('')
  const [notice, setNotice] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [formNombre, setFormNombre] = useState<string>('')
  const [formEmail, setFormEmail] = useState<string>('')
  const [formRole, setFormRole] = useState<string>('volunteer')

  const fetchUsuarios = async (showFeedback = false) => {
    setError('')
    let token = ''
    try {
      if (getAccessTokenSilently) {
        token =
          (await getAccessTokenSilently({
            authorizationParams: { audience: AUTH0_AUDIENCE },
          })) || ''
      }
    } catch (err) {
      const code = (err as { error?: string })?.error
      if ((code === 'consent_required' || code === 'login_required') && loginWithRedirect) {
        await loginWithRedirect({
          authorizationParams: { audience: AUTH0_AUDIENCE },
        })
        return
      }
    }

    try {
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch('/api/usuarios', {
        method: 'GET',
        headers,
      })
      if (res.ok) {
        const json = await res.json()
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.datos)
            ? json.datos
            : Array.isArray(json?.usuarios)
              ? json.usuarios
              : null
        if (list && list.length > 0) {
          setUsers(list)
          if (showFeedback) {
            setNotice('Directorio de personas actualizado desde la base de datos.')
            setTimeout(() => setNotice(''), 3000)
          }
          return
        }
      }
      setError('No se pudo cargar el directorio remoto; mostrando cuentas locales.')
      setUsers(DEMO_USERS)
    } catch {
      setError('No se pudo cargar la lista de usuarios desde el servidor.')
      setUsers(DEMO_USERS)
    }
  }

  useEffect(() => {
    fetchUsuarios(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formEmail.trim() || !formNombre.trim()) return

    const nuevo: ExtendedUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      nombre: formNombre.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      activo: true,
    }

    setUsers((prev) => [nuevo, ...(prev || [])])
    setShowModal(false)
    setFormNombre('')
    setFormEmail('')

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo),
      })
      if (res.ok) {
        const json = await res.json()
        const list = Array.isArray(json?.datos) ? json.datos : Array.isArray(json?.usuarios) ? json.usuarios : null
        if (list) setUsers(list)
      }
    } catch {
      // ignore
    }

    setNotice(`Se agregó a "${nuevo.nombre}" al equipo.`)
    setTimeout(() => setNotice(''), 3500)
  }

  const handleToggleActivo = async (u: ExtendedUser) => {
    const nextActivo = u.activo === false
    setUsers((prev) => (prev || []).map((item) => (item.id === u.id ? { ...item, activo: nextActivo } : item)))
    try {
      const res = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, activo: nextActivo }),
      })
      if (res.ok) {
        const json = await res.json()
        const list = Array.isArray(json?.datos) ? json.datos : Array.isArray(json?.usuarios) ? json.usuarios : null
        if (list) setUsers(list)
      }
    } catch {
      // ignore
    }
    setNotice(nextActivo ? `Cuenta de ${u.email} reactivada.` : `Cuenta de ${u.email} pausada.`)
    setTimeout(() => setNotice(''), 3000)
  }

  const handleDeleteUser = async (u: ExtendedUser) => {
    if (!window.confirm(`¿Confirmas quitar a "${u.email}" del directorio?`)) return
    setUsers((prev) => (prev || []).filter((item) => item.id !== u.id))
    try {
      const res = await fetch(`/api/usuarios?id=${encodeURIComponent(u.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const json = await res.json()
        const list = Array.isArray(json?.datos) ? json.datos : Array.isArray(json?.usuarios) ? json.usuarios : null
        if (list) setUsers(list)
      }
    } catch {
      // ignore
    }
    setNotice(`Cuenta "${u.email}" eliminada.`)
    setTimeout(() => setNotice(''), 3000)
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Equipo y Permisos en Sede
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
            Administra quiénes pueden coordinar talleres, pasar asistencia como voluntarios o participar en las jornadas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchUsuarios(true)}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border)',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Sincronizar lista
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'var(--brand-emerald, #059669)',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.22)',
            }}
          >
            + Agregar persona
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--brand-amber)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.1rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--brand-emerald)',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {notice}
        </div>
      )}

      {users === null && (
        <div className={styles.grid} aria-busy="true">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.14)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ width: '65%', height: '14px', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.16)' }} />
                  <div style={{ width: '40%', height: '11px', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.1)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {users && (
        <div className={styles.grid}>
          {users.map((u) => {
            const isActive = u.activo !== false
            return (
              <div
                key={u.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      {u.nombre || u.email.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{u.email}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isActive ? 'var(--brand-emerald)' : '#f87171',
                    }}
                  >
                    {isActive ? 'Activo' : 'Pausado'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      background: 'var(--brand-indigo-light)',
                      color: 'var(--brand-indigo)',
                    }}
                  >
                    {ROLE_LABELS[u.role] || u.role}
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleToggleActivo(u)}
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        padding: '0.35rem 0.7rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                      }}
                    >
                      {isActive ? 'Pausar' : 'Reactivar'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u)}
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        padding: '0.35rem 0.7rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        cursor: 'pointer',
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '440px',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>Agregar persona al equipo</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Nombre y apellido
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Camila Rojas"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="camila.rojas@duocuc.cl"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Rol en terreno
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="coordinator">Docente Coordinador</option>
                  <option value="volunteer">Estudiante Voluntario</option>
                  <option value="attendee">Vecino / Beneficiario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--brand-emerald, #059669)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
