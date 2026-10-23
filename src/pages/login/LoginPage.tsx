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
  const [showLocalForm, setShowLocalForm] = useState(false)
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
    }, 300)
  }

  const handleQuickRole = (role: Role) => {
    switchRole(role)
    setLocation(role === ROLES.admin ? '/users' : '/dashboard')
  }

  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '1.5rem auto 3rem auto',
        padding: '0 1rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          padding: '2.5rem 2.25rem',
          position: 'relative',
          overflow: 'hidden',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #10b981 100%)',
          }}
        />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.35rem',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
              marginBottom: '1rem',
            }}
          >
            SP
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.03em',
              marginBottom: '0.4rem',
            }}
          >
            Portal de Acceso SyncPass
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            Acreditación territorial y sincronización en la nube
          </p>
        </div>

        {/* Cloud Authentication Primary Action */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={loginWithCognito}
            style={{
              width: '100%',
              padding: '0.95rem 1.25rem',
              background: 'var(--text-main)',
              color: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              fontWeight: 700,
              fontSize: '0.98rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
            <span>Continuar con Amazon Cognito</span>
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              marginTop: '0.65rem',
              fontSize: '0.75rem',
              color: 'var(--brand-emerald)',
              fontWeight: 600,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-emerald)' }} />
            <span>User Pool `us-east-1_RlB8Ft9Z2` · Protocolo PKCE RFC 7636</span>
          </div>
        </div>

        {/* Section Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1.75rem 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Acceso Rápido por Perfil (Evaluación)
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* 4 Interactive Role Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.75rem',
          }}
        >
          {/* Docente / Coordinador */}
          <div
            onClick={() => handleQuickRole(ROLES.coordinator)}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '0.35rem',
                borderRadius: '8px',
                background: 'var(--brand-indigo-light)',
                color: 'var(--brand-indigo)',
                marginBottom: '0.5rem',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Docente</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quórum & QR de Taller</div>
          </div>

          {/* Estudiante Voluntario */}
          <div
            onClick={() => handleQuickRole(ROLES.volunteer)}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '0.35rem',
                borderRadius: '8px',
                background: 'var(--brand-emerald-light)',
                color: 'var(--brand-emerald)',
                marginBottom: '0.5rem',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <rect x="7" y="7" width="10" height="10" rx="1" />
              </svg>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Voluntario</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Acreditación & Offline</div>
          </div>

          {/* Beneficiario Comunitario */}
          <div
            onClick={() => handleQuickRole(ROLES.attendee)}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '0.35rem',
                borderRadius: '8px',
                background: 'var(--brand-cyan-light)',
                color: 'var(--brand-cyan)',
                marginBottom: '0.5rem',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Beneficiario</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pase QR & Encuesta 30s</div>
          </div>

          {/* Administrador General */}
          <div
            onClick={() => handleQuickRole(ROLES.admin)}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '0.35rem',
                borderRadius: '8px',
                background: 'var(--brand-amber-light)',
                color: 'var(--brand-amber)',
                marginBottom: '0.5rem',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Admin</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Métricas & Usuarios</div>
          </div>
        </div>

        {/* Toggle Local Credentials Form */}
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowLocalForm(!showLocalForm)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-indigo)',
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '0.25rem 0.5rem',
            }}
          >
            {showLocalForm ? 'Ocultar formulario manual' : '¿Deseas ingresar con formulario manual?'}
          </button>
        </div>

        {showLocalForm && (
          <form onSubmit={handleLocalSubmit} style={{ marginTop: '1rem' }}>
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
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
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.35rem',
                }}
              >
                Correo Electrónico
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@duocuc.cl"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="login-role"
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.35rem',
                }}
              >
                Rol Asignado
              </label>
              <select
                id="login-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value={ROLES.coordinator}>Docente / Coordinador</option>
                <option value={ROLES.volunteer}>Estudiante Voluntario</option>
                <option value={ROLES.attendee}>Beneficiario Comunitario</option>
                <option value={ROLES.admin}>Administrador General</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--brand-indigo)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              {loading ? 'Accediendo...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}
      </div>

      {/* Backend & Deployment Metadata */}
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
        <span>AWS EC2 Spring Boot: 54.164.69.142</span>
        <span>Duoc UC · Vinculación Territorial</span>
      </div>
    </div>
  )
}
