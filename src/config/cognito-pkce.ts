/**
 * Utilidades para el flujo OAuth 2.0 Authorization Code Grant con PKCE
 * compatible con Amazon Cognito User Pools (RFC 7636).
 */

export function generateRandomString(length = 64): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  if (typeof window !== 'undefined' && window.crypto) {
    const values = new Uint8Array(length)
    window.crypto.getRandomValues(values)
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length]
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)]
    }
  }
  return result
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return verifier
  }
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function startCognitoLogin(
  domain: string,
  clientId: string,
  redirectUri: string,
): Promise<void> {
  const verifier = generateRandomString(64)
  sessionStorage.setItem('cognito_code_verifier', verifier)
  const challenge = await generateCodeChallenge(verifier)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'email openid phone',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `${domain}/login?${params.toString()}`
}

export async function exchangeCodeForTokens(
  domain: string,
  clientId: string,
  redirectUri: string,
  code: string,
  verifier: string,
): Promise<{ id_token: string; access_token: string }> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  })

  const res = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Cognito token error: ${errorBody}`)
  }

  return res.json() as Promise<{ id_token: string; access_token: string }>
}
