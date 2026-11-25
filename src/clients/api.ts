// Cliente HTTP del BFF / API Gateway y funciones serverless SyncPass (con JWT Bearer).
import { BFF_URL, type BffUser } from '../config/auth.ts'

export interface HealthResponse {
  service: string
  status: string
  database?: string
  timestamp?: string
}

export interface AuthSessionData {
  accessToken: string
  idToken?: string
  user?: {
    id: string
    email: string
    name?: string
    roles: string[]
  }
}

export interface AuthApiResponse<T = AuthSessionData> {
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
  timestamp?: number
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
  datos?: AsistenciaSyncItemRequest[]
}

export function authHeaders(token?: string | null, extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function apiHealthCheck(): Promise<HealthResponse> {
  const res = await fetch(`${BFF_URL}/api/health`)
  if (!res.ok) throw new Error(`Health check fallo con status ${res.status}`)
  const json = await res.json()
  return (json.data || json) as HealthResponse
}

async function postAuthEndpoint(
  endpointPath: string,
  payload: unknown,
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  // Primero intenta API serverless same-origin (/api/auth/*) si no hay gateway dedicado,
  // o el API Gateway si está operativo. Nunca fabrica sesiones si ambos fallan.
  const endpoints = BFF_URL && !BFF_URL.includes('5xvspck6jb')
    ? [`${BFF_URL}${endpointPath}`, endpointPath]
    : [`${BFF_URL}${endpointPath}`, endpointPath]

  let lastStatus = 503
  let lastJson: Record<string, unknown> = {}
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (res.status !== 502 && res.status !== 503 && res.status !== 404) {
        return { ok: res.ok, status: res.status, json }
      }
      lastStatus = res.status
      lastJson = json
    } catch (err) {
      lastJson = { mensaje: `Fallo de red: ${(err as Error).message}` }
    }
  }
  return { ok: false, status: lastStatus, json: lastJson }
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<AuthApiResponse<AuthSessionData>> {
  const body: LoginRequestPayload = { email, password }
  const { ok, status, json } = await postAuthEndpoint('/api/auth/login', body)
  const data = json.data as AuthSessionData | undefined
  if (!ok || !data?.accessToken) {
    return {
      success: false,
      message:
        (json.mensaje as string) ||
        (json.message as string) ||
        (json.error as string) ||
        `Autenticación rechazada (HTTP ${status})`,
    }
  }
  return {
    success: true,
    data,
    message: (json.message as string) || (json.mensaje as string),
  }
}

export async function apiRegister(payload: RegisterRequestPayload): Promise<AuthApiResponse<AuthSessionData>> {
  const requestBody = {
    email: payload.email,
    password: payload.password,
    nombre: payload.nombre,
    roles: payload.roles || ['attendee'],
  }
  const { ok, status, json } = await postAuthEndpoint('/api/auth/registro', requestBody)
  if (!ok) {
    return {
      success: false,
      message:
        (json.mensaje as string) ||
        (json.message as string) ||
        (json.error as string) ||
        `No se pudo completar el registro (HTTP ${status})`,
    }
  }
  return {
    success: true,
    message: (json.message as string) || (json.mensaje as string) || 'Usuario registrado exitosamente',
    data: json.data as AuthSessionData | undefined,
  }
}

export async function apiFetchTalleres(token?: string | null): Promise<TallerListResponse> {
  const res = await fetch('/api/talleres', {
    method: 'GET',
    headers: authHeaders(token, { Accept: 'application/json' }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} al obtener talleres`)
  return (await res.json()) as TallerListResponse
}

export async function apiSyncAsistencias(
  registros: AsistenciaSyncItemRequest[],
  token?: string | null,
): Promise<AsistenciaSyncResponse> {
  if (registros.length === 0) {
    throw new Error('No hay registros pendientes para sincronizar')
  }
  const res = await fetch('/api/asistencias/sync', {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ registros }),
  })
  const json = (await res.json().catch(() => ({}))) as Partial<AsistenciaSyncResponse>
  if (!res.ok || !json.exito) {
    throw new Error(json.mensaje || `HTTP ${res.status} al sincronizar asistencias`)
  }
  return json as AsistenciaSyncResponse
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BFF_URL}${path}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/** Lista de usuarios (BFF exige rol admin en el JWT). */
export function apiGetUsers(token: string): Promise<BffUser[]> {
  return apiGet<BffUser[]>('/api/users', token)
}
