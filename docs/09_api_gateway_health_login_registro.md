# Integracion de API Gateway con Health, Login y Registro (SyncPass)

Este documento detalla el flujo de consumo de la API a traves de **AWS API Gateway** (punto de entrada seguro en HTTPS) hacia el backend Spring Boot (`fs2-api`) en **AWS EC2**, cumpliendo con la separacion de endpoints publicos y protegidos solicitada por el docente.

---

## 1. Arquitectura de Acceso Seguro

```text
[ Cliente Web (localhost:5173) ]       [ Cliente Movil Android ]
                   │                              │
                   ▼ (Peticiones HTTPS Cifradas)  ▼
          ┌─────────────────────────────────────────────────┐
          │     AWS API Gateway (ID: 5xvspck6jb)           │
          │  https://5xvspck6jb.execute-api.us-east-1...    │
          └───────────────────────┬─────────────────────────┘
                                  │ Integracion HTTP /{proxy}
                                  ▼
                   ┌───────────────────────────────┐
                   │    AWS EC2 (Ubuntu 22.04)     │
                   │    Spring Boot en Puerto 8080 │
                   └──────────────┬────────────────┘
                                  │
                                  ▼
                   ┌───────────────────────────────┐
                   │  AWS Cognito / PostgreSQL DB  │
                   └───────────────────────────────┘
```

---

## 2. Endpoints Consumidos por el Frontend

### A. Health Check (Publico)
- **Ruta:** `GET /api/health`
- **URL Completa:** `https://5xvspck6jb.execute-api.us-east-1.amazonaws.com/api/health`
- **Respuesta:**
  ```json
  {
    "service": "cursos-api",
    "status": "UP",
    "timestamp": "2026-10-24T00:06:44.985241039Z"
  }
  ```
- **Proposito:** Monitoreo y comprobacion automatica de que el backend esta operativo.

### B. Inicio de Sesion (Publico / Sin Token Previo)
- **Ruta:** `POST /api/auth/login`
- **URL Completa:** `https://5xvspck6jb.execute-api.us-east-1.amazonaws.com/api/auth/login`
- **Payload:**
  ```json
  {
    "email": "usuario@duocuc.cl",
    "password": "Password123."
  }
  ```
- **Proposito:** Autenticar al usuario y emitir tokens JWT (`accessToken`, `idToken`, `refreshToken`).

### C. Registro de Nuevo Usuario (Publico)
- **Ruta:** `POST /api/auth/registro`
- **URL Completa:** `https://5xvspck6jb.execute-api.us-east-1.amazonaws.com/api/auth/registro`
- **Payload:**
  ```json
  {
    "nombre": "Mariano Acevedo",
    "email": "mariano.acevedo@duocuc.cl",
    "password": "Password123.",
    "roles": ["coordinator"]
  }
  ```
- **Proposito:** Crear la cuenta en Cognito y persistir los metadatos en la base de datos relacional.

---

## 3. Pruebas de Verificacion desde Terminal (cURL)

```bash
# 1. Verificar disponibilidad (Health)
curl -i https://5xvspck6jb.execute-api.us-east-1.amazonaws.com/api/health

# 2. Probar endpoint de login
curl -i -X POST https://5xvspck6jb.execute-api.us-east-1.amazonaws.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@duocuc.cl","password":"Password123."}'

# 3. Probar endpoint de registro
curl -i -X POST https://5xvspck6jb.execute-api.us-east-1.amazonaws.com/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mariano Acevedo","email":"nuevo@duocuc.cl","password":"Password123.","roles":["coordinator"]}'
```
