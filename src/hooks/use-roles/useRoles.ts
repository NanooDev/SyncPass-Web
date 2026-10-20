import { useAuth0 } from '@auth0/auth0-react'
import { ROLES_CLAIM } from '../../config/auth.ts'
import { useAuth } from '../use-auth/useAuth.ts'

/** Lee los roles del usuario activo (soporta AWS Cognito, AuthContext y Auth0). */
export function useUserRoles(): string[] {
  const auth = useAuth()
  const { user: auth0User } = useAuth0()

  if (auth.isAuthenticated && auth.roles.length > 0) {
    return auth.roles
  }

  const claim = (auth0User as Record<string, unknown> | undefined)?.[ROLES_CLAIM]
  if (Array.isArray(claim)) {
    return claim.filter((r): r is string => typeof r === 'string')
  }

  return []
}

/** True si el usuario tiene al menos uno de los roles indicados. */
export function useHasRole(...slugs: string[]): boolean {
  const roles = useUserRoles()
  return slugs.some((s) => roles.includes(s))
}
