import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Link, useLocation } from 'wouter'
import { ROLES, ROLE_LABELS } from '../../config/auth.ts'
import { useHasRole, useUserRoles } from '../../hooks/use-roles/useRoles.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const auth0 = useAuth0()
  const [location] = useLocation()
  const isAdmin = useHasRole(ROLES.admin)
  const roles = useUserRoles()

  const isAuthenticated = auth.isAuthenticated || auth0.isAuthenticated
  const userEmail = auth.user?.email || auth0.user?.email || ''

  const handleLogout = () => {
    if (auth.isAuthenticated) {
      auth.logout()
    } else if (auth0.logout) {
      auth0.logout({ logoutParams: { returnTo: window.location.origin } })
    } else {
      window.location.href = '/'
    }
  }

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.brand}>
            Sync Pass
          </Link>
          <Link
            href="/"
            className={`${styles.link} ${location === '/' ? styles.active : ''}`}
          >
            Inicio
          </Link>
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className={`${styles.link} ${location === '/dashboard' ? styles.active : ''}`}
            >
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/users"
              className={`${styles.link} ${location === '/users' ? styles.active : ''}`}
            >
              Usuarios
            </Link>
          )}
          {isAuthenticated ? (
            <div className={styles.auth}>
              <span className={styles.user}>{userEmail}</span>
              {roles.length > 0 && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'var(--accent-bg)',
                    border: '1px solid var(--accent-border)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }}
                >
                  {ROLE_LABELS[roles[0]] || roles[0]}
                </span>
              )}
              <button onClick={handleLogout} title="Cerrar sesión">
                Salir
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.link}>
              Ingresar
            </Link>
          )}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </>
  )
}
