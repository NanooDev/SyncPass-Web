// Config centralizada del front: un solo archivo.
// Cada valor sale de `VITE_*` (/.env.local en local) con default en duro.
const env = import.meta.env

// Configuración AWS Cognito de Mariano (User Pool SyncPass)
export const COGNITO_USER_POOL_ID: string =
  env.VITE_COGNITO_USER_POOL_ID ?? 'us-east-1_RlB8Ft9Z2'

export const COGNITO_CLIENT_ID: string =
  env.VITE_COGNITO_CLIENT_ID ?? '2988naivr3qfmjhhm35k5lubvd'

export const COGNITO_DOMAIN: string =
  env.VITE_COGNITO_DOMAIN ??
  'https://us-east-1rlb8ft9z2.auth.us-east-1.amazoncognito.com'

export const COGNITO_REDIRECT_URI: string =
  (env.VITE_COGNITO_REDIRECT_URI && env.VITE_COGNITO_REDIRECT_URI.startsWith('http'))
    ? env.VITE_COGNITO_REDIRECT_URI
    : (typeof window !== 'undefined' ? window.location.origin + '/' : 'http://localhost:5173/')

// URL de login con flujo seguro Authorization Code Grant (estándar AWS Cognito)
export const COGNITO_LOGIN_URL = `${COGNITO_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(
  COGNITO_REDIRECT_URI,
)}`

export const COGNITO_LOGOUT_URL = `${COGNITO_DOMAIN}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(
  COGNITO_REDIRECT_URI,
)}`

// Configuración Auth0 (mantenida para compatibilidad con código base)
export const AUTH0_DOMAIN: string =
  env.VITE_AUTH0_DOMAIN ?? 'dev-qd6i88udlr5yzjtv.us.auth0.com'
export const AUTH0_CLIENT_ID: string =
  env.VITE_AUTH0_CLIENT_ID ?? 'zpg5yYHLp9KiFYj0tNaZO8eaSfMGrgcZ'

// Custom claim donde la Post-Login Action inyecta los roles
export const ROLES_CLAIM: string =
  env.VITE_AUTH0_ROLES_CLAIM ?? 'https://sync-pass/roles'

// API registrada en Auth0 (Applications -> APIs)
export const AUTH0_AUDIENCE: string =
  env.VITE_AUTH0_AUDIENCE ?? 'https://sync-pass-api'

// URL del BFF / API Gateway (HTTPS Seguro)
const rawBffUrl = env.VITE_BFF_URL ?? 'https://5xvspck6jb.execute-api.us-east-1.amazonaws.com'
export const BFF_URL: string =
  rawBffUrl.includes('54.164.69.142') || !rawBffUrl.startsWith('http')
    ? 'https://5xvspck6jb.execute-api.us-east-1.amazonaws.com'
    : rawBffUrl

export interface BffUser {
  id: string
  email: string
  role: string
}

// Slugs de roles para SyncPass (RBAC)
export const ROLES = {
  admin: 'admin',
  coordinator: 'coordinator',
  volunteer: 'volunteer',
  attendee: 'attendee',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.admin]: 'Administrador',
  [ROLES.coordinator]: 'Docente / Coordinador',
  [ROLES.volunteer]: 'Estudiante Voluntario',
  [ROLES.attendee]: 'Beneficiario Comunitario',
}
