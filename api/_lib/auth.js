import crypto from 'node:crypto'

const DEFAULT_ALLOWED_ORIGINS = [
  'https://sync-pass-web-rho.vercel.app',
  'https://citt-sync-pass-front.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_RlB8Ft9Z2'
const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1'
const COGNITO_ISSUER =
  process.env.COGNITO_ISSUER ||
  `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '2988naivr3qfmjhhm35k5lubvd'

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'dev-qd6i88udlr5yzjtv.us.auth0.com'
const AUTH0_ISSUER = process.env.AUTH0_ISSUER || `https://${AUTH0_DOMAIN}/`
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://sync-pass-api'
const AUTH0_ROLES_CLAIM = process.env.AUTH0_ROLES_CLAIM || 'https://sync-pass/roles'

// Secreto HMAC para tokens emitidos por el propio BFF/API; en producción debe venir de env.
// En desarrollo sin env se usa un secreto aleatorio efímero en memoria (nunca un secreto fijo débil).
const EPHEMERAL_DEV_SECRET = crypto.randomBytes(32).toString('hex')
const SESSION_ISSUER = 'syncpass-api'

const jwksCache = new Map()

function getJwtSecret() {
  if (process.env.SYNCPASS_JWT_SECRET) {
    return process.env.SYNCPASS_JWT_SECRET
  }
  if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
    return ''
  }
  return EPHEMERAL_DEV_SECRET
}

