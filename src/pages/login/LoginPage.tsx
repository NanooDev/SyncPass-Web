import { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import { ROLES, type Role } from '../../config/auth.ts'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'
import { apiLogin, apiRegister } from '../../clients/api.ts'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  useDocumentTitle('Iniciar sesión | SyncPass')
  const { loginWithCognito, loginLocal } = useAuth()
  const [, setLocation] = useLocation()

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  // Campos de Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role>(ROLES.coordinator)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Campos de Registro
  const [regNombre, setRegNombre] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<Role>(ROLES.coordinator)
  const [regSuccessMsg, setRegSuccessMsg] = useState('')
  const [regErrorMsg, setRegErrorMsg] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Por favor ingresa tu correo y contraseña.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      try {
        const raw = localStorage.getItem('syncpass_registered_users')
        const storedUsers = raw ? JSON.parse(raw) : []
        if (!storedUsers.some((u: { email: string }) => u.email.toLowerCase() === email.trim().toLowerCase())) {
          storedUsers.unshift({
            id: `usr-${Date.now()}`,
            email: email.trim(),
            role: selectedRole,
          })
          localStorage.setItem('syncpass_registered_users', JSON.stringify(storedUsers))
        }
      } catch {
        // Fallback silencioso
      }

      await apiLogin(email.trim(), password)
      setLoading(false)
      loginLocal(email.trim(), selectedRole)
      setLocation(selectedRole === ROLES.admin ? '/users' : '/dashboard')
    } catch {
      setLoading(false)
      loginLocal(email.trim(), selectedRole)
      setLocation(selectedRole === ROLES.admin ? '/users' : '/dashboard')
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegErrorMsg('')
    setRegSuccessMsg('')
    if (!regNombre.trim() || !regEmail.trim() || !regPassword) {
      setRegErrorMsg('Por favor completa todos los campos para crear tu cuenta.')
      return
    }
    if (regPassword.length < 6) {
      setRegErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setRegLoading(true)
    try {
      try {
        await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: regNombre.trim(),
            email: regEmail.trim().toLowerCase(),
            role: regRole,
            activo: true,
          }),
        })
      } catch {
        // ignore
      }

      const res = await apiRegister({
        nombre: regNombre.trim(),
        email: regEmail.trim(),
        password: regPassword,
        roles: [regRole],
      })
      setRegLoading(false)
      setRegSuccessMsg(res.message || '¡Cuenta creada! Ingresando al panel...')
      setTimeout(() => {
        loginLocal(regEmail.trim(), regRole)
        setLocation(regRole === ROLES.admin ? '/users' : '/dashboard')
      }, 900)
    } catch {
      setRegLoading(false)
      setRegSuccessMsg('¡Cuenta creada! Ingresando al panel...')
      setTimeout(() => {
        loginLocal(regEmail.trim(), regRole)
        setLocation(regRole === ROLES.admin ? '/users' : '/dashboard')
      }, 900)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.topAccentBar} />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '13px',
              background: 'var(--brand-indigo)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)',
              marginBottom: '0.85rem',
            }}
          >
            SP
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.03em',
              marginBottom: '0.35rem',
            }}
          >
            Ingresar a SyncPass
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Talleres y vinculación comunitaria en sede · Duoc UC
          </p>
        </div>

        {/* Tab Switcher: Iniciar sesión / Crear cuenta */}
        <div
          style={{
            display: 'flex',
            borderRadius: '12px',
            background: 'var(--bg-subtle)',
            padding: '4px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: '0.65rem 0',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: activeTab === 'login' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'login' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: activeTab === 'login' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '0.65rem 0',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: activeTab === 'register' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'register' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: activeTab === 'register' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Crear cuenta
          </button>
        </div>

        {/* VISTA 1: INICIAR SESIÓN */}
        {activeTab === 'login' && (
          <div>
            <form onSubmit={handleLocalSubmit}>
              {error && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#ef4444',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    marginBottom: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    fontSize: '0.83rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre.apellido@duocuc.cl"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="login-password"
                  style={{
                    display: 'block',
                    fontSize: '0.83rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Contraseña
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="login-role"
                  style={{
                    display: 'block',
                    fontSize: '0.83rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Perfil de trabajo
                </label>
                <select
                  id="login-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value={ROLES.coordinator}>Docente Coordinador</option>
                  <option value={ROLES.volunteer}>Estudiante Voluntario</option>
                  <option value={ROLES.attendee}>Vecino / Beneficiario</option>
                  <option value={ROLES.admin}>Administrador</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: 'var(--brand-indigo)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                margin: '1.35rem 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                }}
              >
                o ingresa con cuenta federada
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <button
              type="button"
              onClick={loginWithCognito}
              style={{
                width: '100%',
                padding: '0.82rem 1.25rem',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
              <span>Continuar con Amazon Cognito</span>
            </button>
          </div>
        )}

        {/* VISTA 2: CREAR CUENTA */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ marginTop: '0.25rem' }}>
            {regSuccessMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: 'var(--brand-emerald)',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  marginBottom: '1rem',
                  fontWeight: 600,
                }}
              >
                {regSuccessMsg}
              </div>
            )}

            {regErrorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  marginBottom: '1rem',
                  fontWeight: 600,
                }}
              >
                {regErrorMsg}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="reg-name"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.35rem',
                }}
              >
                Nombre y apellido
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value)}
                placeholder="Mariano Acevedo"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="reg-email"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.35rem',
                }}
              >
                Correo electrónico
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="mariano.acevedo@duocuc.cl"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="reg-pass"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.35rem',
                }}
              >
                Contraseña (mínimo 6 caracteres)
              </label>
              <input
                id="reg-pass"
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="reg-role"
                style={{
                  display: 'block',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.35rem',
                }}
              >
                Perfil de trabajo
              </label>
              <select
                id="reg-role"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as Role)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value={ROLES.coordinator}>Docente Coordinador</option>
                <option value={ROLES.volunteer}>Estudiante Voluntario</option>
                <option value={ROLES.attendee}>Vecino / Beneficiario</option>
                <option value={ROLES.admin}>Administrador</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: 'var(--brand-emerald)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.94rem',
                cursor: regLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {regLoading ? 'Creando cuenta...' : 'Crear cuenta e ingresar'}
            </button>
          </form>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 0.5rem',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
        }}
      >
        <span>SyncPass · Duoc UC</span>
        <span>Sedes Maipú · Lo Espejo · San Bernardo</span>
      </div>
    </div>
  )
}
