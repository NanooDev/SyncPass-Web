import { useContext } from 'react'
import { AuthContext } from '../../contexts/auth-context.ts'
import type { AuthContextType } from '../../contexts/AuthContext.types.ts'

export function useAuth(): AuthContextType {
  return useContext(AuthContext)
}
