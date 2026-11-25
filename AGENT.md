# Directrices de Agente IA, Registro de Prompts y Plan de Ejecución (`AGENT.md`)

**Repositorio:** `SyncPass-Web` — Frontend Web (React / TypeScript / Vite), API Serverless (Vercel `/api/*`), BFF Spring Boot (`bff/`) y DDL PostgreSQL (`docs/syncpass-ddl.sql`)  
**Repositorio hermano (Android Kotlin):** `SyncPass-Android` (`https://github.com/NanooDev/SyncPass-Android`)

---

## 1. Reglas de Ingeniería para el Agente IA (System Guidelines)

1. **Seguridad y Secretos en Cliente SPA:**
   * **Prohibido** exponer secretos (`VITE_COGNITO_CLIENT_SECRET`, `SUPABASE_KEY` o claves privadas) en variables `VITE_*` o en archivos `.env` versionados.
   * AWS Cognito en el navegador utiliza **Authorization Code Grant + PKCE S256** como cliente público sin `client_secret`.
   * Todos los endpoints en `api/*` (Vercel) y `bff/` (Spring Boot) validan tokens JWT firmados (`RS256` vía JWKS de Cognito/Auth0 o `HS256` vía `SYNCPASS_JWT_SECRET` en servidor), aplican RBAC por rol y restringen CORS a orígenes autorizados.
2. **Autenticación Real Obligatoria (Sin Sesiones Ficticias):**
   * El frontend nunca crea tokens `mock-token-*` ni otorga sesiones de respaldo ante fallos de red, rechazo de credenciales o errores en Cognito PKCE.
   * Solo `loginWithToken` restaura o inicia sesión con un JWT estructuralmente válido y no expirado emitido por el backend o Cognito.
3. **Cola Offline Persistente (Web + Vercel/BFF):**
   * Las acreditaciones registradas sin conexión o ante caída temporal de red se almacenan con estructura completa en `localStorage` (`src/services/offlineQueue.ts`).
   * El botón **"Sincronizar pendientes"** envía el lote real de registros hacia `/api/asistencias/sync` con `Authorization: Bearer <token>` y **solo limpia de la cola los registros confirmados con HTTP 2xx**.
4. **Persistencia Unificada en PostgreSQL (Supabase):**
   * El esquema relacional oficial reside en [`docs/syncpass-ddl.sql`](docs/syncpass-ddl.sql).
   * Tanto las funciones serverless `api/*.js` como los controladores Spring Boot en `bff/` (`SupabaseGatewayService`) leen y escriben en Supabase PostgREST con autorización RBAC verificada en servidor.

---

## 2. Checklist de Ingeniería Verificable (`SyncPass-Web`)

- [x] **Seguridad OAuth2 / PKCE y Secretos:**
  - [x] Retirar `VITE_COGNITO_CLIENT_SECRET` de `src/config/auth.ts`, `src/config/cognito-pkce.ts`, `src/contexts/AuthProvider.tsx` y `.gitignore`ar `.env` / `.env.*` dejando solo `.env.example`.
  - [x] Eliminar `loginLocal`, `switchRole` sin respaldo y el fallback ficticio de Cognito en `AuthProvider.tsx` y `LoginPage.tsx`.
- [x] **Autorización Uniforme y RBAC (`/api/*` + `bff/`):**
  - [x] Implementar `api/_lib/auth.js` (CORS por lista blanca, verificación RS256/JWKS y HS256, control de roles por endpoint y método).
  - [x] Proteger `/api/usuarios`, `/api/talleres`, `/api/asistencias`, `/api/asistencias/sync`, `/api/encuestas` y `/api/notificar` (evitando envío anónimo de avisos push).
  - [x] Conectar los 6 handlers + `/api/auth/*` + `/api/asistencias/sync` tanto en `vercel.json` como en el middleware local de `vite.config.ts`.
  - [x] Conectar `bff/` (`UserController`, `TallerController`, `AsistenciaController`, `EncuestaController`, `NotificarController`) a `SupabaseGatewayService` con `@PreAuthorize` RBAC y pruebas `MockMvc`.
- [x] **Operación Offline Persistente y DDL:**
  - [x] Implementar cola durable en `src/services/offlineQueue.ts` integrada en `DashboardPage.tsx`.
  - [x] Versionar el esquema SQL en `docs/syncpass-ddl.sql`.

---

## 3. Registro de Decisiones de Auditoría (Segunda Opinión Codex + Corrección)

| Hallazgo auditado | Corrección aplicada y verificada |
| :--- | :--- |
| **1. Secreto de Cognito y `.env` versionados** | Se eliminó `COGNITO_CLIENT_SECRET` del frontend, se desversionaron `.env` y `.env.production` (`git rm --cached`), se actualizó `.gitignore` y se migró `cognito-pkce.ts` a cliente público PKCE S256 puro. *(Importante: rotar el App Client en la consola de AWS Cognito).* |
| **2. Falta de validación JWT/RBAC en Vercel API y CORS `*`** | Se creó `api/_lib/auth.js` con verificación criptográfica JWT (`RS256` JWKS / `HS256`), RBAC por rol y CORS restringido en `usuarios.js`, `talleres.js`, `asistencias.js`, `encuestas.js` y `notificar.js`. |
| **3. Login y Cognito con sesiones locales ficticias** | Se eliminó `loginLocal`, el fallback de coordinador en `AuthProvider.tsx` y el bypass de `switchRole`; ahora `LoginPage.tsx` exige respuesta exitosa con JWT del backend (`api/auth.js` o API Gateway). |
| **4. Modo offline sin cola durable ni envío real** | Se creó `src/services/offlineQueue.ts` respaldado en `localStorage`; `DashboardPage.tsx` envía los registros reales a `/api/asistencias/sync` con token Bearer y solo limpia la cola tras respuesta exitosa. |
| **5. Desalineación entre `bff/`, `vite.config.ts` y documentos** | Se conectó `bff/` a `SupabaseGatewayService` con `@PreAuthorize`, se expusieron los 6 endpoints y `/api/asistencias/sync` en `vite.config.ts`/`vercel.json`, se incorporó `docs/syncpass-ddl.sql` y se actualizaron `AGENT.md`, `03-GUIA-AWS-COGNITO.md` y `TESTING.md`. |
