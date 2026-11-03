import { useEffect, useState } from 'react'
import { type BffUser } from '../../config/auth.ts'
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
  coordinator: 'Docente / Coordinador',
  volunteer: 'Estudiante Voluntario',
  attendee: 'Beneficiario Comunitario',
}

export default function UsersPage() {
  useDocumentTitle('Usuarios | Sync Pass')
  const [users, setUsers] = useState<ExtendedUser[] | null>(null)
  const [notice, setNotice] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [formNombre, setFormNombre] = useState<string>('')
  const [formEmail, setFormEmail] = useState<string>('')
  const [formRole, setFormRole] = useState<string>('volunteer')

  const fetchUsuarios = async (showFeedback = false) => {
    try {
      const res = await fetch('/api/usuarios', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json.datos) && json.datos.length > 0) {
          setUsers(json.datos)
          if (showFeedback) {
            setNotice('Directorio de usuarios actualizado desde /api/usuarios.')
            setTimeout(() => setNotice(''), 3000)
          }
          return
        }
      }
    } catch {
      // Fallback
    }
    setUsers(DEMO_USERS)
  }

  useEffect(() => {
    fetchUsuarios(false)
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
        if (Array.isArray(json.usuarios)) setUsers(json.usuarios)
      }
    } catch {
      // ignore
    }

    setNotice(`Usuario "${nuevo.nombre}" registrado en la base de datos.`)
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
        if (Array.isArray(json.usuarios)) setUsers(json.usuarios)
      }
    } catch {
      // ignore
    }
    setNotice(nextActivo ? `Cuenta de ${u.email} reactivada.` : `Cuenta de ${u.email} dada de baja.`)
    setTimeout(() => setNotice(''), 3000)
  }

  const handleDeleteUser = async (u: ExtendedUser) => {
    if (!window.confirm(`¿Confirmas eliminar el usuario "${u.email}" de la base de datos?`)) return
    setUsers((prev) => (prev || []).filter((item) => item.id !== u.id))
    try {
      const res = await fetch(`/api/usuarios?id=${encodeURIComponent(u.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json.usuarios)) setUsers(json.usuarios)
      }
    } catch {
      // ignore
    }
    setNotice(`Usuario "${u.email}" eliminado de la base de datos.`)
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
            Gestión de Usuarios
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
            Mantenedor de cuentas, control de acceso basado en roles (RBAC) y estado institucional.
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
            Actualizar Lista
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'var(--brand-emerald, #10b981)',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            + Nuevo Usuario
          </button>
        </div>
      </div>

      {notice && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.1rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
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
                      color: isActive ? '#34d399' : '#f87171',
                    }}
                  >
                    {isActive ? 'Activo' : 'De baja'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.14)',
                      color: '#818cf8',
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
                        background: 'var(--bg-surface)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                      }}
                    >
                      {isActive ? 'Dar de baja' : 'Reactivar'}
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
                      Eliminar
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
            background: 'rgba(2, 6, 23, 0.75)',
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
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>Registrar Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Camila Rojas"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Correo institucional
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="camila.rojas@duocuc.cl"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Rol del sistema (RBAC)
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                  }}
                >
                  <option value="coordinator">Docente / Coordinador</option>
                  <option value="volunteer">Estudiante Voluntario</option>
                  <option value="attendee">Beneficiario Comunitario</option>
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
                    background: 'var(--brand-emerald, #10b981)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
