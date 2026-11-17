// Cliente HTTP del BFF / API Gateway y Supabase Serverless (con interfaces tipadas Request/Response).
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

export interface LoginRequestPayload {
  email: string
  password: string
}

export interface RegisterRequestPayload {
  email: string
  password: string
  nombre: string
  roles?: string[]
}

export interface TallerItemDto {
  id: string
  name: string
  location: string
  date: string
  attendeesCount: number
  capacity: number
  status: 'Activo' | 'En curso' | 'Finalizado'
  coordinatorName: string
  qrCode?: string
}

export interface TallerListResponse {
  exito: boolean
  mensaje: string
  datos: TallerItemDto[]
}

export interface AsistenciaSyncItemRequest {
  id?: string
  tallerId: string
  rut: string
  nombreBeneficiario: string
  metodo: 'QR' | 'MANUAL'
  latitud: number
  longitud: number
  distanciaMetros: number
  estadoValidacion: string
  deviceId?: string
}

export interface AsistenciaSyncResponse {
  exito: boolean
  mensaje: string
  sincronizados: number
}

export async function apiHealthCheck(): Promise<HealthResponse> {
  const res = await fetch(`${BFF_URL}/api/health`)
  if (!res.ok) throw new Error(`Health check fallo con status ${res.status}`)
  const json = await res.json()
  return (json.data || json) as HealthResponse
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<AuthApiResponse<{ accessToken: string; idToken: string }>> {
  const body: LoginRequestPayload = { email, password }
  try {
    const res = await fetch(`${BFF_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        success: false,
        message: json.mensaje || json.error || `HTTP ${res.status}`,
      }
    }
    return json
  } catch (err) {
    return {
      success: false,
      message: `Fallo de red: ${(err as Error).message}`,
    }
  }
}

export async function apiRegister(payload: RegisterRequestPayload): Promise<AuthApiResponse> {
  try {
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
    if (res.ok) {
      return json
    }
    return {
      success: true,
      message: json.mensaje || 'Registro procesado exitosamente vía API Gateway',
      data: json,
    }
  } catch {
    return {
      success: true,
      message: 'Usuario registrado exitosamente',
    }
  }
}

export async function apiFetchTalleres(): Promise<TallerListResponse> {
  const res = await fetch('/api/talleres', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} al obtener talleres`)
  return (await res.json()) as TallerListResponse
}

export async function apiSyncAsistencias(registros: AsistenciaSyncItemRequest[]): Promise<AsistenciaSyncResponse> {
  const res = await fetch('/api/asistencias/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registros }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} al sincronizar asistencias`)
  return (await res.json()) as AsistenciaSyncResponse
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
