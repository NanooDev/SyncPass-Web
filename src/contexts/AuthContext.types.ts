import type { Role } from '../config/auth.ts'

export interface SyncPassUser {
  id: string
  email: string
  name?: string
  roles: Role[]
  authProvider: 'cognito' | 'bff' | 'auth0'
}

export interface AuthContextType {
  user: SyncPassUser | null
  roles: Role[]
  isAuthenticated: boolean
  isLoading: boolean
  authError: string | null
  loginWithCognito: () => void
  loginWithToken: (
    token: string,
    userInfo?: Partial<SyncPassUser>,
    provider?: SyncPassUser['authProvider'],
  ) => boolean
  clearAuthError: () => void
  logout: () => void
  token: string | null
}
