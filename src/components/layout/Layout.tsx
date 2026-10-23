import { useState, useEffect, type ReactNode } from 'react'
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

  // Gestión de Modo Claro / Modo Oscuro
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syncpass_theme')
      if (saved === 'dark' || saved === 'light') return saved
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    }
    return 'light'
  })

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('syncpass_theme', theme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

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

          {/* Botón de Modo Claro / Modo Oscuro */}
          <button
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label="Alternar tema claro y oscuro"
          >
            {theme === 'dark' ? (
              // Icono Sol (Modo Claro)
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              // Icono Luna (Modo Oscuro)
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

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
