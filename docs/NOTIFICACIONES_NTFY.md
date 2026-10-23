# Notificaciones Push con ntfy.sh (SyncPass Web)

La plataforma web de SyncPass implementa el emisor de notificaciones push en tiempo real hacia los dispositivos moviles Android de la comunidad Duoc UC mediante la infraestructura abierta **ntfy.sh**.

---

## 1. Algoritmo de Derivacion de Topico

Tanto la aplicacion Web como la app Android calculan el mismo topico criptografico:

1. Normalizar correo: `email.trim().toLowerCase()`
2. Hash SHA-256 en UTF-8
3. Extraer los primeros 20 caracteres hexadecimales
4. Prefijo: `app_vibe_`

Resultado: `app_vibe_[20_caracteres_hex]`

### Ejemplo de referencia docente:
- `docente.dev@gmail.com` -> `app_vibe_8e63635b0c5401804b4b`

Implementado en: `src/services/ntfy.ts`.

---

## 2. Emision de Notificaciones

La funcion `sendPushNotification` publica un evento HTTP POST directamente en `https://ntfy.sh/<topico>`:

```typescript
import { sendPushNotification } from './services/ntfy'

await sendPushNotification({
  email: 'voluntario.estudiante@duocuc.cl',
  title: 'SyncPass Alerta Territorial',
  message: 'Taller de Huertos Comunitarios iniciado.',
  priority: 'high',
})
```

Las cabeceras enviadas son:
- `Title`: Titulo del mensaje para el sistema operativo Android.
- `Priority`: Nivel de prioridad (high / urgent / default).
- `Content-Type`: `text/plain; charset=utf-8`.

---

## 3. Pruebas y Cobertura

Las pruebas unitarias estan implementadas en `src/services/ntfy.test.ts` con Vitest:
- Verificacion de consistencia de hash SHA-256 frente a los vectores del profesor.
- Sanitizacion de entradas y soporte de fallbacks.
- Mocking de peticiones de red y gestion de errores.

Comando de ejecucion:
```bash
npm test
```
