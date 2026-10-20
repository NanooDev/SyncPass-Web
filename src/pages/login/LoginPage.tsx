import { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import { ROLES, type Role } from '../../config/auth.ts'
import { useDocumentTitle } from '../../hooks/use-document-title/useDocumentTitle.ts'

export default function LoginPage() {
  useDocumentTitle('Iniciar Sesión | Sync Pass')
  const { loginWithCognito, loginLocal, switchRole } = useAuth()
  const [, setLocation] = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role>(ROLES.coordinator)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Por favor completa todos los campos.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      loginLocal(email, selectedRole)
      setLoading(false)
      setLocation('/dashboard')
    }, 400)
  }

  const handleQuickRole = (role: Role) => {
    switchRole(role)
    setLocation('/dashboard')
  }

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          background: 'var(--code-bg)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              fontWeight: 800,
              fontSize: '1.5rem',
              marginBottom: '1rem',
            }}
          >
            SyncPass
          </div>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>
            Portal de Acceso
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
            Vinculación con el Medio • Duoc UC
          </p>
        </div>

        {/* 1. Botón Oficial AWS Cognito */}
        <div style={{ marginBottom: '1.75rem' }}>
          <button
            type="button"
            onClick={loginWithCognito}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.85rem',
              borderRadius: '10px',
              border: '1px solid #f59e0b',
              background: '#fef3c7',
              color: '#92400e',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span>☁️</span>
            <span>Iniciar sesión con AWS Cognito (Hosted UI)</span>
          </button>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text)',
              marginTop: '0.5rem',
              textAlign: 'center',
            }}
          >
            User Pool: <code>us-east-1_RlB8Ft9Z2</code>
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
            color: 'var(--text)',
            fontSize: '0.8rem',
            gap: '1rem',
          }}
        >
          <hr style={{ flex: 1, borderColor: 'var(--border)' }} />
          <span>O ingresa con credenciales</span>
          <hr style={{ flex: 1, borderColor: 'var(--border)' }} />
        </div>

        {/* 2. Formulario de Credenciales Locales */}
        <form onSubmit={handleLocalSubmit}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email-input"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-h)',
                marginBottom: '0.35rem',
              }}
            >
              Correo Institucional
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@duocuc.cl"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-h)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="password-input"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-h)',
                marginBottom: '0.35rem',
              }}
            >
              Contraseña
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-h)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="role-select"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-h)',
                marginBottom: '0.35rem',
              }}
            >
              Rol asignado para la sesión
            </label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-h)',
                fontSize: '0.95rem',
              }}
            >
              <option value={ROLES.coordinator}>Docente / Coordinador</option>
              <option value={ROLES.volunteer}>Estudiante Voluntario</option>
              <option value={ROLES.attendee}>Beneficiario Comunitario</option>
              <option value={ROLES.admin}>Administrador</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* 3. Selector de Roles Demo de 1-Clic */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text)',
              marginBottom: '0.75rem',
              letterSpacing: '0.05em',
            }}
          >
            Acceso Rápido de Prueba (Evaluación)
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => handleQuickRole(ROLES.coordinator)}
              style={{ fontSize: '0.8rem', padding: '0.5rem', textAlign: 'left' }}
              title="Entrar como Docente Coordinador"
            >
              🎓 <b>Docente</b>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole(ROLES.volunteer)}
              style={{ fontSize: '0.8rem', padding: '0.5rem', textAlign: 'left' }}
              title="Entrar como Estudiante Voluntario"
            >
              🤝 <b>Voluntario</b>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole(ROLES.attendee)}
              style={{ fontSize: '0.8rem', padding: '0.5rem', textAlign: 'left' }}
              title="Entrar como Beneficiario"
            >
              🏡 <b>Beneficiario</b>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole(ROLES.admin)}
              style={{ fontSize: '0.8rem', padding: '0.5rem', textAlign: 'left' }}
              title="Entrar como Administrador"
            >
              🛡️ <b>Admin</b>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
