# Guía de Integración AWS Cognito — SyncPass Web

> **Integrantes (Dupla):** Mariano Acevedo (@NanooDev) y Álvaro León (alv.leon@duocuc.cl)  
> **Servicio Cloud:** Amazon Web Services (AWS) — Amazon Cognito User Pools  
> **Flujo:** Cliente SPA Público con Authorization Code + PKCE (RFC 7636, sin `client_secret`)

---

## 1. Parámetros del User Pool

- **Región:** `us-east-1` (US East - N. Virginia)
- **User Pool ID:** `us-east-1_RlB8Ft9Z2`
- **App Client:** Cliente público **sin secreto de cliente** (PKCE S256)
- **Dominio Hosted UI:** `https://us-east-1rlb8ft9z2.auth.us-east-1.amazoncognito.com`
- **Flujo OAuth:** Authorization Code Grant con PKCE S256 (`code_challenge` + `code_verifier`)
- **Scopes permitidos:** `openid`, `email`, `phone`
- **URL de Retorno Web:** `http://localhost:5173/` y dominio Vercel configurado

---

## 2. Reglas de Seguridad Aplicadas (SPA Pública)

1. **Cero secretos en el cliente Vite:** Nunca se define ni exporta `VITE_COGNITO_CLIENT_SECRET` en `.env`, `.env.production` ni `src/config/auth.ts`. El App Client en AWS Cognito debe configurarse como **Public client** ("Don't generate a client secret").
2. **Validación estricta en backend y BFF:** El navegador valida estructura y expiración (`exp`) del JWT recibido; los endpoints `/api/*` de Vercel y Spring Boot (`bff`) verifican la firma criptográfica del JWT (`RS256` vía JWKS de Cognito/Auth0 o `HS256` vía `SYNCPASS_JWT_SECRET` en servidor) y exigen los roles RBAC correspondientes.
3. **Sin sesiones ficticias de respaldo:** Si falla el intercambio OAuth2 (`?code=...`) o el login contra backend, la sesión permanece cerrada y se muestra el error correspondiente sin generar tokens simulados.

---

## 3. Verificación en la Consola de AWS

1. Entra a **AWS Cognito** → User Pool `us-east-1_RlB8Ft9Z2`.
2. Ve a **App integration** → **App clients**.
3. Asegúrate de usar un **Public client** (sin Client Secret; si existía un secreto previo en el repositorio, rótalo o crea un nuevo cliente público sin secreto).
4. Verifica **Allowed callback URLs** / **Allowed sign-out URLs** (`http://localhost:5173/`, dominio Vercel de producción y `com.example.kotlinlogin://cognito/callback` para Android).
5. Habilita **Authorization code grant** y los scopes **OpenID**, **Email** y **Phone**.
