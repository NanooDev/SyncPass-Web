import type { Role } from '../config/auth.ts'

export interface SyncPassUser {
  id: string
  email: string
  name?: string
  roles: Role[]
  authProvider: 'cognito' | 'local' | 'auth0'
}

export interface AuthContextType {
  user: SyncPassUser | null
  roles: Role[]
  isAuthenticated: boolean
  isLoading: boolean
  loginWithCognito: () => void
  logout: () => void
  loginLocal: (email: string, role?: Role) => void
  switchRole: (role: Role) => void
  token: string | null
}