export function getAllowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const origins = new Set(fromEnv.length > 0 ? fromEnv : DEFAULT_ALLOWED_ORIGINS)
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`)
  }
  return Array.from(origins)
}

export function applyCors(req, res, methods = 'GET,POST,OPTIONS') {
  const origin = req.headers?.origin
  const allowed = getAllowedOrigins()
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  if (req.method === 'OPTIONS') {
    if (origin && !res.getHeader('Access-Control-Allow-Origin')) {
      res.status(403).json({ exito: false, mensaje: 'Origen CORS no permitido' })
      return false
    }
    res.status(200).end()
    return true
  }

  return null
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(segment) {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((segment.length + 3) % 4)
  return Buffer.from(padded, 'base64')
}

export function signSessionJwt(userPayload, expiresInSeconds = 28800) {
  const secret = getJwtSecret()
  if (!secret) {
    throw new Error('SYNCPASS_JWT_SECRET no configurado para emitir sesiones firmadas')
  }
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    sub: userPayload.id || userPayload.email,
    email: userPayload.email,
    name: userPayload.name || userPayload.email,
    roles: normalizeRoles(userPayload.roles),
    iss: SESSION_ISSUER,
    aud: 'syncpass-web',
    iat: now,
    exp: now + expiresInSeconds,
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const sig = crypto.createHmac('sha256', secret).update(signingInput).digest()
  return `${signingInput}.${base64UrlEncode(sig)}`
}

export function normalizeRoles(rawRoles) {
  const list = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []
  const normalized = new Set()
  for (const r of list) {
    const val = String(r || '').trim().toLowerCase()
    if (val === 'admin' || val === 'administrador') normalized.add('admin')
    else if (val === 'coordinator' || val === 'docente') normalized.add('coordinator')
    else if (val === 'volunteer' || val === 'voluntario' || val === 'estudiante_voluntario') normalized.add('volunteer')
    else if (val === 'attendee' || val === 'beneficiario' || val === 'vecino') normalized.add('attendee')
  }
  return Array.from(normalized)
}

async function fetchJwks(jwksUri) {
  const cached = jwksCache.get(jwksUri)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.keys
  }
  const res = await fetch(jwksUri)
  if (!res.ok) {
    throw new Error(`No se pudo obtener JWKS (${res.status})`)
  }
  const data = await res.json()
  const keys = Array.isArray(data?.keys) ? data.keys : []
  jwksCache.set(jwksUri, { keys, expiresAt: Date.now() + 10 * 60 * 1000 })
  return keys
}

async function verifyRs256Jwt(signingInput, sigBytes, header, payload) {
  let jwksUri = ''
  if (payload.iss === COGNITO_ISSUER) {
    if (payload.token_use === 'access') {
      if (payload.client_id !== COGNITO_CLIENT_ID) {
        throw new Error('client_id de Cognito no coincide')
      }
    } else if (payload.token_use === 'id') {
      if (payload.aud !== COGNITO_CLIENT_ID) {
        throw new Error('aud de Cognito no coincide')
      }
    } else {
      throw new Error('token_use de Cognito inválido')
    }
    jwksUri = `${COGNITO_ISSUER}/.well-known/jwks.json`
  } else if (payload.iss === AUTH0_ISSUER) {
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!aud.includes(AUTH0_AUDIENCE)) {
      throw new Error('Audience de Auth0 no autorizada')
    }
    jwksUri = `${AUTH0_ISSUER}.well-known/jwks.json`
  } else {
    throw new Error('Emisor JWT RS256 no reconocido')
  }

  const keys = await fetchJwks(jwksUri)
  const jwk = keys.find((k) => k.kid === header.kid)
  if (!jwk) {
    throw new Error('Clave pública (kid) no encontrada en JWKS')
  }
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' })
  const valid = crypto.verify('RSA-SHA256', Buffer.from(signingInput, 'utf8'), publicKey, sigBytes)
  if (!valid) {
    throw new Error('Firma JWT RS256 inválida')
  }
}

function verifyHs256Jwt(signingInput, sigBytes, payload) {
  const secret = getJwtSecret()
  if (!secret) {
    throw new Error('SYNCPASS_JWT_SECRET no configurado en el servidor')
  }
  if (payload.iss !== SESSION_ISSUER || payload.aud !== 'syncpass-web') {
    throw new Error('Emisor o audiencia de sesión HS256 inválido')
  }
  const expectedSig = crypto.createHmac('sha256', secret).update(signingInput).digest()
  if (expectedSig.length !== sigBytes.length || !crypto.timingSafeEqual(expectedSig, sigBytes)) {
    throw new Error('Firma JWT HS256 inválida')
  }
}

export async function verifyJwtToken(token) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) {
    throw new Error('Token JWT malformado')
  }
  const [headerSeg, payloadSeg, sigSeg] = parts
  const header = JSON.parse(base64UrlDecode(headerSeg).toString('utf8'))
  const payload = JSON.parse(base64UrlDecode(payloadSeg).toString('utf8'))
  const sigBytes = base64UrlDecode(sigSeg)

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || Number(payload.exp) <= now) {
    throw new Error('Token JWT expirado')
  }

  const signingInput = `${headerSeg}.${payloadSeg}`
  if (header.alg === 'RS256') {
    await verifyRs256Jwt(signingInput, sigBytes, header, payload)
  } else if (header.alg === 'HS256') {
    verifyHs256Jwt(signingInput, sigBytes, payload)
  } else {
    throw new Error(`Algoritmo JWT no permitido: ${header.alg || 'none'}`)
  }

  const rawRoles =
    payload[AUTH0_ROLES_CLAIM] ??
    payload['cognito:groups'] ??
    payload.roles ??
    payload.role ??
    []

  const roles = normalizeRoles(rawRoles)
  return {
    id: String(payload.sub || payload.email || 'usuario'),
    email: String(payload.email || payload['cognito:username'] || payload.sub || ''),
    name: String(payload.name || payload.email || 'Usuario SyncPass'),
    roles: roles.length > 0 ? roles : ['attendee'],
    issuer: String(payload.iss || ''),
  }
}

export async function requireAuth(req, res, allowedRoles = []) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(String(authHeader).trim())
  if (!match) {
    res.status(401).json({
      exito: false,
      mensaje: 'No autorizado: se requiere token Bearer válido',
    })
    return { ok: false, user: null }
  }

  try {
    const user = await verifyJwtToken(match[1])
    if (allowedRoles.length > 0 && !allowedRoles.some((role) => user.roles.includes(role))) {
      res.status(403).json({
        exito: false,
        mensaje: `Acceso denegado: requiere rol ${allowedRoles.join(' o ')}`,
      })
      return { ok: false, user: null }
    }
    return { ok: true, user }
  } catch (err) {
    res.status(401).json({
      exito: false,
      mensaje: err instanceof Error ? err.message : 'Token inválido o expirado',
    })
    return { ok: false, user: null }
  }
}
