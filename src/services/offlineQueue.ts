import type { AsistenciaSyncItemRequest } from '../clients/api.ts'

export const STORAGE_KEY_OFFLINE_MODE = 'syncpass_offline_mode'
export const STORAGE_KEY_OFFLINE_QUEUE = 'syncpass_offline_queue'

export interface PendingAsistenciaRecord extends AsistenciaSyncItemRequest {
  id: string
  timestamp: number
  sincronizado: false
}

export function loadOfflineMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY_OFFLINE_MODE) === 'true'
  } catch {
    return false
  }
}

export function saveOfflineMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_MODE, enabled ? 'true' : 'false')
  } catch {
    // Almacenamiento bloqueado en navegador
  }
}

export function loadOfflineQueue(): PendingAsistenciaRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PendingAsistenciaRecord[]) : []
  } catch {
    return []
  }
}

function persistQueueOrThrow(queue: PendingAsistenciaRecord[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(queue))
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `No se pudo guardar la cola offline en localStorage: ${err.message}`
        : 'No se pudo guardar la cola offline en localStorage',
    )
  }
}

function createUuidFallback(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0')
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-a${hex().slice(1)}-${hex()}${hex()}${hex()}`
}

export function enqueueOfflineRecord(
  record: Omit<PendingAsistenciaRecord, 'sincronizado'>,
): PendingAsistenciaRecord[] {
  const current = loadOfflineQueue()
  const entry: PendingAsistenciaRecord = {
    ...record,
    id: record.id || createUuidFallback(),
    timestamp: record.timestamp || Date.now(),
    sincronizado: false,
  }
  const updated = [entry, ...current]
  persistQueueOrThrow(updated)
  return updated
}

export function removeSyncedRecords(syncedIds: string[]): PendingAsistenciaRecord[] {
  const idSet = new Set(syncedIds)
  const remaining = loadOfflineQueue().filter((item) => !idSet.has(item.id))
  persistQueueOrThrow(remaining)
  return remaining
}
