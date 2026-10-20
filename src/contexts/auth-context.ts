import { createContext } from 'react'
import type { AuthContextType } from './AuthContext.types.ts'

export const defaultAuthContext: AuthContextType = {
  user: null,
  roles: [],
  isAuthenticated: false,
  isLoading: false,
  loginWithCognito: () => {},
  logout: () => {},
  loginLocal: () => {},
  switchRole: () => {},
  token: null,
}

export const AuthContext = createContext<AuthContextType>(defaultAuthContext)
