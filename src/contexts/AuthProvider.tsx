import { useState, type ReactNode } from 'react'
import {
  COGNITO_LOGIN_URL,
  COGNITO_LOGOUT_URL,
  ROLES,
  type Role,
} from '../config/auth.ts'
import type { SyncPassUser } from './AuthContext.types.ts'
import { AuthContext } from './auth-context.ts'

const STORAGE_KEY_USER = 'syncpass_user'
const STORAGE_KEY_TOKEN = 'syncpass_token'

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1]
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

function getInitialAuth(): { user: SyncPassUser | null; token: string | null } {
  if (typeof window === 'undefined') {
    return { user: null, token: null }
  }

  // 1. Detectar retorno desde AWS Cognito Hosted UI
  if (window.location.hash.includes('id_token=')) {
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const idToken = hashParams.get('id_token')
      const accessToken = hashParams.get('access_token')

      if (idToken) {
        const payload = parseJwtPayload(idToken)
        const email =
          (payload?.email as string) ||
          (payload?.['cognito:username'] as string) ||
          'usuario@cognito.aws'

        const cognitoGroups = (payload?.['cognito:groups'] as string[]) || []
        const mappedRoles: Role[] = cognitoGroups.includes('admin')
          ? [ROLES.admin]
          : cognitoGroups.includes('volunteer')
            ? [ROLES.volunteer]
            : cognitoGroups.includes('attendee')
              ? [ROLES.attendee]
              : [ROLES.coordinator]

        const cognitoUser: SyncPassUser = {
          id: (payload?.sub as string) || 'cognito-user',
          email,
          name: (payload?.name as string) || email.split('@')[0],
          roles: mappedRoles,
          authProvider: 'cognito',
        }

        const validToken = accessToken || idToken
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(cognitoUser))
        localStorage.setItem(STORAGE_KEY_TOKEN, validToken)
        window.history.replaceState(null, '', window.location.pathname)

        return { user: cognitoUser, token: validToken }
      }
    } catch {
      // Ignorar error de parseo
    }
  }

  // 2. Restaurar sesión de localStorage
  try {
    const savedUserStr = localStorage.getItem(STORAGE_KEY_USER)
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
    if (savedUserStr) {
      return {
        user: JSON.parse(savedUserStr) as SyncPassUser,
        token: savedToken,
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY_USER)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
  }

  return { user: null, token: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => getInitialAuth())
  const [user, setUser] = useState<SyncPassUser | null>(initial.user)
  const [token, setToken] = useState<string | null>(initial.token)

  const loginWithCognito = () => {
    window.location.href = COGNITO_LOGIN_URL
  }

  const logout = () => {
    const isCognito = user?.authProvider === 'cognito'
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY_USER)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    sessionStorage.clear()

    if (isCognito && typeof window !== 'undefined') {
      window.location.href = COGNITO_LOGOUT_URL
    } else {
      window.location.href = '/'
    }
  }

  const loginLocal = (email: string, role: Role = ROLES.coordinator) => {
    const localUser: SyncPassUser = {
      id: `local-${Date.now()}`,
      email,
      name: email.split('@')[0],
      roles: [role],
      authProvider: 'local',
    }
    const mockToken = `mock-token-${Date.now()}`
    setUser(localUser)
    setToken(mockToken)
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(localUser))
    localStorage.setItem(STORAGE_KEY_TOKEN, mockToken)
  }

  const switchRole = (role: Role) => {
    const roleEmailMap: Record<Role, string> = {
      [ROLES.coordinator]: 'docente.coordinador@duocuc.cl',
      [ROLES.volunteer]: 'voluntario.estudiante@duocuc.cl',
      [ROLES.attendee]: 'maria.gonzalez@comunidad.cl',
      [ROLES.admin]: 'admin.syncpass@duocuc.cl',
    }

    const updatedUser: SyncPassUser = {
      id: `user-${role}`,
      email: roleEmailMap[role],
      name: roleEmailMap[role].split('@')[0],
      roles: [role],
      authProvider: 'local',
    }
    setUser(updatedUser)
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        roles: user?.roles ?? [],
        isAuthenticated: !!user,
        isLoading: false,
        loginWithCognito,
        logout,
        loginLocal,
        switchRole,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
