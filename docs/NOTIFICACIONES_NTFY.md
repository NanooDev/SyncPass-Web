# Notificaciones Push con ntfy.sh y BFF Spring Boot (SyncPass Web)

La plataforma web de SyncPass implementa el emisor de notificaciones push en tiempo real hacia los dispositivos moviles Android de la comunidad Duoc UC mediante la infraestructura abierta **ntfy.sh** y el backend BFF **Spring Boot**.

---

## 1. Arquitectura Dual de Envio (BFF + ntfy.sh directo)

El frontend soporta dos canales de emision de eventos:

1. **Canal BFF (Recomendado por el Docente en fs2-api):**
   - Endpoint: `POST /api/notificar`
   - Payload JSON:
     ```json
     {
       "email": "voluntario.estudiante@duocuc.cl",
       "message": "Nuevo taller territorial asignado",
       "title": "SyncPass Alerta",
       "priority": 4
     }
     ```
   - El BFF calcula el topico secreto SHA-256 en el servidor y retransmite hacia ntfy.sh.
   - Endpoint de consulta de topico: `GET /api/notificar/topic/{email}`.

2. **Canal Directo ntfy.sh (Mecanismo Resiliente / Offline):**
   - Emision directa mediante `POST https://ntfy.sh/<topico>` con cabeceras `Title` y `Priority`.
   - Permite que las notificaciones funcionen incluso si el servidor Spring Boot se encuentra apagado o en mantenimiento.

---

## 2. Algoritmo de Derivacion de Topico

Tanto la aplicacion Web, el backend Spring Boot (`NotificationService.java`) y la app Android (`NtfyTopics.kt`) calculan el mismo topico criptografico:

1. Normalizar correo: `email.trim().toLowerCase()`
2. Hash SHA-256 en UTF-8
3. Extraer los primeros 20 caracteres hexadecimales
4. Prefijo: `app_vibe_`

Resultado: `app_vibe_[20_caracteres_hex]`

### Ejemplo de referencia docente:
- `docente.dev@gmail.com` -> `app_vibe_8e63635b0c5401804b4b`

Implementado en: `src/services/ntfy.ts`.

---

## 3. Pruebas y Cobertura

Las pruebas unitarias estan implementadas en `src/services/ntfy.test.ts` con Vitest:
- Verificacion de consistencia de hash SHA-256 frente a los vectores del profesor.
- Emision exitosa via BFF `/api/notificar`.
- Emision exitosa directa hacia ntfy.sh.
- Sanitizacion de entradas y soporte de fallbacks.
- Mocking de peticiones de red y gestion de errores.

Comando de ejecucion:
```bash
npm test
```
