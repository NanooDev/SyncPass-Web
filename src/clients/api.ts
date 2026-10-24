// Cliente HTTP del BFF / API Gateway (ver README Paso 9).
import { BFF_URL, type BffUser } from '../config/auth.ts'

export interface HealthResponse {
  service: string
  status: string
  timestamp?: string
}

export interface AuthApiResponse<T = unknown> {
  success?: boolean
  data?: T
  message?: string
  error?: string
  mensaje?: string
}

export async function apiHealthCheck(): Promise<HealthResponse> {
  const res = await fetch(`${BFF_URL}/api/health`)
  if (!res.ok) throw new Error(`Health check fallo con status ${res.status}`)
  const json = await res.json()
  return (json.data || json) as HealthResponse
}

export async function apiLogin(email: string, password: string): Promise<AuthApiResponse<{ accessToken: string; idToken: string }>> {
  const res = await fetch(`${BFF_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.mensaje || json.error || `HTTP ${res.status}`)
  }
  return json
}

export async function apiRegister(payload: { email: string; password: string; nombre: string; roles?: string[] }): Promise<AuthApiResponse> {
  const res = await fetch(`${BFF_URL}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      nombre: payload.nombre,
      roles: payload.roles || ['coordinator'],
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.mensaje || json.error || `HTTP ${res.status}`)
  }
  return json
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BFF_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/** Lista de usuarios (BFF exige rol admin en el JWT). */
export function apiGetUsers(token: string): Promise<BffUser[]> {
  return apiGet<BffUser[]>('/api/users', token)
}
