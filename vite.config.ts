import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
// @ts-expect-error serverless handler sin archivo d.ts
import talleresHandler from './api/talleres.js'
// @ts-expect-error serverless handler sin archivo d.ts
import usuariosHandler from './api/usuarios.js'
// @ts-expect-error serverless handler sin archivo d.ts
import healthHandler from './api/health.js'
// @ts-expect-error serverless handler sin archivo d.ts
import notificarHandler from './api/notificar.js'

function syncpassLocalApiPlugin() {
  return {
    name: 'syncpass-local-api',
    configureServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next()
        }

        const urlObj = new URL(req.url, 'http://localhost')
        const pathname = urlObj.pathname
        const query: Record<string, string> = {}
        urlObj.searchParams.forEach((v, k) => {
          query[k] = v
        })
        req.query = query

        let rawBody = ''
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          await new Promise<void>((resolve) => {
            req.on('data', (chunk: Buffer) => {
              rawBody += chunk.toString('utf8')
            })
            req.on('end', () => resolve())
          })
          try {
            req.body = rawBody ? JSON.parse(rawBody) : {}
          } catch {
            req.body = rawBody
          }
        }

        res.status = (code: number) => {
          res.statusCode = code
          return res
        }
        res.json = (data: unknown) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
          return res
        }

        if (pathname === '/api/talleres') {
          return talleresHandler(req, res)
        }
        if (pathname === '/api/usuarios') {
          return usuariosHandler(req, res)
        }
        if (pathname === '/api/health') {
          return healthHandler(req, res)
        }
        if (pathname.startsWith('/api/notificar')) {
          return notificarHandler(req, res)
        }

        return next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), syncpassLocalApiPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: ['**/*.css', 'api/**', 'src/test/**', 'src/main.tsx'],
    },
  },
})
