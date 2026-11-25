// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { signSessionJwt } from './_lib/auth.js'
import usuariosHandler from './usuarios.js'
import talleresHandler from './talleres.js'
import asistenciasHandler from './asistencias.js'
import encuestasHandler from './encuestas.js'
import notificarHandler from './notificar.js'

function createMockRes() {
  const headers: Record<string, string> = {}
  const res: any = {
    statusCode: 200,
    body: null as any,
    setHeader(k: string, v: string) {
      headers[k] = v
    },
    getHeader(k: string) {
      return headers[k]
    },
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(data: unknown) {
      res.body = data
      return res
    },
    end() {
      return res
    },
    headers,
  }
  return res
}

describe('Seguridad uniforme y RBAC en Vercel API (/api/*)', () => {
  const prevSupabaseKey = process.env.SUPABASE_KEY

  afterEach(() => {
    vi.restoreAllMocks()
    process.env.SUPABASE_KEY = prevSupabaseKey
  })

  it('rechaza con 401 peticiones sin Bearer token o con token falso en todos los endpoints protegidos', async () => {
    const handlers = [usuariosHandler, talleresHandler, asistenciasHandler, encuestasHandler, notificarHandler]
    for (const h of handlers) {
      const reqNoAuth: any = { method: 'GET', headers: { origin: 'http://localhost:5173' } }
      const resNoAuth = createMockRes()
      await h(reqNoAuth, resNoAuth)
      expect(resNoAuth.statusCode).toBe(401)
      expect(resNoAuth.headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')

      const reqFakeTok: any = {
        method: 'GET',
        headers: { authorization: 'Bearer mock-token-123456', origin: 'https://evil-sync-pass.vercel.app' },
      }
      const resFakeTok = createMockRes()
      await h(reqFakeTok, resFakeTok)
      expect(resFakeTok.statusCode).toBe(401)
      expect(resFakeTok.headers['Access-Control-Allow-Origin']).toBeUndefined()
    }
  })

  it('aplica RBAC por rol: voluntario recibe 403 en /api/usuarios, POST /api/talleres y /api/notificar', async () => {
    const volToken = signSessionJwt({ id: 'v1', email: 'vol@duocuc.cl', roles: ['volunteer'] })

    const resUsers = createMockRes()
    await usuariosHandler({ method: 'GET', headers: { authorization: `Bearer ${volToken}` } } as any, resUsers)
    expect(resUsers.statusCode).toBe(403)

    const resTallerPost = createMockRes()
    await talleresHandler(
      { method: 'POST', headers: { authorization: `Bearer ${volToken}` }, body: { name: 'T' } } as any,
      resTallerPost,
    )
    expect(resTallerPost.statusCode).toBe(403)

    const resNotify = createMockRes()
    await notificarHandler(
      { method: 'POST', headers: { authorization: `Bearer ${volToken}` }, body: { message: 'hola' } } as any,
      resNotify,
    )
    expect(resNotify.statusCode).toBe(403)
  })

  it('acepta sincronización batch real con JWT válido de voluntario y rechaza lotes vacíos con 400', async () => {
    process.env.SUPABASE_KEY = 'test-server-key'
    const volToken = signSessionJwt({ id: 'v1', email: 'vol@duocuc.cl', roles: ['volunteer'] })

    const resEmpty = createMockRes()
    await asistenciasHandler(
      { method: 'POST', headers: { authorization: `Bearer ${volToken}` }, body: { registros: [] } } as any,
      resEmpty,
    )
    expect(resEmpty.statusCode).toBe(400)

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [{ id_beneficiario: '00000000-0000-0000-0003-000000000001' }],
      }),
    )

    const resValid = createMockRes()
    await asistenciasHandler(
      {
        method: 'POST',
        headers: { authorization: `Bearer ${volToken}` },
        body: {
          registros: [
            {
              tallerId: '00000000-0000-0000-0002-000000000001',
              rut: '18.111.222-3',
              nombreBeneficiario: 'Ana',
              distanciaMetros: 20,
            },
          ],
        },
      } as any,
      resValid,
    )
    expect(resValid.statusCode).toBe(201)
    expect(resValid.body.exito).toBe(true)
    expect(resValid.body.sincronizados).toBe(1)
  })
})
