import { beforeEach, describe, expect, it } from 'vitest'
import {
  enqueueOfflineRecord,
  loadOfflineMode,
  loadOfflineQueue,
  removeSyncedRecords,
  saveOfflineMode,
} from './offlineQueue.ts'

describe('offlineQueue (Cola persistente en localStorage)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persiste el estado offline y los registros reales entre recargas y solo limpia los sincronizados', () => {
    saveOfflineMode(true)
    expect(loadOfflineMode()).toBe(true)

    enqueueOfflineRecord({
      id: 'rec-1',
      tallerId: 'T-101',
      rut: '18.111.222-3',
      nombreBeneficiario: 'Vecino Uno',
      metodo: 'QR',
      timestamp: 1700000000000,
      latitud: -33.5015,
      longitud: -70.6887,
      distanciaMetros: 22,
      estadoValidacion: 'valido',
      deviceId: 'WEB-SYNCPASS-PANEL',
    })
    enqueueOfflineRecord({
      id: 'rec-2',
      tallerId: 'T-101',
      rut: '19.333.444-5',
      nombreBeneficiario: 'Vecino Dos',
      metodo: 'MANUAL',
      timestamp: 1700000005000,
      latitud: -33.5015,
      longitud: -70.6887,
      distanciaMetros: 28,
      estadoValidacion: 'valido',
      deviceId: 'WEB-SYNCPASS-PANEL',
    })

    const persisted = loadOfflineQueue()
    expect(persisted).toHaveLength(2)
    expect(persisted.every((item) => item.sincronizado === false)).toBe(true)

    const afterPartialSync = removeSyncedRecords(['rec-1'])
    expect(afterPartialSync).toHaveLength(1)
    expect(afterPartialSync[0].id).toBe('rec-2')
  })
})
