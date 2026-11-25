import { useState, useEffect, type ReactNode } from 'react'
import {
  COGNITO_CLIENT_ID,
  COGNITO_DOMAIN,
  COGNITO_LOGOUT_URL,
  COGNITO_REDIRECT_URI,
  ROLES,
  ROLES_CLAIM,
  type Role,
} from '../config/auth.ts'
import {
  exchangeCodeForTokens,
  startCognitoLogin,
} from '../config/cognito-pkce.ts'
import type { SyncPassUser } from './AuthContext.types.ts'
import { AuthContext } from './auth-context.ts'

const STORAGE_KEY_USER = 'syncpass_user'
const STORAGE_KEY_TOKEN = 'syncpass_token'

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function isTokenUnexpired(payload: Record<string, unknown> | null): boolean {
  if (!payload || typeof payload.exp !== 'number') return false
  return payload.exp * 1000 > Date.now()
}

function mapRolesFromPayload(payload: Record<string, unknown> | null): Role[] {
  const raw =
    payload?.[ROLES_CLAIM] ??
    payload?.['cognito:groups'] ??
    payload?.roles ??
    payload?.role ??
    []
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const mapped: Role[] = []
  for (const r of list) {
    const val = String(r).toLowerCase()
    if ((val === 'admin' || val === 'administrador') && !mapped.includes(ROLES.admin)) mapped.push(ROLES.admin)
    else if ((val === 'coordinator' || val === 'docente') && !mapped.includes(ROLES.coordinator)) mapped.push(ROLES.coordinator)
    else if ((val === 'volunteer' || val === 'voluntario' || val === 'estudiante_voluntario') && !mapped.includes(ROLES.volunteer)) mapped.push(ROLES.volunteer)
    else if ((val === 'attendee' || val === 'beneficiario' || val === 'vecino') && !mapped.includes(ROLES.attendee)) mapped.push(ROLES.attendee)
  }
  return mapped.length > 0 ? mapped : [ROLES.attendee]
}

function buildUserFromJwt(
  token: string,
  provider: SyncPassUser['authProvider'],
  fallback?: Partial<SyncPassUser>,
): SyncPassUser | null {
  const payload = parseJwtPayload(token)
  // Validación estructural y de expiración en cliente; la firma criptográfica se verifica en el servidor/BFF.
  if (!isTokenUnexpired(payload)) {
    return null
  }
  const email =
    (payload?.email as string) ||
    (payload?.['cognito:username'] as string) ||
    fallback?.email ||
    ''
  if (!email) return null

  return {
    id: (payload?.sub as string) || fallback?.id || email,
    email,
    name: (payload?.name as string) || fallback?.name || email.split('@')[0],
    roles: fallback?.roles && fallback.roles.length > 0 ? fallback.roles : mapRolesFromPayload(payload),
    authProvider: provider,
  }
}

function getInitialAuth(): { user: SyncPassUser | null; token: string | null } {
  if (typeof window === 'undefined') {
    return { user: null, token: null }
  }

  try {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
    const savedUserStr = localStorage.getItem(STORAGE_KEY_USER)
    if (savedToken && savedUserStr) {
      const parsedUser = JSON.parse(savedUserStr) as SyncPassUser
      const restored = buildUserFromJwt(savedToken, parsedUser.authProvider || 'bff', parsedUser)
      if (restored) {
        return { user: restored, token: savedToken }
      }
    }
  } catch {
    // Limpiar sesión corrupta o expirada
  }

  localStorage.removeItem(STORAGE_KEY_USER)
  localStorage.removeItem(STORAGE_KEY_TOKEN)
  return { user: null, token: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => getInitialAuth())
  const [user, setUser] = useState<SyncPassUser | null>(initial.user)
  const [token, setToken] = useState<string | null>(initial.token)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return Boolean(params.get('code'))
  })

  const loginWithToken = (
    rawToken: string,
    userInfo?: Partial<SyncPassUser>,
    provider: SyncPassUser['authProvider'] = 'bff',
  ): boolean => {
    const verifiedUser = buildUserFromJwt(rawToken, provider, userInfo)
    if (!verifiedUser) {
      setAuthError('El token recibido es inválido o ha expirado.')
      setUser(null)
      setToken(null)
      localStorage.removeItem(STORAGE_KEY_USER)
      localStorage.removeItem(STORAGE_KEY_TOKEN)
      return false
    }
    setAuthError(null)
    setUser(verifiedUser)
    setToken(rawToken)
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(verifiedUser))
    localStorage.setItem(STORAGE_KEY_TOKEN, rawToken)
    return true
  }

  // Manejar retorno de Authorization Code (?code=...) con PKCE desde Cognito (sin secreto en navegador)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.search.includes('code=')) {
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')
    const verifier = sessionStorage.getItem('cognito_code_verifier') || ''

    if (!code) {
      return
    }

    const currentRedirectUri = `${window.location.origin}/`
    exchangeCodeForTokens(COGNITO_DOMAIN, COGNITO_CLIENT_ID, currentRedirectUri, code, verifier)
      .then((tokens) => {
        const idPayload = parseJwtPayload(tokens.id_token)
        const sessionToken = tokens.id_token || tokens.access_token
        const ok = loginWithToken(
          sessionToken,
          {
            id: idPayload?.sub as string | undefined,
            email: idPayload?.email as string | undefined,
            name: idPayload?.name as string | undefined,
            roles: mapRolesFromPayload(idPayload),
          },
          'cognito',
        )
        sessionStorage.removeItem('cognito_code_verifier')
        window.history.replaceState(null, '', window.location.pathname)

        if (ok && (window.location.pathname === '/' || window.location.pathname === '/login')) {
          window.location.href = '/dashboard'
        }
      })
      .catch((err) => {
        // Sin respaldo ficticio: si falla el intercambio con Cognito, la sesión permanece cerrada.
        setUser(null)
        setToken(null)
        localStorage.removeItem(STORAGE_KEY_USER)
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        sessionStorage.removeItem('cognito_code_verifier')
        window.history.replaceState(null, '', window.location.pathname)
        setAuthError(err instanceof Error ? err.message : 'Error validando sesión con AWS Cognito')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const loginWithCognito = () => {
    setAuthError(null)
    startCognitoLogin(COGNITO_DOMAIN, COGNITO_CLIENT_ID, COGNITO_REDIRECT_URI)
  }

  const logout = () => {
    const isCognito = user?.authProvider === 'cognito'
    setUser(null)
    setToken(null)
    setAuthError(null)
    localStorage.removeItem(STORAGE_KEY_USER)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    sessionStorage.clear()

    if (isCognito && typeof window !== 'undefined') {
      window.location.href = COGNITO_LOGOUT_URL
    } else if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        roles: user?.roles ?? [],
        isAuthenticated: !!user && !!token,
        isLoading,
        authError,
        loginWithCognito,
        loginWithToken,
        clearAuthError: () => setAuthError(null),
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
