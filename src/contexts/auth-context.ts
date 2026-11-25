import { createContext } from 'react'
import type { AuthContextType } from './AuthContext.types.ts'

export const defaultAuthContext: AuthContextType = {
  user: null,
  roles: [],
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  loginWithCognito: () => {},
  loginWithToken: () => false,
  clearAuthError: () => {},
  logout: () => {},
  token: null,
}

export const AuthContext = createContext<AuthContextType>(defaultAuthContext)
