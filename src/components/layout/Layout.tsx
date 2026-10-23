import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Link, useLocation } from 'wouter'
import { ROLES } from '../../config/auth.ts'
import { useHasRole } from '../../hooks/use-roles/useRoles.ts'
import { useAuth } from '../../hooks/use-auth/useAuth.ts'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const auth0 = useAuth0()
  const [location] = useLocation()
  const isAdmin = useHasRole(ROLES.admin)

  const isAuthenticated = auth.isAuthenticated || auth0.isAuthenticated
  const userEmail = auth.user?.email || auth0.user?.email || ''
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U'

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
            <span className={styles.brandIcon}>SP</span>
            <span>Sync Pass</span>
          </Link>

          <div className={styles.links}>
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
          </div>

          <div className={styles.statusPill} title="API Backend Spring Boot en AWS EC2">
            <span className={styles.statusDot}></span>
            <span>API EC2: 54.164.69.142</span>
          </div>

          <div className={styles.auth}>
            {isAuthenticated ? (
              <>
                <div className={styles.userCard}>
                  <div className={styles.avatar}>{userInitial}</div>
                  <span className={styles.userEmail}>{userEmail}</span>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link href="/login" className={styles.loginBtn}>
                Acceder
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className={styles.main}>{children}</main>
    </>
  )
}
