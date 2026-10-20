// Cliente HTTP del BFF (ver README Paso 9).
// El token se obtiene con getAccessTokenSilently() de Auth0.
import { BFF_URL, type BffUser } from '../config/auth.ts'

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
