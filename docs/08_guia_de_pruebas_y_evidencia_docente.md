# Guía de Pruebas, Validación y Evidencia para Evaluación Docente (Web)

> **Institución:** Duoc UC • Escuela de Informática y Telecomunicaciones  
> **Asignatura:** Desarrollo Fullstack / DSY1105  
> **Proyecto:** SyncPass Web (React 19 + TypeScript + AWS Cognito PKCE)  
> **Integrantes (Dupla):**  
> - Mariano Acevedo (`NanooDev` · `marianoacevedo1809@gmail.com`)  
> - Álvaro León (`alv.leon@duocuc.cl`)  
> **Versión:** 1.1.0

---

## 1. Objetivo del Documento

Este documento instruye a los docentes evaluadores sobre cómo poner a prueba y verificar el funcionamiento del frontend web de SyncPass:
1. Autenticación con **AWS Cognito** vía Hosted UI con flujo **OAuth 2.0 PKCE**.
2. Simulación interactiva de los **4 Roles** de la matriz RBAC.
3. Dashboard territorial con alternancia de **Modo Offline** y cola de sincronización.
4. Encuesta inmediata de satisfacción ciudadana sin emojis con diseño institucional Duoc UC.
5. Ejecución de la suite de pruebas automatizadas con **Vitest** (14 tests unitarios).

---

## 2. Pruebas Automatizadas de Calidad

Para ejecutar la verificación completa de calidad de código:

```bash
# 1. Ejecutar las 14 pruebas unitarias
npm test

# 2. Análisis estático de linter (0 errores, 0 advertencias)
npm run lint

# 3. Compilación tipada con TypeScript
npx tsc --noEmit
```

---

## 3. Protocolo de Pruebas en Vivo

### Prueba 1: Login con AWS Cognito
1. Iniciar servidor: `npm run dev`.
2. Navegar a `http://localhost:5173/login`.
3. Clic en **AWS Cognito (SSO)**.
4. Ingresar credenciales verificadas (`marianoacevedo1809@gmail.com`).
5. Se valida el intercambio seguro del código PKCE y se accede al Dashboard con el grupo `coordinador`.

### Prueba 2: Demostración Rápida de Roles
En `http://localhost:5173/login`:
- Clic en **Docente**: Acceso al panel de proyectos y quórum.
- Clic en **Voluntario**: Acceso al simulador de acreditación y modo offline.
- Clic en **Beneficiario**: Despliegue de pase digital y encuesta de satisfacción.
- Clic en **Admin**: Acceso a la gestión de usuarios (`/users`).
